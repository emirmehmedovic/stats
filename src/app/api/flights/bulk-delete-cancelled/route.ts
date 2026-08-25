import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrManager } from '@/lib/route-guards';
import { startOfDayUtc, endOfDayUtc } from '@/lib/dates';

/**
 * POST /api/flights/bulk-delete-cancelled
 * Bulk delete cancelled flights (both arrival and departure cancelled)
 * Only deletes future flights (date >= today)
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminOrManager(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const body = await request.json();
    const { dateFrom, dateTo } = body;

    // Default to today as start date
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let fromDate = today;
    let toDate: Date | undefined;

    if (dateFrom) {
      const parsed = startOfDayUtc(dateFrom);
      // Ensure we don't delete past flights
      fromDate = parsed > today ? parsed : today;
    }

    if (dateTo) {
      toDate = endOfDayUtc(dateTo);
    }

    // Build where clause
    const whereClause = {
      date: toDate
        ? { gte: fromDate, lte: toDate }
        : { gte: fromDate },
      arrivalStatus: 'CANCELLED' as const,
      departureStatus: 'CANCELLED' as const,
    };

    // Count flights to be deleted (for preview)
    const count = await prisma.flight.count({
      where: whereClause,
    });

    // If this is a preview request (GET-style but we use body param)
    if (body.preview === true) {
      return NextResponse.json({
        success: true,
        preview: true,
        count,
        message: `${count} potpuno otkazanih letova bi bilo obrisano`,
      });
    }

    if (count === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'Nema potpuno otkazanih budućih letova za brisanje',
      });
    }

    // Delete related records first (due to foreign key constraints)
    // Get IDs first
    const flightsToDelete = await prisma.flight.findMany({
      where: whereClause,
      select: { id: true },
    });

    const ids = flightsToDelete.map(f => f.id);

    // Delete flight delays
    await prisma.flightDelay.deleteMany({
      where: {
        flightId: { in: ids },
      },
    });

    // Delete flights
    const result = await prisma.flight.deleteMany({
      where: whereClause,
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Uspješno obrisano ${result.count} potpuno otkazanih letova`,
    });
  } catch (error) {
    console.error('Error bulk deleting cancelled flights:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri brisanju otkazanih letova',
      },
      { status: 500 }
    );
  }
}
