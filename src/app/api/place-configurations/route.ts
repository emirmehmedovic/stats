import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';

// GET /api/place-configurations
export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromCookie(request.headers.get('cookie'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configs = await prisma.placeConfiguration.findMany({
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ success: true, data: configs });
  } catch (error) {
    console.error('Error fetching place configurations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch configurations' },
      { status: 500 }
    );
  }
}

// POST /api/place-configurations
export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromCookie(request.headers.get('cookie'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { externalPlaceId, type, name, description, isActive = true } = body || {};

    if (externalPlaceId === undefined || !type || !name) {
      return NextResponse.json(
        { success: false, error: 'externalPlaceId, type and name are required' },
        { status: 400 }
      );
    }

    const config = await prisma.placeConfiguration.create({
      data: {
        externalPlaceId: Number(externalPlaceId),
        type,
        name,
        description: description || null,
        isActive: Boolean(isActive),
      },
    });

    return NextResponse.json({ success: true, data: config }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating place configuration:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create configuration' },
      { status: 500 }
    );
  }
}
