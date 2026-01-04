import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'MANAGER' | 'VIEWER';
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AuthUser;
  } catch (error: any) {
    console.error('Token verification failed:', {
      error: error.message,
      tokenLength: token.length,
      tokenPreview: token.substring(0, 20) + '...',
      hasSecret: !!JWT_SECRET,
      secretLength: JWT_SECRET?.length
    });
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
