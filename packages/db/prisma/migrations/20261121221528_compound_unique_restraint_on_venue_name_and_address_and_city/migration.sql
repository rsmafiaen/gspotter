ALTER TABLE "venue" ADD CONSTRAINT "venue_unique_name_and_address" UNIQUE("name", "address", "city_id");
