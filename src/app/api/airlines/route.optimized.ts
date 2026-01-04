import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAirlineSchema } from '@/lib/validators/airline';
import { z } from 'zod';

/**
 * OPTIMIZED Airlines API
 *
 * BEFORE:
 * - No pagination - returns ALL airlines
 * - Returns all fields
 *
 * AFTER:
 * - Pagination with page/limit
 * - Select only needed fields
 * - Parallel queries for count
 */

// GET /api/airlines - Lista svih airlines SA PAGINACIJOM
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    // ✅ DODATO: Paginacija parametri
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid pagination parameters. Page must be >= 1, limit between 1-100',
        },
        { status: 400 }
      );
    }

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { icaoCode: { contains: search, mode: 'insensitive' as const } },
            { iataCode: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : undefined;

    // ✅ OPTIMIZOVANO: Paralelni upiti za podatke i count
    const [airlines, total] = await Promise.all([
      prisma.airline.findMany({
        where,
        orderBy: {
          name: 'asc',
        },
        // ✅ DODATO: Select samo potrebna polja
        select: {
          id: true,
          name: true,
          icaoCode: true,
          iataCode: true,
          country: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              flights: true,
            },
          },
        },
        // ✅ DODATO: Paginacija
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.airline.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: airlines,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching airlines:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch airlines',
      },
      { status: 500 }
    );
  }
}

// POST /api/airlines - Kreiranje nove airline (VEĆ OK)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createAirlineSchema.parse(body);

    const airline = await prisma.airline.create({
      data: validatedData,
      // ✅ DODATO: Select samo potrebna polja u odgovoru
      select: {
        id: true,
        name: true,
        icaoCode: true,
        iataCode: true,
        country: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: airline,
        message: 'Aviokompanija uspješno kreirana',
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

    // Handle unique constraint violation
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'Aviokompanija sa ovim ICAO kodom već postoji',
        },
        { status: 400 }
      );
    }

    console.error('Error creating airline:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create airline',
      },
      { status: 500 }
    );
  }
}
