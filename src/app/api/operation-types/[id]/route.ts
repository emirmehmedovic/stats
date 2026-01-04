import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateOperationTypeSchema = z.object({
  code: z.string().min(1).toUpperCase().optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

// GET /api/operation-types/[id] - Pojedinačni tip operacije
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const operationType = await prisma.operationType.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            flights: true,
          },
        },
      },
    });

    if (!operationType) {
      return NextResponse.json(
        {
          success: false,
          error: 'Tip operacije nije pronađen',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: operationType,
    });
  } catch (error) {
    console.error('Error fetching operation type:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch operation type',
      },
      { status: 500 }
    );
  }
}

// PUT /api/operation-types/[id] - Ažuriranje tipa operacije
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const validatedData = updateOperationTypeSchema.parse(body);

    const operationType = await prisma.operationType.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: operationType,
      message: 'Tip operacije uspješno ažuriran',
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

    // Handle unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Tip operacije sa ovim kodom već postoji',
        },
        { status: 400 }
      );
    }

    console.error('Error updating operation type:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update operation type',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/operation-types/[id] - Brisanje tipa operacije
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Provjeri da li ima povezanih letova
    const flightCount = await prisma.flight.count({
      where: { operationTypeId: id },
    });

    if (flightCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Ne možete obrisati tip operacije koji ima ${flightCount} povezanih letova`,
        },
        { status: 400 }
      );
    }

    await prisma.operationType.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Tip operacije uspješno obrisan',
    });
  } catch (error) {
    console.error('Error deleting operation type:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete operation type',
      },
      { status: 500 }
    );
  }
}

