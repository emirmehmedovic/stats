import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookie } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookie(cookieHeader);
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get detailed 2025 flight data for baseline analysis
    const flights2025 = await prisma.$queryRaw<Array<{
      route: string;
      destination: string;
      airlineIcao: string;
      airlineName: string;
      aircraftType: string;
      month: number;
      weekOfYear: number;
      totalFlights: number;
      totalPassengers: number;
      avgPassengers: number;
      minPassengers: number;
      maxPassengers: number;
      stdDevPassengers: number;
      avgLoadFactor: number;
      minLoadFactor: number;
      maxLoadFactor: number;
      stdDevLoadFactor: number;
      aircraftCapacity: number;
    }>>`
      SELECT 
        f.route,
        COALESCE(arr_ap.city, arr_ap.name, f.route) as destination,
        a."icaoCode" as "airlineIcao",
        a.name as "airlineName",
        at.model as "aircraftType",
        EXTRACT(MONTH FROM f.date)::int as month,
        EXTRACT(WEEK FROM f.date)::int as "weekOfYear",
        COUNT(f.id)::int as "totalFlights",
        SUM(COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0))::int as "totalPassengers",
        AVG(COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0))::float as "avgPassengers",
        MIN(COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0))::int as "minPassengers",
        MAX(COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0))::int as "maxPassengers",
        STDDEV(COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0))::float as "stdDevPassengers",
        AVG(CASE 
          WHEN at.seats > 0 AND (COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0)) > 0 
          THEN ((COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0))::float / (at.seats * 2) * 100)
          ELSE 0 
        END)::float as "avgLoadFactor",
        MIN(CASE 
          WHEN at.seats > 0 AND (COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0)) > 0 
          THEN ((COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0))::float / (at.seats * 2) * 100)
          ELSE 0 
        END)::float as "minLoadFactor",
        MAX(CASE 
          WHEN at.seats > 0 AND (COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0)) > 0 
          THEN ((COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0))::float / (at.seats * 2) * 100)
          ELSE 0 
        END)::float as "maxLoadFactor",
        STDDEV(CASE 
          WHEN at.seats > 0 AND (COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0)) > 0 
          THEN ((COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0))::float / (at.seats * 2) * 100)
          ELSE 0 
        END)::float as "stdDevLoadFactor",
        MAX(at.seats)::int as "aircraftCapacity"
      FROM "Flight" f
      JOIN "Airline" a ON f."airlineId" = a.id
      JOIN "AircraftType" at ON f."aircraftTypeId" = at.id
      LEFT JOIN "Airport" arr_ap ON f."arrivalAirportId" = arr_ap.id
      WHERE EXTRACT(YEAR FROM f.date) = 2025
        AND f.date >= '2025-05-01'
        AND (f."arrivalPassengers" > 0 OR f."departurePassengers" > 0)
        AND at.seats > 0
      GROUP BY f.route, arr_ap.city, arr_ap.name, a."icaoCode", a.name, at.model, 
               EXTRACT(MONTH FROM f.date), EXTRACT(WEEK FROM f.date)
      ORDER BY f.route, month
    `;

    // Aggregate by route for summary - use departure airport for destination
    const routeSummary = await prisma.$queryRaw<Array<{
      route: string;
      destination: string;
      airlineIcao: string;
      airlineName: string;
      aircraftType: string;
      totalFlights: number;
      totalPassengers: number;
      avgPassengersPerFlight: number;
      avgLoadFactor: number;
      stdDevLoadFactor: number;
      minLoadFactor: number;
      maxLoadFactor: number;
      weeklyFrequency: number;
      aircraftCapacity: number;
    }>>`
      SELECT 
        f.route,
        COALESCE(dep_ap.city, dep_ap.name, f.route) as destination,
        a."icaoCode" as "airlineIcao",
        a.name as "airlineName",
        at.model as "aircraftType",
        COUNT(f.id)::int as "totalFlights",
        SUM(COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0))::int as "totalPassengers",
        AVG(COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0))::float as "avgPassengersPerFlight",
        AVG(CASE 
          WHEN at.seats > 0 AND (COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0)) > 0 
          THEN ((COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0))::float / (at.seats * 2) * 100)
          ELSE 0 
        END)::float as "avgLoadFactor",
        COALESCE(STDDEV(CASE 
          WHEN at.seats > 0 AND (COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0)) > 0 
          THEN ((COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0))::float / (at.seats * 2) * 100)
          ELSE NULL
        END), 0)::float as "stdDevLoadFactor",
        MIN(CASE 
          WHEN at.seats > 0 AND (COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0)) > 0 
          THEN ((COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0))::float / (at.seats * 2) * 100)
          ELSE 0 
        END)::float as "minLoadFactor",
        MAX(CASE 
          WHEN at.seats > 0 AND (COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0)) > 0 
          THEN ((COALESCE(f."arrivalPassengers", 0) + COALESCE(f."departurePassengers", 0))::float / (at.seats * 2) * 100)
          ELSE 0 
        END)::float as "maxLoadFactor",
        (COUNT(f.id)::float / 
          GREATEST(1, (EXTRACT(EPOCH FROM MAX(f.date)) - EXTRACT(EPOCH FROM MIN(f.date))) / 604800))::float as "weeklyFrequency",
        MAX(at.seats)::int as "aircraftCapacity"
      FROM "Flight" f
      JOIN "Airline" a ON f."airlineId" = a.id
      JOIN "AircraftType" at ON f."aircraftTypeId" = at.id
      LEFT JOIN "Airport" dep_ap ON f."departureAirportId" = dep_ap.id
      WHERE EXTRACT(YEAR FROM f.date) = 2025
        AND (f."arrivalPassengers" > 0 OR f."departurePassengers" > 0)
        AND at.seats > 0
        AND dep_ap.city IS NOT NULL
        AND dep_ap.city != 'Tuzla'
        AND dep_ap."iataCode" != 'TZL'
        AND f.route NOT LIKE '%TZL%'
      GROUP BY f.route, dep_ap.city, dep_ap.name, a."icaoCode", a.name, at.model
      HAVING COUNT(f.id) >= 10
      ORDER BY "totalFlights" DESC
      LIMIT 30
    `;

    return NextResponse.json({
      success: true,
      baseline: {
        detailedData: flights2025,
        routeSummary,
        period: 'May-December 2025',
        totalRoutes: routeSummary.length,
      },
    });
  } catch (error: any) {
    console.error('Baseline 2025 error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch baseline data' },
      { status: 500 }
    );
  }
}
