import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, addDays } from 'date-fns';
import { dateOnlyToUtc, formatDateDisplay, getDateStringInTimeZone, getTodayDateString, TIME_ZONE_SARAJEVO } from '@/lib/dates';
import { cache, CacheTTL } from '@/lib/cache';

type TrendType = 'weekly' | 'monthly' | 'yearly';

// GET /api/comparison/trends
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as TrendType;

    if (!type || !['weekly', 'monthly', 'yearly'].includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid trend type. Must be: weekly, monthly, or yearly',
        },
        { status: 400 }
      );
    }

    const todayStr = getTodayDateString();
    const today = dateOnlyToUtc(todayStr);
    let start: Date;
    let end: Date;
    let periodLabel: string;

    switch (type) {
      case 'weekly': {
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = endOfWeek(today, { weekStartsOn: 1 });
        periodLabel = `Sedmica ${formatDateDisplay(start)} - ${formatDateDisplay(end)}`;
        break;
      }
      case 'monthly': {
        start = startOfMonth(today);
        end = endOfMonth(today);
        periodLabel = formatDateDisplay(start);
        break;
      }
      case 'yearly': {
        start = startOfYear(today);
        end = endOfYear(today);
        periodLabel = formatDateDisplay(start);
        break;
      }
    }

    const cacheKey = `comparison:trends:${type}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    const whereSql = Prisma.sql`f.date >= ${start} AND f.date <= ${end}`;

    const summaryQuery = Prisma.sql`
      SELECT
        COUNT(*)::int AS total_flights,
        SUM(
          CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END +
          CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END
        )::int AS total_passengers,
        SUM(
          CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END +
          CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END
        )::int AS total_seats
      FROM "Flight" f
      LEFT JOIN "AircraftType" at ON f."aircraftTypeId" = at.id
      WHERE ${whereSql};
    `;

    const delaysQuery = Prisma.sql`
      SELECT
        COUNT(DISTINCT d."flightId")::int AS delay_flights,
        COALESCE(SUM(d.minutes), 0)::int AS total_delay_minutes
      FROM "FlightDelay" d
      INNER JOIN "Flight" f ON f.id = d."flightId"
      WHERE ${whereSql};
    `;

    const dailyQuery = Prisma.sql`
      WITH daily_base AS (
        SELECT
          date_trunc('day', f.date) AS day,
          COUNT(*)::int AS flights,
          SUM(
            CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END +
            CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END
          )::int AS passengers,
          SUM(
            CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END +
            CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END
          )::int AS seats
        FROM "Flight" f
        LEFT JOIN "AircraftType" at ON f."aircraftTypeId" = at.id
        WHERE ${whereSql}
        GROUP BY day
      ),
      daily_delays AS (
        SELECT
          date_trunc('day', f.date) AS day,
          COUNT(DISTINCT f.id)::int AS delays
        FROM "Flight" f
        INNER JOIN "FlightDelay" d ON d."flightId" = f.id
        WHERE ${whereSql}
        GROUP BY day
      )
      SELECT
        daily_base.day,
        daily_base.flights,
        daily_base.passengers,
        daily_base.seats,
        COALESCE(daily_delays.delays, 0)::int AS delays
      FROM daily_base
      LEFT JOIN daily_delays ON daily_base.day = daily_delays.day
      ORDER BY daily_base.day ASC;
    `;

    const airlineQuery = Prisma.sql`
      SELECT
        a.name AS name,
        a."icaoCode" AS icao_code,
        COUNT(*)::int AS flights,
        SUM(
          CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END +
          CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END
        )::int AS passengers
      FROM "Flight" f
      INNER JOIN "Airline" a ON a.id = f."airlineId"
      WHERE ${whereSql}
      GROUP BY a.id
      ORDER BY flights DESC;
    `;

    const operationTypeQuery = Prisma.sql`
      SELECT
        ot.name AS name,
        ot.code AS code,
        COUNT(*)::int AS flights
      FROM "Flight" f
      INNER JOIN "OperationType" ot ON ot.id = f."operationTypeId"
      WHERE ${whereSql}
      GROUP BY ot.id
      ORDER BY flights DESC;
    `;

    const routeQuery = Prisma.sql`
      SELECT
        f.route AS route,
        COUNT(*)::int AS flights
      FROM "Flight" f
      WHERE ${whereSql} AND f.route IS NOT NULL
      GROUP BY f.route
      ORDER BY flights DESC
      LIMIT 10;
    `;

    const [
      summaryRows,
      delayRows,
      dailyRows,
      airlineRows,
      operationRows,
      routeRows,
    ] = await Promise.all([
      prisma.$queryRaw<any[]>(summaryQuery),
      prisma.$queryRaw<any[]>(delaysQuery),
      prisma.$queryRaw<any[]>(dailyQuery),
      prisma.$queryRaw<any[]>(airlineQuery),
      prisma.$queryRaw<any[]>(operationTypeQuery),
      prisma.$queryRaw<any[]>(routeQuery),
    ]);

    const summaryRow = summaryRows[0] || { total_flights: 0, total_passengers: 0, total_seats: 0 };
    const delayRow = delayRows[0] || { delay_flights: 0, total_delay_minutes: 0 };

    const totalFlights = summaryRow.total_flights || 0;
    const totalPassengers = summaryRow.total_passengers || 0;
    const totalSeats = summaryRow.total_seats || 0;
    const loadFactor = totalSeats > 0 ? (totalPassengers / totalSeats) * 100 : 0;
    const delays = delayRow.delay_flights || 0;
    const avgDelayMinutes = delays > 0 ? (delayRow.total_delay_minutes || 0) / delays : 0;

    const dailyMap = new Map<string, any>();
    dailyRows.forEach((row) => {
      const dayStr = getDateStringInTimeZone(new Date(row.day), TIME_ZONE_SARAJEVO);
      dailyMap.set(dayStr, row);
    });

    const dailyData: Array<{
      date: string;
      label: string;
      flights: number;
      passengers: number;
      loadFactor: number;
      delays: number;
    }> = [];

    let current = new Date(start);
    while (current <= end) {
      const dateStr = getDateStringInTimeZone(current, TIME_ZONE_SARAJEVO);
      const row = dailyMap.get(dateStr);
      const passengers = row?.passengers || 0;
      const seats = row?.seats || 0;
      dailyData.push({
        date: dateStr,
        label: formatDateDisplay(current),
        flights: row?.flights || 0,
        passengers,
        loadFactor: seats > 0 ? (passengers / seats) * 100 : 0,
        delays: row?.delays || 0,
      });
      current = addDays(current, 1);
    }

    const airlineBreakdown = airlineRows.map((row) => ({
      name: row.name || 'Unknown',
      icaoCode: row.icao_code || '',
      flights: row.flights || 0,
      passengers: row.passengers || 0,
    }));

    const operationTypeBreakdown = operationRows.map((row) => ({
      name: row.name || 'Unknown',
      code: row.code || '',
      flights: row.flights || 0,
    }));

    const routeBreakdown = routeRows.map((row) => ({
      route: row.route,
      flights: row.flights || 0,
    }));

    const responseData = {
      period: periodLabel,
      start: getDateStringInTimeZone(start, TIME_ZONE_SARAJEVO),
      end: getDateStringInTimeZone(end, TIME_ZONE_SARAJEVO),
      summary: {
        flights: totalFlights,
        passengers: totalPassengers,
        loadFactor,
        delays,
        avgDelayMinutes,
      },
      dailyData,
      airlineBreakdown,
      operationTypeBreakdown,
      routeBreakdown,
    };

    cache.set(cacheKey, responseData, CacheTTL.TEN_MINUTES);

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error in trends API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate trend data',
      },
      { status: 500 }
    );
  }
}
