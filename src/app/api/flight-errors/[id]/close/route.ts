import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/route-guards';
import { closeFlightErrorSchema } from '@/lib/validators/flight-error';
import { FlightErrorStatus } from '@prisma/client';
import { z } from 'zod';

// POST /api/flight-errors/[id]/close - Admin zatvori grešku
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const { id } = await context.params;
    const body = await request.json();
    const validatedData = closeFlightErrorSchema.parse(body);

    // Get the error report
    const errorReport = await prisma.flightErrorReport.findUnique({
      where: { id },
    });

    if (!errorReport) {
      return NextResponse.json(
        { success: false, error: 'Greška nije pronađena' },
        { status: 404 }
      );
    }

    // Check status - can close any status except already closed
    if (errorReport.status === FlightErrorStatus.CLOSED) {
      return NextResponse.json(
        { success: false, error: 'Greška je već zatvorena' },
        { status: 400 }
      );
    }

    // Update error report
    const updatedError = await prisma.$transaction(async (tx) => {
      const updated = await tx.flightErrorReport.update({
        where: { id },
        data: {
          status: validatedData.newStatus,
          closedById: user.id,
          closedAt: new Date(),
          closedNotes: validatedData.closedNotes,
          isFalseReport: validatedData.isFalseReport || false,
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
          reportedBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          closedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      const historyNotes = validatedData.isFalseReport
        ? `Admin zatvorio kao LAŽNU PRIJAVU: ${validatedData.closedNotes || 'Prijava je bila neosnovana'}`
        : validatedData.closedNotes || `Admin zatvorio: ${validatedData.newStatus}`;

      await tx.flightErrorHistory.create({
        data: {
          errorReportId: id,
          action: validatedData.isFalseReport ? 'MARKED_FALSE_REPORT' : 'CLOSED',
          fromStatus: errorReport.status,
          toStatus: validatedData.newStatus,
          notes: historyNotes,
          performedById: user.id,
        },
      });

      return updated;
    });

    return NextResponse.json({
      success: true,
      data: updatedError,
      message: 'Greška uspješno zatvorena',
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

    console.error('Error closing flight error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to close flight error',
      },
      { status: 500 }
    );
  }
}
