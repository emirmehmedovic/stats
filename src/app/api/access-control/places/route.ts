import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';

// GET /api/access-control/places
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookie(request.headers.get('cookie'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');

    const where: any = {};
    if (search) {
      where.OR = [
        { placeName: { contains: search, mode: 'insensitive' } },
        { externalPlaceId: isNaN(Number(search)) ? undefined : Number(search) },
      ].filter(condition => condition.externalPlaceId !== undefined || condition.placeName);
    }

    const places = await prisma.accessControlPlace.findMany({
      where,
      orderBy: [
        { placeName: 'asc' },
      ],
      take: 1000,
    });

    return NextResponse.json({ success: true, data: places });
  } catch (error) {
    console.error('Error fetching AC places:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch places' },
      { status: 500 }
    );
  }
}
