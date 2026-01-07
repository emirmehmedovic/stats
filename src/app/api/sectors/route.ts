import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireNonOperations } from '@/lib/route-guards';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const authCheck = await requireNonOperations(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const sectors = await prisma.sector.findMany({
      include: {
        _count: {
          select: { employees: true },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(sectors);
  } catch (error) {
    console.error('Error fetching sectors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sectors' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authCheck = await requireNonOperations(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const body = await request.json();
    const { name, code, description, color, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const sector = await prisma.sector.create({
      data: {
        name,
        code: code || null,
        description: description || null,
        color: color || null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(sector, { status: 201 });
  } catch (error: any) {
    console.error('Error creating sector:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Sector with this name or code already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create sector' },
      { status: 500 }
    );
  }
}
