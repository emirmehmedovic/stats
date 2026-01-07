import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { logAudit } from '@/lib/audit';

const MAX_ATTEMPTS = 5;
const COOLDOWN_MINUTES = 15;

// Helper function to get IP address from request
function getIpAddress(request: NextRequest): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  return forwarded?.split(',')[0] || realIp || null;
}

// Check if email is rate limited
async function checkRateLimit(email: string, ipAddress: string | null): Promise<{ 
  isLimited: boolean; 
  remainingMinutes?: number;
  attempts?: number;
}> {
  const fifteenMinutesAgo = new Date(Date.now() - COOLDOWN_MINUTES * 60 * 1000);

  // Count failed attempts in the last 15 minutes
  const failedAttempts = await prisma.loginAttempt.count({
    where: {
      email: email.toLowerCase(),
      success: false,
      createdAt: {
        gte: fifteenMinutesAgo,
      },
    },
  });

  if (failedAttempts >= MAX_ATTEMPTS) {
    // Find the oldest failed attempt to calculate remaining time
    const oldestAttempt = await prisma.loginAttempt.findFirst({
      where: {
        email: email.toLowerCase(),
        success: false,
        createdAt: {
          gte: fifteenMinutesAgo,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (oldestAttempt) {
      const timeElapsed = Date.now() - oldestAttempt.createdAt.getTime();
      const remainingMs = COOLDOWN_MINUTES * 60 * 1000 - timeElapsed;
      const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
      
      return {
        isLimited: true,
        remainingMinutes: Math.max(0, remainingMinutes),
        attempts: failedAttempts,
      };
    }
  }

  return {
    isLimited: false,
    attempts: failedAttempts,
  };
}

// Record login attempt
async function recordLoginAttempt(
  email: string,
  ipAddress: string | null,
  success: boolean
): Promise<void> {
  await prisma.loginAttempt.create({
    data: {
      email: email.toLowerCase(),
      ipAddress,
      success,
    },
  });

  // Clean up old attempts (older than 24 hours) to keep database clean
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await prisma.loginAttempt.deleteMany({
    where: {
      createdAt: {
        lt: oneDayAgo,
      },
    },
  });
}

// Clear successful login attempts for email
async function clearLoginAttempts(email: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({
    where: {
      email: email.toLowerCase(),
      success: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const rateIp = getClientIp(request);
    const rate = rateLimit(`login:${rateIp}`, { windowMs: 60_000, max: 10 });
    if (!rate.ok) {
      return NextResponse.json(
        { error: 'Previše pokušaja. Pokušajte ponovo kasnije.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email i lozinka su obavezni' },
        { status: 400 }
      );
    }

    const ipAddress = getIpAddress(request);

    // Check rate limit before attempting authentication
    const rateLimitCheck = await checkRateLimit(email, ipAddress);
    
    if (rateLimitCheck.isLimited) {
      await recordLoginAttempt(email, ipAddress, false);
      return NextResponse.json(
        { 
          error: `Previše neuspješnih pokušaja. Molimo pokušajte ponovo za ${rateLimitCheck.remainingMinutes} minuta.`,
          rateLimited: true,
          remainingMinutes: rateLimitCheck.remainingMinutes,
        },
        { status: 429 }
      );
    }

    const user = await authenticateUser(email, password);

    if (!user) {
      // Record failed attempt
      await recordLoginAttempt(email, ipAddress, false);
      
      // Check if this was the last allowed attempt
      const updatedRateLimit = await checkRateLimit(email, ipAddress);
      if (updatedRateLimit.isLimited) {
        return NextResponse.json(
          { 
            error: `Previše neuspješnih pokušaja. Molimo pokušajte ponovo za ${updatedRateLimit.remainingMinutes} minuta.`,
            rateLimited: true,
            remainingMinutes: updatedRateLimit.remainingMinutes,
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { 
          error: 'Neispravni pristupni podaci',
          remainingAttempts: MAX_ATTEMPTS - (updatedRateLimit.attempts || 0) - 1,
        },
        { status: 401 }
      );
    }

    // Login successful - record success and clear failed attempts
    await recordLoginAttempt(email, ipAddress, true);
    await clearLoginAttempts(email);

    const token = await generateToken(user);

    await logAudit({
      userId: user.id,
      action: 'auth.login',
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email },
      request,
    });

    // Set HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Greška pri prijavljivanju' },
      { status: 500 }
    );
  }
}
