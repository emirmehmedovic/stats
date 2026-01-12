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
        SUM(CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END)::int AS arrival_passengers,
        SUM(CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END)::int AS departure_passengers,
        SUM(CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departureNoShow", 0) END)::int AS departure_no_show,
        SUM(COALESCE(f."arrivalBaggageCount", 0) + COALESCE(f."departureBaggageCount", 0))::int AS total_baggage_count,
        SUM(CASE WHEN f."arrivalFerryIn" THEN 1 ELSE 0 END)::int AS arrival_ferry_legs,
        SUM(CASE WHEN f."departureFerryOut" THEN 1 ELSE 0 END)::int AS departure_ferry_legs,
        SUM(
          CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END +
          CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END
        )::int AS total_seats
      FROM "Flight" f
      LEFT JOIN "AircraftType" at ON f."aircraftTypeId" = at.id
      WHERE ${whereSql};
    `;

    const loadFactorSplitQuery = Prisma.sql`
      SELECT
        SUM(CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END)::int AS arrival_passengers,
        SUM(CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END)::int AS arrival_seats,
        SUM(CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END)::int AS departure_passengers,
        SUM(CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END)::int AS departure_seats
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
      INNER JOIN "OperationType" ot ON ot.id = f."operationTypeId"
      LEFT JOIN "AircraftType" at ON f."aircraftTypeId" = at.id
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

    const routePassengersQuery = Prisma.sql`
      SELECT
        f.route AS route,
        SUM(
          CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END +
          CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END
        )::int AS passengers
      FROM "Flight" f
      WHERE ${whereSql} AND f.route IS NOT NULL
      GROUP BY f.route
      ORDER BY passengers DESC
      LIMIT 5;
    `;

    const routeLoadFactorQuery = Prisma.sql`
      SELECT
        f.route AS route,
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
      WHERE ${whereSql} AND f.route IS NOT NULL
      GROUP BY f.route
      HAVING SUM(
        CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END +
        CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END
      ) > 0
      ORDER BY (SUM(
        CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END +
        CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END
      )::float / NULLIF(SUM(
        CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END +
        CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END
      ), 0)) DESC
      LIMIT 5;
    `;

    const routeCountQuery = Prisma.sql`
      SELECT COUNT(DISTINCT f.route)::int AS route_count
      FROM "Flight" f
      WHERE ${whereSql} AND f.route IS NOT NULL;
    `;

    const [
      summaryRows,
      delayRows,
      loadFactorRows,
      dailyRows,
      airlineRows,
      operationRows,
      routeRows,
      routePassengerRows,
      routeLoadFactorRows,
      routeCountRows,
    ] = await Promise.all([
      prisma.$queryRaw<any[]>(summaryQuery),
      prisma.$queryRaw<any[]>(delaysQuery),
      prisma.$queryRaw<any[]>(loadFactorSplitQuery),
      prisma.$queryRaw<any[]>(dailyQuery),
      prisma.$queryRaw<any[]>(airlineQuery),
      prisma.$queryRaw<any[]>(operationTypeQuery),
      prisma.$queryRaw<any[]>(routeQuery),
      prisma.$queryRaw<any[]>(routePassengersQuery),
      prisma.$queryRaw<any[]>(routeLoadFactorQuery),
      prisma.$queryRaw<any[]>(routeCountQuery),
    ]);

    const summaryRow = summaryRows[0] || {
      total_flights: 0,
      total_passengers: 0,
      arrival_passengers: 0,
      departure_passengers: 0,
      departure_no_show: 0,
      total_baggage_count: 0,
      arrival_ferry_legs: 0,
      departure_ferry_legs: 0,
      total_seats: 0,
    };
    const delayRow = delayRows[0] || { delay_flights: 0, total_delay_minutes: 0 };
    const loadFactorRow = loadFactorRows[0] || {
      arrival_passengers: 0,
      arrival_seats: 0,
      departure_passengers: 0,
      departure_seats: 0,
    };

    const totalFlights = summaryRow.total_flights || 0;
    const totalPassengers = summaryRow.total_passengers || 0;
    const arrivalPassengers = summaryRow.arrival_passengers || 0;
    const departurePassengers = summaryRow.departure_passengers || 0;
    const departureNoShow = summaryRow.departure_no_show || 0;
    const totalBaggageCount = summaryRow.total_baggage_count || 0;
    const totalSeats = summaryRow.total_seats || 0;
    const arrivalFerryLegs = summaryRow.arrival_ferry_legs || 0;
    const departureFerryLegs = summaryRow.departure_ferry_legs || 0;
    const totalFerryLegs = arrivalFerryLegs + departureFerryLegs;
    const loadFactor = totalSeats > 0 ? (totalPassengers / totalSeats) * 100 : 0;
    const delays = delayRow.delay_flights || 0;
    const totalDelayMinutes = delayRow.total_delay_minutes || 0;
    const avgDelayMinutes = delays > 0 ? totalDelayMinutes / delays : 0;
    const operations = totalFlights * 2;
    const noShowPercent = departurePassengers > 0 ? (departureNoShow / departurePassengers) * 100 : 0;
    const avgBaggageCount = operations > 0 ? totalBaggageCount / operations : 0;
    const avgPassengersPerOperation = operations > 0 ? totalPassengers / operations : 0;
    const avgSeatsPerOperation = operations > 0 ? totalSeats / operations : 0;
    const avgSeatsPerFlight = totalFlights > 0 ? totalSeats / totalFlights : 0;
    const baggagePerPassenger = totalPassengers > 0 ? totalBaggageCount / totalPassengers : 0;
    const arrivalLoadFactor =
      loadFactorRow.arrival_seats > 0
        ? (loadFactorRow.arrival_passengers / loadFactorRow.arrival_seats) * 100
        : 0;
    const departureLoadFactor =
      loadFactorRow.departure_seats > 0
        ? (loadFactorRow.departure_passengers / loadFactorRow.departure_seats) * 100
        : 0;
    const daysInPeriod = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
    const avgFlightsPerDay = totalFlights / daysInPeriod;
    const avgPassengersPerDay = totalPassengers / daysInPeriod;
    const delayRatePercent = totalFlights > 0 ? (delays / totalFlights) * 100 : 0;
    const avgDelayMinutesAllFlights = totalFlights > 0 ? totalDelayMinutes / totalFlights : 0;
    const distinctRoutes = routeCountRows[0]?.route_count || 0;
    const avgFlightsPerRoute = distinctRoutes > 0 ? totalFlights / distinctRoutes : 0;

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

    const operationTypeBreakdown = operationRows.map((row) => {
      const seats = row.seats || 0;
      const passengers = row.passengers || 0;
      return {
        name: row.name || 'Unknown',
        code: row.code || '',
        flights: row.flights || 0,
        avgLoadFactor: seats > 0 ? (passengers / seats) * 100 : 0,
        passengers,
        seats,
      };
    });

    const routeBreakdown = routeRows.map((row) => ({
      route: row.route,
      flights: row.flights || 0,
    }));

    const routePassengersBreakdown = routePassengerRows.map((row) => ({
      route: row.route,
      passengers: row.passengers || 0,
    }));

    const routeLoadFactorBreakdown = routeLoadFactorRows.map((row) => ({
      route: row.route,
      loadFactor: row.seats > 0 ? (row.passengers / row.seats) * 100 : 0,
    }));

    const responseData = {
      period: periodLabel,
      start: getDateStringInTimeZone(start, TIME_ZONE_SARAJEVO),
      end: getDateStringInTimeZone(end, TIME_ZONE_SARAJEVO),
      summary: {
        flights: totalFlights,
        passengers: totalPassengers,
        arrivalPassengers,
        departurePassengers,
        operations,
        noShowPercent,
        avgBaggageCount,
        avgPassengersPerOperation,
        arrivalLoadFactor,
        departureLoadFactor,
        avgSeatsPerOperation,
        avgSeatsPerFlight,
        baggagePerPassenger,
        totalSeats,
        totalDelayMinutes,
        delayRatePercent,
        avgDelayMinutesAllFlights,
        noShowCount: departureNoShow,
        totalFerryLegs,
        avgFlightsPerDay,
        avgPassengersPerDay,
        distinctRoutes,
        avgFlightsPerRoute,
        loadFactor,
        delays,
        avgDelayMinutes,
      },
      dailyData,
      airlineBreakdown,
      operationTypeBreakdown,
      routeBreakdown,
      routePassengersBreakdown,
      routeLoadFactorBreakdown,
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
