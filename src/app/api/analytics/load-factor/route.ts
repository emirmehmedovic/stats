import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { eachDayOfInterval } from 'date-fns';
import { endOfDayUtc, formatDateDisplay, getDateStringInTimeZone, startOfDayUtc, TIME_ZONE_SARAJEVO } from '@/lib/dates';
import { cache, CacheTTL } from '@/lib/cache';

// GET /api/analytics/load-factor?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&airline=ICAO&route=TEXT&operationTypeId=ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');
    const airlineParam = searchParams.get('airline');
    const routeParam = searchParams.get('route');
    const operationTypeParam = searchParams.get('operationTypeId');

    if (!dateFromParam || !dateToParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datum od i do su obavezni',
        },
        { status: 400 }
      );
    }

    const startDate = startOfDayUtc(dateFromParam);
    const endDate = endOfDayUtc(dateToParam);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Neispravan format datuma',
        },
        { status: 400 }
      );
    }

    const cacheKey = `analytics:load-factor:${dateFromParam}:${dateToParam}:${airlineParam || 'ALL'}:${routeParam || 'ALL'}:${operationTypeParam || 'ALL'}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    const whereSql = [
      Prisma.sql`f.date >= ${startDate}`,
      Prisma.sql`f.date <= ${endDate}`,
    ];

    if (airlineParam) {
      const airline = await prisma.airline.findFirst({
        where: { icaoCode: airlineParam },
        select: { id: true },
      });
      if (airline) {
        whereSql.push(Prisma.sql`f."airlineId" = ${airline.id}`);
      }
    }

    if (routeParam) {
      whereSql.push(Prisma.sql`f."route" ILIKE ${`%${routeParam}%`}`);
    }

    if (operationTypeParam) {
      whereSql.push(Prisma.sql`f."operationTypeId" = ${operationTypeParam}`);
    }

    const whereClauseSql = Prisma.join(whereSql, ' AND ');

    const summaryQuery = Prisma.sql`
      WITH flight_stats AS (
        SELECT
          f.id,
          f."airlineId" AS airline_id,
          f.date,
          (CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END +
           CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END
          )::int AS total_passengers,
          (CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END +
           CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END
          )::int AS total_seats
        FROM "Flight" f
        LEFT JOIN "AircraftType" at ON f."aircraftTypeId" = at.id
        WHERE ${whereClauseSql}
      )
      SELECT
        COUNT(*) FILTER (WHERE total_seats > 0)::int AS total_flights,
        SUM(total_passengers)::int AS total_passengers,
        SUM(total_seats)::int AS total_seats,
        AVG(CASE WHEN total_seats > 0 THEN (total_passengers::float / total_seats) * 100 END) AS avg_load_factor
      FROM flight_stats;
    `;

    const airlineQuery = Prisma.sql`
      WITH flight_stats AS (
        SELECT
          f."airlineId" AS airline_id,
          (CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END +
           CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END
          )::int AS total_passengers,
          (CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END +
           CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END
          )::int AS total_seats
        FROM "Flight" f
        LEFT JOIN "AircraftType" at ON f."aircraftTypeId" = at.id
        WHERE ${whereClauseSql}
      )
      SELECT
        a.name AS airline,
        a."icaoCode" AS icao_code,
        COUNT(*) FILTER (WHERE total_seats > 0)::int AS flights,
        SUM(total_passengers)::int AS total_passengers,
        SUM(total_seats)::int AS total_seats,
        AVG(CASE WHEN total_seats > 0 THEN (total_passengers::float / total_seats) * 100 END) AS avg_load_factor
      FROM flight_stats fs
      INNER JOIN "Airline" a ON a.id = fs.airline_id
      GROUP BY a.id
      ORDER BY avg_load_factor DESC;
    `;

    const dailyQuery = Prisma.sql`
      WITH flight_stats AS (
        SELECT
          date_trunc('day', f.date) AS day,
          (CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END +
           CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END
          )::int AS total_passengers,
          (CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END +
           CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END
          )::int AS total_seats
        FROM "Flight" f
        LEFT JOIN "AircraftType" at ON f."aircraftTypeId" = at.id
        WHERE ${whereClauseSql}
      )
      SELECT
        day,
        COUNT(*) FILTER (WHERE total_seats > 0)::int AS flights,
        SUM(total_passengers)::int AS total_passengers,
        AVG(CASE WHEN total_seats > 0 THEN (total_passengers::float / total_seats) * 100 END) AS avg_load_factor
      FROM flight_stats
      GROUP BY day
      ORDER BY day ASC;
    `;

    const distributionQuery = Prisma.sql`
      WITH flight_stats AS (
        SELECT
          (CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END +
           CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END
          )::int AS total_passengers,
          (CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END +
           CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END
          )::int AS total_seats
        FROM "Flight" f
        LEFT JOIN "AircraftType" at ON f."aircraftTypeId" = at.id
        WHERE ${whereClauseSql}
      )
      SELECT
        SUM(CASE WHEN total_seats > 0 AND (total_passengers::float / total_seats) * 100 < 50 THEN 1 ELSE 0 END)::int AS very_low,
        SUM(CASE WHEN total_seats > 0 AND (total_passengers::float / total_seats) * 100 >= 50 AND (total_passengers::float / total_seats) * 100 < 70 THEN 1 ELSE 0 END)::int AS low,
        SUM(CASE WHEN total_seats > 0 AND (total_passengers::float / total_seats) * 100 >= 70 AND (total_passengers::float / total_seats) * 100 < 85 THEN 1 ELSE 0 END)::int AS medium,
        SUM(CASE WHEN total_seats > 0 AND (total_passengers::float / total_seats) * 100 >= 85 AND (total_passengers::float / total_seats) * 100 < 95 THEN 1 ELSE 0 END)::int AS high,
        SUM(CASE WHEN total_seats > 0 AND (total_passengers::float / total_seats) * 100 >= 95 THEN 1 ELSE 0 END)::int AS very_high
      FROM flight_stats;
    `;

    const [
      summaryRows,
      airlineRows,
      dailyRows,
      distributionRows,
    ] = await Promise.all([
      prisma.$queryRaw<any[]>(summaryQuery),
      prisma.$queryRaw<any[]>(airlineQuery),
      prisma.$queryRaw<any[]>(dailyQuery),
      prisma.$queryRaw<any[]>(distributionQuery),
    ]);

    const summaryRow = summaryRows[0] || {
      total_flights: 0,
      total_passengers: 0,
      total_seats: 0,
      avg_load_factor: 0,
    };

    const dailyMap = new Map<string, any>();
    dailyRows.forEach((row) => {
      const dayStr = getDateStringInTimeZone(new Date(row.day), TIME_ZONE_SARAJEVO);
      dailyMap.set(dayStr, row);
    });

    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
    const dailyTrend = daysInRange.map(day => {
      const dayStr = getDateStringInTimeZone(day, TIME_ZONE_SARAJEVO);
      const row = dailyMap.get(dayStr);
      const passengers = row?.total_passengers || 0;
      const flights = row?.flights || 0;
      const avgLoadFactor = row?.avg_load_factor ? Math.round(row.avg_load_factor) : 0;
      return {
        date: dayStr,
        displayDate: formatDateDisplay(day),
        flights,
        averageLoadFactor: avgLoadFactor,
        totalPassengers: passengers,
      };
    });

    const byAirline = airlineRows.map((row) => ({
      airline: row.airline,
      icaoCode: row.icao_code,
      flights: row.flights || 0,
      averageLoadFactor: row.avg_load_factor ? Math.round(row.avg_load_factor) : 0,
      totalPassengers: row.total_passengers || 0,
      totalSeats: row.total_seats || 0,
    }));

    const distributionRow = distributionRows[0] || {};
    const distribution = {
      veryLow: distributionRow.very_low || 0,
      low: distributionRow.low || 0,
      medium: distributionRow.medium || 0,
      high: distributionRow.high || 0,
      veryHigh: distributionRow.very_high || 0,
    };

    const details = await prisma.flight.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(airlineParam ? { airline: { icaoCode: airlineParam } } : {}),
        ...(routeParam ? { route: { contains: routeParam, mode: 'insensitive' } } : {}),
        ...(operationTypeParam ? { operationTypeId: operationTypeParam } : {}),
      },
      select: {
        id: true,
        date: true,
        route: true,
        airline: {
          select: {
            name: true,
            icaoCode: true,
          },
        },
        aircraftType: {
          select: {
            model: true,
            seats: true,
          },
        },
        availableSeats: true,
        arrivalPassengers: true,
        arrivalFerryIn: true,
        arrivalFlightNumber: true,
        departurePassengers: true,
        departureFerryOut: true,
        departureFlightNumber: true,
      },
      orderBy: { date: 'asc' },
      take: 100,
    });

    const flightsWithLoadFactor = details.map((flight) => {
      const arrivalPassengers = flight.arrivalFerryIn ? 0 : (flight.arrivalPassengers || 0);
      const departurePassengers = flight.departureFerryOut ? 0 : (flight.departurePassengers || 0);
      const totalPassengers = arrivalPassengers + departurePassengers;

      const seatsPerLeg = flight.availableSeats || flight.aircraftType?.seats || 0;
      const totalSeats =
        (flight.arrivalFerryIn ? 0 : seatsPerLeg) +
        (flight.departureFerryOut ? 0 : seatsPerLeg);

      const loadFactor = totalSeats > 0
        ? Math.round((totalPassengers / totalSeats) * 100)
        : 0;

      return {
        id: flight.id,
        date: flight.date,
        airline: flight.airline?.name || 'Unknown',
        icaoCode: flight.airline?.icaoCode || 'N/A',
        route: flight.route,
        aircraftModel: flight.aircraftType?.model || 'Unknown',
        totalPassengers,
        totalSeats,
        loadFactor,
        arrivalPassengers,
        departurePassengers,
        arrivalFlightNumber: flight.arrivalFlightNumber,
        departureFlightNumber: flight.departureFlightNumber,
      };
    });

    const responseData = {
      filters: {
        dateFrom: dateFromParam,
        dateTo: dateToParam,
        airline: airlineParam || 'ALL',
        route: routeParam || '',
        operationTypeId: operationTypeParam || 'ALL',
      },
      summary: {
        totalFlights: summaryRow.total_flights || 0,
        averageLoadFactor: summaryRow.avg_load_factor ? Math.round(summaryRow.avg_load_factor) : 0,
        totalPassengers: summaryRow.total_passengers || 0,
        totalSeats: summaryRow.total_seats || 0,
      },
      byAirline,
      dailyTrend,
      distribution,
      flights: flightsWithLoadFactor,
      totalFlightsCount: summaryRow.total_flights || 0,
    };

    cache.set(cacheKey, responseData, CacheTTL.TEN_MINUTES);

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Load factor analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri analizi load factora',
      },
      { status: 500 }
    );
  }
}
