import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, code, description, color, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const sector = await prisma.sector.update({
      where: { id },
      data: {
        name,
        code: code || null,
        description: description || null,
        color: color || null,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json(sector);
  } catch (error: any) {
    console.error('Error updating sector:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Sector with this name or code already exists' },
        { status: 400 }
      );
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Sector not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update sector' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Check if sector has employees
    const sector = await prisma.sector.findUnique({
      where: { id },
      include: {
        _count: {
          select: { employees: true },
        },
      },
    });

    if (!sector) {
      return NextResponse.json(
        { error: 'Sector not found' },
        { status: 404 }
      );
    }

    if (sector._count.employees > 0) {
      return NextResponse.json(
        { error: `Cannot delete sector that has ${sector._count.employees} employee(s). Please reassign employees first.` },
        { status: 400 }
      );
    }

    await prisma.sector.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting sector:', error);

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Sector not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete sector' },
      { status: 500 }
    );
  }
}
