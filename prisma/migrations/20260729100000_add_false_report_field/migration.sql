-- AddColumn - Označavanje lažne prijave greške
-- Dodaje polje isFalseReport na FlightErrorReport tabelu
-- Koristi se kad admin zatvori osporenu grešku i označi je kao lažnu prijavu

ALTER TABLE "FlightErrorReport" ADD COLUMN IF NOT EXISTS "isFalseReport" BOOLEAN NOT NULL DEFAULT false;

-- Kreiranje indeksa za brže pretraživanje lažnih prijava po reporteru
CREATE INDEX IF NOT EXISTS "FlightErrorReport_isFalseReport_idx" ON "FlightErrorReport"("isFalseReport");
CREATE INDEX IF NOT EXISTS "FlightErrorReport_reportedById_isFalseReport_idx" ON "FlightErrorReport"("reportedById", "isFalseReport");
