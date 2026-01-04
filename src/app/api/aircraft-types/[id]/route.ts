import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateAircraftTypeSchema } from '@/lib/validators/aircraft-type';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/aircraft-types/[id] - Pojedinačni aircraft type
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const aircraftType = await prisma.aircraftType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            flights: true,
          },
        },
      },
    });

    if (!aircraftType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tip aviona nije pronađen',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: aircraftType,
    });
  } catch (error) {
    console.error('Error fetching aircraft type:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch aircraft type',
      },
      { status: 500 }
    );
  }
}

// PUT /api/aircraft-types/[id] - Ažuriranje aircraft type
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const validatedData = updateAircraftTypeSchema.parse(body);

    const aircraftType = await prisma.aircraftType.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: aircraftType,
      message: 'Tip aviona uspješno ažuriran',
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

    console.error('Error updating aircraft type:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update aircraft type',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/aircraft-types/[id] - Brisanje aircraft type
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Provjeri da li ima povezanih letova
    const flightCount = await prisma.flight.count({
      where: { aircraftTypeId: id },
    });

    if (flightCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Ne možete obrisati tip aviona koji ima ${flightCount} povezanih letova`,
        },
        { status: 400 }
      );
    }

    await prisma.aircraftType.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Tip aviona uspješno obrisan',
    });
  } catch (error) {
    console.error('Error deleting aircraft type:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete aircraft type',
      },
      { status: 500 }
    );
  }
}
