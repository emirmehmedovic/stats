import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const licenseTypes = await prisma.licenseType.findMany({
      include: {
        _count: {
          select: { licenses: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(licenseTypes);
  } catch (error) {
    console.error('Error fetching license types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch license types' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      code,
      description,
      validityPeriodMonths,
      requiresRenewal,
      isActive,
      category,
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const licenseType = await prisma.licenseType.create({
      data: {
        name,
        code: code || null,
        description: description || null,
        validityPeriodMonths: validityPeriodMonths || null,
        requiresRenewal: requiresRenewal ?? true,
        isActive: isActive ?? true,
        category: category || null,
      },
    });

    return NextResponse.json(licenseType, { status: 201 });
  } catch (error: any) {
    console.error('Error creating license type:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'License type with this name or code already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create license type' },
      { status: 500 }
    );
  }
}
