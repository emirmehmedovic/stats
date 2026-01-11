import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';
import type { AuthUser } from '@/lib/auth-utils';

type AuthCheck = { user: AuthUser } | { error: NextResponse };

async function requireRole(request: Request, allowedRoles: AuthUser['role'][]): Promise<AuthCheck> {
  const cookieHeader = request.headers.get('cookie');
  const token = getTokenFromCookie(cookieHeader);
  if (!token) {
    return { error: NextResponse.json({ error: 'Niste autentifikovani' }, { status: 401 }) };
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    return { error: NextResponse.json({ error: 'Niste autentifikovani' }, { status: 401 }) };
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) {
    return { error: NextResponse.json({ error: 'Niste autentifikovani' }, { status: 401 }) };
  }

  if (!allowedRoles.includes(user.role)) {
    return { error: NextResponse.json({ error: 'Nemate dozvolu za pristup' }, { status: 403 }) };
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export function requireNonOperations(request: Request): Promise<AuthCheck> {
  return requireRole(request, ['ADMIN', 'MANAGER', 'VIEWER']);
}

export function requireAdmin(request: Request): Promise<AuthCheck> {
  return requireRole(request, ['ADMIN']);
}

export function requireAdminOrManager(request: Request): Promise<AuthCheck> {
  return requireRole(request, ['ADMIN', 'MANAGER']);
}

export function requireSTW(request: Request): Promise<AuthCheck> {
  return requireRole(request, ['STW', 'ADMIN']);
}

export function requireAdminOrOperations(request: Request): Promise<AuthCheck> {
  return requireRole(request, ['ADMIN', 'OPERATIONS']);
}
