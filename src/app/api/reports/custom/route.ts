import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { eachDayOfInterval } from 'date-fns';
import { endOfDayUtc, formatDateDisplay, getDateStringInTimeZone, startOfDayUtc, TIME_ZONE_SARAJEVO } from '@/lib/dates';
import { cache, CacheTTL } from '@/lib/cache';

// POST /api/reports/custom - Custom report with flexible filters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dateFrom, dateTo, airlines, routes, operationTypeId, groupBy } = body;

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datum od i do su obavezni',
        },
        { status: 400 }
      );
    }

    const startDate = startOfDayUtc(dateFrom);
    const endDate = endOfDayUtc(dateTo);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Neispravan format datuma',
        },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datum od mora biti prije datuma do',
        },
        { status: 400 }
      );
    }

    const normalizedFilters = {
      dateFrom,
      dateTo,
      airlines: Array.isArray(airlines) ? [...airlines].sort() : [],
      routes: Array.isArray(routes) ? [...routes].sort() : [],
      operationTypeId: operationTypeId || 'ALL',
      groupBy: groupBy || 'day',
    };
    const cacheKey = `reports:custom:${JSON.stringify(normalizedFilters)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (airlines && airlines.length > 0) {
      const airlineRecords = await prisma.airline.findMany({
        where: {
          icaoCode: {
            in: airlines,
          },
        },
        select: {
          id: true,
        },
      });

      if (airlineRecords.length > 0) {
        whereClause.airlineId = {
          in: airlineRecords.map(a => a.id),
        };
      }
    }

    if (routes && routes.length > 0) {
      whereClause.route = {
        in: routes,
      };
    }

    if (operationTypeId && operationTypeId !== 'ALL') {
      whereClause.operationTypeId = operationTypeId;
    }

    const whereSql = [
      Prisma.sql`f.date >= ${startDate}`,
      Prisma.sql`f.date <= ${endDate}`,
    ];
    if (whereClause.airlineId?.in) {
      whereSql.push(Prisma.sql`f."airlineId" IN (${Prisma.join(whereClause.airlineId.in)})`);
    }
    if (whereClause.route?.in) {
      whereSql.push(Prisma.sql`f.route IN (${Prisma.join(whereClause.route.in)})`);
    }
    if (whereClause.operationTypeId) {
      whereSql.push(Prisma.sql`f."operationTypeId" = ${whereClause.operationTypeId}`);
    }
    const whereClauseSql = Prisma.join(whereSql, ' AND ');

    const totalsQuery = Prisma.sql`
      SELECT
        COUNT(*)::int AS flights,
        SUM(CASE WHEN f."arrivalFlightNumber" IS NOT NULL THEN 1 ELSE 0 END)::int AS arrival_flights,
        SUM(CASE WHEN f."departureFlightNumber" IS NOT NULL THEN 1 ELSE 0 END)::int AS departure_flights,
        SUM(CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END)::int AS arrival_passengers,
        SUM(CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END)::int AS departure_passengers,
        SUM(COALESCE(f."arrivalBaggage", 0))::int AS arrival_baggage,
        SUM(COALESCE(f."departureBaggage", 0))::int AS departure_baggage,
        SUM(COALESCE(f."arrivalCargo", 0))::int AS arrival_cargo,
        SUM(COALESCE(f."departureCargo", 0))::int AS departure_cargo,
        SUM(COALESCE(f."arrivalMail", 0))::int AS arrival_mail,
        SUM(COALESCE(f."departureMail", 0))::int AS departure_mail
      FROM "Flight" f
      WHERE ${whereClauseSql};
    `;

    const dailyQuery = Prisma.sql`
      SELECT
        date_trunc('day', f.date) AS day,
        COUNT(*)::int AS flights,
        SUM(
          CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END +
          CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END
        )::int AS passengers,
        SUM(CASE WHEN f."arrivalFlightNumber" IS NOT NULL THEN 1 ELSE 0 END)::int AS arrival_flights,
        SUM(CASE WHEN f."departureFlightNumber" IS NOT NULL THEN 1 ELSE 0 END)::int AS departure_flights
      FROM "Flight" f
      WHERE ${whereClauseSql}
      GROUP BY day
      ORDER BY day ASC;
    `;

    const airlineQuery = Prisma.sql`
      SELECT
        a."icaoCode" AS icao_code,
        a.name AS name,
        COUNT(*)::int AS flights,
        SUM(
          CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END +
          CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END
        )::int AS passengers,
        SUM(CASE WHEN f."arrivalFlightNumber" IS NOT NULL THEN 1 ELSE 0 END)::int AS arrival_flights,
        SUM(CASE WHEN f."departureFlightNumber" IS NOT NULL THEN 1 ELSE 0 END)::int AS departure_flights
      FROM "Flight" f
      INNER JOIN "Airline" a ON a.id = f."airlineId"
      WHERE ${whereClauseSql}
      GROUP BY a.id
      ORDER BY flights DESC;
    `;

    const routeQuery = Prisma.sql`
      SELECT
        f.route AS route,
        COUNT(*)::int AS flights,
        SUM(
          CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END +
          CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END
        )::int AS passengers,
        SUM(CASE WHEN f."arrivalFlightNumber" IS NOT NULL THEN 1 ELSE 0 END)::int AS arrival_flights,
        SUM(CASE WHEN f."departureFlightNumber" IS NOT NULL THEN 1 ELSE 0 END)::int AS departure_flights
      FROM "Flight" f
      WHERE ${whereClauseSql}
      GROUP BY f.route
      ORDER BY flights DESC;
    `;

    const typeQuery = Prisma.sql`
      SELECT
        ot.code AS code,
        ot.name AS name,
        COUNT(*)::int AS flights,
        SUM(
          CASE WHEN f."arrivalFerryIn" THEN 0 ELSE COALESCE(f."arrivalPassengers", 0) END +
          CASE WHEN f."departureFerryOut" THEN 0 ELSE COALESCE(f."departurePassengers", 0) END
        )::int AS passengers,
        SUM(CASE WHEN f."arrivalFlightNumber" IS NOT NULL THEN 1 ELSE 0 END)::int AS arrival_flights,
        SUM(CASE WHEN f."departureFlightNumber" IS NOT NULL THEN 1 ELSE 0 END)::int AS departure_flights
      FROM "Flight" f
      INNER JOIN "OperationType" ot ON ot.id = f."operationTypeId"
      WHERE ${whereClauseSql}
      GROUP BY ot.id
      ORDER BY flights DESC;
    `;

    const [totalsRows, dailyRows, airlineRows, routeRows, typeRows] = await Promise.all([
      prisma.$queryRaw<any[]>(totalsQuery),
      prisma.$queryRaw<any[]>(dailyQuery),
      prisma.$queryRaw<any[]>(airlineQuery),
      prisma.$queryRaw<any[]>(routeQuery),
      prisma.$queryRaw<any[]>(typeQuery),
    ]);

    const totalsRow = totalsRows[0] || {};
    const totals = {
      flights: totalsRow.flights || 0,
      arrivalFlights: totalsRow.arrival_flights || 0,
      arrivalPassengers: totalsRow.arrival_passengers || 0,
      arrivalBaggage: totalsRow.arrival_baggage || 0,
      arrivalCargo: totalsRow.arrival_cargo || 0,
      arrivalMail: totalsRow.arrival_mail || 0,
      departureFlights: totalsRow.departure_flights || 0,
      departurePassengers: totalsRow.departure_passengers || 0,
      departureBaggage: totalsRow.departure_baggage || 0,
      departureCargo: totalsRow.departure_cargo || 0,
      departureMail: totalsRow.departure_mail || 0,
      totalPassengers: (totalsRow.arrival_passengers || 0) + (totalsRow.departure_passengers || 0),
      totalBaggage: (totalsRow.arrival_baggage || 0) + (totalsRow.departure_baggage || 0),
      totalCargo: (totalsRow.arrival_cargo || 0) + (totalsRow.departure_cargo || 0),
      totalMail: (totalsRow.arrival_mail || 0) + (totalsRow.departure_mail || 0),
    };

    let groupedData: any[] = [];
    if (groupBy === 'day') {
      const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
      const dailyMap = new Map<string, any>();
      dailyRows.forEach((row) => {
        const dayStr = getDateStringInTimeZone(new Date(row.day), TIME_ZONE_SARAJEVO);
        dailyMap.set(dayStr, row);
      });
      groupedData = daysInRange.map(day => {
        const dayStr = getDateStringInTimeZone(day, TIME_ZONE_SARAJEVO);
        const row = dailyMap.get(dayStr);
        return {
          label: dayStr,
          displayLabel: formatDateDisplay(day),
          flights: row?.flights || 0,
          passengers: row?.passengers || 0,
          arrivalFlights: row?.arrival_flights || 0,
          departureFlights: row?.departure_flights || 0,
        };
      });
    } else if (groupBy === 'airline') {
      groupedData = airlineRows.map((row) => ({
        label: row.icao_code,
        displayLabel: row.name,
        flights: row.flights || 0,
        passengers: row.passengers || 0,
        arrivalFlights: row.arrival_flights || 0,
        departureFlights: row.departure_flights || 0,
      }));
    } else if (groupBy === 'route') {
      groupedData = routeRows.map((row) => ({
        label: row.route,
        displayLabel: row.route,
        flights: row.flights || 0,
        passengers: row.passengers || 0,
        arrivalFlights: row.arrival_flights || 0,
        departureFlights: row.departure_flights || 0,
      }));
    } else if (groupBy === 'operationType') {
      groupedData = typeRows.map((row) => ({
        label: row.code,
        displayLabel: row.name,
        flights: row.flights || 0,
        passengers: row.passengers || 0,
        arrivalFlights: row.arrival_flights || 0,
        departureFlights: row.departure_flights || 0,
      }));
    }

    const flights = await prisma.flight.findMany({
      where: whereClause,
      include: {
        operationType: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
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
      take: 100,
    });

    const responseData = {
      filters: {
        dateFrom,
        dateTo,
        airlines: airlines || [],
        routes: routes || [],
        operationTypeId: operationTypeId || 'ALL',
        groupBy: groupBy || 'day',
      },
      totals,
      groupedData,
      flights,
      totalFlightsCount: totals.flights,
    };

    cache.set(cacheKey, responseData, CacheTTL.FIVE_MINUTES);

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Custom report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri generisanju custom izvještaja',
      },
      { status: 500 }
    );
  }
}
