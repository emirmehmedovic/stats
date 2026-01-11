-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'STW';

-- CreateEnum
CREATE TYPE "BoardingStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PassengerBoardingStatus" AS ENUM ('PENDING', 'BOARDED', 'NO_SHOW');

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

-- AddForeignKey
ALTER TABLE "BoardingManifest" ADD CONSTRAINT "BoardingManifest_flightId_fkey" FOREIGN KEY ("flightId") REFERENCES "Flight"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardingManifest" ADD CONSTRAINT "BoardingManifest_uploadedByUserId_fkey" FOREIGN KEY ("uploadedByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardingManifest" ADD CONSTRAINT "BoardingManifest_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManifestPassenger" ADD CONSTRAINT "ManifestPassenger_manifestId_fkey" FOREIGN KEY ("manifestId") REFERENCES "BoardingManifest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
