import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/airlines/[id] - Get single airline
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const airline = await prisma.airline.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        icaoCode: true,
        iataCode: true,
        country: true,
        address: true,
        logoUrl: true,
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
