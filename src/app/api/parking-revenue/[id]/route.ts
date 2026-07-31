import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

async function requireParkingAccess(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const token = getTokenFromCookie(cookieHeader);

  if (!token) {
    return { error: NextResponse.json({ success: false, error: 'Niste autentifikovani' }, { status: 401 }) };
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    return { error: NextResponse.json({ success: false, error: 'Niste autentifikovani' }, { status: 401 }) };
  }

  if (decoded.role !== 'ADMIN' && decoded.role !== 'PARKING') {
    return { error: NextResponse.json({ success: false, error: 'Nemate dozvolu za pristup' }, { status: 403 }) };
  }

  return { user: decoded };
}

const updateParkingRevenueSchema = z.object({
  amount: z.number().min(0, 'Iznos mora biti pozitivan').optional(),
  notes: z.string().optional().nullable(),
});

// GET /api/parking-revenue/[id] - Pojedinačni unos
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireParkingAccess(request);
    if ('error' in authResult) return authResult.error;

    const { id } = await context.params;

    const revenue = await prisma.parkingRevenue.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!revenue) {
      return NextResponse.json(
        { success: false, error: 'Unos nije pronađen' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: revenue });
  } catch (error) {
    console.error('Error fetching parking revenue:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri učitavanju podataka' },
      { status: 500 }
    );
  }
}

// PUT /api/parking-revenue/[id] - Ažuriranje unosa
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireParkingAccess(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const { id } = await context.params;
    const body = await request.json();
    const validatedData = updateParkingRevenueSchema.parse(body);

    const existing = await prisma.parkingRevenue.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Unos nije pronađen' },
        { status: 404 }
      );
    }

    const updateData: Prisma.ParkingRevenueUpdateInput = {
      updatedBy: { connect: { id: user.id } },
    };

    if (validatedData.amount !== undefined) {
      updateData.amount = new Prisma.Decimal(validatedData.amount);
    }
    if (validatedData.notes !== undefined) {
      updateData.notes = validatedData.notes;
    }

    const revenue = await prisma.parkingRevenue.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: revenue,
      message: 'Unos uspješno ažuriran',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error updating parking revenue:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri ažuriranju unosa' },
      { status: 500 }
    );
  }
}

// DELETE /api/parking-revenue/[id] - Brisanje unosa
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireParkingAccess(request);
    if ('error' in authResult) return authResult.error;

    const { id } = await context.params;

    const existing = await prisma.parkingRevenue.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Unos nije pronađen' },
        { status: 404 }
      );
    }

    await prisma.parkingRevenue.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Unos uspješno obrisan',
    });
  } catch (error) {
    console.error('Error deleting parking revenue:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri brisanju unosa' },
      { status: 500 }
    );
  }
}
