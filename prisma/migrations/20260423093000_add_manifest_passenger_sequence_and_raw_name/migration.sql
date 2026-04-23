ALTER TABLE "ManifestPassenger"
ADD COLUMN "rawPassengerName" TEXT,
ADD COLUMN "sequenceNumber" TEXT;

CREATE INDEX "ManifestPassenger_sequenceNumber_idx" ON "ManifestPassenger"("sequenceNumber");
