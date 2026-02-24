import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';

// PATCH /api/place-configurations/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromCookie(request.headers.get('cookie'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { type, name, description, isActive, externalPlaceId } = body || {};

    const config = await prisma.placeConfiguration.update({
      where: { id },
      data: {
        type,
        name,
        description: description === undefined ? undefined : description || null,
        isActive: isActive === undefined ? undefined : Boolean(isActive),
        externalPlaceId: externalPlaceId === undefined ? undefined : Number(externalPlaceId),
      },
    });

    return NextResponse.json({ success: true, data: config });
  } catch (error) {
    console.error('Error updating place configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update configuration' },
      { status: 500 }
    );
  }
}

// DELETE /api/place-configurations/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromCookie(request.headers.get('cookie'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;

    await prisma.placeConfiguration.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting place configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete configuration' },
      { status: 500 }
    );
  }
}
