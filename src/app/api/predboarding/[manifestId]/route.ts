import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSTW } from '@/lib/route-guards';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * GET /api/predboarding/[manifestId]
 *
 * Vraća detalje manifesta sa putnicima i statistikom
 * Auth: requireSTW (STW ili ADMIN)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ manifestId: string }> }
) {
  const authCheck = await requireSTW(request);
  if ('error' in authCheck) return authCheck.error;

  const { manifestId } = await params;

  try {
    const manifest = await prisma.boardingManifest.findUnique({
      where: { id: manifestId },
      include: {
        flight: {
          include: {
            airline: true,
            aircraftType: true
          }
        },
        passengers: {
          orderBy: {
            seatNumber: 'asc'
          }
        },
        uploadedByUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!manifest) {
      return NextResponse.json(
        { error: 'Manifest ne postoji' },
        { status: 404 }
      );
    }

    // Calculate stats
    const passengers = manifest.passengers;
    const boarded = passengers.filter(p => p.boardingStatus === 'BOARDED');
    const noShow = passengers.filter(p => p.boardingStatus === 'NO_SHOW');
    const pending = passengers.filter(p => p.boardingStatus === 'PENDING');

    const stats = {
      total: passengers.length,
      boarded: boarded.length,
      noShow: noShow.length,
      pending: pending.length,
      male: boarded.filter(p => p.title === 'MR' || p.title === 'MSTR').length,
      female: boarded.filter(p => ['MS', 'MRS', 'MISS'].includes(p.title)).length,
      children: boarded.filter(p => p.title === 'CHD').length,
      infants: boarded.filter(p => p.isInfant).length
    };

    return NextResponse.json({
      success: true,
      data: {
        manifest,
        stats
      }
    });
  } catch (error) {
    console.error('Error fetching manifest:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju manifesta' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/predboarding/[manifestId]
 *
 * Briše manifest i sve povezane putnike
 * Može se obrisati samo IN_PROGRESS manifest
 * Auth: requireSTW (STW ili ADMIN)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ manifestId: string }> }
) {
  const authCheck = await requireSTW(request);
  if ('error' in authCheck) return authCheck.error;

  const { manifestId } = await params;

  try {
    // Find manifest
    const manifest = await prisma.boardingManifest.findUnique({
      where: { id: manifestId },
      select: {
        id: true,
        filePath: true,
        boardingStatus: true,
        flightId: true
      }
    });

    if (!manifest) {
      return NextResponse.json(
        { success: false, error: 'Manifest ne postoji' },
        { status: 404 }
      );
    }

    // Can only delete IN_PROGRESS manifests
    if (manifest.boardingStatus !== 'IN_PROGRESS') {
      return NextResponse.json(
        { success: false, error: 'Ne možete obrisati završen manifest' },
        { status: 400 }
      );
    }

    // Delete manifest file from filesystem
    try {
      const filePath = path.join(process.cwd(), manifest.filePath);
      await fs.unlink(filePath);
    } catch (fileError) {
      console.error('Error deleting manifest file:', fileError);
      // Continue even if file deletion fails
    }

    // Delete manifest from database (CASCADE will delete all passengers)
    await prisma.boardingManifest.delete({
      where: { id: manifestId }
    });

    return NextResponse.json({
      success: true,
      message: 'Manifest uspješno obrisan'
    });
  } catch (error) {
    console.error('Error deleting manifest:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri brisanju manifesta' },
      { status: 500 }
    );
  }
}
