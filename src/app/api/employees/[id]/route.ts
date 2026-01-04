import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dateOnlyToUtc } from '@/lib/dates';
import { updateEmployeeSchema } from '@/lib/validators/employee';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/employees/[id] - Detalji jednog radnika
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        sector: true,
        licenses: {
          include: {
            documents: true,
          },
          orderBy: { expiryDate: 'asc' },
        },
        documents: true,
        notifications: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Calculate license statistics
    const activeLicenses = employee.licenses.filter(l => l.status === 'ACTIVE').length;
    const expiringLicenses = employee.licenses.filter(l => {
      if (l.status !== 'ACTIVE') return false;
      const daysUntilExpiry = Math.floor(
        (new Date(l.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
    }).length;

    return NextResponse.json({
      success: true,
      data: {
        ...employee,
        stats: {
          activeLicenses,
          expiringLicenses,
          totalLicenses: employee.licenses.length,
        },
      },
    });
  } catch (error) {
    console.error('Employee GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee' },
      { status: 500 }
    );
  }
}

// PUT /api/employees/[id] - Ažuriranje radnika
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Validacija
    const validated = updateEmployeeSchema.parse(body);

    // Provera da li employee postoji
    const existing = await prisma.employee.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Provera da li novi email/employeeNumber već postoji kod drugog radnika
    if (validated.email || validated.employeeNumber) {
      const duplicate = await prisma.employee.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                validated.email ? { email: validated.email } : {},
                validated.employeeNumber ? { employeeNumber: validated.employeeNumber } : {},
              ].filter(obj => Object.keys(obj).length > 0),
            },
          ],
        },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            error: duplicate.email === validated.email
              ? 'Email already exists'
              : 'Employee number already exists',
          },
          { status: 400 }
        );
      }
    }

    // Ažuriranje
    const employee = await prisma.employee.update({
      where: { id },
      data: {
        ...(validated.employeeNumber && { employeeNumber: validated.employeeNumber }),
        ...(validated.firstName && { firstName: validated.firstName }),
        ...(validated.lastName && { lastName: validated.lastName }),
        ...(validated.email && { email: validated.email }),
        ...(validated.phone !== undefined && { phone: validated.phone || null }),
        ...(validated.nationalId !== undefined && { nationalId: validated.nationalId || null }),
        ...(validated.dateOfBirth && { dateOfBirth: dateOnlyToUtc(validated.dateOfBirth) }),
        ...(validated.hireDate && { hireDate: dateOnlyToUtc(validated.hireDate) }),
        ...(validated.position && { position: validated.position }),
        ...(validated.department !== undefined && { department: validated.department || null }),
        ...(validated.status && { status: validated.status }),
        ...((body.sectorId !== undefined) && { sectorId: body.sectorId || null }),
        ...((body.photo !== undefined) && { photo: body.photo || null }),
      },
      include: {
        sector: true,
        licenses: true,
        documents: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Employee PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update employee' },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id] - Brisanje radnika (soft delete)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        licenses: true,
      },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Soft delete - postavi status na INACTIVE
    await prisma.employee.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });

    return NextResponse.json({
      success: true,
      message: 'Employee deactivated successfully',
    });
  } catch (error) {
    console.error('Employee DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete employee' },
      { status: 500 }
    );
  }
}
