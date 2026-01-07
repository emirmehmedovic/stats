import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateFlightSchema, type UpdateFlightInput } from '@/lib/validators/flight';
import { validateAllPassengerData } from '@/lib/validators/passenger-validation';
import { z } from 'zod';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';
import {
  dateOnlyToUtc,
  getDateStringInTimeZone,
  getTodayDateString,
  parseDateTimeInput,
  TIME_ZONE_SARAJEVO,
} from '@/lib/dates';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const getNormalizedDate = (dateStr: string) => dateOnlyToUtc(dateStr);

const hasUnverifiedPastDates = async (cutoffDate: Date) => {
  const pendingCount = await prisma.flight.count({
    where: {
      date: { lt: cutoffDate },
      isVerified: false,
    },
  });
  return pendingCount > 0;
};

// GET /api/flights/[id] - Pojedinačni let
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const flight = await prisma.flight.findUnique({
      where: { id },
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
          include: {
            delayCode: true,
          },
        },
      },
    });

    if (!flight) {
      return NextResponse.json(
        {
          success: false,
          error: 'Let nije pronađen',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: flight,
    });
  } catch (error) {
    console.error('Error fetching flight:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch flight',
      },
      { status: 500 }
    );
  }
}

// PUT /api/flights/[id] - Ažuriranje leta
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Check if flight is locked
    const existingFlight = await prisma.flight.findUnique({
      where: { id },
      select: { isLocked: true, isVerified: true, airlineId: true, date: true },
    });

    if (!existingFlight) {
      return NextResponse.json(
        {
          success: false,
          error: 'Let nije pronađen',
        },
        { status: 404 }
      );
    }

    if (existingFlight.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ne možete ažurirati zaključan let',
        },
        { status: 403 }
      );
    }
    if (existingFlight.isVerified) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ne možete ažurirati verifikovan let',
        },
        { status: 403 }
      );
    }

    const todayStr = getTodayDateString();
    const flightDateStr = getDateStringInTimeZone(existingFlight.date, TIME_ZONE_SARAJEVO);
    if (flightDateStr === todayStr) {
      const hasPending = await hasUnverifiedPastDates(getNormalizedDate(todayStr));
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

    const { delays, confirmLowLoadFactor, isVerified, ...flightData } = body;
    const normalizedFlightData = { ...flightData };
    const timeFields = [
      'arrivalScheduledTime',
      'arrivalActualTime',
      'departureScheduledTime',
      'departureActualTime',
      'departureDoorClosingTime',
    ];
    for (const field of timeFields) {
      if (field in normalizedFlightData) {
        normalizedFlightData[field] = parseDateTimeInput(
          normalizedFlightData[field]
        );
      }
    }
    const validatedData = updateFlightSchema.parse(normalizedFlightData) as UpdateFlightInput & {
      airlineId?: string;
      aircraftTypeId?: string;
      operationTypeId?: string;
      arrivalAirportId?: string | null;
      departureAirportId?: string | null;
    };
    const {
      airlineId,
      aircraftTypeId,
      operationTypeId,
      arrivalAirportId,
      departureAirportId,
      ...flightUpdate
    } = validatedData;
    if (flightUpdate.arrivalFerryIn) {
      flightUpdate.arrivalPassengers = null;
      flightUpdate.arrivalMalePassengers = null;
      flightUpdate.arrivalFemalePassengers = null;
      flightUpdate.arrivalChildren = null;
      flightUpdate.arrivalInfants = null;
    }
    if (flightUpdate.departureFerryOut) {
      flightUpdate.departurePassengers = null;
      flightUpdate.departureMalePassengers = null;
      flightUpdate.departureFemalePassengers = null;
      flightUpdate.departureChildren = null;
      flightUpdate.departureInfants = null;
    }

    // Validacija broja putnika
    const validation = validateAllPassengerData({
      arrivalPassengers: flightUpdate.arrivalPassengers,
      arrivalMalePassengers: flightUpdate.arrivalMalePassengers,
      arrivalFemalePassengers: flightUpdate.arrivalFemalePassengers,
      arrivalChildren: flightUpdate.arrivalChildren,
      arrivalFerryIn: flightUpdate.arrivalFerryIn,
      departurePassengers: flightUpdate.departurePassengers,
      departureMalePassengers: flightUpdate.departureMalePassengers,
      departureFemalePassengers: flightUpdate.departureFemalePassengers,
      departureChildren: flightUpdate.departureChildren,
      departureFerryOut: flightUpdate.departureFerryOut,
      availableSeats: flightUpdate.availableSeats,
    });

    // Ako ima grešaka, blokiraj request
    if (validation.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validacione greške',
          validationErrors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Ako ima upozorenja i nije confirmovano, vrati upozorenje
    if (validation.warnings.length > 0 && !confirmLowLoadFactor) {
      return NextResponse.json(
        {
          success: false,
          requiresConfirmation: true,
          warnings: validation.warnings,
        },
        { status: 400 }
      );
    }

    let verifiedByUserId: string | null = null;
    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookie(cookieHeader);
    if (token) {
      const decoded = await verifyToken(token);
      verifiedByUserId = decoded?.id || null;
    }

    const delaysPayload = Array.isArray(delays) ? delays : [];
    const delayCodeIds = delaysPayload
      .map((delay: any) => delay.delayCodeId)
      .filter((id: any) => typeof id === 'string' && id.trim().length > 0);

    if (delaysPayload.length !== delayCodeIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Odaberite validan delay kod za sva kašnjenja',
        },
        { status: 400 }
      );
    }

    if (delayCodeIds.length > 0) {
      const uniqueIds = [...new Set(delayCodeIds)];
      const existingCodes = await prisma.delayCode.findMany({
        where: { id: { in: uniqueIds } },
        select: { id: true },
      });
      const existingSet = new Set(existingCodes.map((c) => c.id));
      const missingCodes = uniqueIds.filter((id) => !existingSet.has(id));

      if (missingCodes.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Odabrani delay kod ne postoji',
            invalidDelayCodeIds: missingCodes,
          },
          { status: 400 }
        );
      }

      const flightAirlineId = airlineId || existingFlight.airlineId;
      if (flightAirlineId) {
        const allowedLinks = await prisma.airlineDelayCode.findMany({
          where: {
            airlineId: flightAirlineId,
            delayCodeId: { in: uniqueIds },
            isActive: true,
          },
          select: { delayCodeId: true },
        });
        const allowedSet = new Set(allowedLinks.map((l) => l.delayCodeId));
        const invalidForAirline = uniqueIds.filter((id) => !allowedSet.has(id));

        if (invalidForAirline.length > 0) {
          return NextResponse.json(
            {
              success: false,
              error: 'Delay kod nije povezan sa odabranom aviokompanijom',
              invalidDelayCodeIds: invalidForAirline,
            },
            { status: 400 }
          );
        }
      }
    }

    // Update flight
    const relationUpdates: Record<string, unknown> = {};
    if (airlineId) {
      relationUpdates.airline = { connect: { id: airlineId } };
    }
    if (aircraftTypeId) {
      relationUpdates.aircraftType = { connect: { id: aircraftTypeId } };
    }
    if (operationTypeId) {
      relationUpdates.operationType = { connect: { id: operationTypeId } };
    }
    if (arrivalAirportId !== undefined) {
      relationUpdates.arrivalAirport = arrivalAirportId
        ? { connect: { id: arrivalAirportId } }
        : { disconnect: true };
    }
    if (departureAirportId !== undefined) {
      relationUpdates.departureAirport = departureAirportId
        ? { connect: { id: departureAirportId } }
        : { disconnect: true };
    }

    const verificationUpdate =
      typeof isVerified === 'boolean'
        ? {
            isVerified,
            verifiedAt: isVerified ? new Date() : null,
            verifiedByUser: isVerified && verifiedByUserId
              ? { connect: { id: verifiedByUserId } }
              : { disconnect: true },
          }
        : {};

    const flight = await prisma.flight.update({
      where: { id },
      data: {
        ...flightUpdate,
        ...relationUpdates,
        ...verificationUpdate,
      },
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
      },
    });

    // Handle delays if provided
    if (Array.isArray(delays)) {
      // Delete existing delays
      await prisma.flightDelay.deleteMany({
        where: { flightId: id },
      });

      // Create new delays
      if (delaysPayload.length > 0) {
        await prisma.flightDelay.createMany({
          data: delaysPayload.map((delay: any) => ({
            flightId: id,
            phase: delay.phase,
            delayCodeId: delay.delayCodeId,
            minutes: delay.minutes || 0,
            isPrimary: delay.isPrimary !== undefined ? delay.isPrimary : true,
            comment: delay.comment || null,
            unofficialReason: delay.unofficialReason || null, // NOVO: Neoficijelni razlog
          })),
        });
      }
    }

    // Fetch updated flight with delays
    const updatedFlight = await prisma.flight.findUnique({
      where: { id },
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
          include: {
            delayCode: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedFlight || flight,
      message: 'Let uspješno ažuriran',
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

    console.error('Error updating flight:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update flight',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/flights/[id] - Brisanje leta (soft delete)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Check if flight is locked
    const flight = await prisma.flight.findUnique({
      where: { id },
      select: { isLocked: true },
    });

    if (!flight) {
      return NextResponse.json(
        {
          success: false,
          error: 'Let nije pronađen',
        },
        { status: 404 }
      );
    }

    if (flight.isLocked) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ne možete obrisati zaključan let',
        },
        { status: 403 }
      );
    }

    await prisma.flight.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Let uspješno obrisan',
    });
  } catch (error) {
    console.error('Error deleting flight:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete flight',
      },
      { status: 500 }
    );
  }
}
