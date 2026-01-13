'use client';

import { Suspense, useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Calendar,
  Plane,
  PlaneLanding,
  PlaneTakeoff,
  Briefcase,
  Gauge,
  Timer,
  Edit,
  Users,
  Sparkles,
  Lock,
  AlertCircle,
  DoorClosed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  formatDateString,
  formatDateStringWithDay,
  getPreviousDateString,
  getTodayDateString,
  TIME_ZONE_SARAJEVO,
} from '@/lib/dates';

type Flight = {
  id: string;
  date: string;
  route: string;
  airline: {
    id: string;
    name: string;
    icaoCode: string;
    logoUrl: string | null;
  };
  verifiedByUser?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  aircraftType: {
    id: string;
    model: string;
  } | null;
  arrivalScheduledTime: string | null;
  arrivalActualTime: string | null;
  departureScheduledTime: string | null;
  departureActualTime: string | null;
  arrivalPassengers: number | null;
  arrivalFerryIn: boolean;
  departurePassengers: number | null;
  departureFerryOut: boolean;
  arrivalLoadFactor: number | null;
  departureLoadFactor: number | null;
  arrivalBaggage: number | null;
  departureBaggage: number | null;
  arrivalBaggageCount: number | null;
  departureBaggageCount: number | null;
  arrivalCargo: number | null;
  departureCargo: number | null;
  arrivalMail: number | null;
  departureMail: number | null;
  arrivalInfants: number | null;
  departureInfants: number | null;
  isLocked: boolean;
  isVerified: boolean;
  departureDoorClosingTime: string | null;
  _count?: {
    delays: number;
  };
  delays?: Array<{
    id: string;
    unofficialReason: string | null;
  }>;
};

function DailyOperationsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [flights, setFlights] = useState<Flight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const today = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState(today);
  const [pendingDate, setPendingDate] = useState(today);
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyWithDelays, setShowOnlyWithDelays] = useState(false);
  const [showOnlyWithDoorClosing, setShowOnlyWithDoorClosing] = useState(false);
  const [allPastVerified, setAllPastVerified] = useState(true);
  const [pendingVerificationDate, setPendingVerificationDate] = useState<string | null>(null);
  const [pendingVerificationDates, setPendingVerificationDates] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<'ADMIN' | 'MANAGER' | 'OPERATIONS' | 'VIEWER' | 'STW' | null>(null);

  useEffect(() => {
    // Get date from query params if available
    const dateParam = searchParams?.get('date');
    if (dateParam) {
      setSelectedDate(dateParam);
      setPendingDate(dateParam);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchFlights();
    const role = localStorage.getItem('userRole') as 'ADMIN' | 'MANAGER' | 'OPERATIONS' | 'VIEWER' | 'STW' | null;
    setUserRole(role);
  }, [selectedDate]);

  const fetchPendingStatus = async (dateStr: string) => {
    try {
      const res = await fetch(`/api/daily-operations/verification/pending?date=${dateStr}`);
      const data = await res.json();
      if (!res.ok || !data?.success) return null;
      return data?.data || null;
    } catch (err) {
      console.error('Error fetching pending verification status:', err);
      return null;
    }
  };

  useEffect(() => {
    let isActive = true;

    const loadVerification = async () => {
      if (selectedDate === today) {
        const pendingStatus = await fetchPendingStatus(today);
        if (isActive) {
          const allVerified = !!pendingStatus?.allVerified;
          setAllPastVerified(allVerified);
          setPendingVerificationDate(pendingStatus?.latestPendingDate || null);
          setPendingVerificationDates(pendingStatus?.pendingDates || []);
        }
      } else {
        setAllPastVerified(true);
        setPendingVerificationDate(null);
        setPendingVerificationDates([]);
      }

    };

    loadVerification();

    return () => {
      isActive = false;
    };
  }, [selectedDate, today]);

  const fetchFlights = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        dateFrom: selectedDate,
        dateTo: selectedDate,
        limit: '100',
      });

      const url = `/api/flights?${params.toString()}`;
      console.log('Fetching flights:', url);
      
      const response = await fetch(url);
      const result = await response.json();

      console.log('API Response:', { success: result.success, dataLength: result.data?.length, error: result.error });

      if (result.success) {
        // API returns { data: Flight[], pagination: {...} }
        const flightsArray = Array.isArray(result.data) ? result.data : [];
        console.log('Setting flights:', flightsArray.length);
        setFlights(flightsArray);
      } else {
        setError(result.error || 'Greška pri učitavanju letova');
        if (result.details) {
          console.error('Validation errors:', result.details);
        }
      }
    } catch (err) {
      setError('Greška pri učitavanju letova');
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const hasData = (flight: Flight) => {
    return (
      flight.arrivalPassengers !== null ||
      flight.departurePassengers !== null ||
      flight.arrivalBaggage !== null ||
      flight.departureBaggage !== null ||
      flight.arrivalCargo !== null ||
      flight.departureCargo !== null
    );
  };

  const sortTimeValue = (time: string | null) => {
    if (!time) return Number.POSITIVE_INFINITY;
    const parsed = new Date(time).getTime();
    return Number.isNaN(parsed) ? Number.POSITIVE_INFINITY : parsed;
  };

  const getLoadFactor = (flight: Flight) => {
    const values = [flight.arrivalLoadFactor, flight.departureLoadFactor].filter(
      (value): value is number => value !== null && !Number.isNaN(value)
    );
    if (!values.length) return null;
    const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
    return Math.round(avg);
  };

  const getDelayMinutes = (scheduled: string | null, actual: string | null) => {
    if (!scheduled || !actual) return null;
    const delay = new Date(actual).getTime() - new Date(scheduled).getTime();
    if (Number.isNaN(delay)) return null;
    return Math.max(0, Math.round(delay / 60000));
  };

  const filteredFlights = flights.filter(flight => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = (
        flight.route.toLowerCase().includes(search) ||
        flight.airline.name.toLowerCase().includes(search) ||
        flight.airline.icaoCode.toLowerCase().includes(search)
      );
      if (!matchesSearch) return false;
    }

    // Delay filter
    if (showOnlyWithDelays && (!flight._count || flight._count.delays === 0)) {
      return false;
    }

    // Door closing time filter
    if (showOnlyWithDoorClosing && !flight.departureDoorClosingTime) {
      return false;
    }

    return true;
  });

  const sortedFlights = useMemo(() => {
    return [...filteredFlights].sort((a, b) => {
      return sortTimeValue(a.departureScheduledTime) - sortTimeValue(b.departureScheduledTime);
    });
  }, [filteredFlights]);

  const summary = useMemo(() => {
    const totalFlights = filteredFlights.length;
    const withData = filteredFlights.filter(hasData).length;
    const totalArrivals = filteredFlights.reduce(
      (sum, f) => sum + (f.arrivalFerryIn ? 0 : (f.arrivalPassengers || 0)),
      0
    );
    const totalDepartures = filteredFlights.reduce(
      (sum, f) => sum + (f.departureFerryOut ? 0 : (f.departurePassengers || 0)),
      0
    );
    return {
      totalFlights,
      withData,
      totalArrivals,
      totalDepartures,
    };
  }, [filteredFlights]);

  const verificationSummary = useMemo(() => {
    const totalFlights = flights.length;
    const verifiedFlights = flights.filter((flight) => flight.isVerified).length;
    return { totalFlights, verifiedFlights };
  }, [flights]);

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleTimeString('bs-BA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: TIME_ZONE_SARAJEVO,
    });
  };

  const applyDateFilter = () => {
    if (pendingDate && pendingDate !== selectedDate) {
      setSelectedDate(pendingDate);
    }
  };

  const yesterdayDate = getPreviousDateString(today);
  const requiresPastVerification = selectedDate === today;
  const canEditSelectedDate = !requiresPastVerification || allPastVerified || userRole === 'ADMIN';


  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <LoadingSpinner text="Učitavam letove..." />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="p-8">
          <ErrorDisplay error={error} onRetry={fetchFlights} />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white shadow-soft-xl p-6">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.12),transparent_25%)]"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-300">Operativni pregled</p>
              <h1 className="text-3xl font-bold">Dnevne operacije</h1>
              <p className="text-sm text-slate-200">Unos i pregled podataka za letove</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 backdrop-blur">
                <Calendar className="w-4 h-4 text-primary-200" />
                <span className="text-sm">{formatDateString(selectedDate)}</span>
              </div>
              <Button
                className="bg-primary-500 hover:bg-primary-600 text-white shadow-lg"
                onClick={() => router.push(`/flights/new?date=${selectedDate}`)}
                disabled={!canEditSelectedDate}
              >
                + Dodaj vanredni let
              </Button>
            </div>
          </div>
        </div>

        {/* Filters + quick stats */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-3xl shadow-soft relative overflow-hidden p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-white/60 to-primary-100/40"></div>
            <div className="relative z-10 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Datum
                  </label>
                  <Input
                    type="date"
                    value={pendingDate}
                    onChange={(e) => setPendingDate(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') applyDateFilter();
                    }}
                    className="w-full bg-white/80"
                  />
                  <Button
                    variant="outline"
                    className="mt-2 w-full"
                    onClick={applyDateFilter}
                    disabled={!pendingDate || pendingDate === selectedDate}
                  >
                    Primijeni datum
                  </Button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-dark-700 mb-2">
                    Pretraga (ruta, aviokompanija)
                  </label>
                  <Input
                    type="text"
                    placeholder="Pretraži letove..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/80"
                  />
                </div>
              </div>

              {/* Filter Checkboxes */}
              <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-200">
                <label className="flex items-center gap-2 text-sm text-dark-700 cursor-pointer hover:text-dark-900">
                  <input
                    type="checkbox"
                    checked={showOnlyWithDelays}
                    onChange={(e) => setShowOnlyWithDelays(e.target.checked)}
                    className="rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                  />
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  Samo sa delay kodovima
                </label>
                <label className="flex items-center gap-2 text-sm text-dark-700 cursor-pointer hover:text-dark-900">
                  <input
                    type="checkbox"
                    checked={showOnlyWithDoorClosing}
                    onChange={(e) => setShowOnlyWithDoorClosing(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <DoorClosed className="w-4 h-4 text-blue-600" />
                  Samo sa vremenom zatvaranja vrata
                </label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: 'Letova danas',
                value: summary.totalFlights,
                icon: Plane,
                accent: 'bg-blue-50 text-blue-700',
              },
              {
                label: 'Popunjeno',
                value: summary.withData,
                icon: Sparkles,
                accent: 'bg-indigo-50 text-indigo-700',
              },
              {
                label: 'Dolazni putnici',
                value: summary.totalArrivals.toLocaleString('bs-BA'),
                icon: Users,
                accent: 'bg-primary-50 text-primary-700',
              },
              {
                label: 'Odlazni putnici',
                value: summary.totalDepartures.toLocaleString('bs-BA'),
                icon: Users,
                accent: 'bg-sky-50 text-sky-700',
              },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-3xl p-4 shadow-soft relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 via-white/70 to-primary-100/30 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-16 h-16 bg-primary-200 rounded-full blur-2xl opacity-50 group-hover:opacity-80"></div>
                <div className="relative z-10 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">{card.label}</p>
                    <p className="text-2xl font-bold text-dark-900">{card.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${card.accent}`}>
                    <card.icon className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Flights List */}
        <div className="bg-white rounded-3xl shadow-soft overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-white/70 to-primary-100/40"></div>
          <div className="relative z-10">
            <div className="p-6 border-b border-dark-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-100">
              <div>
                <h2 className="text-lg font-bold text-dark-900">
                  Letovi za {formatDateStringWithDay(selectedDate)}
                </h2>
                <p className="text-sm text-dark-600 mt-1">
                  {filteredFlights.length} let(ova)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="px-3 py-2 rounded-2xl bg-primary-50 text-primary-700 text-xs font-semibold">
                  Popunjeno: {summary.withData}/{summary.totalFlights}
                </div>
                <Button
                  onClick={() => router.push(`/daily-operations/${filteredFlights[0]?.id || ''}`)}
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={!filteredFlights.length || !canEditSelectedDate}
                >
                  <Edit className="w-4 h-4" />
                  Unesi podatke
                </Button>
              </div>
            </div>

            {!canEditSelectedDate && (
              <div className="mx-6 mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <Lock className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  Prije unosa podataka za današnje letove, potrebno je verifikovati operacije za{' '}
                  {formatDateStringWithDay(pendingVerificationDate || yesterdayDate)}.
                </div>
              </div>
            )}
            {selectedDate === today && allPastVerified && (
              <div className="mx-6 mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-600 mt-0.5" />
                <div className="text-sm text-emerald-800">
                  Sve prethodne operacije su verifikovane. Možete unositi današnje podatke.
                </div>
              </div>
            )}
            {selectedDate === today && !allPastVerified && pendingVerificationDates.length > 0 && (
              <div className="mx-6 mt-4 bg-white border border-amber-200 rounded-2xl p-4">
                <p className="text-sm font-semibold text-dark-900 mb-2">Ne-verifikovani datumi:</p>
                <div className="flex flex-wrap gap-2">
                  {pendingVerificationDates.map((dateStr) => (
                    <button
                      key={dateStr}
                      onClick={() => {
                        setSelectedDate(dateStr);
                        setPendingDate(dateStr);
                      }}
                      className="px-3 py-1.5 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200 hover:bg-amber-100"
                    >
                      {formatDateString(dateStr)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredFlights.length === 0 ? (
              <div className="p-12 text-center">
                <Plane className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p className="text-dark-600">Nema letova za odabrani datum</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sortedFlights.map((flight) => (
                  <div
                    key={flight.id}
                    className="p-6 relative overflow-hidden group"
                  >
                    <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-50/30 via-white/80 to-primary-100/40 opacity-60 group-hover:opacity-90 transition-all`}></div>
                    <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {flight.airline.logoUrl && (
                            <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center border border-dark-100 rounded-xl bg-white p-2 shadow-sm">
                              <img
                                src={flight.airline.logoUrl}
                                alt={`${flight.airline.name} logo`}
                                className="max-w-full max-h-full object-contain rounded-lg"
                                onError={(e) => {
                                  // Fallback ako se slika ne može učitati
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            </div>
                          )}
                          <div className="px-3 py-1 rounded-xl bg-white shadow-sm border border-dark-100 text-xs font-semibold text-dark-700">
                            {flight.route}
                          </div>
                          <span className="text-sm text-dark-600">
                            {flight.airline.name} ({flight.airline.icaoCode})
                          </span>
                          {hasData(flight) && (
                            <span className="px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-semibold rounded-full border border-primary-100">
                              Podaci uneseni
                            </span>
                          )}
                          {flight.isVerified && (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
                              Verifikovano
                            </span>
                          )}
                          {flight.isVerified && flight.verifiedByUser && (
                            <span className="text-xs text-emerald-700">
                              Verifikovao: {flight.verifiedByUser.name || flight.verifiedByUser.email}
                            </span>
                          )}
                          {flight.aircraftType && (
                            <span className="text-xs text-dark-500 flex items-center gap-1">
                              <Plane className="w-3 h-3" /> {flight.aircraftType.model}
                            </span>
                          )}
                          {flight.departureDoorClosingTime && (
                            <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-200 flex items-center gap-1">
                              <DoorClosed className="w-3 h-3" />
                              Vrata zatvorena
                            </span>
                          )}
                          {flight._count && flight._count.delays > 0 && (
                            <span className="px-2.5 py-1 bg-orange-50 text-orange-700 text-xs font-semibold rounded-full border border-orange-200 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {flight._count.delays} {flight._count.delays === 1 ? 'delay' : 'delaya'}
                            </span>
                          )}
                          {flight.delays && flight.delays.some(d => d.unofficialReason) && (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-full border border-slate-300 flex items-center gap-1">
                              <Lock className="w-3 h-3" />
                              Neoficijelni razlog
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 text-sm">
                          <div className="relative p-3.5 rounded-2xl border-[6px] border-white bg-white/90 shadow-soft overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/70 via-white/80 to-slate-100/70 opacity-80"></div>
                            <div className="relative z-10 flex items-center justify-between text-dark-500 mb-2">
                              <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
                                <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                                  <PlaneLanding className="w-4 h-4" />
                                </span>
                                <span>Dolazak</span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">ARR</span>
                            </div>
                            <p className="relative z-10 font-semibold text-dark-900">
                              {formatTime(flight.arrivalScheduledTime)}
                            </p>
                            {flight.arrivalPassengers !== null && (
                              <p className="relative z-10 text-xs text-dark-500">
                                {flight.arrivalPassengers} putnika
                              </p>
                            )}
                          </div>

                          <div className="relative p-3.5 rounded-2xl border-[6px] border-white bg-white/90 shadow-soft overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-stone-50/70 via-white/80 to-stone-100/70 opacity-80"></div>
                            <div className="relative z-10 flex items-center justify-between text-dark-500 mb-2">
                              <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
                                <span className="w-7 h-7 rounded-xl bg-stone-100 text-stone-600 flex items-center justify-center">
                                  <PlaneTakeoff className="w-4 h-4" />
                                </span>
                                <span>Odlazak</span>
                              </div>
                              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 text-[10px] font-semibold">DEP</span>
                            </div>
                            <p className="relative z-10 font-semibold text-dark-900">
                              {formatTime(flight.departureScheduledTime)}
                            </p>
                            {flight.departurePassengers !== null && (
                              <p className="relative z-10 text-xs text-dark-500">
                                {flight.departurePassengers} putnika
                              </p>
                            )}
                          </div>

                          <div className="relative p-3.5 rounded-2xl border-[6px] border-white bg-white/90 shadow-soft overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/70 via-white/80 to-slate-100/70 opacity-80"></div>
                            <div className="relative z-10 text-dark-500 mb-1 text-xs uppercase tracking-wide">Prtljag</div>
                            <p className="relative z-10 font-semibold text-dark-900">
                              {flight.arrivalBaggage || flight.departureBaggage
                                ? `${(flight.arrivalBaggage || 0) + (flight.departureBaggage || 0)} kg`
                                : '-'}
                            </p>
                          </div>

                          <div className="relative p-3.5 rounded-2xl border-[6px] border-white bg-white/90 shadow-soft overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-stone-50/70 via-white/80 to-stone-100/70 opacity-80"></div>
                            <div className="relative z-10 flex items-center justify-between text-dark-500 mb-1">
                              <span className="text-xs uppercase tracking-wide">Koferi</span>
                              <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center">
                                <Briefcase className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <p className="relative z-10 font-semibold text-dark-900">
                              {flight.arrivalBaggageCount || flight.departureBaggageCount
                                ? `${(flight.arrivalBaggageCount || 0) + (flight.departureBaggageCount || 0)}`
                                : '-'}
                            </p>
                          </div>

                          <div className="relative p-3.5 rounded-2xl border-[6px] border-white bg-white/90 shadow-soft overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/70 via-white/80 to-slate-100/70 opacity-80"></div>
                            <div className="relative z-10 flex items-center justify-between text-dark-500 mb-1">
                              <span className="text-xs uppercase tracking-wide">Load factor</span>
                              <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                                <Gauge className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <p className="relative z-10 font-semibold text-dark-900">
                              {getLoadFactor(flight) !== null ? `${getLoadFactor(flight)}%` : '-'}
                            </p>
                          </div>

                          <div className="relative p-3.5 rounded-2xl border-[6px] border-white bg-white/90 shadow-soft overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-stone-50/70 via-white/80 to-stone-100/70 opacity-80"></div>
                            <div className="relative z-10 flex items-center justify-between text-dark-500 mb-1">
                              <span className="text-xs uppercase tracking-wide">Tačnost</span>
                              <span className="w-6 h-6 rounded-lg bg-stone-100 text-stone-600 flex items-center justify-center">
                                <Timer className="w-3.5 h-3.5" />
                              </span>
                            </div>
                            <div className="relative z-10 space-y-1 text-xs text-dark-600">
                              <p>
                                Dolazak {getDelayMinutes(flight.arrivalScheduledTime, flight.arrivalActualTime) ?? '-'} min kašnjenja
                              </p>
                              <p>
                                Odlazak {getDelayMinutes(flight.departureScheduledTime, flight.departureActualTime) ?? '-'} min kašnjenja
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={() => router.push(`/daily-operations/${flight.id}`)}
                        variant="outline"
                        className="flex items-center gap-2 border-primary-200 text-primary-700 bg-white/80 hover:bg-primary-50 hover:border-primary-300"
                        disabled={!canEditSelectedDate}
                      >
                        <Edit className="w-4 h-4" />
                        {flight.isVerified ? (userRole === 'ADMIN' ? 'Uredi' : 'Pregled') : 'Unesi podatke'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {flights.length > 0 && (
              <div className="p-6 border-t border-slate-200 bg-slate-50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-dark-900">Status verifikacije</h3>
                    <p className="text-sm text-dark-600">
                      Verifikovano {verificationSummary.verifiedFlights}/{verificationSummary.totalFlights} let(ova)
                    </p>
                  </div>
                  <div className="px-3 py-1.5 rounded-2xl bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                    {verificationSummary.verifiedFlights}/{verificationSummary.totalFlights}
                  </div>
                </div>
              </div>
            )}
            {flights.length === 0 && selectedDate < today && (
              <div className="p-6 border-t border-slate-200 bg-slate-50 text-sm text-slate-600">
                Nema letova za ovaj datum, verifikacija nije potrebna.
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default function DailyOperationsPage() {
  return (
    <Suspense
      fallback={
        <MainLayout>
          <div className="p-8">
            <LoadingSpinner text="Učitavam letove..." />
          </div>
        </MainLayout>
      }
    >
      <DailyOperationsContent />
    </Suspense>
  );
}
