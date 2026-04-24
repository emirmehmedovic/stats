'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FlightForm } from '@/components/flights/FlightForm';
import { CreateFlightInput } from '@/lib/validators/flight';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { dateOnlyToUtc } from '@/lib/dates';

function NewFlightContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [defaultDate, setDefaultDate] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Get date from query params if coming from daily-operations
    const dateParam = searchParams.get('date');
    if (dateParam) {
      setDefaultDate(dateParam);
    }
  }, [searchParams]);

  const handleSubmit = async (data: CreateFlightInput) => {
    console.log('handleSubmit called with data:', data);
    setIsSubmitting(true);
    setError(null);

    try {
      console.log('Sending request to /api/flights with data:', JSON.stringify(data, null, 2));
      const response = await fetch('/api/flights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Greška pri kreiranju leta');
      }

      // Redirect based on where user came from
      const dateParam = searchParams.get('date');
      if (dateParam) {
        // If coming from daily-operations, redirect back there with the date
        router.push(`/daily-operations?date=${dateParam}`);
      } else {
        // Otherwise redirect to flights list
        router.push('/flights');
      }
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-dark-900">Dodaj novi let</h1>
            <p className="text-dark-600 mt-1 text-sm lg:text-base">Kreiranje novog leta</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push('/flights')} className="self-start sm:self-auto">
            ← Nazad na listu
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl lg:rounded-2xl px-4 lg:px-5 py-3 lg:py-4">
            <div className="flex items-start gap-2 lg:gap-3">
              <svg
                className="w-4 h-4 lg:w-5 lg:h-5 text-red-700 mt-0.5 flex-shrink-0"
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
                <p className="text-xs lg:text-sm font-semibold text-red-700 mb-1">Greška</p>
                <p className="text-xs lg:text-sm text-red-600">{error}</p>
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
        <FlightForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Kreiraj let"
          minimalMode
          defaultValues={
            defaultDate
              ? {
                  date: dateOnlyToUtc(defaultDate),
                }
              : undefined
          }
        />
      </div>
    </MainLayout>
  );
}

export default function NewFlightPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="p-4 lg:p-8">
            <div className="text-sm text-dark-600">Učitavam...</div>
          </div>
        </MainLayout>
      }
    >
      <NewFlightContent />
    </Suspense>
  );
}
