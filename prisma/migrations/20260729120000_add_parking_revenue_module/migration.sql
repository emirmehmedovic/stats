-- ============================================================
-- MODUL 8 - PARKING REVENUE
-- Sistem za praćenje prihoda od parkinga
-- ============================================================

-- Dodavanje PARKING role u UserRole enum
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'PARKING';

-- Kreiranje ParkingRevenue tabele
CREATE TABLE IF NOT EXISTS "ParkingRevenue" (
  "id" TEXT NOT NULL,
  "date" DATE NOT NULL,
  "amount" DECIMAL(12, 2) NOT NULL,
  "notes" TEXT,
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ParkingRevenue_pkey" PRIMARY KEY ("id")
);

-- Unique constraint na datum (jedan unos po danu)
ALTER TABLE "ParkingRevenue" ADD CONSTRAINT "ParkingRevenue_date_key" UNIQUE ("date");

-- Foreign keys
ALTER TABLE "ParkingRevenue"
  ADD CONSTRAINT "ParkingRevenue_createdById_fkey"
  FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ParkingRevenue"
  ADD CONSTRAINT "ParkingRevenue_updatedById_fkey"
  FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Indeksi
CREATE INDEX IF NOT EXISTS "ParkingRevenue_date_idx" ON "ParkingRevenue"("date");
CREATE INDEX IF NOT EXISTS "ParkingRevenue_createdById_idx" ON "ParkingRevenue"("createdById");
CREATE INDEX IF NOT EXISTS "ParkingRevenue_createdAt_idx" ON "ParkingRevenue"("createdAt");
