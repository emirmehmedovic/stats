import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';
import { dateOnlyToUtc } from '@/lib/dates';

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

// GET /api/daily-operations/verification?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const dateParam = request.nextUrl.searchParams.get('date');
    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const normalizedDate = parseDateParam(dateParam);
    if (!normalizedDate) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const verification = await prisma.dailyOperationsVerification.findUnique({
      where: { date: normalizedDate },
      include: {
        verifiedByUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        date: dateParam,
        verified: verification?.verified || false,
        verifiedAt: verification?.verifiedAt || null,
        verifiedByUser: verification?.verifiedByUser || null,
      },
    });
  } catch (error) {
    console.error('Error fetching daily verification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch verification status' },
      { status: 500 }
    );
  }
}

// POST /api/daily-operations/verification
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireAuth(request);
    if ('error' in authCheck) return authCheck.error;

    const body = await request.json();
    const dateParam = body?.date;
    const verified = Boolean(body?.verified);

    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: 'Date is required' },
        { status: 400 }
      );
    }

    const normalizedDate = parseDateParam(dateParam);
    if (!normalizedDate) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    const now = new Date();
    const verification = await prisma.dailyOperationsVerification.upsert({
      where: { date: normalizedDate },
      update: {
        verified,
        verifiedAt: verified ? now : null,
        verifiedByUserId: verified ? authCheck.user.id : null,
      },
      create: {
        date: normalizedDate,
        verified,
        verifiedAt: verified ? now : null,
        verifiedByUserId: verified ? authCheck.user.id : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        date: dateParam,
        verified: verification.verified,
        verifiedAt: verification.verifiedAt,
        verifiedByUserId: verification.verifiedByUserId,
      },
    });
  } catch (error) {
    console.error('Error updating daily verification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update verification status' },
      { status: 500 }
    );
  }
}
