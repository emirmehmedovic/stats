import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateTicketSchema } from '@/lib/validators/support-ticket';
import { requireAnyAuth, requireAdmin } from '@/lib/route-guards';
import { notifyTicketStatusChanged, notifyTicketAssigned } from '@/lib/notifications';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/support-tickets/[id] - Detalji tiketa
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const { id } = await context.params;

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        airline: {
          select: {
            id: true,
            name: true,
            icaoCode: true,
          },
        },
        flight: {
          select: {
            id: true,
            date: true,
            route: true,
            arrivalFlightNumber: true,
            departureFlightNumber: true,
            airline: {
              select: {
                name: true,
                icaoCode: true,
              },
            },
          },
        },
        comments: {
          where: user.role === 'ADMIN'
            ? {}
            : { isInternal: false }, // Non-admins can't see internal comments
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
            attachments: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        attachments: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tiket nije pronađen',
        },
        { status: 404 }
      );
    }

    // Non-admins can only see their own tickets
    if (user.role !== 'ADMIN' && ticket.submittedById !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nemate dozvolu za pristup ovom tiketu',
        },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch support ticket',
      },
      { status: 500 }
    );
  }
}

// PATCH /api/support-tickets/[id] - Ažuriranje tiketa (samo ADMIN)
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAdmin(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const { id } = await context.params;
    const body = await request.json();

    // Check if ticket exists
    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        status: true,
        submittedById: true,
        assignedToId: true,
      },
    });

    if (!existingTicket) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tiket nije pronađen',
        },
        { status: 404 }
      );
    }

    const validatedData = updateTicketSchema.parse(body);

    // Handle status change timestamps
    const statusUpdates: { resolvedAt?: Date | null; closedAt?: Date | null } = {};
    if (validatedData.status) {
      if (validatedData.status === 'RESOLVED' && existingTicket.status !== 'RESOLVED') {
        statusUpdates.resolvedAt = new Date();
      }
      if (validatedData.status === 'CLOSED' && existingTicket.status !== 'CLOSED') {
        statusUpdates.closedAt = new Date();
      }
      // Clear timestamps if reopening
      if (validatedData.status === 'OPEN' || validatedData.status === 'IN_PROGRESS') {
        if (existingTicket.status === 'RESOLVED') {
          statusUpdates.resolvedAt = null;
        }
        if (existingTicket.status === 'CLOSED') {
          statusUpdates.closedAt = null;
        }
      }
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: {
        ...validatedData,
        ...statusUpdates,
      },
      include: {
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        airline: {
          select: {
            id: true,
            name: true,
            icaoCode: true,
          },
        },
        flight: {
          select: {
            id: true,
            date: true,
            route: true,
            arrivalFlightNumber: true,
            departureFlightNumber: true,
          },
        },
      },
    });

    // Send notifications
    try {
      // Notify if status changed
      if (validatedData.status && validatedData.status !== existingTicket.status) {
        await notifyTicketStatusChanged(
          ticket.id,
          existingTicket.title,
          existingTicket.submittedById,
          existingTicket.status,
          validatedData.status,
          user.name || user.email
        );
      }

      // Notify if assigned to someone new
      if (validatedData.assignedToId && validatedData.assignedToId !== existingTicket.assignedToId) {
        await notifyTicketAssigned(
          ticket.id,
          existingTicket.title,
          validatedData.assignedToId,
          user.name || user.email
        );
      }
    } catch (notifyError) {
      console.error('Failed to send notifications:', notifyError);
    }

    return NextResponse.json({
      success: true,
      data: ticket,
      message: 'Tiket uspješno ažuriran',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Error updating support ticket:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update support ticket',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/support-tickets/[id] - Brisanje tiketa (samo ADMIN)
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAdmin(request);
    if ('error' in authResult) return authResult.error;

    const { id } = await context.params;

    // Check if ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!ticket) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tiket nije pronađen',
        },
        { status: 404 }
      );
    }

    await prisma.supportTicket.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Tiket uspješno obrisan',
    });
  } catch (error) {
    console.error('Error deleting support ticket:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete support ticket',
      },
      { status: 500 }
    );
  }
}
