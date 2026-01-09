import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all active routes (for custom report filter)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const airlineId = searchParams.get('airlineId');

    const where: any = {
      isActive: true,
    };

    if (airlineId) {
      where.airlineId = airlineId;
    }

    const routes = await prisma.airlineRoute.findMany({
      where,
      include: {
        airline: {
          select: {
            name: true,
            icaoCode: true,
          },
        },
      },
      orderBy: [
        { airline: { name: 'asc' } },
        { route: 'asc' },
      ],
    });

    return NextResponse.json({
      success: true,
      data: routes,
    });
  } catch (error) {
    console.error('Error fetching airline routes:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri učitavanju ruta' },
      { status: 500 }
    );
  }
}
