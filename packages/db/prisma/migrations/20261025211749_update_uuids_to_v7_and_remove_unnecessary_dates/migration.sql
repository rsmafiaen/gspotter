-- AlterTable
ALTER TABLE "city" ALTER COLUMN "id" SET DEFAULT uuidv7();

-- AlterTable
ALTER TABLE "opening_hours" ALTER COLUMN "id" SET DEFAULT uuidv7(),
ALTER COLUMN "opening" SET DATA TYPE TIMETZ,
ALTER COLUMN "closing" SET DATA TYPE TIMETZ;

-- AlterTable
ALTER TABLE "price_sighting" ALTER COLUMN "id" SET DEFAULT uuidv7(),
ALTER COLUMN "time_start" SET DATA TYPE TIMETZ,
ALTER COLUMN "time_end" SET DATA TYPE TIMETZ;

-- AlterTable
ALTER TABLE "venue" ALTER COLUMN "id" SET DEFAULT uuidv7();
