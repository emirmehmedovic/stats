'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { MainLayout } from '@/components/layout/MainLayout';
import { formatDateDisplay, formatTimeDisplay } from '@/lib/dates';

interface FlightDetail {
  id: string;
  date: string;
  airline: {
    name: string;
    icaoCode: string;
  };
  aircraftType: {
    model: string;
    seats: number;
  };
  registration: string;
  route: string;
  operationType: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  availableSeats: number | null;

  arrivalFlightNumber: string | null;
  arrivalScheduledTime: string | null;
  arrivalActualTime: string | null;
  arrivalPassengers: number | null;
  arrivalInfants: number | null;
  arrivalBaggage: number | null;
  arrivalCargo: number | null;
  arrivalMail: number | null;
  arrivalStatus: string;

  departureFlightNumber: string | null;
  departureScheduledTime: string | null;
  departureActualTime: string | null;
  departurePassengers: number | null;
  departureInfants: number | null;
  departureBaggage: number | null;
  departureCargo: number | null;
  departureMail: number | null;
  departureStatus: string;

  handlingAgent: string | null;
  stand: string | null;
  gate: string | null;

  isLocked: boolean;
  dataSource: string;
}

export default function FlightDetailPage() {
  const router = useRouter();
  const params = useParams();
  const flightId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [flight, setFlight] = useState<FlightDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
      setFlight(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri učitavanju leta');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Da li ste sigurni da želite obrisati ovaj let?')) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/flights/${flightId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri brisanju leta');
      }

      router.push('/flights');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Greška pri brisanju');
    } finally {
      setIsDeleting(false);
    }
  };

  const calculateDelay = (scheduled: string | null, actual: string | null): number | null => {
    if (!scheduled || !actual) return null;
    const diff = new Date(actual).getTime() - new Date(scheduled).getTime();
    return Math.round(diff / 60000);
  };

  const statusClasses = (status: string) => {
    if (status === 'OPERATED') return 'bg-green-50 text-green-700 border border-green-200';
    if (status === 'CANCELLED') return 'bg-rose-50 text-rose-700 border border-rose-200';
    return 'bg-amber-50 text-amber-700 border border-amber-200';
  };

  const metricCard = (label: string, value: string | number | null) => (
    <div className="p-4 rounded-2xl bg-white/80 border border-dark-100 shadow-sm">
      <p className="text-xs text-textMuted mb-1">{label}</p>
      <p className="text-lg font-semibold text-dark-900">{value ?? '-'}</p>
    </div>
  );

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

  if (error || !flight) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-3xl px-5 py-4 shadow-soft">
            <p className="text-sm text-red-700">{error || 'Let nije pronađen'}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/flights')}
              className="mt-3"
            >
              ← Nazad na listu
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const arrivalDelay = calculateDelay(flight.arrivalScheduledTime, flight.arrivalActualTime);
  const departureDelay = calculateDelay(
    flight.departureScheduledTime,
    flight.departureActualTime
  );

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white shadow-soft-xl p-6 md:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.12),transparent_25%)]"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Letovi › Detalji</p>
              <h1 className="text-3xl font-bold">{flight.airline.name} · {flight.route}</h1>
              <p className="text-sm text-slate-200">{formatDateDisplay(flight.date)}</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs">{flight.operationType.name}</span>
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs">Registracija: {flight.registration}</span>
              </div>
            </div>
            <div className="flex flex-wrap justify-start lg:justify-end gap-3">
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => router.push('/flights')}
              >
                ← Nazad
              </Button>
              <Button
                variant="outline"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                onClick={() => router.push(`/flights/${flightId}/edit`)}
                disabled={flight.isLocked}
              >
                Izmijeni
              </Button>
              <Button
                variant="destructive"
                className="bg-rose-500 hover:bg-rose-600 text-white"
                onClick={handleDelete}
                disabled={flight.isLocked || isDeleting}
              >
                {isDeleting ? 'Brišem...' : 'Obriši'}
              </Button>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border border-dark-100">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Osnovne informacije</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metricCard('Datum', formatDateDisplay(flight.date))}
            {metricCard('Aviokompanija', `${flight.airline.name} (${flight.airline.icaoCode})`)}
            {metricCard('Tip aviona', `${flight.aircraftType.model} (${flight.aircraftType.seats} sjedišta)`)}
            {metricCard('Registracija', flight.registration)}
            {metricCard('Ruta', flight.route)}
            {metricCard('Tip operacije', flight.operationType.name)}
            {flight.handlingAgent && metricCard('Handling agent', flight.handlingAgent)}
            {flight.stand && metricCard('Stand', flight.stand)}
            {flight.gate && metricCard('Gate', flight.gate)}
          </div>
        </div>

        {/* Arrival Section */}
        {flight.arrivalFlightNumber && (
          <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border border-dark-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-900">Dolazak (Arrival)</h3>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusClasses(flight.arrivalStatus)}`}>
                {flight.arrivalStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metricCard('Broj leta', flight.arrivalFlightNumber)}
              {flight.arrivalScheduledTime && metricCard('Planirano', formatTimeDisplay(flight.arrivalScheduledTime))}
              {flight.arrivalActualTime && metricCard('Stvarno', formatTimeDisplay(flight.arrivalActualTime))}
              {arrivalDelay !== null && metricCard('Kašnjenje', `${arrivalDelay > 0 ? '+' : ''}${arrivalDelay} min`)}
            </div>

            <div className="mt-4 pt-4 border-t border-borderSoft">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {flight.arrivalPassengers !== null && metricCard('Putnici', flight.arrivalPassengers)}
                {flight.arrivalInfants !== null && metricCard('Bebe', flight.arrivalInfants)}
                {flight.arrivalBaggage !== null && metricCard('Prtljag (kg)', flight.arrivalBaggage)}
                {flight.arrivalCargo !== null && metricCard('Cargo (kg)', flight.arrivalCargo)}
                {flight.arrivalMail !== null && metricCard('Pošta (kg)', flight.arrivalMail)}
              </div>
            </div>
          </div>
        )}

        {/* Departure Section */}
        {flight.departureFlightNumber && (
          <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border border-dark-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-dark-900">Odlazak (Departure)</h3>
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusClasses(flight.departureStatus)}`}>
                {flight.departureStatus}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {metricCard('Broj leta', flight.departureFlightNumber)}
              {flight.departureScheduledTime && metricCard('Planirano', formatTimeDisplay(flight.departureScheduledTime))}
              {flight.departureActualTime && metricCard('Stvarno', formatTimeDisplay(flight.departureActualTime))}
              {departureDelay !== null && metricCard('Kašnjenje', `${departureDelay > 0 ? '+' : ''}${departureDelay} min`)}
            </div>

            <div className="mt-4 pt-4 border-t border-borderSoft">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {flight.departurePassengers !== null && metricCard('Putnici', flight.departurePassengers)}
                {flight.departureInfants !== null && metricCard('Bebe', flight.departureInfants)}
                {flight.departureBaggage !== null && metricCard('Prtljag (kg)', flight.departureBaggage)}
                {flight.departureCargo !== null && metricCard('Cargo (kg)', flight.departureCargo)}
                {flight.departureMail !== null && metricCard('Pošta (kg)', flight.departureMail)}
              </div>
            </div>
          </div>
        )}

        {/* Lock warning */}
        {flight.isLocked && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl px-5 py-4">
            <p className="text-sm text-amber-800">
              <strong>Napomena:</strong> Ovaj let je zaključan i ne može biti izmijenjen ili obrisan.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
