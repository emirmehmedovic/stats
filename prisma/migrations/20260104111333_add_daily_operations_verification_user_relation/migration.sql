-- AddForeignKey
ALTER TABLE "DailyOperationsVerification" ADD CONSTRAINT "DailyOperationsVerification_verifiedByUserId_fkey" FOREIGN KEY ("verifiedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
