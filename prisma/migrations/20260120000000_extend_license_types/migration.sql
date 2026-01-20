-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('INITIAL', 'RENEWAL', 'EXTENSION');

-- AlterTable
ALTER TABLE "LicenseType" ADD COLUMN     "trainingType" "TrainingType",
ADD COLUMN     "parentLicenseTypeId" TEXT,
ADD COLUMN     "instructors" TEXT,
ADD COLUMN     "programDuration" TEXT,
ADD COLUMN     "theoryHours" INTEGER,
ADD COLUMN     "practicalHours" INTEGER,
ADD COLUMN     "workplaceTraining" TEXT;

-- CreateIndex
CREATE INDEX "LicenseType_parentLicenseTypeId_idx" ON "LicenseType"("parentLicenseTypeId");

-- CreateIndex
CREATE INDEX "LicenseType_trainingType_idx" ON "LicenseType"("trainingType");

-- AddForeignKey
ALTER TABLE "LicenseType" ADD CONSTRAINT "LicenseType_parentLicenseTypeId_fkey" FOREIGN KEY ("parentLicenseTypeId") REFERENCES "LicenseType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
