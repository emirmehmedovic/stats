import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';

// GET /api/access-control/users
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
    const unmappedOnly = searchParams.get('unmappedOnly') === 'true';

    let where: any = {
      deleted: false,
    };

    if (search) {
      where.OR = [
        { firstname: { contains: search, mode: 'insensitive' } },
        { lastname: { contains: search, mode: 'insensitive' } },
        { card: { contains: search, mode: 'insensitive' } },
        { externalUserId: isNaN(Number(search)) ? undefined : Number(search) },
      ].filter(condition => condition.externalUserId !== undefined || condition.firstname || condition.lastname || condition.card);
    }

    const users = await prisma.accessControlUser.findMany({
      where,
      orderBy: [
        { lastname: 'asc' },
        { firstname: 'asc' },
      ],
      take: 1000,
    });

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching AC users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
