import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { prisma } from './prisma';
import type { AuthUser } from './auth-utils';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }
    return 'dev-secret-change-me';
  }
  return secret;
}

const JWT_EXPIRES_IN = '7d';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export async function generateToken(user: AuthUser): Promise<string> {
  const secretValue = getJwtSecret();
  const secret = new TextEncoder().encode(secretValue);
  const token = await new SignJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(secret);
  
  return token;
}


export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'ADMIN' | 'MANAGER' | 'OPERATIONS' | 'VIEWER' | 'STW',
  };
}

export function getTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}
