import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';

// PATCH /api/employees/[id]/access-control-mappings/[mappingId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mappingId: string }> }
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

    const { mappingId } = await params;
    const body = await request.json();
    const { isActive, isPrimary } = body;

    const updateData: any = {};
    if (typeof isActive === 'boolean') {
      updateData.isActive = isActive;
    }
    if (typeof isPrimary === 'boolean') {
      updateData.isPrimary = isPrimary;

      // If setting as primary, unset other primary mappings
      if (isPrimary) {
        const mapping = await prisma.accessControlMapping.findUnique({
          where: { id: mappingId },
        });

        if (mapping) {
          await prisma.accessControlMapping.updateMany({
            where: {
              employeeId: mapping.employeeId,
              isPrimary: true,
              id: { not: mappingId },
            },
            data: {
              isPrimary: false,
            },
          });
        }
      }
    }

    const mapping = await prisma.accessControlMapping.update({
      where: { id: mappingId },
      data: updateData,
      include: {
        accessControlUser: true,
      },
    });

    return NextResponse.json({ success: true, data: mapping });
  } catch (error) {
    console.error('Error updating AC mapping:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update mapping' },
      { status: 500 }
    );
  }
}

// DELETE /api/employees/[id]/access-control-mappings/[mappingId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; mappingId: string }> }
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

    const { mappingId } = await params;

    await prisma.accessControlMapping.delete({
      where: { id: mappingId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting AC mapping:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete mapping' },
      { status: 500 }
    );
  }
}
