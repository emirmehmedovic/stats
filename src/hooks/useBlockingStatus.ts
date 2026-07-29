'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

interface BlockingError {
  id: string;
  flightId: string;
  errorType: string;
  priority: string;
  status: string;
  description: string;
  createdAt: string;
  flight: {
    id: string;
    route: string;
    date: string;
    arrivalFlightNumber: string | null;
    departureFlightNumber: string | null;
  };
}

interface BlockingStatusResponse {
  success: boolean;
  data: {
    isBlocked: boolean;
    pendingErrorsCount: number;
    errors: BlockingError[];
  };
}

// Routes that are never blocked
const UNBLOCKABLE_ROUTES = [
  '/error-review',
  '/api',
  '/naplate/pin',
];

function isUnblockableRoute(pathname: string, allowedFlightIds: string[]): boolean {
  // Check base unblockable routes
  if (UNBLOCKABLE_ROUTES.some(route => pathname.startsWith(route))) {
    return true;
  }

  // Check if this is a daily-operations page for an allowed flight
  const dailyOpsMatch = pathname.match(/^\/daily-operations\/([^/]+)/);
  if (dailyOpsMatch && allowedFlightIds.includes(dailyOpsMatch[1])) {
    return true;
  }

  return false;
}

export function useBlockingStatus() {
  const [isBlocked, setIsBlocked] = useState(false);
  const [pendingErrorsCount, setPendingErrorsCount] = useState(0);
  const [errors, setErrors] = useState<BlockingError[]>([]);
  const [allowedFlightIds, setAllowedFlightIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const checkBlockingStatus = useCallback(async () => {
    // Get user role from localStorage
    const role = localStorage.getItem('userRole');
    setUserRole(role);

    // Admins are never blocked
    if (role === 'ADMIN') {
      setIsBlocked(false);
      setPendingErrorsCount(0);
      setErrors([]);
      setAllowedFlightIds([]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/blocking-status');
      const result: BlockingStatusResponse = await response.json();

      if (result.success) {
        setIsBlocked(result.data.isBlocked);
        setPendingErrorsCount(result.data.pendingErrorsCount);
        setErrors(result.data.errors);

        // Extract flight IDs that user is allowed to edit
        const flightIds = result.data.errors.map(e => e.flightId);
        setAllowedFlightIds(flightIds);

        // If blocked and not on an unblockable route, redirect to error-review
        if (result.data.isBlocked && !isUnblockableRoute(pathname, flightIds)) {
          router.push('/error-review');
        }
      }
    } catch (error) {
      console.error('Error checking blocking status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pathname, router]);

  useEffect(() => {
    checkBlockingStatus();
  }, [checkBlockingStatus]);

  // Periodically check for new errors (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(checkBlockingStatus, 30000);
    return () => clearInterval(interval);
  }, [checkBlockingStatus]);

  return {
    isBlocked,
    pendingErrorsCount,
    errors,
    allowedFlightIds,
    isLoading,
    userRole,
    checkBlockingStatus,
  };
}
