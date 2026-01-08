import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrManager } from '@/lib/route-guards';

/**
 * POST /api/flights/bulk-delete
 * Bulk delete flights by date range
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminOrManager(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const body = await request.json();
    const { dateFrom, dateTo } = body;

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { success: false, error: 'dateFrom and dateTo are required' },
        { status: 400 }
      );
    }

    // Validate date range
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (fromDate > toDate) {
      return NextResponse.json(
        { success: false, error: 'dateFrom must be before or equal to dateTo' },
        { status: 400 }
      );
    }

    // Set time to start/end of day for proper range
    fromDate.setHours(0, 0, 0, 0);
    toDate.setHours(23, 59, 59, 999);

    // Count flights to be deleted
    const count = await prisma.flight.count({
      where: {
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    if (count === 0) {
      return NextResponse.json(
        { success: false, error: 'No flights found in the specified date range' },
        { status: 404 }
      );
    }

    // Delete related records first (due to foreign key constraints)
    // Delete flight delays
    await prisma.flightDelay.deleteMany({
      where: {
        flight: {
          date: {
            gte: fromDate,
            lte: toDate,
          },
        },
      },
    });

    // Delete daily operations verifications
    await prisma.dailyOperationsVerification.deleteMany({
      where: {
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    // Delete flights
    const result = await prisma.flight.deleteMany({
      where: {
        date: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        deletedCount: result.count,
        dateFrom: fromDate.toISOString(),
        dateTo: toDate.toISOString(),
      },
      message: `Successfully deleted ${result.count} flights`,
    });
  } catch (error) {
    console.error('Error bulk deleting flights:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete flights',
      },
      { status: 500 }
    );
  }
}
