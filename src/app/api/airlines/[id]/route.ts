import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { updateAirlineSchema } from '@/lib/validators/airline';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/airlines/[id] - Pojedinačna airline
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const airline = await prisma.airline.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            flights: true,
          },
        },
      },
    });

    if (!airline) {
      return NextResponse.json(
        {
          success: false,
          error: 'Aviokompanija nije pronađena',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: airline,
    });
  } catch (error) {
    console.error('Error fetching airline:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch airline',
      },
      { status: 500 }
    );
  }
}

// PUT /api/airlines/[id] - Ažuriranje airline
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const validatedData = updateAirlineSchema.parse(body);

    const airline = await prisma.airline.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: airline,
      message: 'Aviokompanija uspješno ažurirana',
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

    console.error('Error updating airline:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update airline',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/airlines/[id] - Brisanje airline
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Provjeri da li ima povezanih letova
    const flightCount = await prisma.flight.count({
      where: { airlineId: id },
    });

    if (flightCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Ne možete obrisati aviokompaniju koja ima ${flightCount} povezanih letova`,
        },
        { status: 400 }
      );
    }

    await prisma.airline.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Aviokompanija uspješno obrisana',
    });
  } catch (error) {
    console.error('Error deleting airline:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete airline',
      },
      { status: 500 }
    );
  }
}
