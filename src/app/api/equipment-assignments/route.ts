import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { requireNonOperations } from '@/lib/route-guards';

const createAssignmentSchema = z.object({
  employeeId: z.string().optional().nullable(),
  sectorId: z.string().optional().nullable(),
  equipmentName: z.string().min(1, 'Equipment name is required'),
  notes: z.string().optional().nullable(),
});

// GET /api/equipment-assignments - Lista zaduzenja IT opreme
export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireNonOperations(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const assignments = await prisma.equipmentAssignment.findMany({
      orderBy: { assignedAt: 'desc' },
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

    return NextResponse.json({ success: true, data: assignments });
  } catch (error) {
    console.error('Equipment assignments GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch equipment assignments' },
      { status: 500 }
    );
  }
}

// POST /api/equipment-assignments - Kreiranje novog zaduzenja
export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireNonOperations(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const body = await request.json();
    const validated = createAssignmentSchema.parse(body);

    const hasEmployee = Boolean(validated.employeeId);
    const hasSector = Boolean(validated.sectorId);
    if (hasEmployee === hasSector) {
      return NextResponse.json(
        { error: 'Odaberite ili radnika ili sektor.' },
        { status: 400 }
      );
    }

    const assignment = await prisma.equipmentAssignment.create({
      data: {
        employeeId: validated.employeeId || null,
        sectorId: validated.sectorId || null,
        equipmentName: validated.equipmentName.trim(),
        notes: validated.notes ? validated.notes.trim() : null,
      },
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

    return NextResponse.json({ success: true, data: assignment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Equipment assignments POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create equipment assignment' },
      { status: 500 }
    );
  }
}
