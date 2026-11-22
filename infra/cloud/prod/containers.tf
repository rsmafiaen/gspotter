resource "random_id" "acr_suffix" {
  byte_length = 4
}

resource "azurerm_container_registry" "registry" {
  // ACR names must be globally unique
  // so a random suffix guarantees availability.
  name                = "gspotteracr${random_id.acr_suffix.hex}"
  resource_group_name = data.azurerm_resource_group.rg_gspotter.name
  location            = data.azurerm_resource_group.rg_gspotter.location
  sku                 = "Basic"
  admin_enabled       = false
}

resource "azurerm_container_app_environment" "gspotter_env" {
  name                = "gspotter-container-app-env"
  resource_group_name = data.azurerm_resource_group.rg_gspotter.name
  location            = data.azurerm_resource_group.rg_gspotter.location

  // Attaching a subnet creates a consumption (non-express) environment, which
  // supports the Certificates API - see network.tf.
  infrastructure_subnet_id = azurerm_subnet.infrastructure.id

  // Without a workspace there is nowhere for app/job logs to go: the portal
  // shows "Could not find a corresponding Log Analytics Workspace".
  logs_destination           = "log-analytics"
  log_analytics_workspace_id = azurerm_log_analytics_workspace.logs.id
}

resource "azurerm_log_analytics_workspace" "logs" {
  name                = "gspotter-logger"
  location            = data.azurerm_resource_group.rg_gspotter.location
  resource_group_name = data.azurerm_resource_group.rg_gspotter.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

/*
	Backend - Apollo/GraphQL on port 3001.
	Ingress is INTERNAL ONLY: the backend has no public URL and is reached
	exclusively through the frontend's /graphql proxy (same origin, so no
	CORS) and via BACKEND_URL for SSR fetches.
*/

resource "azurerm_container_app" "backend_container" {
  name                         = "gspotter-backend"
  container_app_environment_id = azurerm_container_app_environment.gspotter_env.id
  resource_group_name          = data.azurerm_resource_group.rg_gspotter.name
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.acr_pull.id]
  }

  registry {
    server   = azurerm_container_registry.registry.login_server
    identity = azurerm_user_assigned_identity.acr_pull.id
  }

  secret {
    name  = "database-url"
    value = neon_project.gspotter_project.connection_uri
  }

  template {
    min_replicas = 0 # cheapest; gives cold starts
    max_replicas = 2

    container {
      name   = "backend"
      image  = var.backend_docker_image # placeholder until CI deploys the real image
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name  = "PORT"
        value = "3001"
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }
    }
  }

  ingress {
    external_enabled = false # internal only, reachable solely from inside the environment

    target_port = 3001
    transport   = "auto"

    # Serve plain HTTP on the internal ingress. The Nitro proxy in the frontend
    # talks to this app over http://<fqdn>/; with this false the ingress would
    # 301-redirect to https and the internal request would die at the redirect.
    allow_insecure_connections = true

    # Required by the provider even in Single revision mode (only used in Multiple).
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  # CI owns the image tag: `az containerapp update --image ...:<sha>`
  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }

  depends_on = [time_sleep.acr_rbac]
}

# ------------------------------------------------------------------
# Frontend - TanStack Start / Nitro on port 3000.
# The only publicly exposed app; served at gspotter.graesberg.com through
# Cloudflare. Nitro proxies /graphql to the internal backend and SSR
# loaders fetch BACKEND_URL directly.
# ------------------------------------------------------------------

resource "azurerm_container_app" "frontend_container" {
  name                         = "gspotter-frontend"
  container_app_environment_id = azurerm_container_app_environment.gspotter_env.id
  resource_group_name          = data.azurerm_resource_group.rg_gspotter.name
  revision_mode                = "Single"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.acr_pull.id]
  }

  registry {
    server   = azurerm_container_registry.registry.login_server
    identity = azurerm_user_assigned_identity.acr_pull.id
  }

  template {
    min_replicas = 0
    max_replicas = 2

    container {
      name   = "frontend"
      image  = var.frontend_docker_image # placeholder until CI deploys the real image
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "PORT"
        value = "3000"
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      # Runtime env for SSR fetches to the internal backend. Not baked into
      # the image, so moving the app to another domain needs no rebuild.
      env {
        name  = "BACKEND_URL"
        value = local.backend_internal_url
      }
    }
  }

  ingress {
    external_enabled           = true
    target_port                = 3000
    transport                  = "auto"
    allow_insecure_connections = false

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  # CI owns the image tag: `az containerapp update --image ...:<sha>`
  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }

  depends_on = [time_sleep.acr_rbac]
}

# ------------------------------------------------------------------
# Migration job - runs `prisma migrate deploy` with the backend image.
# CI starts it with the new image before updating the apps:
#   az containerapp job start -n gspotter-migrate -g rg-gspotter \
#     --image <acr>/gspotter-backend:<sha>
# ------------------------------------------------------------------

resource "azurerm_container_app_job" "migrate" {
  name                         = "gspotter-migrate"
  location                     = data.azurerm_resource_group.rg_gspotter.location
  resource_group_name          = data.azurerm_resource_group.rg_gspotter.name
  container_app_environment_id = azurerm_container_app_environment.gspotter_env.id

  replica_timeout_in_seconds = 600
  replica_retry_limit        = 0

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.acr_pull.id]
  }

  registry {
    server   = azurerm_container_registry.registry.login_server
    identity = azurerm_user_assigned_identity.acr_pull.id
  }

  secret {
    name  = "database-url"
    value = neon_project.gspotter_project.connection_uri
  }

  manual_trigger_config {
    parallelism              = 1
    replica_completion_count = 1
  }

  template {
    container {
      name   = "migrate"
      image  = var.backend_docker_image # placeholder until CI overrides it per run
      cpu    = 0.5
      memory = "1Gi"

      # No .env in the container; DATABASE_URL comes from the secret above.
      # Requires the backend image to keep the prisma CLI installed.
      command = ["pnpm", "-C", "packages/db", "exec", "prisma", "migrate", "deploy"]

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }

  depends_on = [time_sleep.acr_rbac]
}
