locals {
  app_fqdn = "${var.app_subdomain}.${var.domain}"

  backend_internal_url = "http://gspotter-backend.internal.${azurerm_container_app_environment.gspotter_env.default_domain}"
}

resource "cloudflare_dns_record" "app" {
  zone_id = var.cloudflare_zone_id
  name    = local.app_fqdn
  type    = "CNAME"

  // ingress[0].fqdn is the stable app URL (not latest_revision_fqdn, which
  // changes on every revision), so DNS never needs updating on redeploys.
  content = azurerm_container_app.frontend_container.ingress[0].fqdn
  ttl     = 1
  proxied = true
}

resource "cloudflare_dns_record" "app_asuid" {
  zone_id = var.cloudflare_zone_id
  name    = "asuid.${local.app_fqdn}"
  type    = "TXT"
  content = azurerm_container_app.frontend_container.custom_domain_verification_id
  ttl     = 3600
}

resource "cloudflare_zone_setting" "ssl" {
  zone_id    = var.cloudflare_zone_id
  setting_id = "ssl"
  value      = "strict"
}

resource "cloudflare_zone_setting" "min_tls" {
  zone_id    = var.cloudflare_zone_id
  setting_id = "min_tls_version"
  value      = "1.2"
}

resource "cloudflare_zone_setting" "always_https" {
  zone_id    = var.cloudflare_zone_id
  setting_id = "always_use_https"
  value      = "on"
}

// Origin cert

resource "tls_private_key" "origin" {
  algorithm = "RSA"
  rsa_bits  = 2048
}

resource "tls_cert_request" "origin" {
  private_key_pem = tls_private_key.origin.private_key_pem

  subject {
    common_name = local.app_fqdn
  }

  dns_names = [local.app_fqdn, var.domain, "*.${var.domain}"]
}

resource "cloudflare_origin_ca_certificate" "origin" {
  csr                = tls_cert_request.origin.cert_request_pem
  hostnames          = [local.app_fqdn, var.domain, "*.${var.domain}"]
  request_type       = "origin-rsa"
  requested_validity = 5475 // 15 years
}

resource "pkcs12_from_pem" "origin" {
  password        = random_password.origin_pfx.result
  cert_pem        = cloudflare_origin_ca_certificate.origin.certificate
  private_key_pem = tls_private_key.origin.private_key_pem

  // Azure's certificate validation rejects PFX archives encrypted
  // with the modern AES-256-CBC/PBKDF2 default
  // legacyDES matches that accepted legacy encoding.
  encoding = "legacyDES"
}

resource "random_password" "origin_pfx" {
  length  = 32
  special = false
}

resource "azurerm_container_app_environment_certificate" "origin" {
  name                         = "gspotter-origin"
  container_app_environment_id = azurerm_container_app_environment.gspotter_env.id
  certificate_blob_base64      = pkcs12_from_pem.origin.result
  certificate_password         = random_password.origin_pfx.result
}

// Let the asuid TXT record propagate before Azure validates domain ownership.
resource "time_sleep" "dns_propagation" {
  depends_on      = [cloudflare_dns_record.app_asuid]
  create_duration = "60s"
}

resource "azurerm_container_app_custom_domain" "app" {
  name                                     = local.app_fqdn
  container_app_id                         = azurerm_container_app.frontend_container.id
  container_app_environment_certificate_id = azurerm_container_app_environment_certificate.origin.id
  certificate_binding_type                 = "SniEnabled"

  depends_on = [time_sleep.dns_propagation]
}
