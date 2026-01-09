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

    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get('year') || '2025', 10);

    // Get all routes from the specified year with statistics
    const routes = await prisma.$queryRaw<Array<{
      route: string;
      destination: string;
      airlineIcao: string;
      airlineName: string;
      aircraftType: string;
      totalFlights: number;
      totalPassengers: number;
      avgPassengersPerFlight: number;
      avgLoadFactor: number;
      aircraftCapacity: number;
    }>>`
      SELECT 
        f.route,
        COALESCE(arr_ap.city, arr_ap.name, f.route) as destination,
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
        MAX(at.seats)::int as "aircraftCapacity"
      FROM "Flight" f
      JOIN "Airline" a ON f."airlineId" = a.id
      JOIN "AircraftType" at ON f."aircraftTypeId" = at.id
      LEFT JOIN "Airport" arr_ap ON f."arrivalAirportId" = arr_ap.id
      WHERE EXTRACT(YEAR FROM f.date) = ${year}
        AND (f."arrivalPassengers" > 0 OR f."departurePassengers" > 0)
        AND at.seats > 0
      GROUP BY f.route, arr_ap.city, arr_ap.name, a."icaoCode", a.name, at.model
      HAVING COUNT(f.id) >= 10
      ORDER BY COUNT(f.id) DESC
    `;

    // Calculate weekly operations based on total flights
    const routesWithProjections = routes.map(route => {
      // Estimate weekly operations (total flights / 52 weeks, rounded)
      const weeklyOperations = Math.max(1, Math.round(route.totalFlights / 52));
      
      return {
        destination: route.destination,
        airlineIcao: route.airlineIcao,
        airlineName: route.airlineName,
        aircraftType: route.aircraftType,
        weeklyOperations,
        estimatedLoadFactor: Math.round(route.avgLoadFactor),
        historicalData: {
          totalFlights: route.totalFlights,
          totalPassengers: route.totalPassengers,
          avgPassengersPerFlight: Math.round(route.avgPassengersPerFlight),
          avgLoadFactor: Math.round(route.avgLoadFactor),
          aircraftCapacity: route.aircraftCapacity,
        },
      };
    });

    return NextResponse.json({
      success: true,
      year,
      routes: routesWithProjections,
      totalRoutes: routesWithProjections.length,
    });
  } catch (error: any) {
    console.error('Historical routes error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch historical routes' },
      { status: 500 }
    );
  }
}
