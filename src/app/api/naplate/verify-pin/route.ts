import { NextRequest, NextResponse } from 'next/server';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';
import { prisma } from '@/lib/prisma';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

const BILLING_PIN_COOKIE = 'billing-pin-token';
const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 10;

export async function POST(request: NextRequest) {
  try {
    // 1. Check if user is authenticated
    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookie(cookieHeader);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Niste prijavljeni' },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Nevažeća sesija' },
        { status: 401 }
      );
    }

    // 2. Check if user has ADMIN or NAPLATE role
    if (user.role !== 'ADMIN' && user.role !== 'NAPLATE') {
      return NextResponse.json(
        { success: false, error: 'Nemate dozvolu za pristup' },
        { status: 403 }
      );
    }

    const ip = getClientIp(request);
    const rate = rateLimit(`naplate-pin:${ip}`, { windowMs: 60_000, max: 10 });
    if (!rate.ok) {
      return NextResponse.json(
        { success: false, error: 'Previše pokušaja. Pokušajte ponovo kasnije.' },
        { status: 429 }
      );
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        billingPinHash: true,
        billingPinFailedAttempts: true,
        billingPinLockedUntil: true,
      },
    });

    if (!dbUser || !dbUser.isActive) {
      return NextResponse.json(
        { success: false, error: 'Niste prijavljeni' },
        { status: 401 }
      );
    }

    if (!dbUser.billingPinHash) {
      return NextResponse.json(
        { success: false, error: 'PIN nije postavljen za ovog korisnika' },
        { status: 400 }
      );
    }

    if (dbUser.billingPinLockedUntil && dbUser.billingPinLockedUntil > new Date()) {
      const remainingMs = dbUser.billingPinLockedUntil.getTime() - Date.now();
      const remainingMinutes = Math.ceil(remainingMs / 60000);
      return NextResponse.json(
        {
          success: false,
          error: `Previše neuspješnih pokušaja. Pokušajte ponovo za ${remainingMinutes} minuta.`,
          rateLimited: true,
          remainingMinutes,
        },
        { status: 429 }
      );
    }

    // 3. Get PIN from request
    const body = await request.json();
    const { pin } = body;

    if (!pin) {
      return NextResponse.json(
        { success: false, error: 'PIN je obavezan' },
        { status: 400 }
      );
    }
    if (!/^\d{4,6}$/.test(String(pin))) {
      return NextResponse.json(
        { success: false, error: 'PIN mora imati 4-6 cifara' },
        { status: 400 }
      );
    }

    // 4. Verify PIN
    const isValid = await bcrypt.compare(String(pin), dbUser.billingPinHash);
    if (isValid) {
      const secretValue = process.env.JWT_SECRET || 'dev-secret-change-me';
      const secret = new TextEncoder().encode(secretValue);
      const token = await new SignJWT({ type: 'billing-pin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(dbUser.id)
        .setIssuedAt()
        .sign(secret);

      await prisma.user.update({
        where: { id: dbUser.id },
        data: {
          billingPinFailedAttempts: 0,
          billingPinLockedUntil: null,
        },
      });

      const response = NextResponse.json({ success: true });
      response.cookies.set(BILLING_PIN_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
      return response;
    }

    const failedAttempts = (dbUser.billingPinFailedAttempts || 0) + 1;
    const lockout =
      failedAttempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60000) : null;

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        billingPinFailedAttempts: failedAttempts,
        billingPinLockedUntil: lockout,
      },
    });

    console.warn(`Failed PIN attempt by user ${dbUser.email} (${dbUser.role})`);
    return NextResponse.json(
      {
        success: false,
        error: lockout
          ? `Previše neuspješnih pokušaja. Pokušajte ponovo za ${LOCKOUT_MINUTES} minuta.`
          : 'Neispravan PIN',
      },
      { status: lockout ? 429 : 401 }
    );
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri verifikaciji PIN-a' },
      { status: 500 }
    );
  }
}
