'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'ADMIN' | 'MANAGER' | 'OPERATIONS' | 'VIEWER' | 'STW' | 'NAPLATE' | 'AUDITOR';
  language?: 'BS' | 'EN';
}

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const publicRoutes = ['/'];
      const adminRoutes = ['/admin'];
      const employeeRoutes = ['/employees'];
      const managerAllowedAdminRoutes = ['/admin/license-types', '/admin/sectors'];
      const viewerRestrictedRoutes = [
        '/flights',
        '/airlines',
        '/aircraft-types',
        '/operation-types',
        '/delay-codes',
      ];

      // Check if route is public
      if (publicRoutes.includes(pathname)) {
        setIsChecking(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();

        if (!data.authenticated) {
          router.push('/');
          return;
        }

        // Check role-based access for admin routes
        if (adminRoutes.some(route => pathname.startsWith(route))) {
          console.log('AuthCheck - Admin route check:', {
            pathname,
            userRole: data.user.role,
            isAdmin: data.user.role === 'ADMIN'
          });
          const isManagerAllowedAdminPage = managerAllowedAdminRoutes.some(route => pathname.startsWith(route));
          // AUDITOR can access license-types and sectors (read-only)
          const isAllowedRole = data.user.role === 'ADMIN' ||
            ((data.user.role === 'MANAGER' || data.user.role === 'AUDITOR') && isManagerAllowedAdminPage);
          if (!isAllowedRole) {
            console.log('AuthCheck - Redirecting to dashboard, role:', data.user.role);
            router.push('/dashboard');
            return;
          }
        }

        // Block OPERATIONS role from employee pages
        if (data.user.role === 'OPERATIONS' && employeeRoutes.some(route => pathname.startsWith(route))) {
          router.push('/dashboard');
          return;
        }

        if (data.user.role === 'VIEWER' && viewerRestrictedRoutes.some(route => pathname.startsWith(route))) {
          router.push('/dashboard');
          return;
        }

        // Store user info in localStorage for client-side access
        if (data.user) {
          localStorage.setItem('userEmail', data.user.email);
          localStorage.setItem('userName', data.user.name || data.user.email.split('@')[0]);
          localStorage.setItem('userRole', data.user.role);
          // Set language based on user preference (AUDITOR defaults to EN)
          const userLanguage = data.user.language || (data.user.role === 'AUDITOR' ? 'EN' : 'BS');
          localStorage.setItem('userLanguage', userLanguage);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/');
        return;
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
          <p className="text-dark-500">Provjeravam autentifikaciju...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
