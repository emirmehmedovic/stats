import { prisma } from '@/lib/prisma'
import { FlightErrorStatus } from '@prisma/client'

export interface BlockingStatus {
  isBlocked: boolean
  pendingErrorsCount: number
  errors: {
    id: string
    flightId: string
    errorType: string
    priority: string
    status: string
    description: string
    createdAt: Date
    flight: {
      id: string
      route: string
      date: Date
      arrivalFlightNumber: string | null
      departureFlightNumber: string | null
    }
  }[]
}

/**
 * Check if a user is blocked due to pending flight errors
 * A user is blocked if they have any OPEN or IN_PROGRESS errors assigned to them
 */
export async function checkUserBlockingStatus(userId: string): Promise<BlockingStatus> {
  const pendingStatuses: FlightErrorStatus[] = [FlightErrorStatus.OPEN, FlightErrorStatus.IN_PROGRESS]

  const pendingErrors = await prisma.flightErrorReport.findMany({
    where: {
      assignedToId: userId,
      status: {
        in: pendingStatuses,
      },
    },
    include: {
      flight: {
        select: {
          id: true,
          route: true,
          date: true,
          arrivalFlightNumber: true,
          departureFlightNumber: true,
        },
      },
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'asc' },
    ],
  })

  return {
    isBlocked: pendingErrors.length > 0,
    pendingErrorsCount: pendingErrors.length,
    errors: pendingErrors.map(error => ({
      id: error.id,
      flightId: error.flightId,
      errorType: error.errorType,
      priority: error.priority,
      status: error.status,
      description: error.description,
      createdAt: error.createdAt,
      flight: error.flight,
    })),
  }
}

/**
 * Get the count of pending errors for a user
 * Used for quick checks without fetching full error details
 */
export async function getPendingErrorsCount(userId: string): Promise<number> {
  const pendingStatuses: FlightErrorStatus[] = [FlightErrorStatus.OPEN, FlightErrorStatus.IN_PROGRESS]

  return prisma.flightErrorReport.count({
    where: {
      assignedToId: userId,
      status: {
        in: pendingStatuses,
      },
    },
  })
}

/**
 * Find the user who last updated a flight
 * This user will be assigned errors reported on the flight
 */
export async function findLastFlightEditor(flightId: string): Promise<string | null> {
  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    select: { updatedByUserId: true, createdByUserId: true },
  })

  if (!flight) {
    return null
  }

  // Prefer the user who last updated the flight, fallback to creator
  return flight.updatedByUserId || flight.createdByUserId || null
}

/**
 * Routes that are NOT blocked - users can always access these
 * API routes for flights are allowed so users can fix errors from the error-review page
 */
export const UNBLOCKABLE_ROUTES = [
  '/error-review',
  '/api/flight-errors',
  '/api/user/blocking-status',
  '/api/auth',
  '/api/notifications',
  '/api/flights',
  '/api/airlines',
  '/api/aircraft-types',
  '/api/operation-types',
  '/api/flight-types',
  '/api/airports',
  '/api/delay-codes',
  '/_next',
  '/favicon.ico',
]

/**
 * Check if a route should bypass blocking
 */
export function isUnblockableRoute(pathname: string): boolean {
  return UNBLOCKABLE_ROUTES.some(route => pathname.startsWith(route))
}
