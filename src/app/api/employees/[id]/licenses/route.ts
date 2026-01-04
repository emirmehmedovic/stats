import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dateOnlyToUtc } from '@/lib/dates';
import { createLicenseSchema } from '@/lib/validators/license';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/employees/[id]/licenses - Lista licenci za radnika
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const licenses = await prisma.license.findMany({
      where: { employeeId: id },
      include: {
        documents: true,
      },
      orderBy: { expiryDate: 'asc' },
    });

    return NextResponse.json({
      success: true,
      data: licenses,
    });
  } catch (error) {
    console.error('Licenses GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch licenses' },
      { status: 500 }
    );
  }
}

// POST /api/employees/[id]/licenses - Kreiranje nove licence za radnika
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Validacija
    const validated = createLicenseSchema.parse(body);

    // Provjera da li employee postoji
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Kreiranje licence
    const license = await prisma.license.create({
      data: {
        employeeId: id,
        licenseType: validated.licenseType,
        licenseNumber: validated.licenseNumber,
        issuedDate: dateOnlyToUtc(validated.issuedDate),
        expiryDate: dateOnlyToUtc(validated.expiryDate),
        issuer: validated.issuer || null,
        status: validated.status,
        requiredForPosition: validated.requiredForPosition || null,
      },
      include: {
        documents: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: license,
    }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('License POST error:', error);
    return NextResponse.json(
      { error: 'Failed to create license' },
      { status: 500 }
    );
  }
}
