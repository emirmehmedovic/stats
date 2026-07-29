'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { FlightErrorCard } from '@/components/flight-errors';
import { AlertOctagon, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FlightErrorStatus, FlightErrorType, FlightErrorPriority } from '@prisma/client';

interface FlightErrorResponse {
  id: string;
  errorType: FlightErrorType;
  priority: FlightErrorPriority;
  status: FlightErrorStatus;
  description: string;
  createdAt: string;
  flight: {
    id: string;
    date: string;
    route: string;
    arrivalFlightNumber: string | null;
    departureFlightNumber: string | null;
    airline?: {
      id: string;
      name: string;
      icaoCode: string;
    };
  };
  _count?: {
    attachments: number;
  };
}

interface PendingErrorsResponse {
  success: boolean;
  data: FlightErrorResponse[];
  count: number;
}

export default function ErrorReviewPage() {
  const router = useRouter();
  const [data, setData] = useState<PendingErrorsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingErrors = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/flight-errors/my-pending');

      if (!response.ok) {
        throw new Error('Greška pri učitavanju');
      }

      const result: PendingErrorsResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingErrors();
  }, []);

  const pendingCount = data?.count || 0;

  return (
    <MainLayout>
      <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-red-600 via-red-500 to-orange-500 text-white shadow-soft-xl p-4 md:p-6 lg:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.15),transparent_25%),radial-gradient(circle_at_85%_0%,rgba(255,255,255,0.1),transparent_25%)]"></div>
          <div className="relative z-10">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <AlertOctagon className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-2.5 lg:px-3 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] lg:text-xs uppercase tracking-[0.2em] text-white/90 mb-2">
                  Potrebna akcija
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold mb-2">Pregled grešaka</h1>
                <p className="text-sm lg:text-base text-white/90">
                  {pendingCount === 0
                    ? 'Nemate neriješenih grešaka.'
                    : `Imate ${pendingCount} neriješen${pendingCount === 1 ? 'u grešku' : pendingCount < 5 ? 'e greške' : 'ih grešaka'} koje morate riješiti.`}
                </p>
              </div>
            </div>

            {pendingCount > 0 && (
              <div className="mt-6 bg-white/10 rounded-xl p-4 backdrop-blur">
                <p className="text-sm text-white/90">
                  <strong>Napomena:</strong> Pristup drugim dijelovima sistema je blokiran dok ne riješite sve prijavljene greške.
                  Za svaku grešku možete:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-white/80">
                  <li>• <strong>Ispraviti</strong> - Urediti podatke leta i označiti grešku kao riješenu</li>
                  <li>• <strong>Osporiti</strong> - Ako smatrate da prijava nije ispravna, možete je osporiti uz obrazloženje</li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-soft">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchPendingErrors}>
              Pokušaj ponovo
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
          </div>
        )}

        {/* Errors List */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {data?.data && data.data.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-slate-900">
                    Vaše neriješene greške
                  </h2>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchPendingErrors}
                    className="text-slate-600"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Osvježi
                  </Button>
                </div>
                <div className="space-y-3">
                  {data.data.map((flightError) => (
                    <FlightErrorCard
                      key={flightError.id}
                      error={flightError}
                      onClick={() => router.push(`/error-review/${flightError.id}`)}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Sve greške riješene
                </h3>
                <p className="text-slate-600 mb-4">
                  Nemate neriješenih grešaka. Možete nastaviti koristiti sistem normalno.
                </p>
                <Button onClick={() => router.push('/daily-operations')}>
                  Nazad na dnevne operacije
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
