terraform {
  backend "azurerm" {
    sas_token = ""

    storage_account_name = "gspotterstorageacc"
    container_name       = "tfstate"
    key                  = "prod.terraform.tfstate"
  }

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=5.0.0"
    }
    neon = {
      source = "kislerdm/neon"
    }
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 5"
    }
    tls = {
      source  = "hashicorp/tls"
      version = "~> 4"
    }
    time = {
      source  = "hashicorp/time"
      version = "~> 0.13"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.7"
    }
    pkcs12 = {
      source  = "chilicat/pkcs12"
      version = "0.4.0"
    }
  }
}

provider "azurerm" {
  features {}
  subscription_id = var.subscription_id

  resource_provider_registrations = "core"
  resource_providers_to_register = [
    "Microsoft.App",                 // Container Apps env, apps, jobs, custom domains, certs
    "Microsoft.ContainerRegistry",   // the ACR
    "Microsoft.ManagedIdentity",     // user-assigned identity for ACR pulls
    "Microsoft.Authorization",       // the AcrPull role assignment
    "Microsoft.Network",             // VNet + subnet for the container app environment
    "Microsoft.OperationalInsights", // Log Analytics workspace for app/job logs
  ]
}

provider "neon" {
  api_key = var.neon_api_key
}

provider "cloudflare" {
  api_token = var.cloudflare_api_token
}

data "azurerm_resource_group" "rg_gspotter" {
  name = "rg-gspotter"
}
