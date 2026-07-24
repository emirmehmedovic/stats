import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createTicketSchema, getTicketsQuerySchema } from '@/lib/validators/support-ticket';
import { requireAnyAuth } from '@/lib/route-guards';
import { notifyAdminsOfNewTicket } from '@/lib/notifications';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// GET /api/support-tickets - Lista tiketa
// Svi korisnici mogu vidjeti svoje tikete, ADMIN vidi sve
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      status: searchParams.get('status'),
      priority: searchParams.get('priority'),
      category: searchParams.get('category'),
      location: searchParams.get('location'),
      system: searchParams.get('system'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      reporterName: searchParams.get('reporterName'),
      assignedToId: searchParams.get('assignedToId'),
      submittedById: searchParams.get('submittedById'),
    };

    const validatedQuery = getTicketsQuerySchema.parse(queryParams);
    const { page, limit, search, status, priority, category, location, system, dateFrom, dateTo, reporterName, assignedToId, submittedById } = validatedQuery;

    // Build where clause
    const where: Prisma.SupportTicketWhereInput = {
      AND: [
        // Non-admins can only see their own tickets
        user.role !== 'ADMIN' ? { submittedById: user.id } : {},
        // Filters
        status ? { status } : {},
        priority ? { priority } : {},
        category ? { category } : {},
        location ? { location } : {},
        system ? { system } : {},
        assignedToId ? { assignedToId } : {},
        submittedById && user.role === 'ADMIN' ? { submittedById } : {},
        // Date range filter (on createdAt)
        dateFrom ? { createdAt: { gte: new Date(dateFrom) } } : {},
        dateTo ? { createdAt: { lte: new Date(dateTo + 'T23:59:59.999Z') } } : {},
        // Reporter name filter
        reporterName ? { reporterName: { contains: reporterName, mode: 'insensitive' } } : {},
        // Search
        search
          ? {
              OR: [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { reporterName: { contains: search, mode: 'insensitive' } },
                { submittedBy: { name: { contains: search, mode: 'insensitive' } } },
                { submittedBy: { email: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {},
      ],
    };

    // Get total count
    const total = await prisma.supportTicket.count({ where });

    // Get paginated tickets
    const tickets = await prisma.supportTicket.findMany({
      where,
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
          where: {
            isInternal: false, // Only public comments for list view
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 3, // Last 3 comments for preview
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // OPEN first
        { priority: 'desc' }, // URGENT first
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: tickets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
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

    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch support tickets',
      },
      { status: 500 }
    );
  }
}

// POST /api/support-tickets - Kreiranje novog tiketa
// Svi korisnici mogu kreirati tikete
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const body = await request.json();
    const validatedData = createTicketSchema.parse(body);

    const ticket = await prisma.supportTicket.create({
      data: {
        ...validatedData,
        submittedById: user.id,
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

    // Notify admins about new ticket
    try {
      await notifyAdminsOfNewTicket(
        ticket.id,
        ticket.title,
        ticket.submittedBy.name || ticket.submittedBy.email
      );
    } catch (notifyError) {
      console.error('Failed to send notifications:', notifyError);
      // Don't fail the request if notifications fail
    }

    return NextResponse.json(
      {
        success: true,
        data: ticket,
        message: 'Tiket uspješno kreiran',
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

    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create support ticket',
      },
      { status: 500 }
    );
  }
}
