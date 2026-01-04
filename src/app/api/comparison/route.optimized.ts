import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { endOfDayUtc, formatDateDisplay, startOfDayUtc } from '@/lib/dates';

type ComparisonType =
  | 'week-over-week'
  | 'day-over-day'
  | 'month-over-month'
  | 'year-over-year'
  | 'airlines'
  | 'destinations'
  | 'delays';

/**
 * OPTIMIZED VERSION - Eliminates N+1 queries
 *
 * BEFORE:
 * - N+1 for airlines (line 216-232)
 * - N+1 for daily counts (line 286-316)
 * - Loading all flights with includes
 *
 * AFTER:
 * - Batch fetch all data
 * - In-memory processing
 * - Minimal select fields
 */

// Calculate period statistics - OPTIMIZED
async function getPeriodStatsOptimized(start: Date, end: Date) {
  // Single query with minimal fields
  const flights = await prisma.flight.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    select: {
      id: true,
      airlineId: true,
      aircraftTypeId: true,
      arrivalPassengers: true,
      departurePassengers: true,
      arrivalFerryIn: true,
      departureFerryOut: true,
      availableSeats: true,
    },
  });

  // Get aircraft type seats in batch
  const aircraftTypeIds = [...new Set(flights.map(f => f.aircraftTypeId))];
  const aircraftTypes = await prisma.aircraftType.findMany({
    where: {
      id: { in: aircraftTypeIds },
    },
    select: {
      id: true,
      seats: true,
    },
  });
  const aircraftTypeMap = new Map(aircraftTypes.map(at => [at.id, at]));

  // Get delays count in ONE aggregated query
  const delayStats = await prisma.flightDelay.groupBy({
    by: ['flightId'],
    where: {
      flight: {
        date: {
          gte: start,
          lte: end,
        },
      },
    },
    _sum: {
      minutes: true,
    },
  });
  const delayMap = new Map(delayStats.map(d => [d.flightId, d._sum.minutes || 0]));

  // Calculate stats in memory
  const totalFlights = flights.length;
  const totalPassengers = flights.reduce((sum, f) => {
    const arrivalPassengers = f.arrivalFerryIn ? 0 : (f.arrivalPassengers || 0);
    const departurePassengers = f.departureFerryOut ? 0 : (f.departurePassengers || 0);
    return sum + arrivalPassengers + departurePassengers;
  }, 0);

  const totalSeats = flights.reduce((sum, f) => {
    const aircraftType = aircraftTypeMap.get(f.aircraftTypeId);
    const seatsPerLeg = f.availableSeats || aircraftType?.seats || 0;
    const arrivalSeats = f.arrivalFerryIn ? 0 : seatsPerLeg;
    const departureSeats = f.departureFerryOut ? 0 : seatsPerLeg;
    return sum + arrivalSeats + departureSeats;
  }, 0);

  const loadFactor = totalSeats > 0 ? (totalPassengers / totalSeats) * 100 : 0;

  const delays = delayStats.length;
  const totalDelayMinutes = delayStats.reduce((sum, d) => sum + (d._sum.minutes || 0), 0);
  const avgDelayMinutes = delays > 0 ? totalDelayMinutes / delays : 0;

  return {
    flights: totalFlights,
    passengers: totalPassengers,
    loadFactor,
    delays,
    avgDelayMinutes,
  };
}

// GET /api/comparison - OPTIMIZED
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as ComparisonType;
    const date1From = searchParams.get('date1From');
    const date1To = searchParams.get('date1To');
    const date2From = searchParams.get('date2From');
    const date2To = searchParams.get('date2To');

    if (!date1From || !date1To || !date2From || !date2To) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: date1From, date1To, date2From, date2To',
        },
        { status: 400 }
      );
    }

    const range1 = {
      start: startOfDayUtc(date1From),
      end: endOfDayUtc(date1To),
    };
    const range2 = {
      start: startOfDayUtc(date2From),
      end: endOfDayUtc(date2To),
    };

    // Get statistics for both periods in parallel
    const [stats1, stats2] = await Promise.all([
      getPeriodStatsOptimized(range1.start, range1.end),
      getPeriodStatsOptimized(range2.start, range2.end),
    ]);

    // Calculate percentage changes
    const calculateChange = (val1: number, val2: number) => {
      if (val1 === 0) return val2 > 0 ? 100 : 0;
      return ((val2 - val1) / val1) * 100;
    };

    const change = {
      flights: calculateChange(stats1.flights, stats2.flights),
      passengers: calculateChange(stats1.passengers, stats2.passengers),
      loadFactor: calculateChange(stats1.loadFactor, stats2.loadFactor),
      delays: calculateChange(stats1.delays, stats2.delays),
      avgDelayMinutes: calculateChange(stats1.avgDelayMinutes, stats2.avgDelayMinutes),
    };

    let breakdown: Array<{ name: string; period1: number; period2: number; change: number }> = [];

    if (type === 'airlines') {
      // ✅ OPTIMIZED: Batch queries instead of N+1
      const [airlines1, airlines2] = await Promise.all([
        prisma.flight.groupBy({
          by: ['airlineId'],
          where: {
            date: { gte: range1.start, lte: range1.end },
          },
          _count: { id: true },
        }),
        prisma.flight.groupBy({
          by: ['airlineId'],
          where: {
            date: { gte: range2.start, lte: range2.end },
          },
          _count: { id: true },
        }),
      ]);

      const airlineIds = new Set([
        ...airlines1.map(a => a.airlineId),
        ...airlines2.map(a => a.airlineId),
      ]);

      // ✅ OPTIMIZED: Single batch fetch instead of loop with findUnique
      const airlinesData = await prisma.airline.findMany({
        where: {
          id: { in: Array.from(airlineIds) },
        },
        select: {
          id: true,
          name: true,
        },
      });
      const airlineMap = new Map(airlinesData.map(a => [a.id, a.name]));

      // Process in memory
      for (const airlineId of airlineIds) {
        const airlineName = airlineMap.get(airlineId);
        if (!airlineName) continue;

        const count1 = airlines1.find(a => a.airlineId === airlineId)?._count.id || 0;
        const count2 = airlines2.find(a => a.airlineId === airlineId)?._count.id || 0;

        breakdown.push({
          name: airlineName,
          period1: count1,
          period2: count2,
          change: calculateChange(count1, count2),
        });
      }
    } else if (type === 'destinations') {
      // Routes comparison
      const [routes1, routes2] = await Promise.all([
        prisma.flight.groupBy({
          by: ['route'],
          where: {
            date: { gte: range1.start, lte: range1.end },
          },
          _count: { id: true },
        }),
        prisma.flight.groupBy({
          by: ['route'],
          where: {
            date: { gte: range2.start, lte: range2.end },
          },
          _count: { id: true },
        }),
      ]);

      const routes = new Set([
        ...routes1.map(r => r.route),
        ...routes2.map(r => r.route),
      ]);

      for (const route of routes) {
        const count1 = routes1.find(r => r.route === route)?._count.id || 0;
        const count2 = routes2.find(r => r.route === route)?._count.id || 0;

        breakdown.push({
          name: route,
          period1: count1,
          period2: count2,
          change: calculateChange(count1, count2),
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        period1: {
          label: formatDateDisplay(range1.start) + ' - ' + formatDateDisplay(range1.end),
          ...stats1,
        },
        period2: {
          label: formatDateDisplay(range2.start) + ' - ' + formatDateDisplay(range2.end),
          ...stats2,
        },
        change,
        breakdown: breakdown.length > 0 ? breakdown.sort((a, b) => b.change - a.change) : undefined,
      },
    });
  } catch (error) {
    console.error('Error in comparison API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate comparison',
      },
      { status: 500 }
    );
  }
}
