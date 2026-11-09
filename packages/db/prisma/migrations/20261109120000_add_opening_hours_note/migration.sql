-- Add an optional note for venues whose opening hours vary or cannot be
-- represented as a fixed weekly schedule.
ALTER TABLE "venue" ADD COLUMN "opening_hours_note" TEXT;
