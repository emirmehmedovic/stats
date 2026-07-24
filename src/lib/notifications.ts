import { prisma } from '@/lib/prisma';
import { NotificationType, Prisma } from '@prisma/client';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  ticketId?: string;
  metadata?: Prisma.InputJsonValue;
}

export async function createNotification(params: CreateNotificationParams) {
  const { userId, type, title, message, ticketId, metadata } = params;

  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      ticketId,
      metadata: metadata || Prisma.JsonNull,
    },
  });
}

export async function notifyAdminsOfNewTicket(ticketId: string, ticketTitle: string, submitterName: string) {
  // Get all admin users
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true },
  });

  // Create notifications for all admins
  const notifications = admins.map((admin) =>
    createNotification({
      userId: admin.id,
      type: 'TICKET_CREATED',
      title: 'Novi IT tiket',
      message: `${submitterName} je kreirao/la novi tiket: "${ticketTitle}"`,
      ticketId,
      metadata: { submitterName },
    })
  );

  await Promise.all(notifications);
}

export async function notifyTicketAssigned(ticketId: string, ticketTitle: string, assigneeId: string, assignerName: string) {
  await createNotification({
    userId: assigneeId,
    type: 'TICKET_ASSIGNED',
    title: 'Tiket vam je dodijeljen',
    message: `${assignerName} vam je dodijelio/la tiket: "${ticketTitle}"`,
    ticketId,
    metadata: { assignerName },
  });
}

export async function notifyTicketStatusChanged(
  ticketId: string,
  ticketTitle: string,
  submitterId: string,
  oldStatus: string,
  newStatus: string,
  changerName: string
) {
  const statusLabels: Record<string, string> = {
    OPEN: 'Otvoren',
    IN_PROGRESS: 'U obradi',
    RESOLVED: 'Riješen',
    CLOSED: 'Zatvoren',
  };

  await createNotification({
    userId: submitterId,
    type: newStatus === 'RESOLVED' ? 'TICKET_RESOLVED' : 'TICKET_UPDATED',
    title: newStatus === 'RESOLVED' ? 'Vaš tiket je riješen' : 'Status tiketa promijenjen',
    message: `Tiket "${ticketTitle}" je promijenjen iz "${statusLabels[oldStatus] || oldStatus}" u "${statusLabels[newStatus] || newStatus}"`,
    ticketId,
    metadata: { oldStatus, newStatus, changerName },
  });
}

export async function notifyTicketCommented(
  ticketId: string,
  ticketTitle: string,
  ticketSubmitterId: string,
  commentAuthorId: string,
  commentAuthorName: string,
  isInternal: boolean
) {
  // Don't notify if author is commenting on their own ticket
  if (commentAuthorId === ticketSubmitterId) {
    // But notify admins
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', isActive: true, id: { not: commentAuthorId } },
      select: { id: true },
    });

    const adminNotifications = admins.map((admin) =>
      createNotification({
        userId: admin.id,
        type: 'TICKET_COMMENTED',
        title: 'Novi komentar na tiketu',
        message: `${commentAuthorName} je komentarisao/la tiket: "${ticketTitle}"`,
        ticketId,
        metadata: { commentAuthorName },
      })
    );

    await Promise.all(adminNotifications);
    return;
  }

  // Notify ticket submitter (only if comment is not internal)
  if (!isInternal) {
    await createNotification({
      userId: ticketSubmitterId,
      type: 'TICKET_COMMENTED',
      title: 'Novi komentar na vašem tiketu',
      message: `${commentAuthorName} je komentarisao/la vaš tiket: "${ticketTitle}"`,
      ticketId,
      metadata: { commentAuthorName },
    });
  }

  // Notify other admins (not the comment author)
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true, id: { not: commentAuthorId } },
    select: { id: true },
  });

  const adminNotifications = admins.map((admin) =>
    createNotification({
      userId: admin.id,
      type: 'TICKET_COMMENTED',
      title: 'Novi komentar na tiketu',
      message: `${commentAuthorName} je komentarisao/la tiket: "${ticketTitle}"`,
      ticketId,
      metadata: { commentAuthorName, isInternal },
    })
  );

  await Promise.all(adminNotifications);
}
