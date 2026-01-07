import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getTokenFromCookie } from '@/lib/auth-utils';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApiRoute = pathname.startsWith('/api');

  const applySecurityHeaders = (response: NextResponse) => {
    const csp = [
      "default-src 'self'",
      "img-src 'self' data: blob:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "connect-src 'self'",
      "font-src 'self' data:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');

    response.headers.set('Content-Security-Policy', csp);
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'same-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (process.env.NODE_ENV === 'production') {
      response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
    }
    return response;
  };

  const ensureCsrfCookie = (response: NextResponse) => {
    const csrfCookie = request.cookies.get('csrf-token');
    if (!csrfCookie) {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      const value = Array.from(bytes)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
      response.cookies.set('csrf-token', value, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      });
    }
    return response;
  };

  // Skip static files and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|ico|css|js|woff|woff2|ttf|eot)$/)
  ) {
    const response = NextResponse.next();
    return applySecurityHeaders(ensureCsrfCookie(response));
  }

  if (isApiRoute) {
    const publicApiRoutes = ['/api/auth/login', '/api/auth/logout', '/api/auth/session'];
    const isPublicApiRoute = publicApiRoutes.some(route => pathname.startsWith(route));
    const isCronRoute = pathname.startsWith('/api/cron/');

    const method = request.method.toUpperCase();
    const isWriteMethod = !['GET', 'HEAD', 'OPTIONS'].includes(method);
    if (isWriteMethod && !isPublicApiRoute && !isCronRoute) {
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');
      const allowedOrigins = [
        request.nextUrl.origin,
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.ALLOWED_ORIGINS,
      ].filter(Boolean);
      
      const hasValidOrigin = origin && allowedOrigins.some(allowed => allowed && origin === allowed);
      const hasValidReferer = referer && allowedOrigins.some(allowed => allowed && referer.startsWith(allowed));

      if (!hasValidOrigin && !hasValidReferer) {
        return applySecurityHeaders(
          ensureCsrfCookie(NextResponse.json({ error: 'Neispravan origin' }, { status: 403 }))
        );
      }

      const csrfCookie = request.cookies.get('csrf-token')?.value;
      const csrfHeader = request.headers.get('x-csrf-token');
      if (!csrfCookie || !csrfHeader || csrfHeader !== csrfCookie) {
        return applySecurityHeaders(
          ensureCsrfCookie(NextResponse.json({ error: 'Neispravan CSRF token' }, { status: 403 }))
        );
      }
    }

    if (isPublicApiRoute || isCronRoute) {
      const response = NextResponse.next();
      return applySecurityHeaders(ensureCsrfCookie(response));
    }

    const cookieHeader = request.headers.get('cookie');
    const token = getTokenFromCookie(cookieHeader);
    if (!token) {
      return applySecurityHeaders(
        ensureCsrfCookie(NextResponse.json({ error: 'Niste autentifikovani' }, { status: 401 }))
      );
    }

    const decoded = await verifyToken(token);
    if (!decoded) {
      return applySecurityHeaders(
        ensureCsrfCookie(NextResponse.json({ error: 'Niste autentifikovani' }, { status: 401 }))
      );
    }

    const isAdminApiRoute =
      pathname.startsWith('/api/users') || pathname.startsWith('/api/admin');
    const operationsRestrictedApiRoutes = [
      '/api/employees',
      '/api/licenses',
      '/api/license-types',
      '/api/notifications',
      '/api/sectors',
      '/api/documents',
      '/api/upload/employee-photo',
    ];
    const isOperationsRestrictedRoute = operationsRestrictedApiRoutes.some(route =>
      pathname.startsWith(route)
    );

    if (decoded.role === 'VIEWER') {
      if (isAdminApiRoute || isWriteMethod) {
        return applySecurityHeaders(
          ensureCsrfCookie(NextResponse.json({ error: 'Nemate dozvolu za pristup' }, { status: 403 }))
        );
      }
    }

    if (decoded.role === 'MANAGER') {
      if (isAdminApiRoute) {
        return applySecurityHeaders(
          ensureCsrfCookie(NextResponse.json({ error: 'Nemate dozvolu za pristup' }, { status: 403 }))
        );
      }
    }

    if (decoded.role === 'OPERATIONS') {
      if (isAdminApiRoute || isOperationsRestrictedRoute) {
        return applySecurityHeaders(
          ensureCsrfCookie(NextResponse.json({ error: 'Nemate dozvolu za pristup' }, { status: 403 }))
        );
      }
    }

    const response = NextResponse.next();
    return applySecurityHeaders(ensureCsrfCookie(response));
  }

  // Public routes that don't need authentication
  const publicRoutes = ['/'];
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.includes(pathname);

  // Admin routes - only ADMIN role can access
  const adminRoutes = ['/admin'];
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  const operationsRestrictedRoutes = ['/employees'];
  const isOperationsRestrictedRoute = operationsRestrictedRoutes.some(route => pathname.startsWith(route));

  // Get token from cookie
  const cookieHeader = request.headers.get('cookie');
  const token = getTokenFromCookie(cookieHeader);
  
  // If trying to access protected route without auth, redirect to login
  if (!isPublicRoute && !token) {
    const response = NextResponse.redirect(new URL('/', request.url));
    return applySecurityHeaders(ensureCsrfCookie(response));
  }

  // If authenticated and trying to access login, redirect to dashboard
  if (isPublicRoute && pathname === '/' && token) {
    const decoded = await verifyToken(token);
    if (decoded) {
      const response = NextResponse.redirect(new URL('/dashboard', request.url));
      return applySecurityHeaders(ensureCsrfCookie(response));
    }
  }

  // Check role-based access for admin routes
  if (isAdminRoute && token) {
    const decoded = await verifyToken(token);
    if (!decoded || decoded.role !== 'ADMIN') {
      const response = NextResponse.redirect(new URL('/dashboard', request.url));
      return applySecurityHeaders(ensureCsrfCookie(response));
    }
  }

  if (isOperationsRestrictedRoute && token) {
    const decoded = await verifyToken(token);
    if (decoded?.role === 'OPERATIONS') {
      const response = NextResponse.redirect(new URL('/dashboard', request.url));
      return applySecurityHeaders(ensureCsrfCookie(response));
    }
  }

  // If trying to access admin route without token
  if (isAdminRoute && !token) {
    const response = NextResponse.redirect(new URL('/', request.url));
    return applySecurityHeaders(ensureCsrfCookie(response));
  }

  const response = NextResponse.next();
  return applySecurityHeaders(ensureCsrfCookie(response));
}

export const config = {
  matcher: [
    '/api/:path*',
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static files (svg, png, jpg, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|ico|css|js|woff|woff2|ttf|eot)$).*)',
  ],
};
