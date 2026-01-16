-- CreateEnum
CREATE TYPE "BillingReportType" AS ENUM ('DAILY', 'MONTHLY');

-- CreateTable
CREATE TABLE "BillingReport" (
    "id" TEXT NOT NULL,
    "type" "BillingReportType" NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "data" JSONB NOT NULL,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BillingReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BillingReport_type_periodStart_key" ON "BillingReport"("type", "periodStart");

-- CreateIndex
CREATE INDEX "BillingReport_periodStart_idx" ON "BillingReport"("periodStart");

-- AddForeignKey
ALTER TABLE "BillingReport" ADD CONSTRAINT "BillingReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
