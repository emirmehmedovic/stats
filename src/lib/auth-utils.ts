import { jwtVerify } from 'jose';

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

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'MANAGER' | 'OPERATIONS' | 'VIEWER' | 'STW';
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  const secretValue = getJwtSecret();
  try {
    const secret = new TextEncoder().encode(secretValue);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AuthUser;
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Token verification failed:', error.message);
    }
    return null;
  }
}

export function getTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  try {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const trimmed = cookie.trim();
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) return acc;
      const key = trimmed.substring(0, equalIndex);
      const value = trimmed.substring(equalIndex + 1);
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {} as Record<string, string>);
    return cookies['auth-token'] || null;
  } catch (error) {
    console.error('Error parsing cookies:', error);
    return null;
  }
}
