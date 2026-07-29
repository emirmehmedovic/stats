import { NextRequest, NextResponse } from 'next/server';
import { requireAnyAuth } from '@/lib/route-guards';
import { checkUserBlockingStatus } from '@/lib/blocking';

// GET /api/user/blocking-status - Provjera da li je korisnik blokiran
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    // Admins are never blocked
    if (user.role === 'ADMIN') {
      return NextResponse.json({
        success: true,
        data: {
          isBlocked: false,
          pendingErrorsCount: 0,
          errors: [],
        },
      });
    }

    const blockingStatus = await checkUserBlockingStatus(user.id);

    return NextResponse.json({
      success: true,
      data: blockingStatus,
    });
  } catch (error) {
    console.error('Error checking blocking status:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to check blocking status',
      },
      { status: 500 }
    );
  }
}
