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
  role: 'ADMIN' | 'MANAGER' | 'OPERATIONS' | 'VIEWER' | 'STW' | 'NAPLATE';
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

function parseCookies(cookieHeader: string | null): Record<string, string> {
  if (!cookieHeader) return {};
  try {
    return cookieHeader.split(';').reduce((acc, cookie) => {
      const trimmed = cookie.trim();
      const equalIndex = trimmed.indexOf('=');
      if (equalIndex === -1) return acc;
      const key = trimmed.substring(0, equalIndex);
      const value = trimmed.substring(equalIndex + 1);
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {} as Record<string, string>);
  } catch (error) {
    console.error('Error parsing cookies:', error);
    return {};
  }
}

export function getCookieValue(cookieHeader: string | null, name: string): string | null {
  const cookies = parseCookies(cookieHeader);
  return cookies[name] || null;
}

export function getTokenFromCookie(cookieHeader: string | null): string | null {
  return getCookieValue(cookieHeader, 'auth-token');
}

export async function verifyBillingPinToken(token: string): Promise<{ userId: string } | null> {
  const secretValue = getJwtSecret();
  try {
    const secret = new TextEncoder().encode(secretValue);
    const { payload } = await jwtVerify(token, secret);
    if (payload?.type !== 'billing-pin' || typeof payload.sub !== 'string') {
      return null;
    }
    return { userId: payload.sub };
  } catch (error: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Billing PIN token verification failed:', error.message);
    }
    return null;
  }
}
