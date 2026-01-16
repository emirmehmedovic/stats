'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Lock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { showToast } from '@/components/ui/toast';

function NaplatePinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const nextTarget = useMemo(() => {
    const nextParam = searchParams?.get('next');
    if (nextParam && nextParam.startsWith('/naplate')) {
      return nextParam;
    }
    return '/naplate/dnevni';
  }, [searchParams]);

  useEffect(() => {
    const checkAuth = async () => {
      const role = localStorage.getItem('userRole');
      setUserRole(role);

      if (!role || (role !== 'ADMIN' && role !== 'NAPLATE')) {
        showToast('Nemate dozvolu za pristup ovoj stranici', 'error');
        router.push('/dashboard');
        return;
      }

      try {
        const response = await fetch('/api/naplate/session');
        const data = await response.json();
        if (response.ok && data?.authorized) {
          router.replace(nextTarget);
          return;
        }
      } catch (error) {
        console.error('Error checking billing session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [nextTarget, router]);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pin || pin.length < 4) {
      showToast('PIN mora imati najmanje 4 cifre', 'error');
      return;
    }

    setIsVerifying(true);

    try {
      const response = await fetch('/api/naplate/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        showToast('PIN verifikovan uspješno!', 'success');
        router.replace(nextTarget);
      } else {
        showToast(data.error || 'Neispravan PIN', 'error');
        setPin('');
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      showToast('Greška pri verifikaciji PIN-a', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="bg-white rounded-3xl shadow-soft-lg p-12 max-w-md w-full border border-slate-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-100 rounded-full blur-3xl opacity-50 -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50 -ml-16 -mb-16"></div>

        <div className="relative z-10">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-soft">
            <Lock className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">
            Finansijski izvještaji
          </h2>
          <p className="text-slate-600 text-center mb-8">
            Unesite PIN za pristup finansijskim izvještajima
          </p>

          <div className="flex items-center justify-center gap-2 mb-8">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
              {userRole === 'ADMIN' ? 'Administrator' : 'Naplate'}
            </span>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-6">
            <div>
              <label htmlFor="pin" className="block text-sm font-semibold text-slate-700 mb-2">
                Sigurnosni PIN
              </label>
              <Input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Unesite PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className="text-center text-2xl tracking-widest font-bold"
                maxLength={6}
                autoFocus
                disabled={isVerifying}
              />
              <p className="text-xs text-slate-500 mt-2 text-center">
                PIN se sastoji od 4-6 cifara
              </p>
            </div>

            <Button
              type="submit"
              disabled={isVerifying || pin.length < 4}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-soft"
            >
              {isVerifying ? 'Verifikujem...' : 'Verifikuj PIN'}
            </Button>
          </form>

          <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-xs text-amber-800 text-center">
              <Shield className="w-4 h-4 inline mr-1" />
              Ova stranica je zaštićena dodatnom sigurnošću. PIN važi do zatvaranja browsera.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function NaplatePinPage() {
  return (
    <Suspense
      fallback={(
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}
    >
      <NaplatePinContent />
    </Suspense>
  );
}
