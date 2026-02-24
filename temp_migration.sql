warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

-- CreateEnum
CREATE TYPE "FlightStatus" AS ENUM ('SCHEDULED', 'OPERATED', 'CANCELLED', 'DIVERTED', 'NOT_OPERATED');

-- CreateEnum
CREATE TYPE "DelayPhase" AS ENUM ('ARR', 'DEP');

-- CreateEnum
CREATE TYPE "BoardingStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PassengerBoardingStatus" AS ENUM ('PENDING', 'BOARDED', 'NO_SHOW');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('DAILY', 'MONTHLY', 'YEARLY', 'COMPARATIVE', 'ANALYTICS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "WorkScheduleType" AS ENUM ('STANDARD', 'SHIFT_WORK');

-- CreateEnum
CREATE TYPE "PlaceType" AS ENUM ('ENTRY_EXIT', 'INTERNAL');

-- CreateEnum
CREATE TYPE "WorkDayStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'INCOMPLETE', 'ABSENT');

-- CreateEnum
CREATE TYPE "OvertimeStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "TrainingType" AS ENUM ('INITIAL', 'RENEWAL', 'EXTENSION');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'OPERATIONS', 'VIEWER', 'STW', 'NAPLATE');

-- CreateEnum
CREATE TYPE "BillingReportType" AS ENUM ('DAILY', 'MONTHLY');

-- CreateTable
CREATE TABLE "OperationType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlightType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlightType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationTypeFlightType" (
    "operationTypeId" TEXT NOT NULL,
    "flightTypeId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Airline" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icaoCode" TEXT NOT NULL,
    "iataCode" TEXT,
    "country" TEXT,
    "address" TEXT,
    "logoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Airline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirlineRoute" (
    "id" TEXT NOT NULL,
    "airlineId" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AirlineRoute_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Airport" (
    "id" TEXT NOT NULL,
    "iataCode" TEXT NOT NULL,
    "icaoCode" TEXT,
    "name" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT NOT NULL,
    "isEU" BOOLEAN,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Airport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AircraftType" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "seats" INTEGER NOT NULL,
    "mtow" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AircraftType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Flight" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "airlineId" TEXT NOT NULL,
    "aircraftTypeId" TEXT NOT NULL,
    "registration" TEXT NOT NULL,
    "route" TEXT NOT NULL,
    "operationTypeId" TEXT NOT NULL,
    "flightTypeId" TEXT,
    "availableSeats" INTEGER,
    "arrivalAirportId" TEXT,
    "departureAirportId" TEXT,
    "arrivalFlightNumber" TEXT,
    "arrivalScheduledTime" TIMESTAMP(3),
    "arrivalActualTime" TIMESTAMP(3),
    "arrivalEnginesOffTime" TIMESTAMP(3),
    "arrivalPassengers" INTEGER,
    "arrivalMalePassengers" INTEGER,
    "arrivalFemalePassengers" INTEGER,
    "arrivalChildren" INTEGER,
    "arrivalInfants" INTEGER,
    "arrivalLoadFactor" DOUBLE PRECISION,
    "arrivalBaggage" INTEGER,
    "arrivalBaggageCount" INTEGER,
    "arrivalCargo" INTEGER,
    "arrivalMail" INTEGER,
    "arrivalStatus" "FlightStatus" NOT NULL DEFAULT 'OPERATED',
    "arrivalCancelReason" TEXT,
    "arrivalFerryIn" BOOLEAN NOT NULL DEFAULT false,
    "departureFlightNumber" TEXT,
    "departureScheduledTime" TIMESTAMP(3),
    "departureActualTime" TIMESTAMP(3),
    "departureDoorClosingTime" TIMESTAMP(3),
    "departurePassengers" INTEGER,
    "departureMalePassengers" INTEGER,
    "departureFemalePassengers" INTEGER,
    "departureChildren" INTEGER,
    "departureInfants" INTEGER,
    "departureNoShow" INTEGER,
    "departureLoadFactor" DOUBLE PRECISION,
    "departureBaggage" INTEGER,
    "departureBaggageCount" INTEGER,
    "departureCargo" INTEGER,
    "departureMail" INTEGER,
    "departureStatus" "FlightStatus" NOT NULL DEFAULT 'OPERATED',
    "departureCancelReason" TEXT,
    "departureFerryOut" BOOLEAN NOT NULL DEFAULT false,
    "handlingAgent" TEXT,
    "stand" TEXT,
    "gate" TEXT,
    "dataSource" TEXT NOT NULL DEFAULT 'MANUAL',
    "importedFile" TEXT,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Flight_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "BoardingManifest" (
    "id" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "boardingStatus" "BoardingStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "completedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardingManifest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManifestPassenger" (
    "id" TEXT NOT NULL,
    "manifestId" TEXT NOT NULL,
    "seatNumber" TEXT,
    "passengerName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "passengerId" TEXT,
    "fareClass" TEXT,
    "confirmationDate" TEXT,
    "isInfant" BOOLEAN NOT NULL DEFAULT false,
    "boardingStatus" "PassengerBoardingStatus" NOT NULL DEFAULT 'PENDING',
    "boardedAt" TIMESTAMP(3),
    "ssrCodes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManifestPassenger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DelayCode" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DelayCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FlightDelay" (
    "id" TEXT NOT NULL,
    "flightId" TEXT NOT NULL,
    "phase" "DelayPhase" NOT NULL,
    "delayCodeId" TEXT NOT NULL,
    "minutes" INTEGER NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT true,
    "comment" TEXT,
    "unofficialReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FlightDelay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AirlineDelayCode" (
    "id" TEXT NOT NULL,
    "airlineId" TEXT NOT NULL,
    "delayCodeId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AirlineDelayCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sector" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "color" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sector_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "validityPeriodMonths" INTEGER,
    "requiresRenewal" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "trainingType" "TrainingType",
    "parentLicenseTypeId" TEXT,
    "instructors" TEXT,
    "programDuration" TEXT,
    "theoryHours" INTEGER,
    "practicalHours" INTEGER,
    "workplaceTraining" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LicenseType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "employeeNumber" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "nationalId" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "hireDate" TIMESTAMP(3) NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "sectorId" TEXT,
    "serviceId" TEXT,
    "jobPositionId" TEXT,
    "photo" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "workScheduleType" "WorkScheduleType" NOT NULL DEFAULT 'STANDARD',
    "standardStartTime" TEXT,
    "standardEndTime" TEXT,
    "expectedHoursPerDay" DECIMAL(65,30) DEFAULT 8.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Service" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "sectorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Service_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "plannedHeadcount" INTEGER,
    "requiredEducation" TEXT,
    "sectorId" TEXT NOT NULL,
    "serviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipmentAssignment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT,
    "sectorId" TEXT,
    "equipmentName" TEXT NOT NULL,
    "notes" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EquipmentAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "License" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "licenseType" TEXT,
    "licenseTypeId" TEXT,
    "licenseNumber" TEXT NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "issuer" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "requiredForPosition" TEXT,
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "License_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseDocument" (
    "id" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicenseDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployeeDocument" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "category" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LicenseNotification" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "licenseId" TEXT NOT NULL,
    "notificationDate" TIMESTAMP(3) NOT NULL,
    "sent" BOOLEAN NOT NULL DEFAULT false,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LicenseNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_control_users" (
    "id" TEXT NOT NULL,
    "externalUserId" INTEGER NOT NULL,
    "firstname" TEXT,
    "lastname" TEXT,
    "card" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_control_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_control_places" (
    "id" TEXT NOT NULL,
    "externalPlaceId" INTEGER NOT NULL,
    "placeName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastSyncAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_control_places_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_control_events" (
    "id" TEXT NOT NULL,
    "externalEventId" INTEGER NOT NULL,
    "userId" TEXT,
    "placeId" TEXT,
    "eventTime" TIMESTAMP(3) NOT NULL,
    "eventId" INTEGER,
    "controllerId" INTEGER,
    "reader" INTEGER,
    "userToken" TEXT,
    "username" TEXT,
    "userLastname" TEXT,
    "rawData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_control_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_control_sync_logs" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recordsSynced" INTEGER NOT NULL DEFAULT 0,
    "recordsInserted" INTEGER NOT NULL DEFAULT 0,
    "recordsUpdated" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "syncDuration" INTEGER,
    "sourceDatabase" TEXT,
    "lastEventTime" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_control_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "parameters" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'bs',
    "format" TEXT NOT NULL,
    "filePath" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSchedule" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "dayOfWeek" INTEGER,
    "dayOfMonth" INTEGER,
    "time" TEXT NOT NULL,
    "recipients" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastRun" TIMESTAMP(3),
    "nextRun" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BenchmarkData" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "region" TEXT,
    "airline" TEXT,
    "route" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BenchmarkData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastData" (
    "id" TEXT NOT NULL,
    "forecastDate" TIMESTAMP(3) NOT NULL,
    "metric" TEXT NOT NULL,
    "predicted" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "actual" DOUBLE PRECISION,
    "model" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForecastData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "billingPinHash" TEXT,
    "billingPinFailedAttempts" INTEGER NOT NULL DEFAULT 0,
    "billingPinLockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginAttempt" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ipAddress" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperationType_code_key" ON "OperationType"("code");

-- CreateIndex
CREATE UNIQUE INDEX "FlightType_code_key" ON "FlightType"("code");

-- CreateIndex
CREATE INDEX "OperationTypeFlightType_operationTypeId_idx" ON "OperationTypeFlightType"("operationTypeId");

-- CreateIndex
CREATE INDEX "OperationTypeFlightType_flightTypeId_idx" ON "OperationTypeFlightType"("flightTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "OperationTypeFlightType_operationTypeId_flightTypeId_key" ON "OperationTypeFlightType"("operationTypeId", "flightTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "Airline_icaoCode_key" ON "Airline"("icaoCode");

-- CreateIndex
CREATE INDEX "AirlineRoute_airlineId_idx" ON "AirlineRoute"("airlineId");

-- CreateIndex
CREATE UNIQUE INDEX "AirlineRoute_airlineId_route_key" ON "AirlineRoute"("airlineId", "route");

-- CreateIndex
CREATE UNIQUE INDEX "Airport_iataCode_key" ON "Airport"("iataCode");

-- CreateIndex
CREATE UNIQUE INDEX "Airport_icaoCode_key" ON "Airport"("icaoCode");

-- CreateIndex
CREATE UNIQUE INDEX "AircraftType_model_key" ON "AircraftType"("model");

-- CreateIndex
CREATE INDEX "Flight_date_idx" ON "Flight"("date");

-- CreateIndex
CREATE INDEX "Flight_airlineId_idx" ON "Flight"("airlineId");

-- CreateIndex
CREATE INDEX "Flight_route_idx" ON "Flight"("route");

-- CreateIndex
CREATE INDEX "Flight_arrivalAirportId_idx" ON "Flight"("arrivalAirportId");

-- CreateIndex
CREATE INDEX "Flight_departureAirportId_idx" ON "Flight"("departureAirportId");

-- CreateIndex
CREATE INDEX "Flight_operationTypeId_idx" ON "Flight"("operationTypeId");

-- CreateIndex
CREATE INDEX "Flight_flightTypeId_idx" ON "Flight"("flightTypeId");

-- CreateIndex
CREATE INDEX "Flight_aircraftTypeId_idx" ON "Flight"("aircraftTypeId");

-- CreateIndex
CREATE INDEX "Flight_departureScheduledTime_idx" ON "Flight"("departureScheduledTime");

-- CreateIndex
CREATE INDEX "Flight_departureActualTime_idx" ON "Flight"("departureActualTime");

-- CreateIndex
CREATE INDEX "Flight_date_airlineId_idx" ON "Flight"("date", "airlineId");

-- CreateIndex
CREATE INDEX "Flight_date_route_idx" ON "Flight"("date", "route");

-- CreateIndex
CREATE INDEX "Flight_date_operationTypeId_idx" ON "Flight"("date", "operationTypeId");

-- CreateIndex
CREATE INDEX "Flight_date_departureScheduledTime_idx" ON "Flight"("date", "departureScheduledTime");

-- CreateIndex
CREATE UNIQUE INDEX "DailyOperationsVerification_date_key" ON "DailyOperationsVerification"("date");

-- CreateIndex
CREATE INDEX "DailyOperationsVerification_date_idx" ON "DailyOperationsVerification"("date");

-- CreateIndex
CREATE UNIQUE INDEX "BoardingManifest_flightId_key" ON "BoardingManifest"("flightId");

-- CreateIndex
CREATE INDEX "BoardingManifest_flightId_idx" ON "BoardingManifest"("flightId");

-- CreateIndex
CREATE INDEX "BoardingManifest_boardingStatus_idx" ON "BoardingManifest"("boardingStatus");

-- CreateIndex
CREATE INDEX "BoardingManifest_uploadedByUserId_idx" ON "BoardingManifest"("uploadedByUserId");

-- CreateIndex
CREATE INDEX "ManifestPassenger_manifestId_idx" ON "ManifestPassenger"("manifestId");

-- CreateIndex
CREATE INDEX "ManifestPassenger_boardingStatus_idx" ON "ManifestPassenger"("boardingStatus");

-- CreateIndex
CREATE INDEX "ManifestPassenger_passengerName_idx" ON "ManifestPassenger"("passengerName");

-- CreateIndex
CREATE INDEX "ManifestPassenger_manifestId_boardingStatus_idx" ON "ManifestPassenger"("manifestId", "boardingStatus");

-- CreateIndex
CREATE INDEX "ManifestPassenger_seatNumber_idx" ON "ManifestPassenger"("seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DelayCode_code_key" ON "DelayCode"("code");

-- CreateIndex
CREATE INDEX "FlightDelay_flightId_idx" ON "FlightDelay"("flightId");

-- CreateIndex
CREATE INDEX "FlightDelay_delayCodeId_idx" ON "FlightDelay"("delayCodeId");

-- CreateIndex
CREATE INDEX "AirlineDelayCode_airlineId_idx" ON "AirlineDelayCode"("airlineId");

-- CreateIndex
CREATE INDEX "AirlineDelayCode_delayCodeId_idx" ON "AirlineDelayCode"("delayCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "AirlineDelayCode_airlineId_delayCodeId_key" ON "AirlineDelayCode"("airlineId", "delayCodeId");

-- CreateIndex
CREATE UNIQUE INDEX "Sector_name_key" ON "Sector"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Sector_code_key" ON "Sector"("code");

-- CreateIndex
CREATE UNIQUE INDEX "LicenseType_name_key" ON "LicenseType"("name");

-- CreateIndex
CREATE UNIQUE INDEX "LicenseType_code_key" ON "LicenseType"("code");

-- CreateIndex
CREATE INDEX "LicenseType_parentLicenseTypeId_idx" ON "LicenseType"("parentLicenseTypeId");

-- CreateIndex
CREATE INDEX "LicenseType_trainingType_idx" ON "LicenseType"("trainingType");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_employeeNumber_key" ON "Employee"("employeeNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- CreateIndex
CREATE INDEX "Employee_sectorId_idx" ON "Employee"("sectorId");

-- CreateIndex
CREATE INDEX "Employee_serviceId_idx" ON "Employee"("serviceId");

-- CreateIndex
CREATE INDEX "Employee_jobPositionId_idx" ON "Employee"("jobPositionId");

-- CreateIndex
CREATE INDEX "Service_sectorId_idx" ON "Service"("sectorId");

-- CreateIndex
CREATE INDEX "Position_sectorId_idx" ON "Position"("sectorId");

-- CreateIndex
CREATE INDEX "Position_serviceId_idx" ON "Position"("serviceId");

-- CreateIndex
CREATE INDEX "EquipmentAssignment_employeeId_idx" ON "EquipmentAssignment"("employeeId");

-- CreateIndex
CREATE INDEX "EquipmentAssignment_sectorId_idx" ON "EquipmentAssignment"("sectorId");

-- CreateIndex
CREATE INDEX "EquipmentAssignment_equipmentName_idx" ON "EquipmentAssignment"("equipmentName");

-- CreateIndex
CREATE INDEX "License_employeeId_idx" ON "License"("employeeId");

-- CreateIndex
CREATE INDEX "License_expiryDate_idx" ON "License"("expiryDate");

-- CreateIndex
CREATE INDEX "License_licenseTypeId_idx" ON "License"("licenseTypeId");

-- CreateIndex
CREATE INDEX "LicenseDocument_licenseId_idx" ON "LicenseDocument"("licenseId");

-- CreateIndex
CREATE INDEX "EmployeeDocument_employeeId_idx" ON "EmployeeDocument"("employeeId");

-- CreateIndex
CREATE INDEX "EmployeeDocument_category_idx" ON "EmployeeDocument"("category");

-- CreateIndex
CREATE INDEX "LicenseNotification_employeeId_idx" ON "LicenseNotification"("employeeId");

-- CreateIndex
CREATE INDEX "LicenseNotification_licenseId_idx" ON "LicenseNotification"("licenseId");

-- CreateIndex
CREATE UNIQUE INDEX "access_control_users_externalUserId_key" ON "access_control_users"("externalUserId");

-- CreateIndex
CREATE INDEX "access_control_users_externalUserId_idx" ON "access_control_users"("externalUserId");

-- CreateIndex
CREATE INDEX "access_control_users_lastname_firstname_idx" ON "access_control_users"("lastname", "firstname");

-- CreateIndex
CREATE UNIQUE INDEX "access_control_places_externalPlaceId_key" ON "access_control_places"("externalPlaceId");

-- CreateIndex
CREATE INDEX "access_control_places_externalPlaceId_idx" ON "access_control_places"("externalPlaceId");

-- CreateIndex
CREATE UNIQUE INDEX "access_control_events_externalEventId_key" ON "access_control_events"("externalEventId");

-- CreateIndex
CREATE INDEX "access_control_events_userId_eventTime_idx" ON "access_control_events"("userId", "eventTime");

-- CreateIndex
CREATE INDEX "access_control_events_placeId_eventTime_idx" ON "access_control_events"("placeId", "eventTime");

-- CreateIndex
CREATE INDEX "access_control_events_eventTime_idx" ON "access_control_events"("eventTime");

-- CreateIndex
CREATE INDEX "access_control_sync_logs_createdAt_idx" ON "access_control_sync_logs"("createdAt");

-- CreateIndex
CREATE INDEX "access_control_sync_logs_status_idx" ON "access_control_sync_logs"("status");

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

-- CreateIndex
CREATE INDEX "Report_userId_idx" ON "Report"("userId");

-- CreateIndex
CREATE INDEX "Report_generatedAt_idx" ON "Report"("generatedAt");

-- CreateIndex
CREATE INDEX "Report_type_idx" ON "Report"("type");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSchedule_reportId_key" ON "ReportSchedule"("reportId");

-- CreateIndex
CREATE INDEX "ReportSchedule_nextRun_idx" ON "ReportSchedule"("nextRun");

-- CreateIndex
CREATE INDEX "BenchmarkData_date_metric_idx" ON "BenchmarkData"("date", "metric");

-- CreateIndex
CREATE INDEX "BenchmarkData_airline_idx" ON "BenchmarkData"("airline");

-- CreateIndex
CREATE INDEX "ForecastData_forecastDate_idx" ON "ForecastData"("forecastDate");

-- CreateIndex
CREATE INDEX "ForecastData_metric_idx" ON "ForecastData"("metric");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "BillingReport_periodStart_idx" ON "BillingReport"("periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "BillingReport_type_periodStart_key" ON "BillingReport"("type", "periodStart");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_email_createdAt_idx" ON "LoginAttempt"("email", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipAddress_createdAt_idx" ON "LoginAttempt"("ipAddress", "createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_createdAt_idx" ON "LoginAttempt"("createdAt");

-- AddForeignKey
ALTER TABLE "OperationTypeFlightType" ADD CONSTRAINT "OperationTypeFlightType_operationTypeId_fkey" FOREIGN KEY ("operationTypeId") REFERENCES "OperationType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationTypeFlightType" ADD CONSTRAINT "OperationTypeFlightType_flightTypeId_fkey" FOREIGN KEY ("flightTypeId") REFERENCES "FlightType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirlineRoute" ADD CONSTRAINT "AirlineRoute_airlineId_fkey" FOREIGN KEY ("airlineId") REFERENCES "Airline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_airlineId_fkey" FOREIGN KEY ("airlineId") REFERENCES "Airline"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_aircraftTypeId_fkey" FOREIGN KEY ("aircraftTypeId") REFERENCES "AircraftType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_operationTypeId_fkey" FOREIGN KEY ("operationTypeId") REFERENCES "OperationType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_flightTypeId_fkey" FOREIGN KEY ("flightTypeId") REFERENCES "FlightType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_arrivalAirportId_fkey" FOREIGN KEY ("arrivalAirportId") REFERENCES "Airport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_departureAirportId_fkey" FOREIGN KEY ("departureAirportId") REFERENCES "Airport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Flight" ADD CONSTRAINT "Flight_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyOperationsVerification" ADD CONSTRAINT "DailyOperationsVerification_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardingManifest" ADD CONSTRAINT "BoardingManifest_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardingManifest" ADD CONSTRAINT "BoardingManifest_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardingManifest" ADD CONSTRAINT "BoardingManifest_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManifestPassenger" ADD CONSTRAINT "ManifestPassenger_manifestId_fkey" FOREIGN KEY ("manifestId") REFERENCES "BoardingManifest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightDelay" ADD CONSTRAINT "FlightDelay_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FlightDelay" ADD CONSTRAINT "FlightDelay_delayCodeId_fkey" FOREIGN KEY ("delayCodeId") REFERENCES "DelayCode"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirlineDelayCode" ADD CONSTRAINT "AirlineDelayCode_airlineId_fkey" FOREIGN KEY ("airlineId") REFERENCES "Airline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AirlineDelayCode" ADD CONSTRAINT "AirlineDelayCode_delayCodeId_fkey" FOREIGN KEY ("delayCodeId") REFERENCES "DelayCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseType" ADD CONSTRAINT "LicenseType_parentLicenseTypeId_fkey" FOREIGN KEY ("parentLicenseTypeId") REFERENCES "LicenseType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_jobPositionId_fkey" FOREIGN KEY ("jobPositionId") REFERENCES "Position"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Service" ADD CONSTRAINT "Service_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentAssignment" ADD CONSTRAINT "EquipmentAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EquipmentAssignment" ADD CONSTRAINT "EquipmentAssignment_sectorId_fkey" FOREIGN KEY ("sectorId") REFERENCES "Sector"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "License" ADD CONSTRAINT "License_licenseTypeId_fkey" FOREIGN KEY ("licenseTypeId") REFERENCES "LicenseType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseDocument" ADD CONSTRAINT "LicenseDocument_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployeeDocument" ADD CONSTRAINT "EmployeeDocument_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseNotification" ADD CONSTRAINT "LicenseNotification_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LicenseNotification" ADD CONSTRAINT "LicenseNotification_licenseId_fkey" FOREIGN KEY ("licenseId") REFERENCES "License"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_control_events" ADD CONSTRAINT "access_control_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "access_control_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_control_events" ADD CONSTRAINT "access_control_events_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "access_control_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSchedule" ADD CONSTRAINT "ReportSchedule_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "Report"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BillingReport" ADD CONSTRAINT "BillingReport_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

