import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyAuth } from '@/lib/route-guards';

// GET /api/support-tickets/flights-by-date?date=2024-01-15
// Dohvat letova za određeni dan (za IT tiket formu)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;

    const dateParam = request.nextUrl.searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: 'Datum je obavezan' },
        { status: 400 }
      );
    }

    // Parse date and create range for that day
    const date = new Date(dateParam);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const flights = await prisma.flight.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        date: true,
        route: true,
        arrivalFlightNumber: true,
        departureFlightNumber: true,
        arrivalScheduledTime: true,
        departureScheduledTime: true,
        airline: {
          select: {
            id: true,
            name: true,
            icaoCode: true,
          },
        },
      },
      orderBy: [
        { arrivalScheduledTime: 'asc' },
        { departureScheduledTime: 'asc' },
      ],
    });

    // Format flights for dropdown display
    const formattedFlights = flights.map((flight) => {
      const flightNumbers = [
        flight.arrivalFlightNumber,
        flight.departureFlightNumber,
      ].filter(Boolean).join(' / ');

      return {
        id: flight.id,
        label: `${flight.airline.icaoCode} ${flightNumbers} - ${flight.route}`,
        flightNumbers,
        route: flight.route,
        airline: flight.airline,
        arrivalTime: flight.arrivalScheduledTime,
        departureTime: flight.departureScheduledTime,
      };
    });

    return NextResponse.json({
      success: true,
      data: formattedFlights,
    });
  } catch (error) {
    console.error('Error fetching flights by date:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch flights' },
      { status: 500 }
    );
  }
}
