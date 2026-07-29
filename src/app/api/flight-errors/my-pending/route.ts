import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyAuth } from '@/lib/route-guards';
import { FlightErrorStatus } from '@prisma/client';

// GET /api/flight-errors/my-pending - Moje neriješene greške
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const pendingStatuses = [FlightErrorStatus.OPEN, FlightErrorStatus.IN_PROGRESS];

    const errors = await prisma.flightErrorReport.findMany({
      where: {
        assignedToId: user.id,
        status: {
          in: pendingStatuses,
        },
      },
      include: {
        flight: {
          select: {
            id: true,
            date: true,
            route: true,
            arrivalFlightNumber: true,
            departureFlightNumber: true,
            airline: {
              select: {
                id: true,
                name: true,
                icaoCode: true,
              },
            },
          },
        },
        _count: {
          select: {
            attachments: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' }, // URGENT first
        { createdAt: 'asc' }, // Oldest first
      ],
    });

    // Remove reporter info
    const sanitizedErrors = errors.map(({ reportedById, ...error }) => error);

    return NextResponse.json({
      success: true,
      data: sanitizedErrors,
      count: errors.length,
    });
  } catch (error) {
    console.error('Error fetching pending errors:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch pending errors',
      },
      { status: 500 }
    );
  }
}
