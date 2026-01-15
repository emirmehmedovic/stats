import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireNonOperations } from '@/lib/route-guards';

// GET /api/services - Lista sluzbi po sektorima
export async function GET(request: Request) {
  try {
    const authCheck = await requireNonOperations(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const services = await prisma.service.findMany({
      include: {
        sector: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ success: true, data: services });
  } catch (error) {
    console.error('Services GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}
