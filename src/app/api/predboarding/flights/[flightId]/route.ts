import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSTW } from '@/lib/route-guards';

type RouteContext = {
  params: Promise<{ flightId: string }>;
};

/**
 * GET /api/predboarding/flights/[flightId]
 *
 * Vraća osnovne detalje leta potrebne za upload manifesta.
 * Auth: requireSTW (STW ili ADMIN)
 */
export async function GET(request: Request, context: RouteContext) {
  const authCheck = await requireSTW(request);
  if ('error' in authCheck) return authCheck.error;

  try {
    const { flightId } = await context.params;

    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
      select: {
        id: true,
        date: true,
        departureFlightNumber: true,
        route: true,
        departureScheduledTime: true,
        airline: {
          select: {
            id: true,
            name: true,
            icaoCode: true,
            logoUrl: true,
          },
        },
        aircraftType: {
          select: {
            id: true,
            model: true,
          },
        },
      },
    });

    if (!flight) {
      return NextResponse.json(
        { success: false, error: 'Let nije pronađen' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: flight,
    });
  } catch (error) {
    console.error('Error fetching predboarding flight:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri učitavanju leta' },
      { status: 500 }
    );
  }
}
