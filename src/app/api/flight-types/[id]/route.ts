import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateFlightTypeSchema } from '@/lib/validators/flight-type';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/flight-types/[id] - Pojedinačni tip leta
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const flightType = await prisma.flightType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            flights: true,
          },
        },
      },
    });

    if (!flightType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tip leta nije pronađen',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: flightType,
    });
  } catch (error) {
    console.error('Error fetching flight type:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch flight type',
      },
      { status: 500 }
    );
  }
}

// PUT /api/flight-types/[id] - Ažuriranje tipa leta
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const validatedData = updateFlightTypeSchema.parse(body);

    const flightType = await prisma.flightType.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: flightType,
      message: 'Tip leta uspješno ažuriran',
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

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Tip leta sa ovim kodom već postoji',
        },
        { status: 400 }
      );
    }

    console.error('Error updating flight type:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update flight type',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/flight-types/[id] - Brisanje tipa leta
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const flightCount = await prisma.flight.count({
      where: { flightTypeId: id },
    });

    if (flightCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Ne možete obrisati tip leta koji ima ${flightCount} povezanih letova`,
        },
        { status: 400 }
      );
    }

    await prisma.flightType.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Tip leta uspješno obrisan',
    });
  } catch (error) {
    console.error('Error deleting flight type:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete flight type',
      },
      { status: 500 }
    );
  }
}
