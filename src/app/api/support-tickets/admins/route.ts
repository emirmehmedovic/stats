import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/route-guards';

// GET /api/support-tickets/admins - Lista admin korisnika za dodjelu tiketa
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if ('error' in authResult) return authResult.error;

    const admins = await prisma.user.findMany({
      where: {
        role: 'ADMIN',
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: admins,
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch admins',
      },
      { status: 500 }
    );
  }
}
