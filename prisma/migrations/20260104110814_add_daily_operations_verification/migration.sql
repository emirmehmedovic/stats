-- CreateTable
CREATE TABLE "DailyOperationsVerification" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyOperationsVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyOperationsVerification_date_key" ON "DailyOperationsVerification"("date");

-- CreateIndex
CREATE INDEX "DailyOperationsVerification_date_idx" ON "DailyOperationsVerification"("date");
