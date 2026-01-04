import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { endOfDayUtc, startOfDayUtc } from '@/lib/dates';

// GET /api/reports/daily?date=YYYY-MM-DD - Daily report
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datum je obavezan (format: YYYY-MM-DD)',
        },
        { status: 400 }
      );
    }

    const dayStart = startOfDayUtc(dateParam);
    const dayEnd = endOfDayUtc(dateParam);
    if (isNaN(dayStart.getTime()) || isNaN(dayEnd.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Neispravan format datuma',
        },
        { status: 400 }
      );
    }

    // Get all flights for the day
    const flights = await prisma.flight.findMany({
      where: {
        date: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        airline: {
          select: {
            name: true,
            icaoCode: true,
          },
        },
        aircraftType: {
          select: {
            model: true,
          },
        },
      },
      orderBy: [
        { arrivalScheduledTime: 'asc' },
        { departureScheduledTime: 'asc' },
      ],
    });

    const getArrivalPassengers = (flight: any) =>
      flight.arrivalFerryIn ? 0 : (flight.arrivalPassengers || 0);
    const getDeparturePassengers = (flight: any) =>
      flight.departureFerryOut ? 0 : (flight.departurePassengers || 0);

    // Calculate totals
    const totals = {
      flights: flights.length,

      // Arrival totals
      arrivalFlights: flights.filter(f => f.arrivalFlightNumber).length,
      arrivalPassengers: flights.reduce((sum, f) => sum + getArrivalPassengers(f), 0),
      arrivalInfants: flights.reduce((sum, f) => sum + (f.arrivalInfants || 0), 0),
      arrivalBaggage: flights.reduce((sum, f) => sum + (f.arrivalBaggage || 0), 0),
      arrivalCargo: flights.reduce((sum, f) => sum + (f.arrivalCargo || 0), 0),
      arrivalMail: flights.reduce((sum, f) => sum + (f.arrivalMail || 0), 0),

      // Departure totals
      departureFlights: flights.filter(f => f.departureFlightNumber).length,
      departurePassengers: flights.reduce((sum, f) => sum + getDeparturePassengers(f), 0),
      departureInfants: flights.reduce((sum, f) => sum + (f.departureInfants || 0), 0),
      departureBaggage: flights.reduce((sum, f) => sum + (f.departureBaggage || 0), 0),
      departureCargo: flights.reduce((sum, f) => sum + (f.departureCargo || 0), 0),
      departureMail: flights.reduce((sum, f) => sum + (f.departureMail || 0), 0),

      // Combined totals
      totalPassengers: 0,
      totalBaggage: 0,
      totalCargo: 0,
      totalMail: 0,
    };

    totals.totalPassengers = totals.arrivalPassengers + totals.departurePassengers;
    totals.totalBaggage = totals.arrivalBaggage + totals.departureBaggage;
    totals.totalCargo = totals.arrivalCargo + totals.departureCargo;
    totals.totalMail = totals.arrivalMail + totals.departureMail;

    // Group by airline
    const byAirline = flights.reduce((acc, flight) => {
      const airlineKey = flight.airline.icaoCode;
      if (!acc[airlineKey]) {
        acc[airlineKey] = {
          airline: flight.airline.name,
          icaoCode: flight.airline.icaoCode,
          flights: 0,
          passengers: 0,
        };
      }
      acc[airlineKey].flights++;
      acc[airlineKey].passengers += getArrivalPassengers(flight) + getDeparturePassengers(flight);
      return acc;
    }, {} as Record<string, any>);

    const airlineStats = Object.values(byAirline);

    return NextResponse.json({
      success: true,
      data: {
        date: dateParam,
        flights,
        totals,
        byAirline: airlineStats,
      },
    });
  } catch (error) {
    console.error('Daily report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri generisanju izvještaja',
      },
      { status: 500 }
    );
  }
}
