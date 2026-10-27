-- CreateTable
CREATE TABLE "review" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "username" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "time_created" TIMESTAMPTZ NOT NULL DEFAULT now(),
    "venue_id" UUID NOT NULL,

    CONSTRAINT "review_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "review" ADD CONSTRAINT "review_venue_id_fkey" FOREIGN KEY ("venue_id") REFERENCES "venue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
