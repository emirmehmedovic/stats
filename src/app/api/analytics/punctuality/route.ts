import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { eachDayOfInterval } from 'date-fns';
import { endOfDayUtc, formatDateDisplay, getDateStringInTimeZone, startOfDayUtc, TIME_ZONE_SARAJEVO } from '@/lib/dates';
import { cache, CacheTTL } from '@/lib/cache';

// GET /api/analytics/punctuality?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD&airline=ICAO
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateFromParam = searchParams.get('dateFrom');
    const dateToParam = searchParams.get('dateTo');
    const airlineParam = searchParams.get('airline');

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

    const cacheKey = `analytics:punctuality:${dateFromParam}:${dateToParam}:${airlineParam || 'ALL'}`;
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

    const whereClauseSql = Prisma.join(whereSql, ' AND ');

    const summaryQuery = Prisma.sql`
      WITH delays AS (
        SELECT
          f.id,
          CASE
            WHEN f."arrivalScheduledTime" IS NOT NULL AND f."arrivalActualTime" IS NOT NULL
            THEN EXTRACT(EPOCH FROM (f."arrivalActualTime" - f."arrivalScheduledTime")) / 60
            ELSE NULL
          END AS arrival_delay,
          CASE
            WHEN f."departureScheduledTime" IS NOT NULL AND f."departureActualTime" IS NOT NULL
            THEN EXTRACT(EPOCH FROM (f."departureActualTime" - f."departureScheduledTime")) / 60
            ELSE NULL
          END AS departure_delay
        FROM "Flight" f
        WHERE ${whereClauseSql}
      )
      SELECT
        (SELECT COUNT(*) FROM "Flight" f WHERE ${whereClauseSql})::int AS total_flights,
        COUNT(arrival_delay)::int AS arrival_flights,
        COUNT(departure_delay)::int AS departure_flights,
        AVG(arrival_delay)::float AS avg_arrival_delay,
        AVG(departure_delay)::float AS avg_departure_delay,
        SUM(CASE WHEN arrival_delay IS NOT NULL AND arrival_delay < 15 THEN 1 ELSE 0 END)::int AS arrival_on_time,
        SUM(CASE WHEN departure_delay IS NOT NULL AND departure_delay < 15 THEN 1 ELSE 0 END)::int AS departure_on_time
      FROM delays;
    `;

    const dailyQuery = Prisma.sql`
      WITH delays AS (
        SELECT
          date_trunc('day', f.date) AS day,
          CASE
            WHEN f."arrivalScheduledTime" IS NOT NULL AND f."arrivalActualTime" IS NOT NULL
            THEN EXTRACT(EPOCH FROM (f."arrivalActualTime" - f."arrivalScheduledTime")) / 60
            ELSE NULL
          END AS arrival_delay,
          CASE
            WHEN f."departureScheduledTime" IS NOT NULL AND f."departureActualTime" IS NOT NULL
            THEN EXTRACT(EPOCH FROM (f."departureActualTime" - f."departureScheduledTime")) / 60
            ELSE NULL
          END AS departure_delay
        FROM "Flight" f
        WHERE ${whereClauseSql}
      ),
      daily_base AS (
        SELECT
          day,
          COUNT(*)::int AS flights,
          COUNT(arrival_delay)::int AS arrival_flights,
          COUNT(departure_delay)::int AS departure_flights,
          SUM(CASE WHEN arrival_delay IS NOT NULL AND arrival_delay < 15 THEN 1 ELSE 0 END)::int AS arrival_on_time,
          SUM(CASE WHEN departure_delay IS NOT NULL AND departure_delay < 15 THEN 1 ELSE 0 END)::int AS departure_on_time
        FROM delays
        GROUP BY day
      )
      SELECT
        day,
        flights,
        arrival_flights,
        departure_flights,
        arrival_on_time,
        departure_on_time
      FROM daily_base
      ORDER BY day ASC;
    `;

    const airlineQuery = Prisma.sql`
      WITH delays AS (
        SELECT
          f."airlineId" AS airline_id,
          CASE
            WHEN f."arrivalScheduledTime" IS NOT NULL AND f."arrivalActualTime" IS NOT NULL
            THEN EXTRACT(EPOCH FROM (f."arrivalActualTime" - f."arrivalScheduledTime")) / 60
            ELSE NULL
          END AS arrival_delay,
          CASE
            WHEN f."departureScheduledTime" IS NOT NULL AND f."departureActualTime" IS NOT NULL
            THEN EXTRACT(EPOCH FROM (f."departureActualTime" - f."departureScheduledTime")) / 60
            ELSE NULL
          END AS departure_delay
        FROM "Flight" f
        WHERE ${whereClauseSql}
      )
      SELECT
        a.name AS airline,
        a."icaoCode" AS icao_code,
        COUNT(*)::int AS total_flights,
        COUNT(arrival_delay)::int AS arrival_flights,
        COUNT(departure_delay)::int AS departure_flights,
        SUM(CASE WHEN arrival_delay IS NOT NULL AND arrival_delay < 15 THEN 1 ELSE 0 END)::int AS arrival_on_time,
        SUM(CASE WHEN departure_delay IS NOT NULL AND departure_delay < 15 THEN 1 ELSE 0 END)::int AS departure_on_time,
        AVG(arrival_delay)::float AS avg_arrival_delay,
        AVG(departure_delay)::float AS avg_departure_delay
      FROM delays d
      INNER JOIN "Airline" a ON a.id = d.airline_id
      GROUP BY a.id
      ORDER BY total_flights DESC;
    `;

    const distributionQuery = Prisma.sql`
      WITH delays AS (
        SELECT
          CASE
            WHEN f."arrivalScheduledTime" IS NOT NULL AND f."arrivalActualTime" IS NOT NULL
            THEN EXTRACT(EPOCH FROM (f."arrivalActualTime" - f."arrivalScheduledTime")) / 60
            ELSE NULL
          END AS delay
        FROM "Flight" f
        WHERE ${whereClauseSql}
        UNION ALL
        SELECT
          CASE
            WHEN f."departureScheduledTime" IS NOT NULL AND f."departureActualTime" IS NOT NULL
            THEN EXTRACT(EPOCH FROM (f."departureActualTime" - f."departureScheduledTime")) / 60
            ELSE NULL
          END AS delay
        FROM "Flight" f
        WHERE ${whereClauseSql}
      )
      SELECT
        SUM(CASE WHEN delay IS NOT NULL AND delay < 15 THEN 1 ELSE 0 END)::int AS on_time,
        SUM(CASE WHEN delay IS NOT NULL AND delay >= 15 AND delay < 30 THEN 1 ELSE 0 END)::int AS short_delay,
        SUM(CASE WHEN delay IS NOT NULL AND delay >= 30 AND delay < 60 THEN 1 ELSE 0 END)::int AS medium_delay,
        SUM(CASE WHEN delay IS NOT NULL AND delay >= 60 AND delay < 120 THEN 1 ELSE 0 END)::int AS long_delay,
        SUM(CASE WHEN delay IS NOT NULL AND delay >= 120 THEN 1 ELSE 0 END)::int AS very_long_delay
      FROM delays;
    `;

    const worstQuery = Prisma.sql`
      WITH delays AS (
        SELECT
          f.id,
          f.date,
          f.route,
          f."airlineId" AS airline_id,
          f."arrivalFlightNumber",
          f."departureFlightNumber",
          f."arrivalStatus",
          f."departureStatus",
          CASE
            WHEN f."arrivalScheduledTime" IS NOT NULL AND f."arrivalActualTime" IS NOT NULL
            THEN EXTRACT(EPOCH FROM (f."arrivalActualTime" - f."arrivalScheduledTime")) / 60
            ELSE NULL
          END AS arrival_delay,
          CASE
            WHEN f."departureScheduledTime" IS NOT NULL AND f."departureActualTime" IS NOT NULL
            THEN EXTRACT(EPOCH FROM (f."departureActualTime" - f."departureScheduledTime")) / 60
            ELSE NULL
          END AS departure_delay
        FROM "Flight" f
        WHERE ${whereClauseSql}
      )
      SELECT
        d.id,
        d.date,
        d.route,
        a.name AS airline,
        a."icaoCode" AS icao_code,
        d."arrivalFlightNumber",
        d."departureFlightNumber",
        d."arrivalStatus",
        d."departureStatus",
        d.arrival_delay,
        d.departure_delay
      FROM delays d
      INNER JOIN "Airline" a ON a.id = d.airline_id
      WHERE GREATEST(COALESCE(d.arrival_delay, 0), COALESCE(d.departure_delay, 0)) > 0
      ORDER BY GREATEST(COALESCE(d.arrival_delay, 0), COALESCE(d.departure_delay, 0)) DESC
      LIMIT 20;
    `;

    const [
      summaryRows,
      dailyRows,
      airlineRows,
      distributionRows,
      worstRows,
    ] = await Promise.all([
      prisma.$queryRaw<any[]>(summaryQuery),
      prisma.$queryRaw<any[]>(dailyQuery),
      prisma.$queryRaw<any[]>(airlineQuery),
      prisma.$queryRaw<any[]>(distributionQuery),
      prisma.$queryRaw<any[]>(worstQuery),
    ]);

    const summaryRow = summaryRows[0] || {
      total_flights: 0,
      arrival_flights: 0,
      departure_flights: 0,
      avg_arrival_delay: 0,
      avg_departure_delay: 0,
      arrival_on_time: 0,
      departure_on_time: 0,
    };

    const arrivalFlights = summaryRow.arrival_flights || 0;
    const departureFlights = summaryRow.departure_flights || 0;
    const arrivalOnTimeCount = summaryRow.arrival_on_time || 0;
    const departureOnTimeCount = summaryRow.departure_on_time || 0;
    const overallOnTimePercentage = (arrivalFlights + departureFlights) > 0
      ? Math.round(((arrivalOnTimeCount + departureOnTimeCount) / (arrivalFlights + departureFlights)) * 100)
      : 0;
    const arrivalOnTimePercentage = arrivalFlights > 0
      ? Math.round((arrivalOnTimeCount / arrivalFlights) * 100)
      : 0;
    const departureOnTimePercentage = departureFlights > 0
      ? Math.round((departureOnTimeCount / departureFlights) * 100)
      : 0;
    const avgArrivalDelay = summaryRow.avg_arrival_delay ? Math.round(summaryRow.avg_arrival_delay) : 0;
    const avgDepartureDelay = summaryRow.avg_departure_delay ? Math.round(summaryRow.avg_departure_delay) : 0;

    const dailyMap = new Map<string, any>();
    dailyRows.forEach((row) => {
      const dayStr = getDateStringInTimeZone(new Date(row.day), TIME_ZONE_SARAJEVO);
      dailyMap.set(dayStr, row);
    });

    const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
    const dailyTrend = daysInRange.map(day => {
      const dayStr = getDateStringInTimeZone(day, TIME_ZONE_SARAJEVO);
      const row = dailyMap.get(dayStr);
      const dayArrivalFlights = row?.arrival_flights || 0;
      const dayDepartureFlights = row?.departure_flights || 0;
      const dayArrivalOnTime = row?.arrival_on_time || 0;
      const dayDepartureOnTime = row?.departure_on_time || 0;

      return {
        date: dayStr,
        displayDate: formatDateDisplay(day),
        onTimePercentage: (dayArrivalFlights + dayDepartureFlights) > 0
          ? Math.round(((dayArrivalOnTime + dayDepartureOnTime) / (dayArrivalFlights + dayDepartureFlights)) * 100)
          : 0,
        flights: row?.flights || 0,
      };
    });

    const airlineStats = airlineRows.map((row) => {
      const arrivalFlightsCount = row.arrival_flights || 0;
      const departureFlightsCount = row.departure_flights || 0;
      const arrivalOnTime = row.arrival_on_time || 0;
      const departureOnTime = row.departure_on_time || 0;

      return {
        airline: row.airline,
        icaoCode: row.icao_code,
        totalFlights: row.total_flights || 0,
        arrivalOnTimePercentage: arrivalFlightsCount > 0
          ? Math.round((arrivalOnTime / arrivalFlightsCount) * 100)
          : 0,
        departureOnTimePercentage: departureFlightsCount > 0
          ? Math.round((departureOnTime / departureFlightsCount) * 100)
          : 0,
        overallOnTimePercentage: (arrivalFlightsCount + departureFlightsCount) > 0
          ? Math.round(((arrivalOnTime + departureOnTime) / (arrivalFlightsCount + departureFlightsCount)) * 100)
          : 0,
        avgArrivalDelay: row.avg_arrival_delay ? Math.round(row.avg_arrival_delay) : 0,
        avgDepartureDelay: row.avg_departure_delay ? Math.round(row.avg_departure_delay) : 0,
      };
    }).sort((a, b) => b.overallOnTimePercentage - a.overallOnTimePercentage);

    const distributionRow = distributionRows[0] || {};
    const distribution = {
      onTime: distributionRow.on_time || 0,
      shortDelay: distributionRow.short_delay || 0,
      mediumDelay: distributionRow.medium_delay || 0,
      longDelay: distributionRow.long_delay || 0,
      veryLongDelay: distributionRow.very_long_delay || 0,
    };

    const worstPerformers = worstRows.map((row) => ({
      id: row.id,
      date: row.date,
      airline: row.airline,
      icaoCode: row.icao_code,
      route: row.route,
      arrivalFlightNumber: row.arrivalFlightNumber,
      departureFlightNumber: row.departureFlightNumber,
      arrivalDelay: row.arrival_delay,
      departureDelay: row.departure_delay,
      arrivalStatus: row.arrivalStatus,
      departureStatus: row.departureStatus,
      arrivalOnTime: row.arrival_delay !== null && row.arrival_delay < 15,
      departureOnTime: row.departure_delay !== null && row.departure_delay < 15,
      maxDelay: Math.max(row.arrival_delay || 0, row.departure_delay || 0),
    }));

    const responseData = {
      filters: {
        dateFrom: dateFromParam,
        dateTo: dateToParam,
        airline: airlineParam || 'ALL',
      },
      summary: {
        totalFlights: summaryRow.total_flights || 0,
        arrivalFlights,
        departureFlights,
        onTimePercentage: overallOnTimePercentage,
        arrivalOnTimePercentage,
        departureOnTimePercentage,
        avgArrivalDelay,
        avgDepartureDelay,
      },
      byAirline: airlineStats,
      dailyTrend,
      distribution,
      worstPerformers,
    };

    cache.set(cacheKey, responseData, CacheTTL.TEN_MINUTES);

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Punctuality analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri analizi tačnosti',
      },
      { status: 500 }
    );
  }
}
