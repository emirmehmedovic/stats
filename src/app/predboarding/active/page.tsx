'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Users, Search, CheckCircle2, Clock, ArrowLeft, RefreshCw, Loader2, ScanLine, CreditCard, Keyboard } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { showToast } from '@/components/ui/toast';
import { formatTimeDisplay, formatDateStringWithDay, getTodayDateString } from '@/lib/dates';

interface Passenger {
  id: string;
  seatNumber: string | null;
  passengerName: string;
  rawPassengerName?: string | null;
  sequenceNumber?: string | null;
  title: string;
  isInfant: boolean;
  boardingStatus: 'PENDING' | 'BOARDED' | 'NO_SHOW';
  manifestId: string;
  passengerId?: string | null;
  fareClass?: string | null;
  confirmationDate?: string | null;
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
}

interface ManifestData {
  manifest: {
    id: string;
    flightId: string;
    uploadedAt: string;
    flight: Flight;
    passengerCount: number;
  };
  passengers: Passenger[];
  stats: {
    total: number;
    boarded: number;
    noShow: number;
    pending: number;
  };
}

interface ActiveBoardingData {
  manifests: ManifestData[];
  overallStats: {
    totalFlights: number;
    totalPassengers: number;
    totalBoarded: number;
    totalPending: number;
  };
}

type StatusFilter = 'ALL' | 'NOT_BOARDED' | 'BOARDED';
type SearchMode = 'MANUAL' | 'READER' | 'SCANNER';

const normalizeSearchValue = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, ' ')
    .trim()
    .toUpperCase();

const normalizeSeatValue = (value: string) => {
  const normalized = normalizeSearchValue(value).replace(/\s+/g, '');
  if (!normalized) return '';

  const match = normalized.match(/^0*(\d+)([A-Z])$/);
  if (!match) return normalized;

  return `${match[1]}${match[2]}`;
};

const normalizeFlightValue = (value: string) =>
  normalizeSearchValue(value).replace(/\s+/g, '');

const extractFlightNumberDigits = (value: string) => {
  const normalized = normalizeFlightValue(value);
  const match = normalized.match(/(\d{2,4})$/);
  return match ? match[1] : '';
};

const extractBoardingPassNameTokens = (rawValue: string): string[] => {
  const normalized = rawValue
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  const match = normalized.match(/(?:^|\s)M\d([A-Z]+(?:[\/-][A-Z]+)+)(?=\s|$)/);
  if (!match) return [];

  return match[1]
    .split(/[\/-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);
};

const extractBoardingPassFlightTokens = (rawValue: string): string[] => {
  const normalized = rawValue
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  const chunks = normalized.split(/[^A-Z0-9]+/).filter(Boolean);
  const flightTokens = new Set<string>();

  for (const chunk of chunks) {
    const exactMatch = chunk.match(/^[A-Z]{1,3}\d{2,4}$/);
    if (exactMatch) {
      flightTokens.add(exactMatch[0]);
      continue;
    }

    const embeddedMatch = chunk.match(/^([A-Z]{1,3}\d{2,4})(?!\d)/);
    if (embeddedMatch) {
      flightTokens.add(embeddedMatch[1]);
    }
  }

  return [...flightTokens];
};

const extractBoardingPassSeatTokens = (rawValue: string): string[] => {
  const normalized = rawValue
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  const seatTokens = new Set<string>();

  for (const match of normalized.matchAll(/(\d{1,3}[A-F])(?=\d{4}\b)/g)) {
    seatTokens.add(normalizeSeatValue(match[1]));
  }

  for (const match of normalized.matchAll(/\b(\d{1,3}[A-F])\b/g)) {
    seatTokens.add(normalizeSeatValue(match[1]));
  }

  return [...seatTokens].filter(Boolean);
};

const extractReaderNameTokens = (rawValue: string): string[] => {
  const boardingPassTokens = extractBoardingPassNameTokens(rawValue);
  if (boardingPassTokens.length > 0) {
    return [...new Set(boardingPassTokens.slice(0, 3))];
  }

  const normalized = rawValue
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  const alphaChunks = normalized
    .split(/[^A-Z0-9]+/)
    .flatMap((chunk) => chunk.match(/[A-Z]{3,}/g) || []);

  if (alphaChunks.length === 0) return [];

  const filteredChunks = alphaChunks.filter(
    (chunk) => !['BIH', 'IDBIH', 'M', 'F'].includes(chunk)
  );

  const source = filteredChunks.length > 0 ? filteredChunks : alphaChunks;
  return [...new Set(source.slice(0, 3))];
};

const matchesNameToken = (passengerName: string, token: string) => {
  if (passengerName.includes(token)) return true;

  const passengerTokens = passengerName.split(/\s+/).filter(Boolean);
  return passengerTokens.some((passengerToken) => {
    if (passengerToken.includes(token) || token.includes(passengerToken)) {
      return true;
    }

    const minPrefixLength = Math.min(passengerToken.length, token.length);
    if (minPrefixLength < 5) {
      return false;
    }

    return passengerToken.slice(0, minPrefixLength) === token.slice(0, minPrefixLength);
  });
};

const formatPassengerDisplayName = (value: string) =>
  value
    .split("/")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

const passengerMatchesQuery = (
  passenger: Passenger & { flight: Flight },
  rawQuery: string
) => {
  const query = normalizeSearchValue(rawQuery);
  if (!query) return true;

  const compactQuery = query.replace(/\s+/g, '');
  const passengerName = normalizeSearchValue(passenger.passengerName);
  const nameNoSeparators = passengerName.replace(/\s+/g, '').replace(/\//g, '');
  const seat = normalizeSearchValue(passenger.seatNumber || '');
  const route = normalizeSearchValue(passenger.flight.route);
  const flightNumber = normalizeSearchValue(passenger.flight.departureFlightNumber || '');

  if (
    passengerName.includes(query) ||
    nameNoSeparators.includes(compactQuery) ||
    seat.includes(query) ||
    route.includes(query) ||
    flightNumber.includes(query)
  ) {
    return true;
  }

  const queryTokens = query.split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return true;

  return queryTokens.every((token) => passengerName.includes(token));
};

const passengerMatchesDevicePayload = (
  passenger: Passenger & { flight: Flight },
  rawPayload: string
) => {
  const nameTokens = extractReaderNameTokens(rawPayload);
  const flightTokens = extractBoardingPassFlightTokens(rawPayload);
  const seatTokens = extractBoardingPassSeatTokens(rawPayload);

  if (nameTokens.length === 0) {
    return passengerMatchesQuery(passenger, rawPayload);
  }

  const passengerName = normalizeSearchValue(passenger.passengerName);
  if (!nameTokens.every((token) => matchesNameToken(passengerName, token))) {
    return false;
  }

  const passengerFlightNumber = normalizeFlightValue(passenger.flight.departureFlightNumber || '');
  const passengerFlightDigits = extractFlightNumberDigits(passenger.flight.departureFlightNumber || '');
  if (flightTokens.length > 0 && passengerFlightNumber) {
    const matchesFlight = flightTokens.some(
      (token) => {
        const normalizedToken = normalizeFlightValue(token);
        const tokenDigits = extractFlightNumberDigits(token);

        return (
          passengerFlightNumber.includes(normalizedToken) ||
          normalizedToken.includes(passengerFlightNumber) ||
          (tokenDigits !== '' && tokenDigits === passengerFlightDigits)
        );
      }
    );

    if (!matchesFlight) {
      return false;
    }
  }

  const passengerSeat = normalizeSeatValue(passenger.seatNumber || '');
  if (seatTokens.length > 0 && passengerSeat) {
    const matchesSeat = seatTokens.some((token) => token === passengerSeat);
    if (!matchesSeat) {
      return false;
    }
  }

  return true;
};

export default function ActiveBoardingPage() {
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const lastProcessedDeviceInputRef = useRef('');
  const [data, setData] = useState<ActiveBoardingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('MANUAL');
  const [deviceInput, setDeviceInput] = useState('');
  const [deviceFeedback, setDeviceFeedback] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('NOT_BOARDED');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPassengers, setSelectedPassengers] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  const today = getTodayDateString();
  const todayDisplay = formatDateStringWithDay(today);
  const activeSearchTerm = searchMode === 'MANUAL' ? searchTerm : deviceInput;

  useEffect(() => {
    fetchActiveBoarding();
  }, []);

  useEffect(() => {
    if (searchMode !== 'MANUAL') {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }
  }, [searchMode]);

  useEffect(() => {
    if (searchMode === 'MANUAL') {
      lastProcessedDeviceInputRef.current = '';
      return;
    }

    const query = deviceInput.trim();
    if (query.length < 6) return;
    if (query === lastProcessedDeviceInputRef.current) return;

    const timeoutId = window.setTimeout(() => {
      lastProcessedDeviceInputRef.current = query;
      void attemptDeviceBoarding(query);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [deviceInput, searchMode, data]);

  const fetchActiveBoarding = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/predboarding/active-boarding');

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Greška pri učitavanju');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchActiveBoarding();
    setIsRefreshing(false);
  };

  const updatePassengerStatus = async (manifestId: string, passengerId: string, status: 'BOARDED' | 'NO_SHOW') => {
    if (!data) return;

    // Optimistic update - odmah ažuriraj UI
    const previousData = { ...data };
    const updatedManifests = data.manifests.map(m => {
      if (m.manifest.id === manifestId) {
        const updatedPassengers = m.passengers.map(p =>
          p.id === passengerId ? { ...p, boardingStatus: status } : p
        );
        const boarded = updatedPassengers.filter(p => p.boardingStatus === 'BOARDED').length;
        const noShow = updatedPassengers.filter(p => p.boardingStatus === 'NO_SHOW').length;
        return {
          ...m,
          passengers: updatedPassengers,
          stats: {
            ...m.stats,
            boarded,
            noShow,
            pending: noShow
          }
        };
      }
      return m;
    });

    const totalBoarded = updatedManifests.reduce((sum, m) => sum + m.stats.boarded, 0);
    const totalPending = updatedManifests.reduce((sum, m) => sum + m.stats.pending, 0);

    setData({
      manifests: updatedManifests,
      overallStats: {
        ...data.overallStats,
        totalBoarded,
        totalPending
      }
    });

    // API poziv u pozadini
    try {
      const response = await fetch(`/api/predboarding/${manifestId}/passenger-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passengerId, status }),
      });

      if (!response.ok) {
        // Rollback na staro stanje ako je greška
        setData(previousData);
        const result = await response.json();
        throw new Error(result.error || 'Greška pri ažuriranju statusa');
      }
    } catch (err) {
      console.error('Error updating passenger status:', err);
      alert(err instanceof Error ? err.message : 'Greška pri ažuriranju statusa');
    }
  };

  const togglePassengerSelection = (passengerId: string) => {
    setSelectedPassengers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(passengerId)) {
        newSet.delete(passengerId);
      } else {
        newSet.add(passengerId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const allPendingIds = filteredPassengers
      .filter(p => p.boardingStatus === 'NO_SHOW')
      .map(p => p.id);
    setSelectedPassengers(new Set(allPendingIds));
  };

  const clearSelection = () => {
    setSelectedPassengers(new Set());
  };

  const bulkUpdateStatus = async (status: 'BOARDED' | 'NO_SHOW') => {
    if (selectedPassengers.size === 0) return;

    setIsBulkUpdating(true);

    // Group passengers by manifestId
    const passengersByManifest = new Map<string, string[]>();
    selectedPassengers.forEach(passengerId => {
      const passenger = allPassengers.find(p => p.id === passengerId);
      if (passenger) {
        const manifestId = passenger.manifestId;
        if (!passengersByManifest.has(manifestId)) {
          passengersByManifest.set(manifestId, []);
        }
        passengersByManifest.get(manifestId)!.push(passengerId);
      }
    });

    // Update all passengers (sequentially by manifest)
    try {
      for (const [manifestId, passengerIds] of passengersByManifest.entries()) {
        for (const passengerId of passengerIds) {
          await updatePassengerStatus(manifestId, passengerId, status);
        }
      }
      clearSelection();
    } catch (err) {
      console.error('Bulk update error:', err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const attemptDeviceBoarding = async (rawQuery?: string) => {
    const query = (rawQuery ?? activeSearchTerm).trim();
    if (!query || !data) {
      const message = 'Nema unosa sa readera/scannera. Pokušajte ponovo ili pređite na ručnu pretragu.';
      setDeviceFeedback(message);
      showToast(message, 'warning');
      return;
    }

    const pendingMatches = allPassengers.filter((passenger) => {
      if (passenger.boardingStatus !== 'NO_SHOW') return false;

      return searchMode === 'MANUAL'
        ? passengerMatchesQuery(passenger, query)
        : passengerMatchesDevicePayload(passenger, query);
    });

    if (pendingMatches.length === 1) {
      const passenger = pendingMatches[0];
      setDeviceFeedback(
        `Pronađen putnik ${passenger.passengerName}. Boarding se evidentira automatski.`
      );
      showToast(`Pronađen putnik ${passenger.passengerName}. Boarding je evidentiran.`, 'success');
      await updatePassengerStatus(passenger.manifestId, passenger.id, 'BOARDED');
      setSelectedPassengers(new Set());
      setDeviceInput('');
      lastProcessedDeviceInputRef.current = '';
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
      return;
    }

    if (pendingMatches.length === 0) {
      const message = 'Putnik nije pronađen preko readera/scannera. Probajte ručno pretraživanje.';
      setDeviceFeedback(message);
      showToast(message, 'warning');
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
      return;
    }

    const message = `Pronađeno je više kandidata (${pendingMatches.length}). Probajte ručno pretraživanje ili odaberite putnika iz liste.`;
    setDeviceFeedback(message);
    showToast(message, 'info');
    searchInputRef.current?.focus();
    searchInputRef.current?.select();
  };

  // Flatten all passengers from all manifests
  const allPassengers = data?.manifests.flatMap(m =>
    m.passengers.map(p => ({
      ...p,
      flight: m.manifest.flight
    }))
  ) || [];

  const filteredPassengers = allPassengers.filter((passenger) => {
    // Search filter
    if (
      activeSearchTerm &&
      !(
        searchMode === 'MANUAL'
          ? passengerMatchesQuery(passenger, activeSearchTerm)
          : passengerMatchesDevicePayload(passenger, activeSearchTerm)
      )
    ) {
      return false;
    }

    // Status filter
    if (statusFilter === 'NOT_BOARDED') {
      if (passenger.boardingStatus !== 'NO_SHOW') return false;
    } else if (statusFilter === 'BOARDED') {
      if (passenger.boardingStatus !== 'BOARDED') return false;
    }

    return true;
  });

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
              <p className="text-dark-500">Učitavam aktivne boardinge...</p>
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
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => router.push('/predboarding')}
            className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
          >
            Nazad na pregled
          </button>
        </div>
      </MainLayout>
    );
  }

  if (!data || data.manifests.length === 0) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/predboarding')}
              className="p-3 rounded-xl bg-dark-100 text-dark-600 hover:bg-dark-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-3xl font-bold text-dark-900">Aktivni boarding</h1>
          </div>
          <div className="bg-white rounded-3xl p-12 shadow-soft text-center">
            <Users className="w-16 h-16 text-dark-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-dark-900 mb-2">Nema aktivnih boardinga</h3>
            <p className="text-dark-500 mb-6">Prvo uploadujte manifest za neki let.</p>
            <button
              onClick={() => router.push('/predboarding')}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition-colors"
            >
              Idi na letove
            </button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/predboarding')}
            className="p-3 rounded-xl bg-dark-100 text-dark-600 hover:bg-dark-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-dark-900">Aktivni boarding</h1>
            <p className="text-dark-500 mt-1">{todayDisplay}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-3 bg-white border border-dark-200 rounded-xl font-semibold hover:bg-dark-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Osvježi
          </button>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Plane className="w-5 h-5 text-blue-600" />
              <p className="text-sm font-semibold text-blue-700 uppercase">Aktivni letovi</p>
            </div>
            <p className="text-3xl font-bold text-blue-900">{data.overallStats.totalFlights}</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-6 border border-indigo-200">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-indigo-600" />
              <p className="text-sm font-semibold text-indigo-700 uppercase">Ukupno putnika</p>
            </div>
            <p className="text-3xl font-bold text-indigo-900">{data.overallStats.totalPassengers}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <p className="text-sm font-semibold text-green-700 uppercase">Ukrcano</p>
            </div>
            <p className="text-3xl font-bold text-green-900">{data.overallStats.totalBoarded}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-6 border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <p className="text-sm font-semibold text-amber-700 uppercase">Čeka</p>
            </div>
            <p className="text-3xl font-bold text-amber-900">{data.overallStats.totalPending}</p>
          </div>
        </div>

        {/* Flight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.manifests.map((manifestData) => (
            <div
              key={manifestData.manifest.id}
              className="bg-white rounded-2xl p-4 shadow-soft border border-dark-100 hover:shadow-soft-lg transition-all cursor-pointer"
              onClick={() => router.push(`/predboarding/${manifestData.manifest.id}`)}
            >
              <div className="flex items-center gap-3 mb-3">
                {manifestData.manifest.flight.airline.logoUrl ? (
                  <img
                    src={manifestData.manifest.flight.airline.logoUrl}
                    alt={manifestData.manifest.flight.airline.name}
                    className="w-10 h-10 rounded-lg object-contain bg-white border border-dark-100 p-1"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">
                    {manifestData.manifest.flight.airline.icaoCode}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-dark-900 text-sm truncate">
                    {manifestData.manifest.flight.departureFlightNumber || manifestData.manifest.flight.route}
                  </p>
                  <p className="text-xs text-dark-500">{manifestData.manifest.flight.route}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="text-xs text-blue-600 font-semibold">Ukupno</p>
                  <p className="text-lg font-bold text-blue-900">{manifestData.stats.total}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-2">
                  <p className="text-xs text-green-600 font-semibold">Ukrcano</p>
                  <p className="text-lg font-bold text-green-900">{manifestData.stats.boarded}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2">
                  <p className="text-xs text-amber-600 font-semibold">Čeka</p>
                  <p className="text-lg font-bold text-amber-900">{manifestData.stats.pending}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-2xl p-4 shadow-soft">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {([
                { value: 'MANUAL', label: 'Ručno', icon: Keyboard },
                { value: 'READER', label: 'Reader', icon: CreditCard },
                { value: 'SCANNER', label: 'Scanner', icon: ScanLine }
              ] as Array<{ value: SearchMode; label: string; icon: typeof Keyboard }>).map((mode) => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.value}
                    onClick={() => {
                      setSearchMode(mode.value);
                      setDeviceFeedback(null);
                      if (mode.value === 'MANUAL') {
                        setDeviceInput('');
                        lastProcessedDeviceInputRef.current = '';
                      }
                    }}
                    className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${
                      searchMode === mode.value
                        ? 'bg-dark-900 text-white'
                        : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {mode.label}
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_auto] gap-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder={
                      searchMode === 'MANUAL'
                        ? 'Pretraži po imenu, sjedištu, broju leta, ruti...'
                        : searchMode === 'READER'
                        ? 'Reader može upisati ime i prezime sa dokumenta ili karte...'
                        : 'Scanner može upisati barcode/string sa boarding karte...'
                    }
                    value={searchMode === 'MANUAL' ? searchTerm : deviceInput}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (searchMode === 'MANUAL') {
                        setSearchTerm(value);
                      } else {
                        setDeviceInput(value);
                        setDeviceFeedback(null);
                        if (!value.trim()) {
                          lastProcessedDeviceInputRef.current = '';
                        }
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && searchMode !== 'MANUAL') {
                        void attemptDeviceBoarding();
                      }
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-dark-50 border border-dark-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {searchMode !== 'MANUAL' && (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-xs text-dark-500">
                      Uređaj može poslati tekst direktno u ovo polje. Ako je pogodak jednoznačan, putnik će biti automatski ukrcan.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setDeviceInput('');
                          setDeviceFeedback(null);
                          lastProcessedDeviceInputRef.current = '';
                          searchInputRef.current?.focus();
                        }}
                        className="px-3 py-2 text-sm bg-dark-100 text-dark-700 rounded-lg font-semibold hover:bg-dark-200 transition-colors"
                      >
                        Očisti
                      </button>
                      <button
                        onClick={() => void attemptDeviceBoarding()}
                        className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        Pretraži i ukrcaj
                      </button>
                    </div>
                  </div>
                )}

                {deviceFeedback && searchMode !== 'MANUAL' && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                    <p className="text-sm text-blue-900">{deviceFeedback}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {([
                  { value: 'ALL', label: 'Svi' },
                  { value: 'NOT_BOARDED', label: 'Putnici' },
                  { value: 'BOARDED', label: 'Ukrcani' }
                ] as Array<{ value: StatusFilter; label: string }>).map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all whitespace-nowrap ${
                      statusFilter === filter.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Selection Actions */}
        {selectedPassengers.size > 0 && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 shadow-soft">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-blue-600" />
                <span className="font-semibold text-blue-900">
                  Selektovano: {selectedPassengers.size} {selectedPassengers.size === 1 ? 'putnik' : 'putnika'}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => bulkUpdateStatus('BOARDED')}
                  disabled={isBulkUpdating}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors text-sm flex items-center gap-2"
                >
                  {isBulkUpdating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Ukrcavam...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Ukrcaj sve
                    </>
                  )}
                </button>
                <button
                  onClick={clearSelection}
                  disabled={isBulkUpdating}
                  className="px-4 py-2 bg-dark-100 text-dark-700 rounded-xl font-semibold hover:bg-dark-200 disabled:opacity-50 transition-colors text-sm"
                >
                  Poništi selekciju
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Passengers List */}
        <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
          <div className="p-6 border-b border-dark-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-dark-900">
                Putnici ({filteredPassengers.length})
              </h3>
              {statusFilter === 'NOT_BOARDED' && filteredPassengers.length > 0 && (
                <button
                  onClick={selectAll}
                  className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
                >
                  Selektuj sve
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-dark-100">
            {filteredPassengers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                <p className="text-dark-500">Nema putnika koji odgovaraju filterima</p>
              </div>
            ) : (
              filteredPassengers.map((passenger) => (
                <div
                  key={passenger.id}
                  className={`p-4 transition-colors ${
                    selectedPassengers.has(passenger.id) ? 'bg-blue-50' : 'hover:bg-dark-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Checkbox (only for pending passengers) */}
                    {passenger.boardingStatus === 'NO_SHOW' && (
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedPassengers.has(passenger.id)}
                          onChange={() => togglePassengerSelection(passenger.id)}
                          className="w-5 h-5 rounded border-2 border-dark-300 text-primary-600 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Seat Number */}
                    <div className="w-14 h-14 rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                      {passenger.seatNumber || 'N/A'}
                    </div>

                    {/* Passenger Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-dark-900">{formatPassengerDisplayName(passenger.passengerName)}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          passenger.title === 'MR' || passenger.title === 'MSTR'
                            ? 'bg-blue-100 text-blue-700'
                            : passenger.title === 'CHD'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-pink-100 text-pink-700'
                        }`}>
                          {passenger.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-dark-500 flex-wrap">
                        {passenger.sequenceNumber && <span>Seq: {passenger.sequenceNumber}</span>}
                        {passenger.passengerId && <span>Locator: {passenger.passengerId}</span>}
                        {passenger.fareClass && passenger.fareClass !== passenger.passengerId && (
                          <span>Class: {passenger.fareClass}</span>
                        )}
                        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2 py-1 rounded font-semibold">
                          {passenger.flight.airline.logoUrl ? (
                            <img
                              src={passenger.flight.airline.logoUrl}
                              alt={passenger.flight.airline.name}
                              className="w-4 h-4 rounded object-contain"
                            />
                          ) : (
                            <Plane className="w-3 h-3" />
                          )}
                          <span>{passenger.flight.departureFlightNumber || passenger.flight.route}</span>
                        </div>
                        <span>{passenger.flight.route}</span>
                        {passenger.flight.departureScheduledTime && (
                          <span>Polazak: {formatTimeDisplay(passenger.flight.departureScheduledTime)}</span>
                        )}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {passenger.boardingStatus === 'BOARDED' ? (
                        <>
                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                            Ukrcan
                          </span>
                          <button
                            onClick={() => updatePassengerStatus(passenger.manifestId, passenger.id, 'NO_SHOW')}
                            className="px-3 py-2 bg-dark-100 text-dark-600 rounded-xl font-semibold hover:bg-dark-200 transition-colors text-sm"
                          >
                            Poništi
                          </button>
                        </>
                      ) : (
                        <>
                          <span className="px-3 py-1 rounded-full bg-dark-100 text-dark-600 text-xs font-semibold">
                            Čeka
                          </span>
                          <button
                            onClick={() => updatePassengerStatus(passenger.manifestId, passenger.id, 'BOARDED')}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors text-sm"
                          >
                            Ukrcaj
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
