import { prisma } from '@/lib/prisma';
import { getClientIp } from '@/lib/rate-limit';

type AuditInput = {
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  request?: Request;
};

export async function logAudit({
  userId,
  action,
  entityType,
  entityId,
  metadata,
  request,
}: AuditInput) {
  try {
    const ipAddress = request ? getClientIp(request) : null;
    const userAgent = request?.headers.get('user-agent') || null;

    await prisma.auditLog.create({
      data: {
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        metadata: metadata || null,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('Audit log error:', error);
  }
}
