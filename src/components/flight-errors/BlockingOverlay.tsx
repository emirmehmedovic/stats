'use client';

import { useRouter } from 'next/navigation';
import { AlertOctagon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlockingOverlayProps {
  pendingErrorsCount: number;
}

export function BlockingOverlay({ pendingErrorsCount }: BlockingOverlayProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertOctagon className="w-10 h-10 text-red-600" />
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-3">
          Pristup blokiran
        </h2>

        <p className="text-slate-600 mb-6">
          Imate <strong className="text-red-600">{pendingErrorsCount}</strong> neriješen{pendingErrorsCount === 1 ? 'u grešku' : pendingErrorsCount < 5 ? 'e greške' : 'ih grešaka'} na letovima.
          Morate riješiti sve prijavljene greške prije nego što možete nastaviti koristiti sistem.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-amber-800">
            <strong>Zašto sam blokiran?</strong>
            <br />
            Drugi korisnik je prijavio grešku na podacima leta koje ste vi unijeli ili uredili.
            Molimo pregledajte i ispravite prijavljene greške.
          </p>
        </div>

        <Button
          onClick={() => router.push('/error-review')}
          className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white py-3"
        >
          Pregled i rješavanje grešaka
        </Button>
      </div>
    </div>
  );
}
