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

-- AddForeignKey
ALTER TABLE "access_control_events" ADD CONSTRAINT "access_control_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "access_control_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "access_control_events" ADD CONSTRAINT "access_control_events_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "access_control_places"("id") ON DELETE SET NULL ON UPDATE CASCADE;
