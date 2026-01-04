import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';
import { dateOnlyToUtc, getTodayDateString } from '@/lib/dates';

const requireAdmin = async (request: NextRequest) => {
  const cookieHeader = request.headers.get('cookie');
  const token = getTokenFromCookie(cookieHeader);
  if (!token) {
    return { error: NextResponse.json({ success: false, error: 'Niste autentifikovani' }, { status: 401 }) };
  }

  const decoded = await verifyToken(token);
  if (!decoded || decoded.role !== 'ADMIN') {
    return { error: NextResponse.json({ success: false, error: 'Nemate dozvolu za pristup' }, { status: 403 }) };
  }

  return { user: decoded };
};

// POST /api/daily-operations/verification/bulk
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAdmin(request);
    if ('error' in authCheck) return authCheck.error;

    const todayStr = getTodayDateString();
    const todayStart = dateOnlyToUtc(todayStr);

    const flightsToVerify = await prisma.flight.findMany({
      where: {
        date: { lt: todayStart },
        isVerified: false,
      },
      select: { id: true, date: true },
    });

    if (flightsToVerify.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          totalFlights: 0,
          verifiedFlights: 0,
        },
      });
    }

    const now = new Date();
    const updateResult = await prisma.flight.updateMany({
      where: {
        id: { in: flightsToVerify.map((flight) => flight.id) },
      },
      data: {
        isVerified: true,
        verifiedAt: now,
      },
    });

    const flightIds = flightsToVerify.map((flight) => flight.id);
    await prisma.$executeRaw(
      Prisma.sql`UPDATE "Flight"
        SET "verifiedByUserId" = ${authCheck.user.id}
        WHERE "id" IN (${Prisma.join(flightIds)})`
    );

    return NextResponse.json({
      success: true,
      data: {
        totalFlights: flightsToVerify.length,
        verifiedFlights: updateResult.count,
      },
    });
  } catch (error) {
    console.error('Error bulk verifying daily operations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to bulk verify daily operations' },
      { status: 500 }
    );
  }
}
