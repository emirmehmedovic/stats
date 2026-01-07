'use client';

import { useEffect } from 'react';

function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )csrf-token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export function CsrfBootstrap() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const originalFetch = window.fetch;

    window.fetch = (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method || 'GET').toUpperCase();
      if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
        return originalFetch(input, init);
      }

      const csrfToken = getCsrfToken();
      if (!csrfToken) {
        return originalFetch(input, init);
      }

      const headers = new Headers(init?.headers || {});
      if (!headers.has('x-csrf-token')) {
        headers.set('x-csrf-token', csrfToken);
      }

      return originalFetch(input, { ...init, headers });
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
