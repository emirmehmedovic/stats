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

// ---------------------------------------------------------
// FLIGHT ERROR NOTIFICATIONS
// ---------------------------------------------------------

interface FlightErrorNotificationParams {
  flightErrorId: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Notify a user that a flight error has been assigned to them
 */
export async function notifyUserOfAssignedError(
  assigneeId: string,
  flightErrorId: string,
  flightInfo: string,
  errorType: string,
  priority: string
) {
  const priorityLabels: Record<string, string> = {
    LOW: 'Nizak',
    MEDIUM: 'Srednji',
    HIGH: 'Visok',
    URGENT: 'Hitan',
  };

  const errorTypeLabels: Record<string, string> = {
    GENERAL: 'Opća greška',
    DEPARTURE_PASSENGERS: 'Broj odlaznih putnika',
    ARRIVAL_PASSENGERS: 'Broj dolaznih putnika',
    AIRCRAFT_TYPE: 'Tip aviona',
    OPERATION_TYPE: 'Tip operacije',
    FLIGHT_TYPE: 'Tip leta',
  };

  await prisma.notification.create({
    data: {
      userId: assigneeId,
      type: 'FLIGHT_ERROR_ASSIGNED',
      title: 'Greška na letu vam je dodijeljena',
      message: `Prijavljena je greška na letu ${flightInfo}: ${errorTypeLabels[errorType] || errorType}. Prioritet: ${priorityLabels[priority] || priority}`,
      flightErrorId,
      metadata: { flightInfo, errorType, priority },
    },
  });
}

/**
 * Notify the reporter that an error they reported has been resolved
 */
export async function notifyReporterOfResolution(
  reporterId: string,
  flightErrorId: string,
  flightInfo: string,
  resolverName: string
) {
  await prisma.notification.create({
    data: {
      userId: reporterId,
      type: 'FLIGHT_ERROR_RESOLVED',
      title: 'Greška na letu je ispravljena',
      message: `Greška koju ste prijavili na letu ${flightInfo} je ispravljena od strane korisnika.`,
      flightErrorId,
      metadata: { flightInfo, resolverName },
    },
  });
}

/**
 * Notify the reporter that an error they reported has been disputed
 */
export async function notifyReporterOfDispute(
  reporterId: string,
  flightErrorId: string,
  flightInfo: string,
  disputeReason: string
) {
  await prisma.notification.create({
    data: {
      userId: reporterId,
      type: 'FLIGHT_ERROR_DISPUTED',
      title: 'Greška na letu je osporena',
      message: `Korisnik je osporio grešku na letu ${flightInfo}. Razlog: "${disputeReason.substring(0, 100)}${disputeReason.length > 100 ? '...' : ''}"`,
      flightErrorId,
      metadata: { flightInfo, disputeReason },
    },
  });
}

/**
 * Notify admins about a disputed error for review
 */
export async function notifyAdminsOfDisputedError(
  flightErrorId: string,
  flightInfo: string,
  disputerName: string,
  disputeReason: string
) {
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', isActive: true },
    select: { id: true },
  });

  const notifications = admins.map((admin) =>
    prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'FLIGHT_ERROR_DISPUTED',
        title: 'Greška na letu osporena',
        message: `${disputerName} je osporio/la grešku na letu ${flightInfo}. Razlog: "${disputeReason.substring(0, 100)}${disputeReason.length > 100 ? '...' : ''}"`,
        flightErrorId,
        metadata: { flightInfo, disputerName, disputeReason },
      },
    })
  );

  await Promise.all(notifications);
}
