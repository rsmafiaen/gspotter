-- Move opening-hours notes into their own table so each note can reference
-- the day(s) it applies to.
CREATE TABLE "opening_hours_note" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "days" "day"[],
    "note" TEXT NOT NULL,
    "venue_id" UUID NOT NULL,

    CONSTRAINT "opening_hours_note_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "opening_hours_note" ADD CONSTRAINT "opening_hours_note_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "venue" DROP COLUMN "opening_hours_note";
