/*
	For a real-world deployment, using azure's postgresql servers would be preferable
	But the annual cost of running just the database on the cheapest tier could easily surpass the
	free annual student credits - so neon is used as a standin with a free tier and autoscaling

	If the usage surpasses neon's free tier, the datbase should be migrated to azure, as the paid
	tier of neon is more expensive then having an azure hosted datbase server
*/
resource "neon_project" "gspotter_project" {
  name       = "gspotter"
  pg_version = 18
  region_id  = "aws-eu-central-1"

  branch {
    name          = "prod"
    database_name = "gspot"
    role_name     = "admin"
  }

  autoscaling_limit_min_cu = 0.25
  autoscaling_limit_max_cu = 1.0

  // PITR backup history. The provider defaults to 86400 (1 day), but the
  // Neon free plan rejects anything above 21600 (6 hours):
  //   requested history retention seconds exceeds allowed maximum ... max:"21600"
  history_retention_seconds = 21600
}
