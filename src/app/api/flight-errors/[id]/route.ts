import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyAuth } from '@/lib/route-guards';
import { FlightErrorStatus } from '@prisma/client';

// GET /api/flight-errors/[id] - Detalji greške
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const { id } = await context.params;

    const errorReport = await prisma.flightErrorReport.findUnique({
      where: { id },
      include: {
        flight: {
          select: {
            id: true,
            date: true,
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
              },
            },
            operationType: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
            flightType: {
              select: {
                id: true,
                name: true,
                code: true,
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
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileType: true,
            fileSize: true,
            uploadedAt: true,
            uploadedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            uploadedAt: 'desc',
          },
        },
        history: {
          select: {
            id: true,
            action: true,
            fromStatus: true,
            toStatus: true,
            notes: true,
            createdAt: true,
            performedBy: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
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

    // Check access - assignee can see their errors, admin can see all, operations can see all
    const isAdminOrOps = user.role === 'ADMIN' || user.role === 'OPERATIONS';
    const isAssignee = errorReport.assignedToId === user.id;

    if (!isAdminOrOps && !isAssignee) {
      return NextResponse.json(
        { success: false, error: 'Nemate pristup ovoj grešci' },
        { status: 403 }
      );
    }

    // Mark as IN_PROGRESS if assignee is viewing for the first time
    if (isAssignee && errorReport.status === FlightErrorStatus.OPEN) {
      await prisma.$transaction([
        prisma.flightErrorReport.update({
          where: { id },
          data: { status: FlightErrorStatus.IN_PROGRESS },
        }),
        prisma.flightErrorHistory.create({
          data: {
            errorReportId: id,
            action: 'STATUS_CHANGED',
            fromStatus: FlightErrorStatus.OPEN,
            toStatus: FlightErrorStatus.IN_PROGRESS,
            notes: 'Korisnik je pregledao grešku',
            performedById: user.id,
          },
        }),
      ]);
      errorReport.status = FlightErrorStatus.IN_PROGRESS;
    }

    // Remove reporter info if user is assignee and not admin
    let responseData: typeof errorReport & {
      reportedBy?: typeof errorReport.reportedBy | undefined;
      reportedById?: string | undefined;
    } = { ...errorReport };

    if (isAssignee && user.role !== 'ADMIN') {
      const { reportedBy, reportedById, ...rest } = responseData;
      responseData = rest as typeof responseData;
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error('Error fetching flight error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch flight error',
      },
      { status: 500 }
    );
  }
}
