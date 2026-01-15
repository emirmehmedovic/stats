import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireNonOperations } from '@/lib/route-guards';

// PATCH /api/equipment-assignments/[id] - Razduzi opremu
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authCheck = await requireNonOperations(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const assignment = await prisma.equipmentAssignment.findUnique({
      where: { id },
      select: { id: true, returnedAt: true },
    });

    if (!assignment) {
      return NextResponse.json({ error: 'Zaduženje nije pronađeno' }, { status: 404 });
    }

    if (assignment.returnedAt) {
      return NextResponse.json({ error: 'Oprema je već razdužena' }, { status: 400 });
    }

    const updated = await prisma.equipmentAssignment.update({
      where: { id },
      data: { returnedAt: new Date() },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            sector: {
              select: {
                id: true,
                name: true,
                code: true,
              },
            },
          },
        },
        sector: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Equipment assignment PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update equipment assignment' },
      { status: 500 }
    );
  }
}
