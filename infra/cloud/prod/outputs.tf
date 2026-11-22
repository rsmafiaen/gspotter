output "acr_login_server" {
  description = "ACR login server, e.g. for `az containerapp update --image`."
  value       = azurerm_container_registry.registry.login_server
}

output "resource_group_name" {
  value = data.azurerm_resource_group.rg_gspotter.name
}

output "app_url" {
  description = "Public URL of the app (frontend + /graphql API)."
  value       = "https://${local.app_fqdn}"
}

output "migrate_job_name" {
  value = azurerm_container_app_job.migrate.name
}

output "ci_identity_client_id" {
  description = "Client ID of the CI managed identity (AZURE_CLIENT_ID secret in GitHub Actions)."
  value       = azurerm_user_assigned_identity.ci.client_id
}
