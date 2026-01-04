import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dateOnlyToUtc } from '@/lib/dates';
import { updateLicenseSchema } from '@/lib/validators/license';
import { z } from 'zod';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/licenses/[id] - Detalji jedne licence
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const license = await prisma.license.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
          },
        },
        documents: true,
      },
    });

    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: license,
    });
  } catch (error) {
    console.error('License GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch license' },
      { status: 500 }
    );
  }
}

// PUT /api/licenses/[id] - Ažuriranje licence
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Validacija
    const validated = updateLicenseSchema.parse(body);

    // Provjera da li licenca postoji
    const existing = await prisma.license.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    // Ažuriranje
    const license = await prisma.license.update({
      where: { id },
      data: {
        ...(validated.licenseType && { licenseType: validated.licenseType }),
        ...(validated.licenseNumber && { licenseNumber: validated.licenseNumber }),
        ...(validated.issuedDate && { issuedDate: dateOnlyToUtc(validated.issuedDate) }),
        ...(validated.expiryDate && { expiryDate: dateOnlyToUtc(validated.expiryDate) }),
        ...(validated.issuer !== undefined && { issuer: validated.issuer || null }),
        ...(validated.status && { status: validated.status }),
        ...(validated.requiredForPosition !== undefined && { 
          requiredForPosition: validated.requiredForPosition || null 
        }),
      },
      include: {
        documents: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: license,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    console.error('License PUT error:', error);
    return NextResponse.json(
      { error: 'Failed to update license' },
      { status: 500 }
    );
  }
}

// DELETE /api/licenses/[id] - Brisanje licence
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const license = await prisma.license.findUnique({
      where: { id },
    });

    if (!license) {
      return NextResponse.json(
        { error: 'License not found' },
        { status: 404 }
      );
    }

    // Brisanje (kaskadno će obrisati i dokumente)
    await prisma.license.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'License deleted successfully',
    });
  } catch (error) {
    console.error('License DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to delete license' },
      { status: 500 }
    );
  }
}
