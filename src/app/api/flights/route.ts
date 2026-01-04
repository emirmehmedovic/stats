import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFlightSchema, getFlightsQuerySchema } from '@/lib/validators/flight';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import {
  dateOnlyToUtc,
  getDateStringInTimeZone,
  getTodayDateString,
  TIME_ZONE_SARAJEVO,
} from '@/lib/dates';

const hasUnverifiedPastDates = async (cutoffDate: Date) => {
  const pendingCount = await prisma.flight.count({
    where: {
      date: { lt: cutoffDate },
      isVerified: false,
    },
  });
  return pendingCount > 0;
};

// GET /api/flights - Lista letova sa paginacijom i filterima
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      search: searchParams.get('search'),
      airlineId: searchParams.get('airlineId'),
      dateFrom: searchParams.get('dateFrom'),
      dateTo: searchParams.get('dateTo'),
      route: searchParams.get('route'),
      operationType: searchParams.get('operationType'),
      operationTypeId: searchParams.get('operationTypeId'),
    };

    const validatedQuery = getFlightsQuerySchema.parse(queryParams);
    const { page, limit, search, airlineId, dateFrom, dateTo, route, operationTypeId } = validatedQuery;
    
    // Handle operationType code filter (legacy support)
    const operationTypeCode = searchParams.get('operationType');

    // Build where clause
    const where: Prisma.FlightWhereInput = {
      AND: [
        airlineId ? { airlineId } : {},
        dateFrom && dateTo 
          ? { 
              date: { 
                gte: dateFrom,
                lte: dateTo 
              } 
            }
          : dateFrom 
          ? { date: { gte: dateFrom } }
          : dateTo 
          ? { date: { lte: dateTo } }
          : {},
        route ? { route: { contains: route, mode: 'insensitive' } } : {},
        operationTypeId ? { operationTypeId } : {},
        operationTypeCode ? { operationType: { code: operationTypeCode } } : {},
        search
          ? {
              OR: [
                { registration: { contains: search, mode: 'insensitive' } },
                { route: { contains: search, mode: 'insensitive' } },
                { arrivalFlightNumber: { contains: search, mode: 'insensitive' } },
                { departureFlightNumber: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {},
      ],
    };

    // Get total count
    const total = await prisma.flight.count({ where });

    // Get paginated flights
    const flights = await prisma.flight.findMany({
      where,
      include: {
        airline: true,
        aircraftType: true,
        operationType: true,
        arrivalAirport: true,
        departureAirport: true,
        verifiedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        delays: {
          select: {
            id: true,
            unofficialReason: true,
          },
        },
        _count: {
          select: {
            delays: true,
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return NextResponse.json({
      success: true,
      data: flights,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Error fetching flights:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch flights',
      },
      { status: 500 }
    );
  }
}

// POST /api/flights - Kreiranje novog leta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createFlightSchema.parse(body);

    const todayStr = getTodayDateString();
    const flightDateStr = getDateStringInTimeZone(validatedData.date, TIME_ZONE_SARAJEVO);
    if (flightDateStr === todayStr) {
      const hasPending = await hasUnverifiedPastDates(dateOnlyToUtc(todayStr));
      if (hasPending) {
        return NextResponse.json(
          {
            success: false,
            error: 'Prethodne operacije nisu verifikovane',
          },
          { status: 403 }
        );
      }
    }

    const flightData = { ...validatedData };
    if (flightData.arrivalFerryIn) {
      flightData.arrivalPassengers = null;
      flightData.arrivalMalePassengers = null;
      flightData.arrivalFemalePassengers = null;
      flightData.arrivalChildren = null;
      flightData.arrivalInfants = null;
    }
    if (flightData.departureFerryOut) {
      flightData.departurePassengers = null;
      flightData.departureMalePassengers = null;
      flightData.departureFemalePassengers = null;
      flightData.departureChildren = null;
      flightData.departureInfants = null;
    }

    const flight = await prisma.flight.create({
      data: flightData,
      include: {
        airline: true,
        aircraftType: true,
        operationType: true,
        arrivalAirport: true,
        departureAirport: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: flight,
        message: 'Let uspješno kreiran',
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Error creating flight:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create flight',
      },
      { status: 500 }
    );
  }
}
