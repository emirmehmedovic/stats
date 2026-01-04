import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { eachMonthOfInterval } from 'date-fns';
import { dateStringFromParts, endOfDayUtc, formatDateDisplay, startOfDayUtc } from '@/lib/dates';

// GET /api/reports/yearly?year=YYYY - Yearly report
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');

    if (!yearParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Godina je obavezna (format: year=YYYY)',
        },
        { status: 400 }
      );
    }

    const year = parseInt(yearParam);

    if (isNaN(year)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Neispravan format godine',
        },
        { status: 400 }
      );
    }

    const yearStart = startOfDayUtc(dateStringFromParts(year, 1, 1));
    const yearEnd = endOfDayUtc(dateStringFromParts(year, 12, 31));

    // Get all flights for the year
    const flights = await prisma.flight.findMany({
      where: {
        date: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      include: {
        airline: {
          select: {
            name: true,
            icaoCode: true,
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

    // Calculate yearly totals
    const totals = {
      flights: flights.length,
      arrivalFlights: flights.filter(f => f.arrivalFlightNumber).length,
      arrivalPassengers: flights.reduce((sum, f) => sum + getArrivalPassengers(f), 0),
      arrivalInfants: flights.reduce((sum, f) => sum + (f.arrivalInfants || 0), 0),
      arrivalBaggage: flights.reduce((sum, f) => sum + (f.arrivalBaggage || 0), 0),
      arrivalCargo: flights.reduce((sum, f) => sum + (f.arrivalCargo || 0), 0),
      arrivalMail: flights.reduce((sum, f) => sum + (f.arrivalMail || 0), 0),
      departureFlights: flights.filter(f => f.departureFlightNumber).length,
      departurePassengers: flights.reduce((sum, f) => sum + getDeparturePassengers(f), 0),
      departureInfants: flights.reduce((sum, f) => sum + (f.departureInfants || 0), 0),
      departureBaggage: flights.reduce((sum, f) => sum + (f.departureBaggage || 0), 0),
      departureCargo: flights.reduce((sum, f) => sum + (f.departureCargo || 0), 0),
      departureMail: flights.reduce((sum, f) => sum + (f.departureMail || 0), 0),
      totalPassengers: 0,
      totalBaggage: 0,
      totalCargo: 0,
      totalMail: 0,
    };

    totals.totalPassengers = totals.arrivalPassengers + totals.departurePassengers;
    totals.totalBaggage = totals.arrivalBaggage + totals.departureBaggage;
    totals.totalCargo = totals.arrivalCargo + totals.departureCargo;
    totals.totalMail = totals.arrivalMail + totals.departureMail;

    // Monthly breakdown
    const monthsInYear = eachMonthOfInterval({ start: yearStart, end: yearEnd });
    const monthlyBreakdown = monthsInYear.map(month => {
      const monthStart = startOfDayUtc(dateStringFromParts(month.getUTCFullYear(), month.getUTCMonth() + 1, 1));
      const monthEnd = endOfDayUtc(dateStringFromParts(month.getUTCFullYear(), month.getUTCMonth() + 2, 0));

      const monthFlights = flights.filter(f => {
        const flightDate = new Date(f.date);
        return flightDate >= monthStart && flightDate <= monthEnd;
      });

      return {
        month: formatDateDisplay(month),
        monthNumber: month.getUTCMonth() + 1,
        flights: monthFlights.length,
        passengers: monthFlights.reduce(
          (sum, f) => sum + getArrivalPassengers(f) + getDeparturePassengers(f),
          0
        ),
        arrivalFlights: monthFlights.filter(f => f.arrivalFlightNumber).length,
        departureFlights: monthFlights.filter(f => f.departureFlightNumber).length,
        cargo: monthFlights.reduce((sum, f) =>
          sum + (f.arrivalCargo || 0) + (f.departureCargo || 0), 0
        ),
      };
    });

    // Get previous year data for YoY comparison
    const prevYear = year - 1;
    const prevYearStart = startOfDayUtc(dateStringFromParts(prevYear, 1, 1));
    const prevYearEnd = endOfDayUtc(dateStringFromParts(prevYear, 12, 31));

    const prevYearFlights = await prisma.flight.findMany({
      where: {
        date: {
          gte: prevYearStart,
          lte: prevYearEnd,
        },
      },
    });

    const prevYearTotals = {
      flights: prevYearFlights.length,
      passengers: prevYearFlights.reduce((sum, f) =>
        sum + getArrivalPassengers(f) + getDeparturePassengers(f), 0
      ),
      cargo: prevYearFlights.reduce((sum, f) =>
        sum + (f.arrivalCargo || 0) + (f.departureCargo || 0), 0
      ),
    };

    // Calculate YoY growth
    const yoyComparison = {
      flights: {
        current: totals.flights,
        previous: prevYearTotals.flights,
        growth: prevYearTotals.flights > 0
          ? ((totals.flights - prevYearTotals.flights) / prevYearTotals.flights) * 100
          : 0,
      },
      passengers: {
        current: totals.totalPassengers,
        previous: prevYearTotals.passengers,
        growth: prevYearTotals.passengers > 0
          ? ((totals.totalPassengers - prevYearTotals.passengers) / prevYearTotals.passengers) * 100
          : 0,
      },
      cargo: {
        current: totals.totalCargo,
        previous: prevYearTotals.cargo,
        growth: prevYearTotals.cargo > 0
          ? ((totals.totalCargo - prevYearTotals.cargo) / prevYearTotals.cargo) * 100
          : 0,
      },
    };

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

    const airlineStats = Object.values(byAirline).sort((a: any, b: any) => b.flights - a.flights);

    // Seasonal analysis (quarters)
    const quarters = [
      { name: 'Q1 (Jan-Mar)', months: [1, 2, 3] },
      { name: 'Q2 (Apr-Jun)', months: [4, 5, 6] },
      { name: 'Q3 (Jul-Sep)', months: [7, 8, 9] },
      { name: 'Q4 (Oct-Dec)', months: [10, 11, 12] },
    ];

    const seasonalAnalysis = quarters.map(quarter => {
      const quarterData = monthlyBreakdown.filter(m =>
        quarter.months.includes(m.monthNumber)
      );

      return {
        quarter: quarter.name,
        flights: quarterData.reduce((sum, m) => sum + m.flights, 0),
        passengers: quarterData.reduce((sum, m) => sum + m.passengers, 0),
        avgFlightsPerMonth: Math.round(
          quarterData.reduce((sum, m) => sum + m.flights, 0) / quarter.months.length
        ),
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        year,
        totals,
        monthlyBreakdown,
        yoyComparison,
        byAirline: airlineStats,
        seasonalAnalysis,
        hasPreviousYearData: prevYearFlights.length > 0,
      },
    });
  } catch (error) {
    console.error('Yearly report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri generisanju godišnjeg izvještaja',
      },
      { status: 500 }
    );
  }
}
