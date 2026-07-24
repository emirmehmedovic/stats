import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createCommentSchema } from '@/lib/validators/support-ticket';
import { requireAnyAuth } from '@/lib/route-guards';
import { notifyTicketCommented } from '@/lib/notifications';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/support-tickets/[id]/comments - Lista komentara na tiketu
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const { id } = await context.params;

    // Check if ticket exists and user has access
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, submittedById: true },
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

    // Non-admins can only see comments on their own tickets
    if (user.role !== 'ADMIN' && ticket.submittedById !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nemate dozvolu za pristup',
        },
        { status: 403 }
      );
    }

    const comments = await prisma.ticketComment.findMany({
      where: {
        ticketId: id,
        // Non-admins can't see internal comments
        ...(user.role !== 'ADMIN' ? { isInternal: false } : {}),
      },
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
    });

    return NextResponse.json({
      success: true,
      data: comments,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch comments',
      },
      { status: 500 }
    );
  }
}

// POST /api/support-tickets/[id]/comments - Dodavanje komentara
// ADMIN može dodati na bilo koji tiket
// Vlasnik tiketa može dodati komentar na svoj tiket
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const { id } = await context.params;

    // Check if ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
      select: { id: true, title: true, submittedById: true, status: true },
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

    // Check authorization: ADMIN or ticket owner
    const isAdmin = user.role === 'ADMIN';
    const isOwner = ticket.submittedById === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nemate dozvolu za dodavanje komentara',
        },
        { status: 403 }
      );
    }

    // Check if ticket is closed (only ADMIN can comment on closed tickets)
    if (ticket.status === 'CLOSED' && !isAdmin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ne možete komentarisati zatvoreni tiket',
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = createCommentSchema.parse(body);

    // Only ADMIN can create internal comments
    if (validatedData.isInternal && !isAdmin) {
      validatedData.isInternal = false;
    }

    const comment = await prisma.ticketComment.create({
      data: {
        content: validatedData.content,
        isInternal: validatedData.isInternal,
        authorId: user.id,
        ticketId: id,
      },
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
    });

    // Send notifications
    try {
      await notifyTicketCommented(
        id,
        ticket.title,
        ticket.submittedById,
        user.id,
        user.name || user.email,
        validatedData.isInternal || false
      );
    } catch (notifyError) {
      console.error('Failed to send notifications:', notifyError);
    }

    return NextResponse.json(
      {
        success: true,
        data: comment,
        message: 'Komentar uspješno dodan',
      },
      { status: 201 }
    );
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

    console.error('Error creating comment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create comment',
      },
      { status: 500 }
    );
  }
}
