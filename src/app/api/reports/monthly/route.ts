import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { eachDayOfInterval } from 'date-fns';
import {
  endOfDayUtc,
  formatMonthYearDisplay,
  getDateStringInTimeZone,
  getWeekdayName,
  startOfDayUtc,
  TIME_ZONE_SARAJEVO,
  dateStringFromParts,
} from '@/lib/dates';

// GET /api/reports/monthly?year=YYYY&month=MM - Monthly report
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');
    const monthParam = searchParams.get('month');

    if (!yearParam || !monthParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Godina i mjesec su obavezni (format: year=YYYY&month=MM)',
        },
        { status: 400 }
      );
    }

    const year = parseInt(yearParam);
    const month = parseInt(monthParam);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json(
        {
          success: false,
          error: 'Neispravan format godine ili mjeseca',
        },
        { status: 400 }
      );
    }

    // Create date for the first day of the month
    const monthStartStr = dateStringFromParts(year, month, 1);
    const monthEndStr = dateStringFromParts(year, month + 1, 0);
    const monthStart = startOfDayUtc(monthStartStr);
    const monthEnd = endOfDayUtc(monthEndStr);

    // Get all flights for the month
    const flights = await prisma.flight.findMany({
      where: {
        date: {
          gte: monthStart,
          lte: monthEnd,
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
      orderBy: {
        date: 'asc',
      },
    });

    const getArrivalPassengers = (flight: any) =>
      flight.arrivalFerryIn ? 0 : (flight.arrivalPassengers || 0);
    const getDeparturePassengers = (flight: any) =>
      flight.departureFerryOut ? 0 : (flight.departurePassengers || 0);

    // Calculate monthly totals
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

    // Daily breakdown
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const dailyBreakdown = daysInMonth.map(day => {
      const dayStr = getDateStringInTimeZone(day, TIME_ZONE_SARAJEVO);
      const dayStart = startOfDayUtc(dayStr);
      const dayEnd = endOfDayUtc(dayStr);

      const dayFlights = flights.filter(f => {
        const flightDate = new Date(f.date);
        return flightDate >= dayStart && flightDate <= dayEnd;
      });

      return {
        date: dayStr,
        dayOfWeek: getWeekdayName(day),
        flights: dayFlights.length,
        passengers: dayFlights.reduce(
          (sum, f) => sum + getArrivalPassengers(f) + getDeparturePassengers(f),
          0
        ),
        arrivalFlights: dayFlights.filter(f => f.arrivalFlightNumber).length,
        departureFlights: dayFlights.filter(f => f.departureFlightNumber).length,
      };
    });

    // Group by airline
    const byAirline = flights.reduce((acc, flight) => {
      const airlineKey = flight.airline.icaoCode;
      if (!acc[airlineKey]) {
        acc[airlineKey] = {
          airline: flight.airline.name,
          icaoCode: flight.airline.icaoCode,
          flights: 0,
          passengers: 0,
          arrivalFlights: 0,
          departureFlights: 0,
        };
      }
      acc[airlineKey].flights++;
      acc[airlineKey].passengers += getArrivalPassengers(flight) + getDeparturePassengers(flight);
      if (flight.arrivalFlightNumber) acc[airlineKey].arrivalFlights++;
      if (flight.departureFlightNumber) acc[airlineKey].departureFlights++;
      return acc;
    }, {} as Record<string, any>);

    const airlineStats = Object.values(byAirline).sort((a: any, b: any) => b.flights - a.flights);

    // Top routes
    const routeStats = flights.reduce((acc, flight) => {
      const route = flight.route;
      if (!acc[route]) {
        acc[route] = {
          route,
          flights: 0,
          passengers: 0,
        };
      }
      acc[route].flights++;
      acc[route].passengers += getArrivalPassengers(flight) + getDeparturePassengers(flight);
      return acc;
    }, {} as Record<string, any>);

    const topRoutes = Object.values(routeStats)
      .sort((a: any, b: any) => b.flights - a.flights)
      .slice(0, 10);

    return NextResponse.json({
      success: true,
      data: {
        year,
        month,
        monthName: formatMonthYearDisplay(monthStart),
        totals,
        dailyBreakdown,
        byAirline: airlineStats,
        topRoutes,
      },
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri generisanju mjesečnog izvještaja',
      },
      { status: 500 }
    );
  }
}
