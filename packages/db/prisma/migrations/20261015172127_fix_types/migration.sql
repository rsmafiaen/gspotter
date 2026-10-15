/*
  Warnings:

  - Changed the type of `centre_lon` on the `city` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `centre_lat` on the `city` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "city" DROP COLUMN "centre_lon",
ADD COLUMN     "centre_lon" DOUBLE PRECISION NOT NULL,
DROP COLUMN "centre_lat",
ADD COLUMN     "centre_lat" DOUBLE PRECISION NOT NULL;
