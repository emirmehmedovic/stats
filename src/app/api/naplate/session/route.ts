import { NextRequest, NextResponse } from 'next/server';
import { getCookieValue, getTokenFromCookie, verifyBillingPinToken, verifyToken } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';

const BILLING_PIN_COOKIE = 'billing-pin-token';

export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookie(cookieHeader);
    if (!token) {
      return NextResponse.json({ authorized: false }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'NAPLATE')) {
      return NextResponse.json({ authorized: false }, { status: 403 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, isActive: true },
    });
    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json({ authorized: false }, { status: 401 });
    }

    const billingToken = getCookieValue(cookieHeader, BILLING_PIN_COOKIE);
    if (!billingToken) {
      return NextResponse.json({ authorized: false }, { status: 401 });
    }

    const billingSession = await verifyBillingPinToken(billingToken);
    if (!billingSession || billingSession.userId !== dbUser.id) {
      return NextResponse.json({ authorized: false }, { status: 401 });
    }

    return NextResponse.json({ authorized: true });
  } catch (error) {
    console.error('Billing session check error:', error);
    return NextResponse.json({ authorized: false }, { status: 500 });
  }
}
