import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSTW } from '@/lib/route-guards';
import { getTodayDateString, dateOnlyToUtc } from '@/lib/dates';

/**
 * GET /api/predboarding/today-flights
 *
 * Vraća današnje odlazne letove koji još nisu odleteli (za predboarding)
 * Auth: requireSTW (STW ili ADMIN)
 */
export async function GET(request: Request) {
  const authCheck = await requireSTW(request);
  if ('error' in authCheck) return authCheck.error;

  try {
    const today = getTodayDateString();
    const todayUtc = dateOnlyToUtc(today);
    const now = new Date();

    // Get today's departure flights that haven't departed yet
    const flights = await prisma.flight.findMany({
      where: {
        date: todayUtc,
        departureScheduledTime: { not: null }, // Has a departure scheduled
        // Only show flights that haven't departed yet
        OR: [
          { departureActualTime: null },
          { departureActualTime: { gt: now } }
        ]
      },
      select: {
        id: true,
        date: true,
        departureFlightNumber: true,
        route: true,
        departureScheduledTime: true,
        departureActualTime: true,
        airline: {
          select: {
            id: true,
            name: true,
            icaoCode: true,
            iataCode: true,
            logoUrl: true
          }
        },
        aircraftType: {
          select: {
            id: true,
            model: true,
            seats: true,
            mtow: true
          }
        },
        boardingManifest: {
          select: {
            id: true,
            boardingStatus: true,
            uploadedAt: true,
            _count: {
              select: { passengers: true }
            }
          }
        }
      },
      orderBy: {
        departureScheduledTime: 'asc'
      }
    });

    return NextResponse.json({
      success: true,
      data: flights
    });
  } catch (error) {
    console.error('Error fetching today flights:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri učitavanju letova' },
      { status: 500 }
    );
  }
}
