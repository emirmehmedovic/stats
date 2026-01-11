-- Add indexes to Flight table for predboarding query optimization
CREATE INDEX "Flight_departureScheduledTime_idx" ON "Flight"("departureScheduledTime");
CREATE INDEX "Flight_departureActualTime_idx" ON "Flight"("departureActualTime");
CREATE INDEX "Flight_date_departureScheduledTime_idx" ON "Flight"("date", "departureScheduledTime");

-- Add indexes to ManifestPassenger table for search and filtering optimization
CREATE INDEX "ManifestPassenger_manifestId_boardingStatus_idx" ON "ManifestPassenger"("manifestId", "boardingStatus");
CREATE INDEX "ManifestPassenger_seatNumber_idx" ON "ManifestPassenger"("seatNumber");
