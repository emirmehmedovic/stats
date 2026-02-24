/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum (idempotent for shadow db)
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'VIEWER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'VIEWER';
