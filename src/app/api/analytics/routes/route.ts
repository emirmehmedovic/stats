import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { endOfDayUtc, startOfDayUtc } from '@/lib/dates';
import { cache, CacheTTL } from '@/lib/cache';

// GET /api/analytics/routes?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&airline=ICAO&limit=20&page=1
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');
    const airlineParam = searchParams.get('airline');
    const limitParam = searchParams.get('limit') || '20';
    const pageParam = searchParams.get('page') || '1';

    if (!dateFromParam || !dateToParam) {
      return NextResponse.json(
        { error: 'dateFrom and dateTo parameters are required' },
        { status: 400 }
      );
    }

    const dateFrom = startOfDayUtc(dateFromParam);
    const dateTo = endOfDayUtc(dateToParam);

    if (isNaN(dateFrom.getTime()) || isNaN(dateTo.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const limit = Math.min(parseInt(limitParam), 100);
    const page = Math.max(parseInt(pageParam), 1);
    const offset = (page - 1) * limit;

    const cacheKey = `analytics:routes:${dateFromParam}:${dateToParam}:${airlineParam || 'ALL'}:${limit}:${page}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    const whereClause: { airlineId?: string } = {};
    if (airlineParam) {
      const airline = await prisma.airline.findFirst({
        where: { icaoCode: airlineParam },
        select: { id: true },
      });
      if (airline) {
        whereClause.airlineId = airline.id;
      }
    }

    const whereSql = [
      Prisma.sql`f.date >= ${dateFrom}`,
      Prisma.sql`f.date <= ${dateTo}`,
    ];
    if (whereClause.airlineId) {
      whereSql.push(Prisma.sql`f."airlineId" = ${whereClause.airlineId}`);
    }

    const whereClauseSql = Prisma.join(whereSql, ' AND ');

    const routeStatsQuery = Prisma.sql`
      WITH route_stats AS (
        SELECT
          f.route,
          COUNT(*)::int AS frequency,
          SUM(
            CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END +
            CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END
          )::int AS total_passengers,
          SUM(
            CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END +
            CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END
          )::int AS total_seats,
          SUM(CASE WHEN f."arrivalFlightNumber" IS NOT NULL THEN 1 ELSE 0 END)::int AS arrival_count,
          SUM(CASE WHEN f."departureFlightNumber" IS NOT NULL THEN 1 ELSE 0 END)::int AS departure_count,
          ARRAY_AGG(DISTINCT a.name) AS airlines,
          SUM(
            CASE
              WHEN f."arrivalFlightNumber" IS NOT NULL
                AND f."arrivalActualTime" IS NOT NULL
                AND f."arrivalScheduledTime" IS NOT NULL
                AND f."arrivalActualTime" > f."arrivalScheduledTime"
              THEN EXTRACT(EPOCH FROM (f."arrivalActualTime" - f."arrivalScheduledTime")) / 60
              ELSE 0
            END
          )::float AS total_delay_arr,
          SUM(
            CASE
              WHEN f."departureFlightNumber" IS NOT NULL
                AND f."departureActualTime" IS NOT NULL
                AND f."departureScheduledTime" IS NOT NULL
                AND f."departureActualTime" > f."departureScheduledTime"
              THEN EXTRACT(EPOCH FROM (f."departureActualTime" - f."departureScheduledTime")) / 60
              ELSE 0
            END
          )::float AS total_delay_dep
        FROM "Flight" f
        LEFT JOIN "AircraftType" at ON f."aircraftTypeId" = at.id
        LEFT JOIN "Airline" a ON f."airlineId" = a.id
        WHERE f.route IS NOT NULL AND ${whereClauseSql}
        GROUP BY f.route
      )
      SELECT
        route,
        frequency,
        total_passengers,
        total_seats,
        arrival_count,
        departure_count,
        airlines,
        total_delay_arr,
        total_delay_dep
      FROM route_stats
      ORDER BY frequency DESC
      LIMIT ${limit}
      OFFSET ${offset};
    `;

    const summaryQuery = Prisma.sql`
      WITH route_stats AS (
        SELECT
          f.route,
          COUNT(*)::int AS frequency,
          SUM(
            CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END +
            CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END
          )::int AS total_passengers,
          SUM(
            CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END +
            CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."availableSeats", at.seats, 0) END
          )::int AS total_seats,
          SUM(CASE WHEN f."arrivalFlightNumber" IS NOT NULL THEN 1 ELSE 0 END)::int AS arrival_count,
          SUM(CASE WHEN f."departureFlightNumber" IS NOT NULL THEN 1 ELSE 0 END)::int AS departure_count,
          ARRAY_AGG(DISTINCT a.name) AS airlines,
          SUM(
            CASE
              WHEN f."arrivalFlightNumber" IS NOT NULL
                AND f."arrivalActualTime" IS NOT NULL
                AND f."arrivalScheduledTime" IS NOT NULL
                AND f."arrivalActualTime" > f."arrivalScheduledTime"
              THEN EXTRACT(EPOCH FROM (f."arrivalActualTime" - f."arrivalScheduledTime")) / 60
              ELSE 0
            END
          )::float AS total_delay_arr,
          SUM(
            CASE
              WHEN f."departureFlightNumber" IS NOT NULL
                AND f."departureActualTime" IS NOT NULL
                AND f."departureScheduledTime" IS NOT NULL
                AND f."departureActualTime" > f."departureScheduledTime"
              THEN EXTRACT(EPOCH FROM (f."departureActualTime" - f."departureScheduledTime")) / 60
              ELSE 0
            END
          )::float AS total_delay_dep
        FROM "Flight" f
        LEFT JOIN "AircraftType" at ON f."aircraftTypeId" = at.id
        LEFT JOIN "Airline" a ON f."airlineId" = a.id
        WHERE f.route IS NOT NULL AND ${whereClauseSql}
        GROUP BY f.route
      )
      SELECT
        COUNT(*)::int AS total_routes,
        SUM(frequency)::int AS total_flights,
        SUM(total_passengers)::int AS total_passengers,
        AVG(CASE WHEN total_seats > 0 THEN (total_passengers::float / total_seats) * 100 END) AS avg_load_factor,
        AVG(CASE WHEN (arrival_count + departure_count) > 0 THEN total_passengers::float / (arrival_count + departure_count) END) AS avg_passengers_per_route,
        (SELECT row_to_json(rs) FROM route_stats rs ORDER BY frequency DESC LIMIT 1) AS top_route,
        (SELECT row_to_json(rs) FROM route_stats rs ORDER BY total_passengers DESC LIMIT 1) AS busiest_route
      FROM route_stats;
    `;

    const [routeStatsRaw, summaryRaw] = await Promise.all([
      prisma.$queryRaw<any[]>(routeStatsQuery),
      prisma.$queryRaw<any[]>(summaryQuery),
    ]);

    const routeAnalysis = routeStatsRaw.map((stats) => {
      const totalMovements = stats.arrival_count + stats.departure_count;
      const avgPassengersPerFlight = totalMovements > 0
        ? Math.round((stats.total_passengers / totalMovements) * 10) / 10
        : 0;
      const loadFactor = stats.total_seats > 0
        ? Math.round((stats.total_passengers / stats.total_seats) * 100 * 10) / 10
        : 0;
      const avgDelayArr = stats.arrival_count > 0
        ? Math.round((stats.total_delay_arr / stats.arrival_count) * 10) / 10
        : 0;
      const avgDelayDep = stats.departure_count > 0
        ? Math.round((stats.total_delay_dep / stats.departure_count) * 10) / 10
        : 0;

      return {
        route: stats.route,
        frequency: stats.frequency,
        totalPassengers: stats.total_passengers,
        totalSeatsOffered: stats.total_seats,
        arrivalCount: stats.arrival_count,
        departureCount: stats.departure_count,
        airlines: stats.airlines || [],
        airlinesCount: (stats.airlines || []).length,
        avgPassengersPerFlight,
        loadFactor,
        avgDelayArrival: avgDelayArr,
        avgDelayDeparture: avgDelayDep,
      };
    });

    const summaryRow = summaryRaw[0] || {
      total_routes: 0,
      total_flights: 0,
      total_passengers: 0,
      avg_load_factor: 0,
      avg_passengers_per_route: 0,
      top_route: null,
      busiest_route: null,
    };

    const mapRouteRow = (row: any) => {
      if (!row) return null;
      const totalMovements = (row.arrival_count || 0) + (row.departure_count || 0);
      const avgPassengersPerFlight = totalMovements > 0
        ? Math.round((row.total_passengers / totalMovements) * 10) / 10
        : 0;
      const loadFactor = row.total_seats > 0
        ? Math.round((row.total_passengers / row.total_seats) * 100 * 10) / 10
        : 0;
      const avgDelayArr = row.arrival_count > 0
        ? Math.round((row.total_delay_arr / row.arrival_count) * 10) / 10
        : 0;
      const avgDelayDep = row.departure_count > 0
        ? Math.round((row.total_delay_dep / row.departure_count) * 10) / 10
        : 0;

      return {
        route: row.route,
        frequency: row.frequency,
        totalPassengers: row.total_passengers,
        totalSeatsOffered: row.total_seats,
        arrivalCount: row.arrival_count,
        departureCount: row.departure_count,
        airlines: row.airlines || [],
        airlinesCount: (row.airlines || []).length,
        avgPassengersPerFlight,
        loadFactor,
        avgDelayArrival: avgDelayArr,
        avgDelayDeparture: avgDelayDep,
      };
    };

    const summary = {
      totalRoutes: summaryRow.total_routes || 0,
      totalFlights: summaryRow.total_flights || 0,
      totalPassengers: summaryRow.total_passengers || 0,
      avgLoadFactor: summaryRow.avg_load_factor
        ? Math.round(summaryRow.avg_load_factor * 10) / 10
        : 0,
      avgPassengersPerRoute: summaryRow.avg_passengers_per_route
        ? Math.round(summaryRow.avg_passengers_per_route)
        : 0,
      topRoute: mapRouteRow(summaryRow.top_route),
      busiestRoute: mapRouteRow(summaryRow.busiest_route),
    };

    const topRoutes = routeAnalysis;

    const destinationStats = new Map<string, {
      destination: string;
      routeCount: number;
      totalFlights: number;
      totalPassengers: number;
    }>();

    topRoutes.forEach((route) => {
      const parts = typeof route.route === 'string' ? route.route.split('-') : [];
      const destinations = Array.from(new Set(parts))
        .filter((d): d is string => typeof d === 'string' && d !== 'TZL' && d.length > 0);

      destinations.forEach((dest) => {
        if (!destinationStats.has(dest)) {
          destinationStats.set(dest, {
            destination: dest,
            routeCount: 0,
            totalFlights: 0,
            totalPassengers: 0,
          });
        }
        const destStats = destinationStats.get(dest)!;
        destStats.routeCount++;
        destStats.totalFlights += route.frequency;
        destStats.totalPassengers += route.totalPassengers;
      });
    });

    const destinationAnalysis = Array.from(destinationStats.values())
      .sort((a, b) => b.totalFlights - a.totalFlights)
      .slice(0, 10);

    const responseData = {
      summary,
      routes: topRoutes,
      destinationAnalysis,
      pagination: {
        page,
        limit,
      },
    };

    cache.set(cacheKey, responseData, CacheTTL.TEN_MINUTES);

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Routes analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch route analysis',
      },
      { status: 500 }
    );
  }
}
