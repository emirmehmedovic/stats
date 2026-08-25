import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdminOrManager } from '@/lib/route-guards';

/**
 * POST /api/flights/bulk-delete-selected
 * Bulk delete flights by IDs
 */
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdminOrManager(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'ids array is required' },
        { status: 400 }
      );
    }

    // Validate all IDs are strings
    if (!ids.every((id: unknown) => typeof id === 'string')) {
      return NextResponse.json(
        { success: false, error: 'All ids must be strings' },
        { status: 400 }
      );
    }

    // Count flights to be deleted
    const count = await prisma.flight.count({
      where: {
        id: { in: ids },
      },
    });

    if (count === 0) {
      return NextResponse.json(
        { success: false, error: 'No flights found with the specified IDs' },
        { status: 404 }
      );
    }

    // Delete related records first (due to foreign key constraints)
    // Delete flight delays
    await prisma.flightDelay.deleteMany({
      where: {
        flightId: { in: ids },
      },
    });

    // Delete flights
    const result = await prisma.flight.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Uspješno obrisano ${result.count} letova`,
    });
  } catch (error) {
    console.error('Error bulk deleting selected flights:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete flights',
      },
      { status: 500 }
    );
  }
}
