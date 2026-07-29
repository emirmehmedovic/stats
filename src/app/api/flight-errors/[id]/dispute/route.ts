import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyAuth } from '@/lib/route-guards';
import { disputeFlightErrorSchema } from '@/lib/validators/flight-error';
import { notifyReporterOfDispute, notifyAdminsOfDisputedError } from '@/lib/notifications';
import { FlightErrorStatus } from '@prisma/client';
import { z } from 'zod';

// POST /api/flight-errors/[id]/dispute - Ospori grešku
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
    const validatedData = disputeFlightErrorSchema.parse(body);

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

    // Only assignee can dispute
    if (errorReport.assignedToId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Samo dodijeljeni korisnik može osporiti grešku' },
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

    // Update error report
    const updatedError = await prisma.$transaction(async (tx) => {
      const updated = await tx.flightErrorReport.update({
        where: { id },
        data: {
          status: FlightErrorStatus.DISPUTED,
          disputeReason: validatedData.disputeReason,
          disputedAt: new Date(),
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
          action: 'DISPUTED',
          fromStatus: errorReport.status,
          toStatus: FlightErrorStatus.DISPUTED,
          notes: validatedData.disputeReason,
          performedById: user.id,
        },
      });

      return updated;
    });

    // Notify reporter and admins
    const flightInfo = `${errorReport.flight.route} (${errorReport.flight.departureFlightNumber || errorReport.flight.arrivalFlightNumber || 'N/A'})`;
    const disputerName = user.name || user.email;

    try {
      await Promise.all([
        notifyReporterOfDispute(
          errorReport.reportedById,
          errorReport.id,
          flightInfo,
          validatedData.disputeReason
        ),
        notifyAdminsOfDisputedError(
          errorReport.id,
          flightInfo,
          disputerName,
          validatedData.disputeReason
        ),
      ]);
    } catch (notifyError) {
      console.error('Failed to send notifications:', notifyError);
    }

    return NextResponse.json({
      success: true,
      data: updatedError,
      message: 'Greška uspješno osporena',
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

    console.error('Error disputing flight error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to dispute flight error',
      },
      { status: 500 }
    );
  }
}
