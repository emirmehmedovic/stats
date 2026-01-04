-- AlterTable
ALTER TABLE "Flight" ADD COLUMN     "arrivalFerryIn" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "departureFerryOut" BOOLEAN NOT NULL DEFAULT false;
