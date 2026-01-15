-- AlterTable
ALTER TABLE "EquipmentAssignment" ADD COLUMN "sectorId" TEXT;

-- Make employeeId optional
ALTER TABLE "EquipmentAssignment" ALTER COLUMN "employeeId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "EquipmentAssignment_sectorId_idx" ON "EquipmentAssignment"("sectorId");

-- AddForeignKey
ALTER TABLE "EquipmentAssignment" ADD CONSTRAINT "EquipmentAssignment_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;
