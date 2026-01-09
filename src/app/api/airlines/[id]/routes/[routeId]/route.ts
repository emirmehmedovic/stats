import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE - Remove a route
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; routeId: string }> }
) {
  try {
    const { routeId } = await params;

    await prisma.airlineRoute.delete({
      where: {
        id: routeId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ruta uspješno obrisana',
    });
  } catch (error) {
    console.error('Error deleting airline route:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri brisanju rute' },
      { status: 500 }
    );
  }
}

// PATCH - Update a route
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; routeId: string }> }
) {
  try {
    const { routeId } = await params;
    const body = await request.json();
    const { route, destination, country, isActive } = body;

    const updatedRoute = await prisma.airlineRoute.update({
      where: {
        id: routeId,
      },
      data: {
        ...(route && { route }),
        ...(destination && { destination }),
        ...(country && { country }),
        ...(typeof isActive === 'boolean' && { isActive }),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedRoute,
      message: 'Ruta uspješno ažurirana',
    });
  } catch (error) {
    console.error('Error updating airline route:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri ažuriranju rute' },
      { status: 500 }
    );
  }
}
