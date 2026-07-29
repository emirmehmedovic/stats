'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ToastContainer } from '@/components/ui/toast';
import { BlockingOverlay } from '@/components/flight-errors';
import { useBlockingStatus } from '@/hooks/useBlockingStatus';

interface MainLayoutProps {
  children: React.ReactNode;
}

// Routes that should not show the blocking overlay
const UNBLOCKED_PATHS = ['/error-review'];

export function MainLayout({ children }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isBlocked, pendingErrorsCount, allowedFlightIds, isLoading, userRole } = useBlockingStatus();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Check if current path is an allowed flight edit page
  const isAllowedFlightPage = (() => {
    const dailyOpsMatch = pathname.match(/^\/daily-operations\/([^/]+)/);
    if (dailyOpsMatch && allowedFlightIds.includes(dailyOpsMatch[1])) {
      return true;
    }
    return false;
  })();

  // Don't show blocking overlay on error-review pages, allowed flight pages, or while loading
  const showBlockingOverlay =
    isBlocked &&
    !isLoading &&
    userRole !== 'ADMIN' &&
    !isAllowedFlightPage &&
    !UNBLOCKED_PATHS.some(path => pathname.startsWith(path));

  return (
    <div className="min-h-screen bg-dark-50">
      <Sidebar
        isMobileMenuOpen={isMobileMenuOpen}
        closeMobileMenu={closeMobileMenu}
      />
      <Header toggleMobileMenu={toggleMobileMenu} />
      <main className="lg:ml-[280px] pt-24 px-4 lg:px-0">
        {children}
      </main>
      <ToastContainer />

      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Blocking overlay for users with pending errors */}
      {showBlockingOverlay && (
        <BlockingOverlay pendingErrorsCount={pendingErrorsCount} />
      )}
    </div>
  );
}
