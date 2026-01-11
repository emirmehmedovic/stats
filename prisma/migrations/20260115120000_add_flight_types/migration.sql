-- CreateTable
CREATE TABLE "FlightType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlightType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationTypeFlightType" (
    "operationTypeId" TEXT NOT NULL,
    "flightTypeId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "FlightType_code_key" ON "FlightType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "OperationTypeFlightType_operationTypeId_flightTypeId_key" ON "OperationTypeFlightType"("operationTypeId", "flightTypeId");

-- CreateIndex
CREATE INDEX "OperationTypeFlightType_operationTypeId_idx" ON "OperationTypeFlightType"("operationTypeId");

-- CreateIndex
CREATE INDEX "OperationTypeFlightType_flightTypeId_idx" ON "OperationTypeFlightType"("flightTypeId");

-- AlterTable
ALTER TABLE "Flight" ADD COLUMN "flightTypeId" TEXT;

-- CreateIndex
CREATE INDEX "Flight_flightTypeId_idx" ON "Flight"("flightTypeId");

-- AddForeignKey
ALTER TABLE "OperationTypeFlightType" ADD CONSTRAINT "OperationTypeFlightType_operationTypeId_fkey" FOREIGN KEY ("operationTypeId") REFERENCES "OperationType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationTypeFlightType" ADD CONSTRAINT "OperationTypeFlightType_flightTypeId_fkey" FOREIGN KEY ("flightTypeId") REFERENCES "FlightType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_flightTypeId_fkey" FOREIGN KEY ("flightTypeId") REFERENCES "FlightType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
