import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createAirlineDelayCodeSchema = z.object({
  airlineId: z.string().min(1, 'Aviokompanija je obavezna'),
  delayCodeId: z.string().min(1, 'Delay kod je obavezan'),
  isActive: z.boolean().default(true),
});

const getAirlineDelayCodesQuerySchema = z.object({
  airlineId: z.string().optional(),
  delayCodeId: z.string().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === 'true' ? true : val === 'false' ? false : undefined)),
});

/**
 * GET /api/airline-delay-codes
 * Vraća delay kodove za određenu kompaniju ili sve veze
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = {
      airlineId: searchParams.get('airlineId') || undefined,
      delayCodeId: searchParams.get('delayCodeId') || undefined,
      isActive: searchParams.get('isActive') || undefined,
    };

    const validated = getAirlineDelayCodesQuerySchema.parse(queryParams);

    const where: any = {};
    if (validated.airlineId) where.airlineId = validated.airlineId;
    if (validated.delayCodeId) where.delayCodeId = validated.delayCodeId;
    if (validated.isActive !== undefined) where.isActive = validated.isActive;

    const airlineDelayCodes = await prisma.airlineDelayCode.findMany({
      where,
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
      orderBy: [{ airline: { name: 'asc' } }, { delayCode: { code: 'asc' } }],
    });

    return NextResponse.json({
      success: true,
      data: airlineDelayCodes,
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

    console.error('Error fetching airline delay codes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch airline delay codes',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/airline-delay-codes
 * Povezuje delay kod sa kompanijom
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createAirlineDelayCodeSchema.parse(body);

    // Provjeri da li veza već postoji
    const existing = await prisma.airlineDelayCode.findUnique({
      where: {
        airlineId_delayCodeId: {
          airlineId: validated.airlineId,
          delayCodeId: validated.delayCodeId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ova veza između kompanije i delay koda već postoji',
        },
        { status: 409 }
      );
    }

    const airlineDelayCode = await prisma.airlineDelayCode.create({
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

    return NextResponse.json(
      {
        success: true,
        data: airlineDelayCode,
        message: 'Delay kod uspješno povezan sa kompanijom',
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

    console.error('Error creating airline delay code:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create airline delay code',
      },
      { status: 500 }
    );
  }
}
