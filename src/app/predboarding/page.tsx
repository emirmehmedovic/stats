'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Users, Clock, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { formatDateStringWithDay, formatTimeDisplay, getTodayDateString } from '@/lib/dates';

interface BoardingManifest {
  id: string;
  boardingStatus: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  uploadedAt: string;
}

interface Flight {
  id: string;
  date: string;
  departureFlightNumber: string | null;
  route: string;
  departureScheduledTime: string | null;
  airline: {
    id: string;
    name: string;
    icaoCode: string;
    logoUrl: string | null;
  };
  aircraftType: {
    id: string;
    model: string;
  } | null;
  boardingManifest?: BoardingManifest | null;
}

export default function PreboardingPage() {
  const router = useRouter();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = getTodayDateString();
  const todayDisplay = formatDateStringWithDay(today);
  const activeFlights = flights.filter((flight) => flight.boardingManifest?.boardingStatus !== 'COMPLETED');
  const completedFlights = flights.filter((flight) => flight.boardingManifest?.boardingStatus === 'COMPLETED');

  useEffect(() => {
    fetchTodayFlights();
  }, []);

  const fetchTodayFlights = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/predboarding/today-flights');

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Greška pri učitavanju letova');
      }

      const result = await response.json();
      setFlights(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFlightClick = (flight: Flight) => {
    // Don't allow click on completed flights
    if (flight.boardingManifest?.boardingStatus === 'COMPLETED') {
      return;
    }

    if (flight.boardingManifest) {
      // Navigate to boarding interface if manifest exists
      router.push(`/predboarding/${flight.boardingManifest.id}`);
    } else {
      // Navigate to upload page if no manifest
      router.push(`/predboarding/upload?flightId=${flight.id}`);
    }
  };

  const getStatusBadge = (flight: Flight) => {
    if (!flight.boardingManifest) {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-dark-100 text-dark-600 text-xs font-semibold">
          <Upload className="w-3.5 h-3.5" />
          Potreban upload
        </div>
      );
    }

    if (flight.boardingManifest.boardingStatus === 'IN_PROGRESS') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
          <Clock className="w-3.5 h-3.5" />
          U toku
        </div>
      );
    }

    if (flight.boardingManifest.boardingStatus === 'COMPLETED') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Završeno
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
        <AlertCircle className="w-3.5 h-3.5" />
        Otkazano
      </div>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
              <p className="text-dark-500">Učitavam letove...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 lg:p-8 space-y-4 lg:space-y-8">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-2xl lg:rounded-3xl p-4 lg:p-8 text-white shadow-soft-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4 lg:mb-6">
              <div>
                <h1 className="text-2xl lg:text-4xl font-bold mb-2">Predboarding</h1>
                <p className="text-dark-300 text-sm lg:text-lg">{todayDisplay}</p>
              </div>
              <div className="p-3 lg:p-4 bg-white/10 rounded-xl lg:rounded-2xl backdrop-blur-md">
                <Users className="w-6 h-6 lg:w-8 lg:h-8 text-white" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 lg:gap-4">
              <div className="p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs uppercase tracking-wide text-dark-200 font-semibold mb-1">Otvoreni letovi</p>
                <p className="text-xl lg:text-2xl font-bold text-primary-200">{activeFlights.length}</p>
              </div>
              <div
                className="p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all"
                onClick={() => {
                  const activeCount = flights.filter(f => f.boardingManifest?.boardingStatus === 'IN_PROGRESS').length;
                  if (activeCount > 0) {
                    router.push('/predboarding/active');
                  }
                }}
              >
                <p className="text-xs uppercase tracking-wide text-dark-200 font-semibold mb-1">Aktivni boarding</p>
                <p className="text-xl lg:text-2xl font-bold text-blue-200">
                  {flights.filter(f => f.boardingManifest?.boardingStatus === 'IN_PROGRESS').length}
                </p>
                {flights.filter(f => f.boardingManifest?.boardingStatus === 'IN_PROGRESS').length > 0 && (
                  <p className="text-xs text-blue-200 mt-1">Kliknite za pregled</p>
                )}
              </div>
              <div className="p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs uppercase tracking-wide text-dark-200 font-semibold mb-1">Završeni</p>
                <p className="text-xl lg:text-2xl font-bold text-green-200">{completedFlights.length}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Active Boarding Quick Access */}
        {flights.filter(f => f.boardingManifest?.boardingStatus === 'IN_PROGRESS').length > 0 && (
          <section>
            <div
              onClick={() => router.push('/predboarding/active')}
              className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl lg:rounded-3xl p-4 lg:p-8 text-white shadow-soft-xl cursor-pointer hover:shadow-soft-2xl hover:scale-[1.02] transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-20 transition-opacity"></div>
              <div className="relative z-10 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg lg:text-2xl font-bold mb-2">🚀 Aktivni boarding u toku</h3>
                  <p className="text-blue-100 text-sm lg:text-base mb-3 lg:mb-4">
                    Trenutno imate {flights.filter(f => f.boardingManifest?.boardingStatus === 'IN_PROGRESS').length} aktivnih letova
                  </p>
                  <div className="flex items-center gap-2 text-xs lg:text-sm bg-white/20 backdrop-blur-sm rounded-full px-3 lg:px-4 py-1.5 lg:py-2 w-fit">
                    <Users className="w-3 h-3 lg:w-4 lg:h-4" />
                    <span className="hidden md:inline">Kliknite za unified boarding view</span>
                    <span className="md:hidden">Unified view</span>
                  </div>
                </div>
                <div className="p-4 lg:p-6 bg-white/10 rounded-2xl lg:rounded-3xl backdrop-blur-md group-hover:scale-110 transition-transform">
                  <Users className="w-8 h-8 lg:w-12 lg:h-12" />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Flights List */}
        <section>
          <div className="mb-4 lg:mb-6">
            <h2 className="text-xl lg:text-2xl font-bold text-dark-900">Današnji odlasci</h2>
            <p className="text-sm text-dark-500 mt-1">Otvoreni letovi su odvojeni od onih sa završenim boardingom</p>
          </div>

          {flights.length === 0 ? (
            <div className="bg-white rounded-2xl lg:rounded-3xl p-8 lg:p-12 shadow-soft text-center">
              <Plane className="w-16 h-16 text-dark-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-dark-900 mb-2">Nema letova danas</h3>
              <p className="text-dark-500">Trenutno nema zakazanih odlaznih letova za danas.</p>
            </div>
          ) : (
            <div className="space-y-6 lg:space-y-10">
              {activeFlights.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-4 lg:mb-5 gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg lg:text-xl font-bold text-dark-900">Otvoreni za rad</h3>
                      <p className="text-xs lg:text-sm text-dark-500 mt-1">Upload manifesta ili nastavak boardinga</p>
                    </div>
                    <div className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-full bg-primary-100 text-primary-700 text-xs lg:text-sm font-bold whitespace-nowrap">
                      {activeFlights.length} let{activeFlights.length === 1 ? '' : 'a'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                    {activeFlights.map((flight) => (
                      <div
                        key={flight.id}
                        onClick={() => handleFlightClick(flight)}
                        className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-soft transition-all border-2 lg:border-4 border-primary-50 group relative overflow-hidden hover:shadow-soft-lg cursor-pointer hover:border-primary-200"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/70 via-white to-blue-50/50 opacity-0 group-hover:opacity-100 transition-all"></div>
                        <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-primary-200 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-all"></div>

                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-3 lg:mb-4 gap-2">
                            <div className="flex items-center gap-2 lg:gap-3 flex-1">
                              {flight.airline.logoUrl ? (
                                <img
                                  src={flight.airline.logoUrl}
                                  alt={flight.airline.name}
                                  className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl object-contain bg-white border border-dark-100 p-1"
                                />
                              ) : (
                                <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-lg lg:rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs lg:text-sm">
                                  {flight.airline.icaoCode}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-dark-900 text-sm leading-tight truncate">{flight.airline.name}</p>
                                <p className="text-xs text-dark-500 uppercase tracking-wide">{flight.airline.icaoCode}</p>
                              </div>
                            </div>
                            {getStatusBadge(flight)}
                          </div>

                          <div className="mb-3 lg:mb-4 p-3 lg:p-4 rounded-xl lg:rounded-2xl bg-dark-50 border border-dark-100">
                            {flight.departureFlightNumber ? (
                              <>
                                <div className="flex items-center justify-between mb-1.5 lg:mb-2">
                                  <p className="text-xs text-dark-500 font-semibold uppercase tracking-wide">Broj leta</p>
                                  <p className="text-base lg:text-lg font-bold text-dark-900">{flight.departureFlightNumber}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-dark-500 font-semibold uppercase tracking-wide">Ruta</p>
                                  <p className="text-sm font-bold text-primary-600">{flight.route}</p>
                                </div>
                              </>
                            ) : (
                              <div>
                                <p className="text-xs text-dark-500 font-semibold uppercase tracking-wide mb-1.5 lg:mb-2">Ruta</p>
                                <p className="text-base lg:text-lg font-bold text-primary-600">{flight.route}</p>
                                <p className="text-xs text-dark-400 mt-1">Broj leta nije unesen</p>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 lg:gap-3">
                            <div className="p-2.5 lg:p-3 rounded-xl lg:rounded-2xl bg-blue-50 border border-blue-100">
                              <div className="flex items-center gap-1.5 lg:gap-2 mb-1">
                                <Clock className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-blue-600" />
                                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Polazak</p>
                              </div>
                              <p className="text-base lg:text-lg font-bold text-blue-900">
                                {flight.departureScheduledTime ? formatTimeDisplay(flight.departureScheduledTime) : 'N/A'}
                              </p>
                            </div>
                            <div className="p-2.5 lg:p-3 rounded-xl lg:rounded-2xl bg-indigo-50 border border-indigo-100">
                              <div className="flex items-center gap-1.5 lg:gap-2 mb-1">
                                <Plane className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-indigo-600" />
                                <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">Avion</p>
                              </div>
                              <p className="text-sm font-bold text-indigo-900">
                                {flight.aircraftType?.model || 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-dark-100">
                            <p className="text-xs text-dark-500 text-center">
                              {flight.boardingManifest
                                ? 'Kliknite za nastavak boardinga'
                                : 'Kliknite za upload manifesta'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {completedFlights.length > 0 && (
                <div className="rounded-2xl lg:rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4 lg:p-6">
                  <div className="flex items-center justify-between mb-4 lg:mb-5 gap-3">
                    <div className="flex-1">
                      <h3 className="text-lg lg:text-xl font-bold text-green-900">Završeni boarding</h3>
                      <p className="text-xs lg:text-sm text-green-700/80 mt-1">Ovi letovi su finalizovani i zaključani za izmjene</p>
                    </div>
                    <div className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-full bg-green-600 text-white text-xs lg:text-sm font-bold whitespace-nowrap">
                      {completedFlights.length} završeno
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                    {completedFlights.map((flight) => (
                      <div
                        key={flight.id}
                        className="rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-green-200 bg-white/80 backdrop-blur-sm relative overflow-hidden opacity-85"
                      >
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(34,197,94,0.08),transparent_45%,rgba(22,163,74,0.12))]"></div>
                        <div className="relative z-10">
                          <div className="flex items-start justify-between mb-3 lg:mb-4 gap-2">
                            <div className="flex items-center gap-3">
                              {flight.airline.logoUrl ? (
                                <img
                                  src={flight.airline.logoUrl}
                                  alt={flight.airline.name}
                                  className="w-12 h-12 rounded-xl object-contain bg-white border border-green-100 p-1"
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 font-bold flex items-center justify-center text-sm">
                                  {flight.airline.icaoCode}
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-dark-900 text-sm leading-tight">{flight.airline.name}</p>
                                <p className="text-xs text-dark-500 uppercase tracking-wide">{flight.airline.icaoCode}</p>
                              </div>
                            </div>
                            {getStatusBadge(flight)}
                          </div>

                          <div className="mb-4 p-4 rounded-2xl bg-green-50 border border-green-100">
                            {flight.departureFlightNumber ? (
                              <>
                                <div className="flex items-center justify-between mb-2">
                                  <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">Broj leta</p>
                                  <p className="text-lg font-bold text-green-950">{flight.departureFlightNumber}</p>
                                </div>
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">Ruta</p>
                                  <p className="text-sm font-bold text-green-800">{flight.route}</p>
                                </div>
                              </>
                            ) : (
                              <div>
                                <p className="text-xs text-green-700 font-semibold uppercase tracking-wide mb-2">Ruta</p>
                                <p className="text-lg font-bold text-green-800">{flight.route}</p>
                                <p className="text-xs text-green-700/70 mt-1">Broj leta nije unesen</p>
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-2xl bg-white border border-green-100">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-3.5 h-3.5 text-green-600" />
                                <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">Polazak</p>
                              </div>
                              <p className="text-lg font-bold text-green-950">
                                {flight.departureScheduledTime ? formatTimeDisplay(flight.departureScheduledTime) : 'N/A'}
                              </p>
                            </div>
                            <div className="p-3 rounded-2xl bg-white border border-green-100">
                              <div className="flex items-center gap-2 mb-1">
                                <Plane className="w-3.5 h-3.5 text-green-600" />
                                <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">Avion</p>
                              </div>
                              <p className="text-sm font-bold text-green-950">
                                {flight.aircraftType?.model || 'N/A'}
                              </p>
                            </div>
                          </div>

                          <div className="mt-4 pt-4 border-t border-green-100">
                            <p className="text-xs text-green-800 text-center font-semibold">
                              Boarding završen, manifest finalizovan
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
}
