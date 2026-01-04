'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { FlightForm } from '@/components/flights/FlightForm';
import { CreateFlightInput } from '@/lib/validators/flight';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { dateOnlyToUtc, formatDateDisplay } from '@/lib/dates';

export default function EditFlightPage() {
  const router = useRouter();
  const params = useParams();
  const flightId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [flightData, setFlightData] = useState<any>(null);

  useEffect(() => {
    fetchFlight();
  }, [flightId]);

  const fetchFlight = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/flights/${flightId}`);

      if (!response.ok) {
        throw new Error('Let nije pronađen');
      }

      const result = await response.json();
      setFlightData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri učitavanju leta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: CreateFlightInput) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/flights/${flightId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri izmjeni leta');
      }

      // Redirect to flights list on success
      router.push('/flights');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4" />
              <p className="text-textMuted">Učitavam podatke...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error && !flightData) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-3xl px-5 py-4 shadow-soft">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" onClick={() => router.push('/flights')} className="mt-3">
              ← Nazad na listu
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white shadow-soft-xl p-6 md:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.12),transparent_25%)]"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Letovi › Izmijeni</p>
              <h1 className="text-3xl font-bold">Izmijeni let</h1>
              {flightData && (
                <p className="text-sm text-slate-200">
                  {flightData.airline?.name} · {flightData.route} · {formatDateDisplay(flightData.date)}
                </p>
              )}
            </div>
            <div className="flex flex-wrap justify-start lg:justify-end gap-3">
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => router.push('/flights')}
              >
                ← Nazad na listu
              </Button>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl px-5 py-4 mb-6 shadow-soft">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-700 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700 mb-1">Greška</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setError(null)}
                className="text-xs"
              >
                Zatvori
              </Button>
            </div>
          </div>
        )}

        {/* Form */}
        {flightData && (
          <div className="bg-white rounded-3xl shadow-soft border border-dark-100 p-6">
            <FlightForm
              defaultValues={{
                date: dateOnlyToUtc(flightData.date),
                airlineId: flightData.airlineId,
                aircraftTypeId: flightData.aircraftTypeId,
                registration: flightData.registration,
                route: flightData.route,
                operationTypeId: flightData.operationType?.id || flightData.operationTypeId,
                availableSeats: flightData.availableSeats,
                arrivalFlightNumber: flightData.arrivalFlightNumber,
                arrivalScheduledTime: flightData.arrivalScheduledTime
                  ? new Date(flightData.arrivalScheduledTime)
                  : null,
                arrivalActualTime: flightData.arrivalActualTime
                  ? new Date(flightData.arrivalActualTime)
                  : null,
                arrivalPassengers: flightData.arrivalPassengers,
                arrivalInfants: flightData.arrivalInfants,
                arrivalBaggage: flightData.arrivalBaggage,
                arrivalCargo: flightData.arrivalCargo,
                arrivalMail: flightData.arrivalMail,
                arrivalStatus: flightData.arrivalStatus,
                arrivalFerryIn: flightData.arrivalFerryIn,
                departureFlightNumber: flightData.departureFlightNumber,
                departureScheduledTime: flightData.departureScheduledTime
                  ? new Date(flightData.departureScheduledTime)
                  : null,
                departureActualTime: flightData.departureActualTime
                  ? new Date(flightData.departureActualTime)
                  : null,
                departurePassengers: flightData.departurePassengers,
                departureInfants: flightData.departureInfants,
                departureBaggage: flightData.departureBaggage,
                departureCargo: flightData.departureCargo,
                departureMail: flightData.departureMail,
                departureStatus: flightData.departureStatus,
                departureFerryOut: flightData.departureFerryOut,
                handlingAgent: flightData.handlingAgent,
                stand: flightData.stand,
                gate: flightData.gate,
              }}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
              submitLabel="Sačuvaj izmjene"
            />
          </div>
        )}
      </div>
    </MainLayout>
  );
}
