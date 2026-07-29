import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFlightErrorSchema, getFlightErrorsQuerySchema } from '@/lib/validators/flight-error';
import { requireAdminOrOperations, requireAnyAuth } from '@/lib/route-guards';
import { notifyUserOfAssignedError } from '@/lib/notifications';
import { findLastFlightEditor } from '@/lib/blocking';
import { z } from 'zod';
import { Prisma, FlightErrorStatus, FlightErrorType } from '@prisma/client';

// GET /api/flight-errors - Lista grešaka
// ADMIN/OPERATIONS mogu vidjeti sve, ostali samo svoje assignirane
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const searchParams = request.nextUrl.searchParams;
    const queryParams: Record<string, string | undefined> = {
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') || undefined,
      errorType: searchParams.get('errorType') || undefined,
      priority: searchParams.get('priority') || undefined,
      assignedToId: searchParams.get('assignedToId') || undefined,
      reportedById: searchParams.get('reportedById') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
    };

    const validatedQuery = getFlightErrorsQuerySchema.parse(queryParams);
    const { page, limit, search, status, errorType, priority, assignedToId, reportedById, dateFrom, dateTo } = validatedQuery;

    // Build where clause
    const isAdminOrOps = user.role === 'ADMIN' || user.role === 'OPERATIONS';

    const where: Prisma.FlightErrorReportWhereInput = {
      AND: [
        // Non-admin/operations can only see errors assigned to them
        !isAdminOrOps ? { assignedToId: user.id } : {},
        // Filters
        status ? { status } : {},
        errorType ? { errorType } : {},
        priority ? { priority } : {},
        assignedToId && isAdminOrOps ? { assignedToId } : {},
        reportedById && user.role === 'ADMIN' ? { reportedById } : {},
        // Date range filter
        dateFrom ? { createdAt: { gte: new Date(dateFrom) } } : {},
        dateTo ? { createdAt: { lte: new Date(dateTo + 'T23:59:59.999Z') } } : {},
        // Search
        search
          ? {
              OR: [
                { description: { contains: search, mode: 'insensitive' } },
                { flight: { route: { contains: search, mode: 'insensitive' } } },
                { flight: { arrivalFlightNumber: { contains: search, mode: 'insensitive' } } },
                { flight: { departureFlightNumber: { contains: search, mode: 'insensitive' } } },
              ],
            }
          : {},
      ],
    };

    // Get total count
    const total = await prisma.flightErrorReport.count({ where });

    // Get paginated errors
    const errors = await prisma.flightErrorReport.findMany({
      where,
      include: {
        flight: {
          select: {
            id: true,
            date: true,
            route: true,
            arrivalFlightNumber: true,
            departureFlightNumber: true,
            airline: {
              select: {
                id: true,
                name: true,
                icaoCode: true,
              },
            },
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        // Only include reporter info for admins
        ...(user.role === 'ADMIN'
          ? {
              reportedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            }
          : {}),
        closedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            attachments: true,
            history: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // OPEN first
        { priority: 'desc' }, // URGENT first
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    });

    // Remove reporter info from non-admin responses
    const sanitizedErrors = errors.map(error => {
      if (user.role !== 'ADMIN') {
        const { reportedById, ...rest } = error as typeof error & { reportedById: string };
        return rest;
      }
      return error;
    });

    return NextResponse.json({
      success: true,
      data: sanitizedErrors,
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

    console.error('Error fetching flight errors:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch flight errors',
      },
      { status: 500 }
    );
  }
}

// POST /api/flight-errors - Prijavi novu grešku
// Samo ADMIN/OPERATIONS mogu prijavljivati greške
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdminOrOperations(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const body = await request.json();
    const validatedData = createFlightErrorSchema.parse(body);

    // Verify flight exists and get current values for oldValue
    const flight = await prisma.flight.findUnique({
      where: { id: validatedData.flightId },
      select: {
        id: true,
        route: true,
        date: true,
        arrivalFlightNumber: true,
        departureFlightNumber: true,
        updatedByUserId: true,
        createdByUserId: true,
        // For capturing oldValue
        arrivalPassengers: true,
        departurePassengers: true,
        arrivalMalePassengers: true,
        arrivalFemalePassengers: true,
        arrivalChildren: true,
        arrivalInfants: true,
        departureMalePassengers: true,
        departureFemalePassengers: true,
        departureChildren: true,
        departureInfants: true,
        aircraftTypeId: true,
        operationTypeId: true,
        flightTypeId: true,
      },
    });

    if (!flight) {
      return NextResponse.json(
        { success: false, error: 'Let nije pronađen' },
        { status: 404 }
      );
    }

    // Find the user who last edited this flight
    const assigneeId = await findLastFlightEditor(validatedData.flightId);

    if (!assigneeId) {
      return NextResponse.json(
        { success: false, error: 'Nije moguće odrediti korisnika za dodjelu greške. Let nema zapisanog korisnika.' },
        { status: 400 }
      );
    }

    // Cannot assign error to yourself
    if (assigneeId === user.id) {
      return NextResponse.json(
        { success: false, error: 'Ne možete prijaviti grešku na letu koji ste sami zadnji uredili.' },
        { status: 400 }
      );
    }

    // Capture old values based on error type
    const oldValue = captureFlightValues(flight, validatedData.errorType);

    // Create the error report and unverify the flight in a transaction
    const errorReport = await prisma.$transaction(async (tx) => {
      // Unverify the flight so the assignee can edit it
      await tx.flight.update({
        where: { id: validatedData.flightId },
        data: {
          isVerified: false,
          verifiedByUserId: null,
        },
      });

      // Create the error report
      return tx.flightErrorReport.create({
        data: {
          flightId: validatedData.flightId,
          errorType: validatedData.errorType,
          priority: validatedData.priority,
          description: validatedData.description,
          reportedById: user.id,
          assignedToId: assigneeId,
          status: FlightErrorStatus.OPEN,
          oldValue: oldValue as object,
        },
        include: {
          flight: {
            select: {
              id: true,
              date: true,
              route: true,
              arrivalFlightNumber: true,
              departureFlightNumber: true,
              airline: {
                select: {
                  name: true,
                  icaoCode: true,
                },
              },
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
    });

    // Create history entry
    await prisma.flightErrorHistory.create({
      data: {
        errorReportId: errorReport.id,
        action: 'CREATED',
        toStatus: FlightErrorStatus.OPEN,
        notes: `Greška prijavljena: ${validatedData.description.substring(0, 100)}`,
        performedById: user.id,
      },
    });

    // Notify the assignee
    const flightInfo = `${flight.route} (${flight.departureFlightNumber || flight.arrivalFlightNumber || 'N/A'})`;
    try {
      await notifyUserOfAssignedError(
        assigneeId,
        errorReport.id,
        flightInfo,
        validatedData.errorType,
        validatedData.priority
      );
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError);
    }

    return NextResponse.json(
      {
        success: true,
        data: errorReport,
        message: 'Greška uspješno prijavljena',
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

    console.error('Error creating flight error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create flight error',
      },
      { status: 500 }
    );
  }
}

// Helper function to capture flight values based on error type
function captureFlightValues(flight: Record<string, unknown>, errorType: FlightErrorType): Record<string, unknown> {
  switch (errorType) {
    case FlightErrorType.DEPARTURE_PASSENGERS:
      return {
        departurePassengers: flight.departurePassengers,
        departureMalePassengers: flight.departureMalePassengers,
        departureFemalePassengers: flight.departureFemalePassengers,
        departureChildren: flight.departureChildren,
        departureInfants: flight.departureInfants,
      };
    case FlightErrorType.ARRIVAL_PASSENGERS:
      return {
        arrivalPassengers: flight.arrivalPassengers,
        arrivalMalePassengers: flight.arrivalMalePassengers,
        arrivalFemalePassengers: flight.arrivalFemalePassengers,
        arrivalChildren: flight.arrivalChildren,
        arrivalInfants: flight.arrivalInfants,
      };
    case FlightErrorType.AIRCRAFT_TYPE:
      return {
        aircraftTypeId: flight.aircraftTypeId,
      };
    case FlightErrorType.OPERATION_TYPE:
      return {
        operationTypeId: flight.operationTypeId,
      };
    case FlightErrorType.FLIGHT_TYPE:
      return {
        flightTypeId: flight.flightTypeId,
      };
    case FlightErrorType.GENERAL:
    default:
      return {
        departurePassengers: flight.departurePassengers,
        arrivalPassengers: flight.arrivalPassengers,
        aircraftTypeId: flight.aircraftTypeId,
        operationTypeId: flight.operationTypeId,
        flightTypeId: flight.flightTypeId,
      };
  }
}
