-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "arrivalChildren" INTEGER,
ADD COLUMN     "arrivalFemalePassengers" INTEGER,
ADD COLUMN     "arrivalMalePassengers" INTEGER,
ADD COLUMN     "departureChildren" INTEGER,
ADD COLUMN     "departureDoorClosingTime" TIMESTAMP(3),
ADD COLUMN     "departureFemalePassengers" INTEGER,
ADD COLUMN     "departureMalePassengers" INTEGER;

-- AlterTable
ALTER TABLE "FlightDelay" ADD COLUMN     "unofficialReason" TEXT;

-- CreateTable
CREATE TABLE "AirlineDelayCode" (
    "id" TEXT NOT NULL,
    "airlineId" TEXT NOT NULL,
    "delayCodeId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AirlineDelayCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AirlineDelayCode_airlineId_idx" ON "AirlineDelayCode"("airlineId");

-- CreateIndex
CREATE INDEX "AirlineDelayCode_delayCodeId_idx" ON "AirlineDelayCode"("delayCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "AirlineDelayCode_airlineId_delayCodeId_key" ON "AirlineDelayCode"("airlineId", "delayCodeId");

-- AddForeignKey
ALTER TABLE "AirlineDelayCode" ADD CONSTRAINT "AirlineDelayCode_airlineId_fkey" FOREIGN KEY ("airlineId") REFERENCES "Airline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirlineDelayCode" ADD CONSTRAINT "AirlineDelayCode_delayCodeId_fkey" FOREIGN KEY ("delayCodeId") REFERENCES "DelayCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;
