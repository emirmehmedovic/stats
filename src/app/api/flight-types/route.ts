import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createFlightTypeSchema } from '@/lib/validators/flight-type';
import { z } from 'zod';

// GET /api/flight-types - Lista svih tipova leta SA PAGINACIJOM
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid pagination parameters. Page must be >= 1, limit between 1-100',
        },
        { status: 400 }
      );
    }

    const where: any = {
      AND: [
        activeOnly ? { isActive: true } : {},
        search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { code: { contains: search, mode: 'insensitive' as const } },
                { description: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {},
      ],
    };

    const [flightTypes, total] = await Promise.all([
      prisma.flightType.findMany({
        where,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          code: true,
          name: true,
          description: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              flights: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.flightType.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: flightTypes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching flight types:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch flight types',
      },
      { status: 500 }
    );
  }
}

// POST /api/flight-types - Kreiranje novog tipa leta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createFlightTypeSchema.parse(body);

    const flightType = await prisma.flightType.create({
      data: validatedData,
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: flightType,
        message: 'Tip leta uspješno kreiran',
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

    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Tip leta sa ovim kodom već postoji',
        },
        { status: 400 }
      );
    }

    console.error('Error creating flight type:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create flight type',
      },
      { status: 500 }
    );
  }
}
