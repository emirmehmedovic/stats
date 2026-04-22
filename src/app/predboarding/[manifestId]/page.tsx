'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Search,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Plane,
  AlertTriangle,
  Loader2,
  Baby,
  Filter,
  Trash2,
  ScanLine,
  CreditCard,
  Keyboard,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { showToast } from '@/components/ui/toast';
import { formatDateStringWithDay, formatTimeDisplay, formatDateTimeDisplay } from '@/lib/dates';

interface Passenger {
  id: string;
  seatNumber: string | null;
  passengerName: string;
  title: string;
  passengerId: string | null;
  fareClass: string | null;
  confirmationDate: string | null;
  isInfant: boolean;
  boardingStatus: 'PENDING' | 'BOARDED' | 'NO_SHOW';
  boardedAt: string | null;
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
    originalFileName: string;
    uploadedAt: string;
    boardingStatus: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
    flight: Flight;
    passengers: Passenger[];
    uploadedByUser: {
      id: string;
      name: string | null;
      email: string;
    };
  };
  stats: {
    total: number;
    boarded: number;
    noShow: number;
    pending: number;
    male: number;
    female: number;
    children: number;
    infants: number;
  };
}

type StatusFilter = 'ALL' | 'NOT_BOARDED' | 'BOARDED' | 'NO_SHOW';
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
    const exactMatch = chunk.match(/^[A-Z0-9]{2,3}\d{2,4}$/);
    if (exactMatch) {
      flightTokens.add(exactMatch[0]);
      continue;
    }

    const embeddedMatch = chunk.match(/([A-Z0-9]{2,3}\d{2,4})/);
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

const passengerMatchesQuery = (
  passenger: Passenger,
  flight: Flight,
  rawQuery: string
) => {
  const query = normalizeSearchValue(rawQuery);
  if (!query) return true;

  const compactQuery = query.replace(/\s+/g, '');
  const passengerName = normalizeSearchValue(passenger.passengerName);
  const nameNoSeparators = passengerName.replace(/\s+/g, '').replace(/\//g, '');
  const seat = normalizeSeatValue(passenger.seatNumber || '');
  const route = normalizeSearchValue(flight.route);
  const flightNumber = normalizeSearchValue(flight.departureFlightNumber || '').replace(/\s+/g, '');

  if (
    passengerName.includes(query) ||
    nameNoSeparators.includes(compactQuery) ||
    seat.includes(compactQuery) ||
    route.includes(query) ||
    flightNumber.includes(compactQuery)
  ) {
    return true;
  }

  const queryTokens = query.split(/\s+/).filter(Boolean);
  if (queryTokens.length === 0) return true;

  return queryTokens.every((token) => passengerName.includes(token));
};

const passengerMatchesDevicePayload = (
  passenger: Passenger,
  flight: Flight,
  rawPayload: string
) => {
  const nameTokens = extractReaderNameTokens(rawPayload);
  const flightTokens = extractBoardingPassFlightTokens(rawPayload);
  const seatTokens = extractBoardingPassSeatTokens(rawPayload);

  if (nameTokens.length === 0) {
    return passengerMatchesQuery(passenger, flight, rawPayload);
  }

  const passengerName = normalizeSearchValue(passenger.passengerName);
  if (!nameTokens.every((token) => passengerName.includes(token))) {
    return false;
  }

  const passengerFlightNumber = normalizeSearchValue(flight.departureFlightNumber || '').replace(/\s+/g, '');
  if (flightTokens.length > 0 && passengerFlightNumber) {
    const matchesFlight = flightTokens.some(
      (token) => passengerFlightNumber.includes(token) || token.includes(passengerFlightNumber)
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

export default function BoardingInterfacePage() {
  const router = useRouter();
  const params = useParams();
  const manifestId = params?.manifestId as string;

  const [data, setData] = useState<ManifestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('MANUAL');
  const [deviceInput, setDeviceInput] = useState('');
  const [deviceFeedback, setDeviceFeedback] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('NOT_BOARDED');
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [selectedPassengers, setSelectedPassengers] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (manifestId) {
      fetchManifest();
    }
  }, [manifestId]);

  const fetchManifest = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/predboarding/${manifestId}`);

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Greška pri učitavanju manifesta');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePassengerStatus = async (passengerId: string, status: 'BOARDED' | 'NO_SHOW') => {
    if (!data) return;

    // Optimistic update
    const previousData = { ...data };
    const updatedPassengers = data.manifest.passengers.map(p =>
      p.id === passengerId ? { ...p, boardingStatus: status, boardedAt: status === 'BOARDED' ? new Date().toISOString() : null } : p
    );

    const boarded = updatedPassengers.filter(p => p.boardingStatus === 'BOARDED');
    const noShow = updatedPassengers.filter(p => p.boardingStatus === 'NO_SHOW');

    setData({
      manifest: {
        ...data.manifest,
        passengers: updatedPassengers
      },
      stats: {
        total: updatedPassengers.length,
        boarded: boarded.length,
        noShow: noShow.length,
        pending: noShow.length,
        male: boarded.filter(p => p.title === 'MR' || p.title === 'MSTR').length,
        female: boarded.filter(p => ['MS', 'MRS', 'MISS'].includes(p.title)).length,
        children: boarded.filter(p => p.title === 'CHD').length,
        infants: boarded.filter(p => p.isInfant).length
      }
    });

    // API call in background
    try {
      const response = await fetch(`/api/predboarding/${manifestId}/passenger-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ passengerId, status }),
      });

      if (!response.ok) {
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

  const activeSearchTerm = searchMode === 'MANUAL' ? searchTerm : deviceInput;

  const bulkUpdateStatus = async (status: 'BOARDED' | 'NO_SHOW') => {
    if (selectedPassengers.size === 0) return;

    setIsBulkUpdating(true);
    try {
      for (const passengerId of selectedPassengers) {
        await updatePassengerStatus(passengerId, status);
      }
      clearSelection();
    } catch (err) {
      console.error('Bulk update error:', err);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const handleFinalize = async () => {
    setIsFinalizing(true);

    try {
      const response = await fetch('/api/predboarding/finalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ manifestId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Greška pri finalizaciji boardinga');
      }

      alert(result.message);
      router.push('/predboarding');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Greška pri finalizaciji');
    } finally {
      setIsFinalizing(false);
      setShowFinalizeConfirm(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/predboarding/${manifestId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Greška pri brisanju manifesta');
      }

      alert(result.message);
      router.push('/predboarding');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Greška pri brisanju manifesta');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const attemptDeviceBoarding = async () => {
    const query = activeSearchTerm.trim();
    if (!query || !data) {
      const message = 'Nema unosa sa readera/scannera. Pokušajte ponovo ili pređite na ručnu pretragu.';
      setDeviceFeedback(message);
      showToast(message, 'warning');
      return;
    }

    const pendingMatches = data.manifest.passengers.filter((passenger) => {
      if (passenger.boardingStatus !== 'NO_SHOW') return false;

      return searchMode === 'MANUAL'
        ? passengerMatchesQuery(passenger, data.manifest.flight, query)
        : passengerMatchesDevicePayload(passenger, data.manifest.flight, query);
    });

    if (pendingMatches.length === 1) {
      const passenger = pendingMatches[0];
      setDeviceFeedback(
        `Pronađen putnik ${passenger.passengerName}. Boarding se evidentira automatski.`
      );
      showToast(`Pronađen putnik ${passenger.passengerName}. Boarding je evidentiran.`, 'success');
      await updatePassengerStatus(passenger.id, 'BOARDED');
      setSelectedPassengers(new Set());
      return;
    }

    if (pendingMatches.length === 0) {
      const message = 'Putnik nije pronađen preko readera/scannera. Probajte ručno pretraživanje.';
      setDeviceFeedback(message);
      showToast(message, 'warning');
      return;
    }

    const message = `Pronađeno je više kandidata (${pendingMatches.length}). Probajte ručno pretraživanje ili odaberite putnika iz liste.`;
    setDeviceFeedback(message);
    showToast(message, 'info');
  };

  const filteredPassengers = data?.manifest.passengers.filter((passenger) => {
    // Search filter
    if (
      activeSearchTerm &&
      !(
        searchMode === 'MANUAL'
          ? passengerMatchesQuery(passenger, data.manifest.flight, activeSearchTerm)
          : passengerMatchesDevicePayload(passenger, data.manifest.flight, activeSearchTerm)
      )
    ) {
      return false;
    }

    // Status filter
    if (statusFilter === 'NOT_BOARDED') {
      // Prikaži samo putnike koji još nisu boardirani (NO_SHOW status)
      if (passenger.boardingStatus !== 'NO_SHOW') return false;
    } else if (statusFilter !== 'ALL') {
      // Za BOARDED i NO_SHOW, prikaži tačno taj status
      if (passenger.boardingStatus !== statusFilter) return false;
    }

    return true;
  }) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'BOARDED':
        return (
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
            Ukrcan
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className="px-3 py-1 rounded-full bg-dark-100 text-dark-600 text-xs font-semibold">
            Čeka
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-dark-100 text-dark-600 text-xs font-semibold">
            Nepoznat
          </span>
        );
    }
  };

  const getTitleBadge = (title: string) => {
    const colors: Record<string, string> = {
      MR: 'bg-blue-100 text-blue-700',
      MS: 'bg-pink-100 text-pink-700',
      MRS: 'bg-pink-100 text-pink-700',
      MISS: 'bg-pink-100 text-pink-700',
      MSTR: 'bg-blue-100 text-blue-700',
      CHD: 'bg-purple-100 text-purple-700',
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${colors[title] || 'bg-dark-100 text-dark-700'}`}>
        {title}
      </span>
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
              <p className="text-dark-500">Učitavam manifest...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-6">
            <p className="text-sm text-red-700">{error || 'Manifest nije pronađen'}</p>
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

  const { manifest, stats } = data;

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => router.push('/predboarding')}
            className="p-3 rounded-xl bg-dark-100 text-dark-600 hover:bg-dark-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-3xl font-bold text-dark-900">Boarding interfejs</h1>
            <p className="text-dark-500 mt-1">{manifest.originalFileName}</p>
          </div>
          <button
            onClick={() => router.push('/predboarding/active')}
            className="px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Users className="w-5 h-5" />
            Multi-flight view
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting || manifest.boardingStatus !== 'IN_PROGRESS'}
            className="px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:bg-dark-200 disabled:text-dark-400 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Brišem...
              </>
            ) : (
              <>
                <Trash2 className="w-5 h-5" />
                Obriši manifest
              </>
            )}
          </button>
          <button
            onClick={() => setShowFinalizeConfirm(true)}
            disabled={isFinalizing || manifest.boardingStatus !== 'IN_PROGRESS'}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:bg-dark-200 disabled:text-dark-400 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isFinalizing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Finalizujem...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Završi boarding
              </>
            )}
          </button>
        </div>

        {/* Flight Info */}
        <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-6 text-white shadow-soft-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-8 -mb-8"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {manifest.flight.airline.logoUrl ? (
                  <img
                    src={manifest.flight.airline.logoUrl}
                    alt={manifest.flight.airline.name}
                    className="w-14 h-14 rounded-xl object-contain bg-white p-2"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-white/10 text-white font-bold flex items-center justify-center backdrop-blur-md">
                    {manifest.flight.airline.icaoCode}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold">{manifest.flight.airline.name}</h2>
                  <p className="text-dark-300 text-sm">{manifest.flight.airline.icaoCode}</p>
                </div>
              </div>
              <div className="text-right">
                {manifest.flight.departureFlightNumber ? (
                  <>
                    <p className="text-2xl font-bold">{manifest.flight.departureFlightNumber}</p>
                    <p className="text-dark-300 text-sm">{manifest.flight.route}</p>
                  </>
                ) : (
                  <p className="text-xl font-bold text-primary-200">{manifest.flight.route}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-dark-200 mb-1">Datum</p>
                <p className="text-sm font-bold">{formatDateStringWithDay(manifest.flight.date)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-dark-200 mb-1">Polazak</p>
                <p className="text-sm font-bold">
                  {manifest.flight.departureScheduledTime ? formatTimeDisplay(manifest.flight.departureScheduledTime) : 'N/A'}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-dark-200 mb-1">Avion</p>
                <p className="text-sm font-bold">{manifest.flight.aircraftType?.model || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          {[
            { label: 'Ukupno', value: stats.total, color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Users },
            { label: 'Ukrcano', value: stats.boarded, color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
            { label: 'No-show', value: stats.noShow, color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
            { label: 'Čeka', value: stats.pending, color: 'bg-dark-50 text-dark-700 border-dark-200', icon: Clock },
            { label: 'Muškarci', value: stats.male, color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Users },
            { label: 'Žene', value: stats.female, color: 'bg-pink-50 text-pink-700 border-pink-200', icon: Users },
            { label: 'Djeca', value: stats.children, color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Users },
            { label: 'Bebe', value: stats.infants, color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Baby },
          ].map((stat) => (
            <div key={stat.label} className={`p-4 rounded-2xl border ${stat.color}`}>
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">{stat.label}</p>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
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

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <input
                    type="text"
                    placeholder={
                      searchMode === 'MANUAL'
                        ? 'Pretraži po imenu, sjedištu ili broju leta...'
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
                  { value: 'BOARDED', label: 'Boarded' },
                  { value: 'NO_SHOW', label: 'No-show' }
                ] as Array<{ value: StatusFilter; label: string }>).map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`px-4 py-3 rounded-xl font-semibold text-sm transition-all ${
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
                Lista putnika ({filteredPassengers.length})
              </h3>
              <div className="flex items-center gap-3">
                {statusFilter === 'NOT_BOARDED' && filteredPassengers.length > 0 && (
                  <button
                    onClick={selectAll}
                    className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
                  >
                    Selektuj sve
                  </button>
                )}
                <Filter className="w-5 h-5 text-dark-400" />
              </div>
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
                    <div className="w-16 h-16 rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                      {passenger.seatNumber || 'N/A'}
                    </div>

                    {/* Passenger Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-dark-900 truncate">{passenger.passengerName}</p>
                        {getTitleBadge(passenger.title)}
                        {passenger.isInfant && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-semibold flex items-center gap-1">
                            <Baby className="w-3 h-3" />
                            Infant
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-dark-500">
                        {passenger.passengerId && <span>ID: {passenger.passengerId}</span>}
                        {passenger.fareClass && <span>Class: {passenger.fareClass}</span>}
                        {passenger.confirmationDate && <span>Confirmed: {passenger.confirmationDate}</span>}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {getStatusBadge(passenger.boardingStatus)}

                      {passenger.boardingStatus === 'NO_SHOW' && (
                        <button
                          onClick={() => updatePassengerStatus(passenger.id, 'BOARDED')}
                          className="px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors text-sm"
                        >
                          Ukrcaj
                        </button>
                      )}

                      {passenger.boardingStatus === 'BOARDED' && (
                        <button
                          onClick={() => updatePassengerStatus(passenger.id, 'NO_SHOW')}
                          className="px-3 py-2 bg-dark-100 text-dark-600 rounded-xl font-semibold hover:bg-dark-200 transition-colors text-sm"
                        >
                          Poništi
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Finalize Confirmation Modal */}
        {showFinalizeConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-bold text-dark-900 mb-4">Završi boarding?</h3>
              <p className="text-dark-600 mb-6">
                Ova akcija će:
              </p>
              <ul className="text-sm text-dark-600 space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>Sačuvati agregirane brojke ({stats.boarded} ukrcanih putnika)</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Obrisati sve detalje putnika (imena, sjedišta, itd.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Obrisati manifest fajl</span>
                </li>
              </ul>
              {stats.pending > 0 && (
                <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-700">
                    <strong>Napomena:</strong> Imate {stats.pending} putnika koji još nisu ukrcani. Oni će biti označeni kao "no-show" nakon finalizacije.
                  </p>
                </div>
              )}
              <p className="text-sm text-red-600 font-semibold mb-6">
                Ova akcija se ne može poništiti!
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowFinalizeConfirm(false)}
                  className="flex-1 px-6 py-3 bg-dark-100 text-dark-700 rounded-xl font-semibold hover:bg-dark-200 transition-colors"
                >
                  Otkaži
                </button>
                <button
                  onClick={handleFinalize}
                  disabled={isFinalizing}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:bg-dark-200 disabled:text-dark-400 transition-colors"
                >
                  {isFinalizing ? 'Finalizujem...' : 'Potvrdi'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-dark-900">Obriši manifest?</h3>
              </div>
              <p className="text-dark-600 mb-6">
                Da li ste sigurni da želite obrisati ovaj manifest? Ova akcija će:
              </p>
              <ul className="text-sm text-dark-600 space-y-2 mb-6">
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Obrisati sve putničke podatke ({stats.total} putnika)</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Obrisati manifest fajl</span>
                </li>
                <li className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <span>Poništiti sve boarding akcije</span>
                </li>
              </ul>
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-700 font-semibold">
                  ⚠️ Ova akcija se ne može poništiti!
                </p>
                <p className="text-sm text-red-600 mt-1">
                  Flight će ostati bez manifesta i moći ćete uploadovati novi.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-6 py-3 bg-dark-100 text-dark-700 rounded-xl font-semibold hover:bg-dark-200 transition-colors"
                >
                  Otkaži
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 disabled:bg-dark-200 disabled:text-dark-400 transition-colors"
                >
                  {isDeleting ? 'Brišem...' : 'Obriši'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
