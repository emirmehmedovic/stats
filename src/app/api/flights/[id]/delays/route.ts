import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { DelayPhase } from '@prisma/client';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const createDelaySchema = z.object({
  phase: z.nativeEnum(DelayPhase),
  delayCodeId: z.string().min(1, 'Delay kod je obavezan'),
  minutes: z.number().int().nonnegative().min(1, 'Minuti moraju biti veći od 0'),
  isPrimary: z.boolean().default(true),
  comment: z.string().optional().nullable(),
  unofficialReason: z.string().optional().nullable(),
});

/**
 * GET /api/flights/[id]/delays
 * Vraća sve delay kodove za određeni let
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id: flightId } = await context.params;

    // Provjeri da li let postoji
    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
      select: { id: true },
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

    const delays = await prisma.flightDelay.findMany({
      where: { flightId },
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
      orderBy: [{ phase: 'asc' }, { isPrimary: 'desc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({
      success: true,
      data: delays,
    });
  } catch (error) {
    console.error('Error fetching flight delays:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch flight delays',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/flights/[id]/delays
 * Dodaje novi delay kod za let
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: flightId } = await context.params;
    const body = await request.json();
    const validated = createDelaySchema.parse(body);

    // Provjeri da li let postoji
    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
      select: { id: true, isLocked: true },
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
          error: 'Ne možete dodati delay kod zaključanom letu',
        },
        { status: 403 }
      );
    }

    const delay = await prisma.flightDelay.create({
      data: {
        flightId,
        ...validated,
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

    return NextResponse.json(
      {
        success: true,
        data: delay,
        message: 'Delay kod uspješno dodat',
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

    console.error('Error creating flight delay:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create flight delay',
      },
      { status: 500 }
    );
  }
}
