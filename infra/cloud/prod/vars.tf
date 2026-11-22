variable "subscription_id" {
  type = string
}

variable "cloudflare_api_token" {
  description = "Cloudflare API token with Zone:Read, DNS:Edit, SSL and Certificates:Edit, Zone Settings:Edit."
  type        = string
  sensitive   = true
}

variable "cloudflare_zone_id" {
  type = string
}

variable "neon_api_key" {
  type = string

}

variable "domain" {
  type    = string
  default = "graesberg.com"
}

variable "app_subdomain" {
  type    = string
  default = "gspotter"
}

// CI owns the image tags (`az containerapp update --image ...:<sha>`) and the
// image fields are ignored by Terraform via lifecycle blocks, so these only
// apply to the initial apply, which must succeed while the registry is still
// empty.
variable "frontend_docker_image" {
  type    = string
  default = "mcr.microsoft.com/k8se/quickstart:latest"
}

variable "backend_docker_image" {
  type    = string
  default = "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest"
}
