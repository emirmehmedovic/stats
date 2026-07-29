-- ============================================================
-- MODUL 7 - FLIGHT ERROR DELEGATION SYSTEM
-- Sistem za delegiranje grešaka na letovima
-- ============================================================

-- Proširenje NotificationType enum-a sa novim vrijednostima za flight errors
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FLIGHT_ERROR_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FLIGHT_ERROR_RESOLVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FLIGHT_ERROR_DISPUTED';

-- Kreiranje enum tipova
CREATE TYPE "FlightErrorType" AS ENUM (
  'GENERAL',
  'DEPARTURE_PASSENGERS',
  'ARRIVAL_PASSENGERS',
  'AIRCRAFT_TYPE',
  'OPERATION_TYPE',
  'FLIGHT_TYPE',
  'NOT_VERIFIED'
);

CREATE TYPE "FlightErrorPriority" AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
);

CREATE TYPE "FlightErrorStatus" AS ENUM (
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'DISPUTED',
  'CLOSED'
);

-- Dodavanje updatedByUserId na Flight tabelu (ako ne postoji)
ALTER TABLE "Flight" ADD COLUMN IF NOT EXISTS "updatedByUserId" TEXT;

-- Kreiranje FlightErrorReport tabele
CREATE TABLE IF NOT EXISTS "FlightErrorReport" (
  "id" TEXT NOT NULL,
  "flightId" TEXT NOT NULL,
  "errorType" "FlightErrorType" NOT NULL,
  "priority" "FlightErrorPriority" NOT NULL DEFAULT 'MEDIUM',
  "description" TEXT NOT NULL,
  "status" "FlightErrorStatus" NOT NULL DEFAULT 'OPEN',
  "reportedById" TEXT NOT NULL,
  "assignedToId" TEXT NOT NULL,
  "oldValue" JSONB,
  "newValue" JSONB,
  "disputeReason" TEXT,
  "disputedAt" TIMESTAMP(3),
  "closedById" TEXT,
  "closedAt" TIMESTAMP(3),
  "closedNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FlightErrorReport_pkey" PRIMARY KEY ("id")
);

-- Kreiranje FlightErrorAttachment tabele
CREATE TABLE IF NOT EXISTS "FlightErrorAttachment" (
  "id" TEXT NOT NULL,
  "errorReportId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "uploadedById" TEXT NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FlightErrorAttachment_pkey" PRIMARY KEY ("id")
);

-- Kreiranje FlightErrorHistory tabele
CREATE TABLE IF NOT EXISTS "FlightErrorHistory" (
  "id" TEXT NOT NULL,
  "errorReportId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "fromStatus" "FlightErrorStatus",
  "toStatus" "FlightErrorStatus",
  "notes" TEXT,
  "performedById" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "FlightErrorHistory_pkey" PRIMARY KEY ("id")
);

-- Dodavanje flightErrorId na Notification tabelu
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "flightErrorId" TEXT;

-- Foreign Keys za FlightErrorReport
ALTER TABLE "FlightErrorReport"
  ADD CONSTRAINT "FlightErrorReport_flightId_fkey"
  FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FlightErrorReport"
  ADD CONSTRAINT "FlightErrorReport_reportedById_fkey"
  FOREIGN KEY ("reportedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FlightErrorReport"
  ADD CONSTRAINT "FlightErrorReport_assignedToId_fkey"
  FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FlightErrorReport"
  ADD CONSTRAINT "FlightErrorReport_closedById_fkey"
  FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Foreign Keys za FlightErrorAttachment
ALTER TABLE "FlightErrorAttachment"
  ADD CONSTRAINT "FlightErrorAttachment_errorReportId_fkey"
  FOREIGN KEY ("errorReportId") REFERENCES "FlightErrorReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FlightErrorAttachment"
  ADD CONSTRAINT "FlightErrorAttachment_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign Keys za FlightErrorHistory
ALTER TABLE "FlightErrorHistory"
  ADD CONSTRAINT "FlightErrorHistory_errorReportId_fkey"
  FOREIGN KEY ("errorReportId") REFERENCES "FlightErrorReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FlightErrorHistory"
  ADD CONSTRAINT "FlightErrorHistory_performedById_fkey"
  FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Foreign Key za Notification -> FlightErrorReport
ALTER TABLE "Notification"
  ADD CONSTRAINT "Notification_flightErrorId_fkey"
  FOREIGN KEY ("flightErrorId") REFERENCES "FlightErrorReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Indeksi za FlightErrorReport
CREATE INDEX IF NOT EXISTS "FlightErrorReport_flightId_idx" ON "FlightErrorReport"("flightId");
CREATE INDEX IF NOT EXISTS "FlightErrorReport_reportedById_idx" ON "FlightErrorReport"("reportedById");
CREATE INDEX IF NOT EXISTS "FlightErrorReport_assignedToId_idx" ON "FlightErrorReport"("assignedToId");
CREATE INDEX IF NOT EXISTS "FlightErrorReport_status_idx" ON "FlightErrorReport"("status");
CREATE INDEX IF NOT EXISTS "FlightErrorReport_priority_idx" ON "FlightErrorReport"("priority");
CREATE INDEX IF NOT EXISTS "FlightErrorReport_errorType_idx" ON "FlightErrorReport"("errorType");
CREATE INDEX IF NOT EXISTS "FlightErrorReport_createdAt_idx" ON "FlightErrorReport"("createdAt");
CREATE INDEX IF NOT EXISTS "FlightErrorReport_assignedToId_status_idx" ON "FlightErrorReport"("assignedToId", "status");

-- Indeksi za FlightErrorAttachment
CREATE INDEX IF NOT EXISTS "FlightErrorAttachment_errorReportId_idx" ON "FlightErrorAttachment"("errorReportId");
CREATE INDEX IF NOT EXISTS "FlightErrorAttachment_uploadedById_idx" ON "FlightErrorAttachment"("uploadedById");

-- Indeksi za FlightErrorHistory
CREATE INDEX IF NOT EXISTS "FlightErrorHistory_errorReportId_idx" ON "FlightErrorHistory"("errorReportId");
CREATE INDEX IF NOT EXISTS "FlightErrorHistory_performedById_idx" ON "FlightErrorHistory"("performedById");
CREATE INDEX IF NOT EXISTS "FlightErrorHistory_createdAt_idx" ON "FlightErrorHistory"("createdAt");

-- Indeks za Notification -> flightErrorId
CREATE INDEX IF NOT EXISTS "Notification_flightErrorId_idx" ON "Notification"("flightErrorId");
