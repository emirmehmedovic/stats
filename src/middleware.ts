import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getTokenFromCookie } from '@/lib/auth-utils';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.match(/\.(svg|png|jpg|jpeg|gif|ico|css|js|woff|woff2|ttf|eot)$/)
  ) {
    return NextResponse.next();
  }

  // Public routes that don't need authentication
  const publicRoutes = ['/'];
  
  // Check if the current route is public
  const isPublicRoute = publicRoutes.includes(pathname);

  // Admin routes - only ADMIN role can access
  const adminRoutes = ['/admin'];
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));

  // Get token from cookie
  const cookieHeader = request.headers.get('cookie');
  const token = getTokenFromCookie(cookieHeader);
  
  if (isAdminRoute) {
    console.log('Middleware - Admin route access attempt:', {
      pathname,
      hasCookieHeader: !!cookieHeader,
      cookieHeaderPreview: cookieHeader?.substring(0, 150),
      hasToken: !!token,
      token: token ? token.substring(0, 50) + '...' : null,
      tokenLength: token?.length
    });
  }

  // If trying to access protected route without auth, redirect to login
  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If authenticated and trying to access login, redirect to dashboard
  if (isPublicRoute && pathname === '/' && token) {
    const decoded = await verifyToken(token);
    if (decoded) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Check role-based access for admin routes
  if (isAdminRoute && token) {
    const decoded = await verifyToken(token);
    console.log('Middleware - Admin route check:', {
      pathname,
      hasToken: !!token,
      decoded: decoded ? { id: decoded.id, email: decoded.email, role: decoded.role } : null,
      isAdmin: decoded?.role === 'ADMIN'
    });
    if (!decoded || decoded.role !== 'ADMIN') {
      console.log('Middleware - Redirecting to dashboard, role:', decoded?.role);
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // If trying to access admin route without token
  if (isAdminRoute && !token) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
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

