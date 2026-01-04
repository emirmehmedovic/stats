import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { DelayPhase } from '@prisma/client';

type RouteContext = {
  params: Promise<{ id: string; delayId: string }>;
};

const updateDelaySchema = z.object({
  phase: z.nativeEnum(DelayPhase).optional(),
  delayCodeId: z.string().optional(),
  minutes: z.number().int().nonnegative().min(1).optional(),
  isPrimary: z.boolean().optional(),
  comment: z.string().optional().nullable(),
  unofficialReason: z.string().optional().nullable(),
});

/**
 * GET /api/flights/[id]/delays/[delayId]
 * Vraća detalje pojedinačnog delay-a
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: flightId, delayId } = await context.params;

    const delay = await prisma.flightDelay.findFirst({
      where: {
        id: delayId,
        flightId: flightId,
      },
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
    });

    if (!delay) {
      return NextResponse.json(
        {
          success: false,
          error: 'Delay nije pronađen',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: delay,
    });
  } catch (error) {
    console.error('Error fetching delay:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch delay',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/flights/[id]/delays/[delayId]
 * Ažurira postojeći delay
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id: flightId, delayId } = await context.params;
    const body = await request.json();
    const validated = updateDelaySchema.parse(body);

    // Provjeri da li let postoji i nije zaključan
    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
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
          error: 'Ne možete ažurirati delay kod zaključanom letu',
        },
        { status: 403 }
      );
    }

    const delay = await prisma.flightDelay.update({
      where: {
        id: delayId,
        flightId: flightId,
      },
      data: validated,
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
    });

    return NextResponse.json({
      success: true,
      data: delay,
      message: 'Delay kod uspješno ažuriran',
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

    console.error('Error updating delay:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update delay',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/flights/[id]/delays/[delayId]
 * Briše delay
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id: flightId, delayId } = await context.params;

    // Provjeri da li let postoji i nije zaključan
    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
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
          error: 'Ne možete obrisati delay kod zaključanom letu',
        },
        { status: 403 }
      );
    }

    await prisma.flightDelay.delete({
      where: {
        id: delayId,
        flightId: flightId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Delay kod uspješno obrisan',
    });
  } catch (error) {
    console.error('Error deleting delay:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete delay',
      },
      { status: 500 }
    );
  }
}
