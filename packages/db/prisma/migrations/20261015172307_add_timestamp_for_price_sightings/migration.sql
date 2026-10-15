/*
  Warnings:

  - Added the required column `time_sighted` to the `price_sighting` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "price_sighting" ADD COLUMN     "time_sighted" TIMESTAMPTZ NOT NULL;
