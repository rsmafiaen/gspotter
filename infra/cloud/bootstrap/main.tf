terraform {
  backend "local" {
    path = "bootstrap.tfstate"
  }

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "=5.0.0"
    }
  }
}

provider "azurerm" {
  features {}

  resource_provider_registrations = "core"
  resource_providers_to_register  = ["Microsoft.Storage"]
}

resource "azurerm_resource_group" "rg_gspotter" {
  name     = "rg-gspotter"
  location = "Norway East"
}

resource "azurerm_storage_account" "bootstrap" {
  name                     = "gspotterstorageacc"
  resource_group_name      = azurerm_resource_group.rg_gspotter.name
  location                 = azurerm_resource_group.rg_gspotter.location
  account_tier             = "Standard"
  access_tier              = "Cool"
  account_replication_type = "LRS"
}

resource "azurerm_storage_container" "bootstrap" {
  name               = "tfstate"
  storage_account_id = azurerm_storage_account.bootstrap.id
}

resource "azurerm_role_assignment" "blob_data_owner" {
	scope = azurerm_storage_account.bootstrap.id
	role_definition_name = "Storage Blob Data Owner"
	principal_id = "0e18a31c-3e2e-4901-87f8-9cdfdd922242"
}
