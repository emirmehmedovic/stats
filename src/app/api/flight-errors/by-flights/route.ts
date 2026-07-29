import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyAuth } from '@/lib/route-guards';

// GET /api/flight-errors/by-flights - Get error statuses for multiple flights
// Only ADMIN/OPERATIONS can see error statuses for display purposes
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    // Only ADMIN/OPERATIONS can see flight error statuses
    const canViewErrors = user.role === 'ADMIN' || user.role === 'OPERATIONS';
    if (!canViewErrors) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const { searchParams } = new URL(request.url);
    const flightIds = searchParams.getAll('flightIds');

    if (flightIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const errors = await prisma.flightErrorReport.findMany({
      where: {
        flightId: { in: flightIds },
      },
      select: {
        id: true,
        flightId: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: errors,
    });
  } catch (error) {
    console.error('Error fetching flight error statuses:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch flight error statuses',
      },
      { status: 500 }
    );
  }
}
