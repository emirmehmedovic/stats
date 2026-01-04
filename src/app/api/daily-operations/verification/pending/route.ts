import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';
import {
  dateOnlyToUtc,
  getDateStringInTimeZone,
  getTodayDateString,
  TIME_ZONE_SARAJEVO,
} from '@/lib/dates';

const parseDateParam = (dateStr: string) => {
  const isValid = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  if (!isValid) return null;
  const parsed = dateOnlyToUtc(dateStr);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const requireAuth = async (request: NextRequest) => {
  const cookieHeader = request.headers.get('cookie');
  const token = getTokenFromCookie(cookieHeader);
  if (!token) {
    return { error: NextResponse.json({ success: false, error: 'Niste autentifikovani' }, { status: 401 }) };
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    return { error: NextResponse.json({ success: false, error: 'Niste autentifikovani' }, { status: 401 }) };
  }

  return { user: decoded };
};

// GET /api/daily-operations/verification/pending?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const dateParam = request.nextUrl.searchParams.get('date');
    const dateStr = dateParam || getTodayDateString();
    const normalizedDate = parseDateParam(dateStr);

    if (!normalizedDate) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const pendingFlights = await prisma.flight.groupBy({
      by: ['date'],
      where: {
        date: { lt: normalizedDate },
        isVerified: false,
      },
    });

    const dateStrings = Array.from(
      new Set(
        pendingFlights.map((item) => getDateStringInTimeZone(item.date, TIME_ZONE_SARAJEVO))
      )
    );
    if (dateStrings.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          allVerified: true,
          pendingDates: [],
          latestPendingDate: null,
        },
      });
    }

    const pendingDates = dateStrings.sort().reverse();
    const latestPendingDate = pendingDates.reduce<string | null>((acc, item) => {
      if (!acc) return item;
      return item > acc ? item : acc;
    }, null);

    return NextResponse.json({
      success: true,
      data: {
        allVerified: pendingDates.length === 0,
        pendingDates,
        latestPendingDate,
      },
    });
  } catch (error) {
    console.error('Error fetching pending verification status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch pending verification status' },
      { status: 500 }
    );
  }
}
