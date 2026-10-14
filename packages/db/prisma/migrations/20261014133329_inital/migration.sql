-- CreateEnum
CREATE TYPE "glass_size" AS ENUM ('PINT', 'HALF_LITER', 'QUARTER_LITER', 'BOX', 'OTHER');

-- CreateEnum
CREATE TYPE "limitations" AS ENUM ('TIME', 'MEMBERSHIP');

-- CreateEnum
CREATE TYPE "day" AS ENUM ('MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN');

-- CreateTable
CREATE TABLE "venue" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city_id" UUID NOT NULL,

    CONSTRAINT "venue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opening_hours" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "days" "day"[],
    "opening" TIMESTAMPTZ NOT NULL,
    "closing" TIMESTAMPTZ NOT NULL,
    "venue_id" UUID NOT NULL,

    CONSTRAINT "opening_hours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "city" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "centre_lon" TEXT NOT NULL,
    "centre_lat" TEXT NOT NULL,

    CONSTRAINT "city_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "price_sighting" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "price" DOUBLE PRECISION NOT NULL,
    "size" "glass_size" NOT NULL,
    "limitation" "limitations"[],
    "time_start" TIMESTAMPTZ,
    "time_end" TIMESTAMPTZ,
    "size_ml" DOUBLE PRECISION,
    "venue_id" UUID NOT NULL,

    CONSTRAINT "price_sighting_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "venue" ADD CONSTRAINT "venue_city_id_fkey" FOREIGN KEY ("city_id") REFERENCES "city"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opening_hours" ADD CONSTRAINT "opening_hours_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "price_sighting" ADD CONSTRAINT "price_sighting_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
