/*
	Container Apps environments created WITHOUT a virtual network are "express"
	environments, which do not support bring-your-own certificates:
	  ExpressEnvironmentResourceNotSupported: 'Certificate' resources are not
	  supported on express environments
	Attaching an infrastructure subnet creates a "consumption" environment
	instead - same serverless billing as express, no workload profiles - which
	does support the Certificates API used to upload the Cloudflare Origin CA
	certificate.

	The subnet must be a /21 or larger (per the azurerm provider docs) and must
	be delegated to Microsoft.App/environments - required even for consumption
	environments (the Azure API rejects it with ManagedEnvironmentSubnetDelegationError
		otherwise; the CLI docs saying not to delegate are outdated).
*/

resource "azurerm_virtual_network" "vnet" {
  name                = "gspotter-vnet"
  location            = data.azurerm_resource_group.rg_gspotter.location
  resource_group_name = data.azurerm_resource_group.rg_gspotter.name
  address_space       = ["10.0.0.0/16"]
}

resource "azurerm_subnet" "infrastructure" {
  name                 = "infrastructure-subnet"
  resource_group_name  = data.azurerm_resource_group.rg_gspotter.name
  virtual_network_name = azurerm_virtual_network.vnet.name
  address_prefixes     = ["10.0.0.0/21"]

  delegation {
    name = "Microsoft.App-environments"
    service_delegation {
      name = "Microsoft.App/environments"
    }
  }
}
