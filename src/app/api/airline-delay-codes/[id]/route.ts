import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateAirlineDelayCodeSchema = z.object({
  isActive: z.boolean(),
});

/**
 * GET /api/airline-delay-codes/[id]
 * Vraća detalje pojedinačne veze
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    const airlineDelayCode = await prisma.airlineDelayCode.findUnique({
      where: { id },
      include: {
        airline: {
          select: {
            id: true,
            name: true,
            icaoCode: true,
            iataCode: true,
          },
        },
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

    if (!airlineDelayCode) {
      return NextResponse.json(
        {
          success: false,
          error: 'Veza nije pronađena',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: airlineDelayCode,
    });
  } catch (error) {
    console.error('Error fetching airline delay code:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch airline delay code',
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/airline-delay-codes/[id]
 * Ažurira status veze (isActive)
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const validated = updateAirlineDelayCodeSchema.parse(body);

    const airlineDelayCode = await prisma.airlineDelayCode.update({
      where: { id },
      data: validated,
      include: {
        airline: {
          select: {
            id: true,
            name: true,
            icaoCode: true,
            iataCode: true,
          },
        },
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
      data: airlineDelayCode,
      message: 'Status uspješno ažuriran',
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

    console.error('Error updating airline delay code:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update airline delay code',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/airline-delay-codes/[id]
 * Uklanja vezu između kompanije i delay koda
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    await prisma.airlineDelayCode.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Veza uspješno uklonjena',
    });
  } catch (error) {
    console.error('Error deleting airline delay code:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete airline delay code',
      },
      { status: 500 }
    );
  }
}
