-- CreateEnum
CREATE TYPE "WorkScheduleType" AS ENUM ('STANDARD', 'SHIFT_WORK');

-- CreateEnum
CREATE TYPE "PlaceType" AS ENUM ('ENTRY_EXIT', 'INTERNAL');

-- CreateEnum
CREATE TYPE "WorkDayStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'INCOMPLETE', 'ABSENT');

-- CreateEnum
CREATE TYPE "OvertimeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable - Add work schedule fields to Employee
ALTER TABLE "Employee" ADD COLUMN "workScheduleType" "WorkScheduleType" NOT NULL DEFAULT 'STANDARD',
ADD COLUMN "standardStartTime" TEXT,
ADD COLUMN "standardEndTime" TEXT,
ADD COLUMN "expectedHoursPerDay" DECIMAL(5,2) DEFAULT 8.0;

-- CreateTable - AccessControlMapping
CREATE TABLE "access_control_mappings" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "accessControlUserId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "access_control_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable - PlaceConfiguration
CREATE TABLE "place_configurations" (
    "id" TEXT NOT NULL,
    "externalPlaceId" INTEGER NOT NULL,
    "type" "PlaceType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "place_configurations_pkey" PRIMARY KEY ("id")
);

-- CreateTable - WorkDay
CREATE TABLE "work_days" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "checkInTime" TIMESTAMP(3),
    "checkOutTime" TIMESTAMP(3),
    "expectedStartTime" TIMESTAMP(3),
    "expectedEndTime" TIMESTAMP(3),
    "totalHours" DECIMAL(5,2),
    "expectedHours" DECIMAL(5,2),
    "lateMinutes" INTEGER DEFAULT 0,
    "earlyLeaveMinutes" INTEGER DEFAULT 0,
    "overtimeMinutes" INTEGER DEFAULT 0,
    "overtimeStatus" "OvertimeStatus",
    "overtimeApprovedBy" TEXT,
    "overtimeApprovedAt" TIMESTAMP(3),
    "overtimeNotes" TEXT,
    "status" "WorkDayStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "notes" TEXT,
    "isManualEntry" BOOLEAN NOT NULL DEFAULT false,
    "manualEntryBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "calculatedAt" TIMESTAMP(3),

    CONSTRAINT "work_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable - WorkDayEvent
CREATE TABLE "work_day_events" (
    "id" TEXT NOT NULL,
    "workDayId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "isCheckIn" BOOLEAN NOT NULL DEFAULT false,
    "isCheckOut" BOOLEAN NOT NULL DEFAULT false,
    "isInternal" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_day_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_control_mappings_employeeId_idx" ON "access_control_mappings"("employeeId");

-- CreateIndex
CREATE INDEX "access_control_mappings_accessControlUserId_idx" ON "access_control_mappings"("accessControlUserId");

-- CreateIndex
CREATE UNIQUE INDEX "access_control_mappings_employeeId_accessControlUserId_key" ON "access_control_mappings"("employeeId", "accessControlUserId");

-- CreateIndex
CREATE UNIQUE INDEX "place_configurations_externalPlaceId_key" ON "place_configurations"("externalPlaceId");

-- CreateIndex
CREATE INDEX "place_configurations_type_idx" ON "place_configurations"("type");

-- CreateIndex
CREATE INDEX "place_configurations_externalPlaceId_idx" ON "place_configurations"("externalPlaceId");

-- CreateIndex
CREATE INDEX "work_days_employeeId_date_idx" ON "work_days"("employeeId", "date");

-- CreateIndex
CREATE INDEX "work_days_date_idx" ON "work_days"("date");

-- CreateIndex
CREATE INDEX "work_days_status_idx" ON "work_days"("status");

-- CreateIndex
CREATE INDEX "work_days_employeeId_status_idx" ON "work_days"("employeeId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "work_days_employeeId_date_key" ON "work_days"("employeeId", "date");

-- CreateIndex
CREATE INDEX "work_day_events_workDayId_idx" ON "work_day_events"("workDayId");

-- CreateIndex
CREATE INDEX "work_day_events_eventId_idx" ON "work_day_events"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "work_day_events_workDayId_eventId_key" ON "work_day_events"("workDayId", "eventId");

-- AddForeignKey
ALTER TABLE "access_control_mappings" ADD CONSTRAINT "access_control_mappings_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_control_mappings" ADD CONSTRAINT "access_control_mappings_accessControlUserId_fkey" FOREIGN KEY ("accessControlUserId") REFERENCES "access_control_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_days" ADD CONSTRAINT "work_days_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_day_events" ADD CONSTRAINT "work_day_events_workDayId_fkey" FOREIGN KEY ("workDayId") REFERENCES "work_days"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_day_events" ADD CONSTRAINT "work_day_events_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "access_control_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
