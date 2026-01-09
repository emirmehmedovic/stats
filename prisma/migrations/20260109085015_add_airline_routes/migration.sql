-- CreateTable
CREATE TABLE "AirlineRoute" (
    "id" TEXT NOT NULL,
    "airlineId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AirlineRoute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AirlineRoute_airlineId_idx" ON "AirlineRoute"("airlineId");

-- CreateIndex
CREATE UNIQUE INDEX "AirlineRoute_airlineId_route_key" ON "AirlineRoute"("airlineId", "route");

-- AddForeignKey
ALTER TABLE "AirlineRoute" ADD CONSTRAINT "AirlineRoute_airlineId_fkey" FOREIGN KEY ("airlineId") REFERENCES "Airline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
