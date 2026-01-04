/**
 * Flight Repository - Centralized data access for flights
 * Eliminates query duplication and enforces best practices
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { startOfDay, endOfDay } from 'date-fns';

export interface FlightFilters {
  dateFrom?: Date;
  dateTo?: Date;
  airlineId?: string;
  aircraftTypeId?: string;
  operationTypeId?: string;
  route?: string;
  search?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface FlightWithRelations {
  id: string;
  date: Date;
  airlineId: string;
  airline: {
    id: string;
    name: string;
    icaoCode: string;
  };
  aircraftType: {
    id: string;
    model: string;
    seats: number;
  };
  registration: string;
  route: string;
  arrivalPassengers: number | null;
  departurePassengers: number | null;
  arrivalFerryIn: boolean;
  departureFerryOut: boolean;
  availableSeats: number | null;
  delayCount: number;
}

/**
 * Build where clause from filters
 */
function buildWhereClause(filters: FlightFilters): Prisma.FlightWhereInput {
  const where: Prisma.FlightWhereInput = {
    AND: [],
  };

  const conditions = where.AND as Prisma.FlightWhereInput[];

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    conditions.push({
      date: {
        ...(filters.dateFrom && { gte: startOfDay(filters.dateFrom) }),
        ...(filters.dateTo && { lte: endOfDay(filters.dateTo) }),
      },
    });
  }

  // Airline filter
  if (filters.airlineId) {
    conditions.push({ airlineId: filters.airlineId });
  }

  // Aircraft type filter
  if (filters.aircraftTypeId) {
    conditions.push({ aircraftTypeId: filters.aircraftTypeId });
  }

  // Operation type filter
  if (filters.operationTypeId) {
    conditions.push({ operationTypeId: filters.operationTypeId });
  }

  // Route filter
  if (filters.route) {
    conditions.push({
      route: { contains: filters.route, mode: 'insensitive' },
    });
  }

  // Search across multiple fields
  if (filters.search) {
    conditions.push({
      OR: [
        { registration: { contains: filters.search, mode: 'insensitive' } },
        { route: { contains: filters.search, mode: 'insensitive' } },
        { arrivalFlightNumber: { contains: filters.search, mode: 'insensitive' } },
        { departureFlightNumber: { contains: filters.search, mode: 'insensitive' } },
      ],
    });
  }

  return where;
}

/**
 * Get paginated flights with optimized select
 */
export async function getFlightsPaginated(
  filters: FlightFilters,
  pagination: PaginationParams
) {
  const where = buildWhereClause(filters);
  const { page, limit } = pagination;

  const [flights, total] = await Promise.all([
    prisma.flight.findMany({
      where,
      select: {
        id: true,
        date: true,
        airlineId: true,
        aircraftTypeId: true,
        registration: true,
        route: true,
        operationTypeId: true,
        availableSeats: true,
        arrivalFlightNumber: true,
        departureFlightNumber: true,
        arrivalPassengers: true,
        departurePassengers: true,
        arrivalFerryIn: true,
        departureFerryOut: true,
        arrivalStatus: true,
        departureStatus: true,
        airline: {
          select: {
            id: true,
            name: true,
            icaoCode: true,
            iataCode: true,
          },
        },
        aircraftType: {
          select: {
            id: true,
            model: true,
            seats: true,
          },
        },
        _count: {
          select: { delays: true },
        },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.flight.count({ where }),
  ]);

  return {
    data: flights,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get flights for analytics - OPTIMIZED for large date ranges
 * Returns only fields needed for calculations
 */
export async function getFlightsForAnalytics(filters: FlightFilters) {
  const where = buildWhereClause(filters);

  return prisma.flight.findMany({
    where,
    select: {
      id: true,
      date: true,
      airlineId: true,
      aircraftTypeId: true,
      route: true,
      arrivalPassengers: true,
      departurePassengers: true,
      arrivalFerryIn: true,
      departureFerryOut: true,
      availableSeats: true,
      arrivalScheduledTime: true,
      arrivalActualTime: true,
      departureScheduledTime: true,
      departureActualTime: true,
      arrivalStatus: true,
      departureStatus: true,
      arrivalFlightNumber: true,
      departureFlightNumber: true,
      airline: {
        select: {
          id: true,
          name: true,
          icaoCode: true,
        },
      },
      aircraftType: {
        select: {
          id: true,
          model: true,
          seats: true,
        },
      },
    },
    orderBy: { date: 'asc' },
  });
}

/**
 * Get flights count by date range
 */
export async function getFlightsCount(filters: FlightFilters): Promise<number> {
  const where = buildWhereClause(filters);
  return prisma.flight.count({ where });
}

/**
 * Get passenger aggregates for date range
 */
export async function getPassengerAggregates(filters: FlightFilters) {
  const where = buildWhereClause(filters);

  const result = await prisma.flight.aggregate({
    where,
    _sum: {
      arrivalPassengers: true,
      departurePassengers: true,
    },
    _count: {
      id: true,
    },
  });

  return {
    count: result._count.id,
    totalArrivalPassengers: result._sum.arrivalPassengers || 0,
    totalDeparturePassengers: result._sum.departurePassengers || 0,
    totalPassengers: (result._sum.arrivalPassengers || 0) + (result._sum.departurePassengers || 0),
  };
}

/**
 * Get flight by ID with full details
 */
export async function getFlightById(id: string) {
  return prisma.flight.findUnique({
    where: { id },
    include: {
      airline: {
        select: {
          id: true,
          name: true,
          icaoCode: true,
          iataCode: true,
          country: true,
        },
      },
      aircraftType: {
        select: {
          id: true,
          model: true,
          seats: true,
          mtow: true,
        },
      },
      operationType: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      arrivalAirport: {
        select: {
          id: true,
          name: true,
          iataCode: true,
          icaoCode: true,
          city: true,
          country: true,
        },
      },
      departureAirport: {
        select: {
          id: true,
          name: true,
          iataCode: true,
          icaoCode: true,
          city: true,
          country: true,
        },
      },
      delays: {
        include: {
          delayCode: {
            select: {
              id: true,
              code: true,
              description: true,
              category: true,
            },
          },
        },
      },
    },
  });
}

/**
 * Batch fetch airlines by IDs (prevents N+1)
 */
export async function getAirlinesByIds(ids: string[]) {
  const airlines = await prisma.airline.findMany({
    where: {
      id: { in: ids },
    },
    select: {
      id: true,
      name: true,
      icaoCode: true,
      iataCode: true,
    },
  });

  // Return as Map for O(1) lookup
  return new Map(airlines.map(a => [a.id, a]));
}

/**
 * Get airline by ICAO code (cached lookup)
 */
export async function getAirlineByIcaoCode(icaoCode: string) {
  return prisma.airline.findFirst({
    where: { icaoCode },
    select: {
      id: true,
      name: true,
      icaoCode: true,
    },
  });
}
