import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { subDays } from 'date-fns';
import { endOfDayUtc, getDateStringInTimeZone, getTodayDateString, startOfDayUtc, TIME_ZONE_SARAJEVO } from '@/lib/dates';

// OPTIMIZED VERSION - Reduces 72+ queries to ~6 queries
export async function GET(request: NextRequest) {
  try {
    const todayStr = getTodayDateString();
    const todayStart = startOfDayUtc(todayStr);
    const todayEnd = endOfDayUtc(todayStr);
    const thirtyDaysAgo = subDays(todayStart, 30);
    const sevenDaysAgo = subDays(todayStart, 7);

    // Query 1: Get ALL flights from last 30 days in ONE query
    // This replaces 30+ separate queries with a single efficient query
    const last30DaysFlights = await prisma.flight.findMany({
      where: {
        date: {
          gte: thirtyDaysAgo,
          lte: todayEnd,
        },
      },
      select: {
        id: true,
        date: true,
        airlineId: true,
        operationTypeId: true,
        arrivalPassengers: true,
        departurePassengers: true,
        arrivalFerryIn: true,
        departureFerryOut: true,
        availableSeats: true,
        arrivalScheduledTime: true,
        arrivalActualTime: true,
        departureScheduledTime: true,
        departureActualTime: true,
      },
    });

    const getArrivalPassengers = (flight: any) =>
      flight.arrivalFerryIn ? 0 : (flight.arrivalPassengers || 0);
    const getDeparturePassengers = (flight: any) =>
      flight.departureFerryOut ? 0 : (flight.departurePassengers || 0);
    const getSeatsForFlight = (flight: any) => {
      const seats = flight.availableSeats || 0;
      return (flight.arrivalFerryIn ? 0 : seats) + (flight.departureFerryOut ? 0 : seats);
    };

    // Query 2: Get top airlines data in ONE batch query
    const topAirlinesData = await prisma.flight.groupBy({
      by: ['airlineId'],
      where: {
        date: {
          gte: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    // Query 3: Get ALL airline details in ONE query (batch fetch)
    const airlineIds = topAirlinesData.map(item => item.airlineId);
    const uniqueAirlineIds = [...new Set(last30DaysFlights.map(f => f.airlineId))];
    const allAirlineIds = [...new Set([...airlineIds, ...uniqueAirlineIds])];

    const airlines = await prisma.airline.findMany({
      where: {
        id: { in: allAirlineIds },
      },
      select: {
        id: true,
        name: true,
        icaoCode: true,
      },
    });
    const airlineMap = new Map(airlines.map(a => [a.id, a]));

    // Query 4: Get operation types in ONE query
    const operationTypeIds = [...new Set(last30DaysFlights.map(f => f.operationTypeId).filter(Boolean))];
    const operationTypes = await prisma.operationType.findMany({
      where: {
        id: { in: operationTypeIds },
      },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });
    const operationTypeMap = new Map(operationTypes.map(ot => [ot.id, ot]));

    // --- IN-MEMORY PROCESSING (much faster than DB queries in loops) ---

    // Filter today's flights
    const todaysFlights = last30DaysFlights.filter(
      f => f.date >= todayStart && f.date <= todayEnd
    );

    // Calculate today's stats
    const todaysFlightsCount = todaysFlights.length;
    const totalArrivalPassengersToday = todaysFlights.reduce(
      (sum, f) => sum + getArrivalPassengers(f),
      0
    );
    const totalDeparturePassengersToday = todaysFlights.reduce(
      (sum, f) => sum + getDeparturePassengers(f),
      0
    );
    const totalPassengersToday = totalArrivalPassengersToday + totalDeparturePassengersToday;

    const totalSeats = todaysFlights.reduce(
      (sum, f) => sum + getSeatsForFlight(f),
      0
    );
    const averageLoadFactor = totalSeats > 0
      ? Math.round((totalPassengersToday / totalSeats) * 100)
      : 0;

    // Active airlines (unique airlines in last 30 days)
    const activeAirlinesCount = new Set(last30DaysFlights.map(f => f.airlineId)).size;

    // Group flights by date for last 30 days
    const flightsPerDay: { date: string; count: number }[] = [];
    const passengersPerDay: { date: string; passengers: number }[] = [];

    for (let i = 29; i >= 0; i--) {
      const date = subDays(todayStart, i);
      const dateStr = getDateStringInTimeZone(date, TIME_ZONE_SARAJEVO);
      const dayStart = startOfDayUtc(dateStr);
      const dayEnd = endOfDayUtc(dateStr);

      const dayFlights = last30DaysFlights.filter(
        f => f.date >= dayStart && f.date <= dayEnd
      );

      flightsPerDay.push({
        date: dateStr,
        count: dayFlights.length,
      });

      const arrivals = dayFlights.reduce((sum, f) => sum + getArrivalPassengers(f), 0);
      const departures = dayFlights.reduce((sum, f) => sum + getDeparturePassengers(f), 0);

      passengersPerDay.push({
        date: dateStr,
        passengers: arrivals + departures,
      });
    }

    // Load factor & punctuality for last 7 days
    const loadFactor7Days: { date: string; value: number }[] = [];
    const punctuality7Days: { date: string; value: number }[] = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(todayStart, i);
      const dateStr = getDateStringInTimeZone(date, TIME_ZONE_SARAJEVO);
      const dayStart = startOfDayUtc(dateStr);
      const dayEnd = endOfDayUtc(dateStr);

      const dayFlights = last30DaysFlights.filter(
        f => f.date >= dayStart && f.date <= dayEnd
      );

      const dayPassengers = dayFlights.reduce(
        (sum, f) => sum + getArrivalPassengers(f) + getDeparturePassengers(f),
        0
      );
      const daySeats = dayFlights.reduce((sum, f) => sum + getSeatsForFlight(f), 0);
      const dayLoadFactor = daySeats > 0 ? Math.round((dayPassengers / daySeats) * 100) : 0;

      let onTimeEligible = 0;
      let onTimeCount = 0;

      dayFlights.forEach(flight => {
        if (flight.arrivalScheduledTime && flight.arrivalActualTime) {
          onTimeEligible++;
          const delay = new Date(flight.arrivalActualTime).getTime() -
                       new Date(flight.arrivalScheduledTime).getTime();
          if (delay / 60000 < 15) {
            onTimeCount++;
          }
        }

        if (flight.departureScheduledTime && flight.departureActualTime) {
          onTimeEligible++;
          const delay = new Date(flight.departureActualTime).getTime() -
                       new Date(flight.departureScheduledTime).getTime();
          if (delay / 60000 < 15) {
            onTimeCount++;
          }
        }
      });

      const punctuality = onTimeEligible > 0
        ? Math.round((onTimeCount / onTimeEligible) * 100)
        : 0;

      loadFactor7Days.push({
        date: dateStr,
        value: dayLoadFactor,
      });

      punctuality7Days.push({
        date: dateStr,
        value: punctuality,
      });
    }

    // Top airlines (already fetched, just map to response format)
    const topAirlines = topAirlinesData.map(item => {
      const airline = airlineMap.get(item.airlineId);
      return {
        airline: airline?.name || 'Unknown',
        icaoCode: airline?.icaoCode || 'N/A',
        count: item._count.id,
      };
    });

    // Operation types distribution
    const operationTypeGroups = new Map<string, number>();
    last30DaysFlights.forEach(flight => {
      if (flight.operationTypeId) {
        const current = operationTypeGroups.get(flight.operationTypeId) || 0;
        operationTypeGroups.set(flight.operationTypeId, current + 1);
      }
    });

    const operationTypesData = Array.from(operationTypeGroups.entries()).map(([id, count]) => ({
      type: operationTypeMap.get(id)?.name || 'Nepoznato',
      count,
    }));

    return NextResponse.json({
      success: true,
      data: {
        today: {
          flights: todaysFlightsCount,
          passengers: totalPassengersToday,
          arrivals: totalArrivalPassengersToday,
          departures: totalDeparturePassengersToday,
          loadFactor: averageLoadFactor,
        },
        activeAirlines: activeAirlinesCount,
        flightsPerDay,
        passengersPerDay,
        loadFactor7Days,
        punctuality7Days,
        topAirlines,
        operationTypes: operationTypesData,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri učitavanju statistike',
      },
      { status: 500 }
    );
  }
}
