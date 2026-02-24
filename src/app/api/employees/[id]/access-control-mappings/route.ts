import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';

// GET /api/employees/[id]/access-control-mappings
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromCookie(request.headers.get('cookie'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId } = await params;

    const mappings = await prisma.accessControlMapping.findMany({
      where: { employeeId },
      include: {
        accessControlUser: true,
      },
      orderBy: [
        { isPrimary: 'desc' },
        { assignedAt: 'desc' },
      ],
    });

    return NextResponse.json({ success: true, data: mappings });
  } catch (error) {
    console.error('Error fetching AC mappings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mappings' },
      { status: 500 }
    );
  }
}

// POST /api/employees/[id]/access-control-mappings
export async function POST(
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

    const { id: employeeId } = await params;
    const body = await request.json();
    const { accessControlUserId, isPrimary = false } = body;

    // Check if mapping already exists
    const existingMapping = await prisma.accessControlMapping.findUnique({
      where: {
        employeeId_accessControlUserId: {
          employeeId,
          accessControlUserId,
        },
      },
    });

    if (existingMapping) {
      return NextResponse.json(
        { success: false, error: 'Mapping already exists' },
        { status: 400 }
      );
    }

    // If this is primary, unset other primary mappings
    if (isPrimary) {
      await prisma.accessControlMapping.updateMany({
        where: {
          employeeId,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    const mapping = await prisma.accessControlMapping.create({
      data: {
        employeeId,
        accessControlUserId,
        isPrimary,
        isActive: true,
      },
      include: {
        accessControlUser: true,
      },
    });

    return NextResponse.json({ success: true, data: mapping }, { status: 201 });
  } catch (error) {
    console.error('Error creating AC mapping:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create mapping' },
      { status: 500 }
    );
  }
}
