import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';
import { requireAdmin } from '@/lib/route-guards';
import { logAudit } from '@/lib/audit';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// requireAdmin imported from route-guards

// GET - Get user by ID
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const adminCheck = await requireAdmin(request);
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Korisnik nije pronađen' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju korisnika' },
      { status: 500 }
    );
  }
}

// PUT - Update user
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const adminCheck = await requireAdmin(request);
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    const body = await request.json();
    const { email, password, name, role, isActive } = body;

    const updateData: any = {};

    if (email !== undefined) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (role !== undefined) updateData.role = role;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (password) {
      updateData.password = await hashPassword(password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    await logAudit({
      userId: adminCheck.user.id,
      action: 'user.update',
      entityType: 'User',
      entityId: user.id,
      metadata: { email: user.email, role: user.role, isActive: user.isActive },
      request,
    });

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('Update user error:', error);
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Korisnik sa ovim email-om već postoji' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Greška pri ažuriranju korisnika' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const adminCheck = await requireAdmin(request);
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    // Don't allow deleting yourself
    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookie(cookieHeader);
    const decoded = await verifyToken(token!);
    
    if (decoded?.id === id) {
      return NextResponse.json(
        { error: 'Ne možete obrisati vlastiti nalog' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    await logAudit({
      userId: adminCheck.user.id,
      action: 'user.delete',
      entityType: 'User',
      entityId: id,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Greška pri brisanju korisnika' },
      { status: 500 }
    );
  }
}
