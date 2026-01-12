import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSTW } from '@/lib/route-guards';
import { unlink } from 'fs/promises';
import { join } from 'path';

/**
 * POST /api/predboarding/finalize
 *
 * Finalizuje boarding - agregira brojke, ažurira Flight, briše detalje putnika i manifest fajl
 * Auth: requireSTW (STW ili ADMIN)
 */
export async function POST(request: NextRequest) {
  const authCheck = await requireSTW(request);
  if ('error' in authCheck) return authCheck.error;

  try {
    const body = await request.json();
    const { manifestId } = body;

    if (!manifestId) {
      return NextResponse.json(
        { error: 'manifestId je obavezan' },
        { status: 400 }
      );
    }

    // Get manifest with passengers and flight
    const manifest = await prisma.boardingManifest.findUnique({
      where: { id: manifestId },
      include: {
        passengers: true,
        flight: true
      }
    });

    if (!manifest) {
      return NextResponse.json(
        { error: 'Manifest ne postoji' },
        { status: 404 }
      );
    }

    if (manifest.boardingStatus !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Boarding nije u toku' },
        { status: 400 }
      );
    }

    // Calculate aggregated counts
    const boarded = manifest.passengers.filter(p => p.boardingStatus === 'BOARDED');
    const noShow = manifest.passengers.filter(p => p.boardingStatus === 'NO_SHOW');

    // Calculate demographics for boarded passengers only (for display purposes)
    const male = boarded.filter(p => p.title === 'MR' || p.title === 'MSTR').length;
    const female = boarded.filter(p => ['MS', 'MRS', 'MISS'].includes(p.title)).length;
    const children = boarded.filter(p => p.title === 'CHD').length;
    const infants = boarded.filter(p => p.isInfant).length;
    const totalBoarded = boarded.length;

    // Update Flight record with No Show count ONLY
    // All other passenger data comes from LDM message in daily-operations
    await prisma.flight.update({
      where: { id: manifest.flightId },
      data: {
        departureNoShow: noShow.length
      }
    });

    // Delete manifest file from filesystem
    try {
      const filePath = join(process.cwd(), 'public', manifest.filePath);
      await unlink(filePath);
    } catch (error) {
      console.error('Error deleting manifest file:', error);
      // Continue even if file deletion fails
    }

    // Delete all passengers
    await prisma.manifestPassenger.deleteMany({
      where: { manifestId }
    });

    // Update manifest to COMPLETED status (keep the record for tracking)
    await prisma.boardingManifest.update({
      where: { id: manifestId },
      data: {
        boardingStatus: 'COMPLETED',
        completedAt: new Date(),
        completedByUserId: authCheck.user.id
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        totalBoarded,
        male,
        female,
        children,
        infants,
        noShow: noShow.length
      },
      message: `Boarding završen! Ukrcano: ${totalBoarded}, No-show: ${noShow.length}`
    });
  } catch (error) {
    console.error('Error finalizing boarding:', error);
    return NextResponse.json(
      { error: 'Greška pri finalizaciji boardinga' },
      { status: 500 }
    );
  }
}
