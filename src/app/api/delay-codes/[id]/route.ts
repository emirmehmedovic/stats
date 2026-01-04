import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateDelayCodeSchema = z.object({
  code: z.string().min(1).toUpperCase().optional(),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
});

// GET /api/delay-codes/[id] - Pojedinačni delay kod
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const delayCode = await prisma.delayCode.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            delays: true,
          },
        },
      },
    });

    if (!delayCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Delay kod nije pronađen',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: delayCode,
    });
  } catch (error) {
    console.error('Error fetching delay code:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch delay code',
      },
      { status: 500 }
    );
  }
}

// PUT /api/delay-codes/[id] - Ažuriranje delay koda
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const validatedData = updateDelayCodeSchema.parse(body);

    const delayCode = await prisma.delayCode.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json({
      success: true,
      data: delayCode,
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

    // Handle unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Delay kod sa ovim kodom već postoji',
        },
        { status: 400 }
      );
    }

    console.error('Error updating delay code:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update delay code',
      },
      { status: 500 }
    );
  }
}

// DELETE /api/delay-codes/[id] - Brisanje delay koda
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    // Provjeri da li ima povezanih delay-a
    const delayCount = await prisma.flightDelay.count({
      where: { delayCodeId: id },
    });

    if (delayCount > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Ne možete obrisati delay kod koji ima ${delayCount} povezanih kašnjenja`,
        },
        { status: 400 }
      );
    }

    await prisma.delayCode.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Delay kod uspješno obrisan',
    });
  } catch (error) {
    console.error('Error deleting delay code:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete delay code',
      },
      { status: 500 }
    );
  }
}

