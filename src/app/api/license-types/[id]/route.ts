import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireNonOperations } from '@/lib/route-guards';

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireNonOperations(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const { id } = await params;
    const body = await request.json();
    const {
      name,
      code,
      description,
      validityPeriodMonths,
      requiresRenewal,
      isActive,
      category,
      trainingType,
      parentLicenseTypeId,
      instructors,
      programDuration,
      theoryHours,
      practicalHours,
      workplaceTraining,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const licenseType = await prisma.licenseType.update({
      where: { id },
      data: {
        name,
        code: code || null,
        description: description || null,
        validityPeriodMonths: validityPeriodMonths || null,
        requiresRenewal: requiresRenewal ?? true,
        isActive: isActive ?? true,
        category: category || null,
        trainingType: trainingType || null,
        parentLicenseTypeId: parentLicenseTypeId || null,
        instructors: instructors || null,
        programDuration: programDuration || null,
        theoryHours: theoryHours !== undefined ? theoryHours : null,
        practicalHours: practicalHours !== undefined ? practicalHours : null,
        workplaceTraining: workplaceTraining || null,
      },
    });

    return NextResponse.json(licenseType);
  } catch (error: any) {
    console.error('Error updating license type:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'License type with this name or code already exists' },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'License type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update license type' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authCheck = await requireNonOperations(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const { id } = await params;
    // Check if license type is being used
    const licenseType = await prisma.licenseType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { licenses: true },
        },
      },
    });

    if (!licenseType) {
      return NextResponse.json(
        { error: 'License type not found' },
        { status: 404 }
      );
    }

    if (licenseType._count.licenses > 0) {
      return NextResponse.json(
        { error: `Cannot delete license type that is used by ${licenseType._count.licenses} license(s)` },
        { status: 400 }
      );
    }

    await prisma.licenseType.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting license type:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'License type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete license type' },
      { status: 500 }
    );
  }
}
