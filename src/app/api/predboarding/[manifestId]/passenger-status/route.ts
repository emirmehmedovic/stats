import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSTW } from '@/lib/route-guards';

/**
 * PATCH /api/predboarding/[manifestId]/passenger-status
 *
 * Ažurira boarding status putnika (PENDING, BOARDED, NO_SHOW)
 * Auth: requireSTW (STW ili ADMIN)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ manifestId: string }> }
) {
  const authCheck = await requireSTW(request);
  if ('error' in authCheck) return authCheck.error;

  const { manifestId } = await params;

  try {
    const body = await request.json();
    const { passengerId, status } = body;

    // Validate inputs
    if (!passengerId || !status) {
      return NextResponse.json(
        { error: 'passengerId i status su obavezni' },
        { status: 400 }
      );
    }

    if (!['PENDING', 'BOARDED', 'NO_SHOW'].includes(status)) {
      return NextResponse.json(
        { error: 'Nevažeći status' },
        { status: 400 }
      );
    }

    // Verify passenger belongs to this manifest
    const passenger = await prisma.manifestPassenger.findFirst({
      where: {
        id: passengerId,
        manifestId: manifestId
      }
    });

    if (!passenger) {
      return NextResponse.json(
        { error: 'Putnik ne postoji ili ne pripada ovom manifestu' },
        { status: 404 }
      );
    }

    // Update passenger status
    const updated = await prisma.manifestPassenger.update({
      where: { id: passengerId },
      data: {
        boardingStatus: status,
        boardedAt: status === 'BOARDED' ? new Date() : null
      }
    });

    return NextResponse.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Error updating passenger status:', error);
    return NextResponse.json(
      { error: 'Greška pri ažuriranju statusa' },
      { status: 500 }
    );
  }
}
