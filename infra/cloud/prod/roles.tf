resource "azurerm_user_assigned_identity" "acr_pull" {
  name                = "id-gspotter-acr-pull"
  resource_group_name = data.azurerm_resource_group.rg_gspotter.name
  location            = data.azurerm_resource_group.rg_gspotter.location
}

resource "azurerm_role_assignment" "acr_pull" {
  scope                = azurerm_container_registry.registry.id
  role_definition_name = "AcrPull"
  principal_id         = azurerm_user_assigned_identity.acr_pull.principal_id
  principal_type       = "ServicePrincipal"
}

resource "time_sleep" "acr_rbac" {
  depends_on      = [azurerm_role_assignment.acr_pull]
  create_duration = "60s"
}

# ------------------------------------------------------------------
# CI identity. The NTNU Entra tenant blocks app registrations
# (allowedToCreateApps = false), so a client-secret service principal is
# not an option. A user-assigned managed identity with a federated
# identity credential only needs ARM permissions, and git.ntnu.no
# exposes a GitHub Actions OIDC issuer at
# https://git.ntnu.no/_services/token (verified via its
# .well-known/openid-configuration).
resource "azurerm_user_assigned_identity" "ci" {
  name                = "id-gspotter-ci"
  resource_group_name = data.azurerm_resource_group.rg_gspotter.name
  location            = data.azurerm_resource_group.rg_gspotter.location
}

# Federates the identity to workflow runs on the main branch of the
# git.ntnu.no repository. The subject claim format matches GitHub's:
# repo:<owner>/<repo>:ref:refs/heads/main.
resource "azurerm_federated_identity_credential" "ci" {
  name                      = "git-ntnu-no-main"
  user_assigned_identity_id = azurerm_user_assigned_identity.ci.id
  audience                  = ["api://AzureADTokenExchange"]
  issuer                    = "https://git.ntnu.no/_services/token"
  subject                   = "repo:IT2810-H26/T09-Project-2:ref:refs/heads/main"
}

# Deploy the container apps and the migrate job.
resource "azurerm_role_assignment" "ci_contributor" {
  scope                = data.azurerm_resource_group.rg_gspotter.id
  role_definition_name = "Contributor"
  principal_id         = azurerm_user_assigned_identity.ci.principal_id
  principal_type       = "ServicePrincipal"
}

# Push images to the registry (docker buildx --push / az acr login).
resource "azurerm_role_assignment" "ci_acr_push" {
  scope                = azurerm_container_registry.registry.id
  role_definition_name = "AcrPush"
  principal_id         = azurerm_user_assigned_identity.ci.principal_id
  principal_type       = "ServicePrincipal"
}
