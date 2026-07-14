-- CreateEnum: Add Language enum
CREATE TYPE "Language" AS ENUM ('BS', 'EN');

-- AlterEnum: Add AUDITOR to UserRole
ALTER TYPE "UserRole" ADD VALUE 'AUDITOR';

-- AlterTable: Add language field to User
ALTER TABLE "User" ADD COLUMN "language" "Language" NOT NULL DEFAULT 'BS';
