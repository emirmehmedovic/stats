-- AlterTable
ALTER TABLE "User"
ADD COLUMN     "billingPinHash" TEXT,
ADD COLUMN     "billingPinFailedAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "billingPinLockedUntil" TIMESTAMP(3);
