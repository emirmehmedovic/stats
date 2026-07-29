-- Proširenje NotificationType enum-a sa novim vrijednostima za flight errors
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FLIGHT_ERROR_ASSIGNED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FLIGHT_ERROR_RESOLVED';
ALTER TYPE "NotificationType" ADD VALUE IF NOT EXISTS 'FLIGHT_ERROR_DISPUTED';
