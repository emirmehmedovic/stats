import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyAuth } from '@/lib/route-guards';
import { resolveFlightErrorSchema } from '@/lib/validators/flight-error';
import { notifyReporterOfResolution } from '@/lib/notifications';
import { FlightErrorStatus, FlightErrorType } from '@prisma/client';
import { z } from 'zod';

// POST /api/flight-errors/[id]/resolve - Označi grešku kao riješenu
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const { id } = await context.params;
    const body = await request.json();
    const validatedData = resolveFlightErrorSchema.parse(body);

    // Get the error report
    const errorReport = await prisma.flightErrorReport.findUnique({
      where: { id },
      include: {
        flight: {
          select: {
            id: true,
            route: true,
            arrivalFlightNumber: true,
            departureFlightNumber: true,
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
        },
      },
    });

    if (!errorReport) {
      return NextResponse.json(
        { success: false, error: 'Greška nije pronađena' },
        { status: 404 }
      );
    }

    // Only assignee can resolve
    if (errorReport.assignedToId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Samo dodijeljeni korisnik može riješiti grešku' },
        { status: 403 }
      );
    }

    // Check status
    const pendingStatuses: FlightErrorStatus[] = [FlightErrorStatus.OPEN, FlightErrorStatus.IN_PROGRESS];
    if (!pendingStatuses.includes(errorReport.status)) {
      return NextResponse.json(
        { success: false, error: 'Greška je već zatvorena ili riješena' },
        { status: 400 }
      );
    }

    // Capture current flight values as newValue
    const newValue = captureFlightValues(errorReport.flight, errorReport.errorType);

    // For NOT_VERIFIED errors, check that the flight has actually been verified
    if (errorReport.errorType === FlightErrorType.NOT_VERIFIED) {
      const currentFlight = await prisma.flight.findUnique({
        where: { id: errorReport.flightId },
        select: { isVerified: true },
      });

      if (!currentFlight?.isVerified) {
        return NextResponse.json(
          {
            success: false,
            error: 'Let mora biti verifikovan prije označavanja greške kao riješene. Molimo verifikujte let.'
          },
          { status: 400 }
        );
      }
    } else {
      // For other error types, verify that values have actually changed
      const oldValue = errorReport.oldValue as Record<string, unknown> | null;

      if (oldValue && !hasValuesChanged(oldValue, newValue)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Niste napravili nikakve izmjene na letu. Molimo ispravite podatke prije označavanja greške kao riješene.'
          },
          { status: 400 }
        );
      }
    }

    // Update error report
    const updatedError = await prisma.$transaction(async (tx) => {
      const updated = await tx.flightErrorReport.update({
        where: { id },
        data: {
          status: FlightErrorStatus.RESOLVED,
          newValue: newValue as object,
        },
        include: {
          flight: {
            select: {
              id: true,
              route: true,
              arrivalFlightNumber: true,
              departureFlightNumber: true,
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

      await tx.flightErrorHistory.create({
        data: {
          errorReportId: id,
          action: 'RESOLVED',
          fromStatus: errorReport.status,
          toStatus: FlightErrorStatus.RESOLVED,
          notes: validatedData.notes || 'Greška ispravljena',
          performedById: user.id,
        },
      });

      return updated;
    });

    // Notify reporter
    const flightInfo = `${errorReport.flight.route} (${errorReport.flight.departureFlightNumber || errorReport.flight.arrivalFlightNumber || 'N/A'})`;
    try {
      await notifyReporterOfResolution(
        errorReport.reportedById,
        errorReport.id,
        flightInfo,
        user.name || user.email
      );
    } catch (notifyError) {
      console.error('Failed to send notification:', notifyError);
    }

    return NextResponse.json({
      success: true,
      data: updatedError,
      message: 'Greška uspješno označena kao riješena',
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

    console.error('Error resolving flight error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to resolve flight error',
      },
      { status: 500 }
    );
  }
}

// Helper function to check if values have changed
function hasValuesChanged(oldValue: Record<string, unknown>, newValue: Record<string, unknown>): boolean {
  const keys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);

  for (const key of keys) {
    const oldVal = oldValue[key];
    const newVal = newValue[key];

    // Handle null/undefined comparisons
    if (oldVal === null || oldVal === undefined) {
      if (newVal !== null && newVal !== undefined) {
        return true; // Value was added
      }
    } else if (newVal === null || newVal === undefined) {
      return true; // Value was removed
    } else if (oldVal !== newVal) {
      return true; // Value was changed
    }
  }

  return false; // No changes detected
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
