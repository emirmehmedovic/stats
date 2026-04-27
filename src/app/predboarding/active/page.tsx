'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plane, Users, Search, CheckCircle2, Clock, ArrowLeft, RefreshCw, Loader2, ScanLine, CreditCard, Keyboard, Info, AlertTriangle, XCircle, X, Filter } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { showToast } from '@/components/ui/toast';
import { formatTimeDisplay, formatDateStringWithDay, formatDateTimeDisplay, getTodayDateString } from '@/lib/dates';

interface Passenger {
  id: string;
  seatNumber: string | null;
  passengerName: string;
  rawPassengerName?: string | null;
  sequenceNumber?: string | null;
  title: string;
  isInfant: boolean;
  boardingStatus: 'PENDING' | 'BOARDED' | 'NO_SHOW';
  boardedAt?: string | null;
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

type StatusFilter = 'ALL' | 'CHECKED_IN' | 'NO_SHOW' | 'BOARDED';
type SearchMode = 'MANUAL' | 'READER' | 'SCANNER';
type ScanResultStatus = 'SUCCESS' | 'ALREADY_BOARDED' | 'NOT_ON_FLIGHT' | 'MULTIPLE' | 'EMPTY';
type ActivePassenger = Passenger & { flight: Flight };

type ScanResult = {
  status: ScanResultStatus;
  message: string;
  passenger?: ActivePassenger | null;
  matches?: number;
  scannedValue?: string;
};

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
    // Skip chunks that look like 6-7 char locators (e.g., E406NKE, 3P3UDC)
    if (chunk.length >= 6 && chunk.length <= 7 && /^[A-Z0-9]{6,7}$/.test(chunk)) {
      continue;
    }

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

const extractBoardingPassLocatorTokens = (rawValue: string): string[] => {
  const normalized = rawValue
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase();

  const locatorTokens = new Set<string>();

  // Accept 6 or 7 character locators (7-char can have E/W prefix for electronic/group codes)
  const structuredMatch = normalized.match(
    /(?:^|\s)M\d[A-Z]+(?:[\/-][A-Z]+)+\s+([A-Z0-9]{6,7})(?=\s|$)/
  );
  if (structuredMatch) {
    const fullLocator = structuredMatch[1];
    locatorTokens.add(fullLocator);

    // Also add last 6 chars for fuzzy matching (e.g., E406NKE -> also add 406NKE)
    if (fullLocator.length === 7) {
      locatorTokens.add(fullLocator.slice(1));
      locatorTokens.add(fullLocator.slice(-6));
    }
  }

  return [...locatorTokens];
};

const expandLocatorVariants = (token: string) => {
  const normalized = normalizeFlightValue(token);
  const variants = new Set<string>();

  if (!normalized) return variants;

  variants.add(normalized);

  if (
    normalized.length === 7 &&
    /^[A-Z][A-Z0-9]{6}$/.test(normalized)
  ) {
    variants.add(normalized.slice(1));
    variants.add(normalized.slice(-6));
  }

  return variants;
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

const matchesFlightTokens = (flightNumber: string | null | undefined, tokens: string[]) => {
  if (tokens.length === 0) return true;

  const passengerFlightNumber = normalizeFlightValue(flightNumber || '');
  const passengerFlightDigits = extractFlightNumberDigits(flightNumber || '');
  if (!passengerFlightNumber) return false;

  return tokens.some((token) => {
    const normalizedToken = normalizeFlightValue(token);
    const tokenDigits = extractFlightNumberDigits(token);

    return (
      passengerFlightNumber.includes(normalizedToken) ||
      normalizedToken.includes(passengerFlightNumber) ||
      (tokenDigits !== '' && tokenDigits === passengerFlightDigits)
    );
  });
};

const resolveDevicePayloadCandidates = (
  passengers: Array<Passenger & { flight: Flight }>,
  rawPayload: string
) => {
  const nameTokens = extractReaderNameTokens(rawPayload);
  const flightTokens = extractBoardingPassFlightTokens(rawPayload);
  const seatTokens = extractBoardingPassSeatTokens(rawPayload);
  const locatorTokens = extractBoardingPassLocatorTokens(rawPayload);

  if (locatorTokens.length === 0 && nameTokens.length === 0) {
    return passengers.filter((passenger) => passengerMatchesQuery(passenger, rawPayload));
  }

  let candidates = passengers;

  if (locatorTokens.length > 0) {
    candidates = candidates.filter((passenger) => {
      const passengerLocator = normalizeFlightValue(passenger.passengerId || '');
      if (!passengerLocator) return false;

      return locatorTokens.some((token) => expandLocatorVariants(token).has(passengerLocator));
    });

    if (candidates.length === 0) return [];
  }

  if (flightTokens.length > 0) {
    const flightMatched = candidates.filter((passenger) =>
      matchesFlightTokens(passenger.flight.departureFlightNumber, flightTokens)
    );

    if (flightMatched.length > 0) {
      candidates = flightMatched;
    } else if (locatorTokens.length === 0) {
      return [];
    }
  }

  if (seatTokens.length > 0) {
    const seatMatched = candidates.filter((passenger) => {
      const passengerSeat = normalizeSeatValue(passenger.seatNumber || '');
      return passengerSeat !== '' && seatTokens.some((token) => token === passengerSeat);
    });

    if (seatMatched.length > 0) {
      candidates = seatMatched;
    }
  }

  if (nameTokens.length > 0) {
    const nameMatched = candidates.filter((passenger) => {
      const passengerName = normalizeSearchValue(passenger.passengerName);
      return nameTokens.every((token) => matchesNameToken(passengerName, token));
    });

    if (nameMatched.length > 0) {
      candidates = nameMatched;
    } else if (locatorTokens.length === 0) {
      return [];
    }
  }

  return candidates;
};

const formatPassengerDisplayName = (value: string) =>
  value
    .split("/")
    .filter(Boolean)
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");

const hasSequenceNumber = (value?: string | null) => Boolean(value?.trim());

const isCheckedInNotBoarded = (passenger: Passenger) =>
  passenger.boardingStatus === 'NO_SHOW' && hasSequenceNumber(passenger.sequenceNumber);

const isNoShowPassenger = (passenger: Passenger) =>
  passenger.boardingStatus === 'NO_SHOW' && !hasSequenceNumber(passenger.sequenceNumber);

const focusScannerInput = (input: HTMLInputElement | null) => {
  if (!input) return;

  input.focus({ preventScroll: true });
  input.setSelectionRange(0, input.value.length);
};

let scannerAudioContext: AudioContext | null = null;

const getScannerAudioContext = () => {
  if (typeof window === 'undefined') return null;

  const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;

  if (!scannerAudioContext) {
    scannerAudioContext = new AudioContextCtor();
  }

  return scannerAudioContext;
};

const primeScannerAudio = async () => {
  const context = getScannerAudioContext();
  if (!context) return;

  if (context.state === 'suspended') {
    await context.resume();
  }
};

const playScannerFeedback = (status: 'success' | 'warning' | 'error') => {
  const context = getScannerAudioContext();
  if (!context) return;
  if (context.state === 'suspended') {
    void context.resume().then(() => playScannerFeedback(status)).catch(() => undefined);
    return;
  }
  if (context.state !== 'running') return;

  const masterGain = context.createGain();
  masterGain.connect(context.destination);
  masterGain.gain.setValueAtTime(status === 'success' ? 0.18 : 0.42, context.currentTime);

  const playTone = (frequency: number, start: number, duration: number, volume: number) => {
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.type = status === 'success' ? 'triangle' : 'sawtooth';
    oscillator.frequency.setValueAtTime(frequency, start);
    gainNode.gain.setValueAtTime(0.0001, start);
    gainNode.gain.exponentialRampToValueAtTime(volume, start + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gainNode);
    gainNode.connect(masterGain);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  };

  const now = context.currentTime;

  if (status === 'success') {
    playTone(880, now, 0.12, 0.22);
    playTone(1174, now + 0.14, 0.18, 0.2);
  } else if (status === 'warning') {
    playTone(1120, now, 0.18, 0.42);
    playTone(1120, now + 0.24, 0.32, 0.42);
    playTone(1120, now + 0.62, 0.32, 0.42);
    playTone(1120, now + 1.0, 0.26, 0.42);
  } else {
    playTone(1480, now, 0.12, 0.52);
    playTone(1480, now + 0.18, 0.12, 0.52);
    playTone(1480, now + 0.36, 0.12, 0.52);
    playTone(1480, now + 0.54, 0.24, 0.52);
  }
};

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
  const locatorTokens = extractBoardingPassLocatorTokens(rawPayload);

  const passengerLocator = normalizeFlightValue(passenger.passengerId || '');
  if (locatorTokens.length > 0) {
    if (!passengerLocator) {
      return false;
    }

    const matchesLocator = locatorTokens.some(
      (token) => expandLocatorVariants(token).has(passengerLocator)
    );

    if (!matchesLocator) {
      return false;
    }
  }

  if (nameTokens.length === 0) {
    return passengerMatchesQuery(passenger, rawPayload);
  }

  const passengerName = normalizeSearchValue(passenger.passengerName);
  if (!nameTokens.every((token) => matchesNameToken(passengerName, token))) {
    return false;
  }

  if (flightTokens.length > 0 && !matchesFlightTokens(passenger.flight.departureFlightNumber, flightTokens)) {
    return false;
  }

  const passengerSeat = normalizeSeatValue(passenger.seatNumber || '');
  if (seatTokens.length > 0 && passengerSeat) {
    const matchesSeat = seatTokens.some((token) => token === passengerSeat);
    if (!matchesSeat && locatorTokens.length === 0) {
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
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('CHECKED_IN');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPassengers, setSelectedPassengers] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

  const today = getTodayDateString();
  const todayDisplay = formatDateStringWithDay(today);
  const activeSearchTerm = searchMode === 'MANUAL' ? searchTerm : deviceInput;

  useEffect(() => {
    fetchActiveBoarding();
  }, []);

  useEffect(() => {
    if (searchMode !== 'MANUAL') {
      focusScannerInput(searchInputRef.current);
    }
  }, [searchMode]);

  useEffect(() => {
    if (!isScannerModalOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    focusScannerInput(searchInputRef.current);

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isScannerModalOpen]);

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

  const openScannerModal = (mode: Exclude<SearchMode, 'MANUAL'>) => {
    void primeScannerAudio();
    setSearchMode(mode);
    setIsScannerModalOpen(true);
    setDeviceFeedback(null);
    setScanResult(null);
    setDeviceInput('');
    lastProcessedDeviceInputRef.current = '';
  };

  const closeScannerModal = () => {
    setIsScannerModalOpen(false);
    setSearchMode('MANUAL');
    setDeviceInput('');
    setDeviceFeedback(null);
    lastProcessedDeviceInputRef.current = '';
  };

  const updatePassengerStatus = async (manifestId: string, passengerId: string, status: 'BOARDED' | 'NO_SHOW') => {
    if (!data) return;

    // Optimistic update - odmah ažuriraj UI
    const previousData = { ...data };
    const updatedManifests = data.manifests.map(m => {
      if (m.manifest.id === manifestId) {
        const updatedPassengers = m.passengers.map(p =>
          p.id === passengerId
            ? { ...p, boardingStatus: status, boardedAt: status === 'BOARDED' ? new Date().toISOString() : null }
            : p
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
      setScanResult({ status: 'EMPTY', message, scannedValue: query });
      showToast(message, 'warning');
      return;
    }

    const allMatches = searchMode === 'MANUAL'
      ? allPassengers.filter((passenger) => passengerMatchesQuery(passenger, query))
      : resolveDevicePayloadCandidates(allPassengers, query);
    const pendingMatches = allMatches.filter((passenger) => passenger.boardingStatus === 'NO_SHOW');
    const boardedMatches = allMatches.filter((passenger) => passenger.boardingStatus === 'BOARDED');

    if (pendingMatches.length === 1) {
      const passenger = pendingMatches[0];
      const boardedAt = new Date().toISOString();
      const message = `Putnik ${formatPassengerDisplayName(passenger.passengerName)} je ukrcan na let ${passenger.flight.departureFlightNumber || passenger.flight.route}.`;
      setDeviceFeedback(message);
      setScanResult({
        status: 'SUCCESS',
        message,
        passenger: { ...passenger, boardingStatus: 'BOARDED', boardedAt },
        matches: allMatches.length,
        scannedValue: query,
      });
      showToast(message, 'success');
      playScannerFeedback('success');
      await updatePassengerStatus(passenger.manifestId, passenger.id, 'BOARDED');
      setSelectedPassengers(new Set());
      setDeviceInput('');
      lastProcessedDeviceInputRef.current = '';
      focusScannerInput(searchInputRef.current);
      return;
    }

    if (boardedMatches.length === 1 && pendingMatches.length === 0 && allMatches.length === 1) {
      const passenger = boardedMatches[0];
      const message = `Putnik ${formatPassengerDisplayName(passenger.passengerName)} je već boardiran na letu ${passenger.flight.departureFlightNumber || passenger.flight.route}.`;
      setDeviceFeedback(message);
      setScanResult({
        status: 'ALREADY_BOARDED',
        message,
        passenger,
        matches: 1,
        scannedValue: query,
      });
      showToast(message, 'warning');
      playScannerFeedback('warning');
      focusScannerInput(searchInputRef.current);
      return;
    }

    if (allMatches.length === 0) {
      const message = 'Putnik nije pronađen na aktivnim letovima ili nije u manifestima.';
      setDeviceFeedback(message);
      setScanResult({
        status: 'NOT_ON_FLIGHT',
        message,
        scannedValue: query,
      });
      showToast(message, 'warning');
      playScannerFeedback('error');
      focusScannerInput(searchInputRef.current);
      return;
    }

    const candidateCount = pendingMatches.length > 0 ? pendingMatches.length : allMatches.length;
    const message = `Pronađeno je više kandidata (${candidateCount}). Provjerite let i detalje putnika prije boardinga.`;
    setDeviceFeedback(message);
    setScanResult({
      status: 'MULTIPLE',
      message,
      passenger: pendingMatches[0] || allMatches[0],
      matches: candidateCount,
      scannedValue: query,
    });
    showToast(message, 'info');
    focusScannerInput(searchInputRef.current);
  };

  // Flatten all passengers from all manifests
  const allPassengers: ActivePassenger[] = data?.manifests.flatMap(m =>
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
    if (statusFilter === 'CHECKED_IN') {
      if (!isCheckedInNotBoarded(passenger)) return false;
    } else if (statusFilter === 'NO_SHOW') {
      if (!isNoShowPassenger(passenger)) return false;
    } else if (statusFilter === 'BOARDED') {
      if (passenger.boardingStatus !== 'BOARDED') return false;
    }

    return true;
  });

  const checkedInCount = allPassengers.filter(isCheckedInNotBoarded).length;
  const noShowCount = allPassengers.filter(isNoShowPassenger).length;

  const getStatusBadge = (passenger: Passenger) => {
    switch (passenger.boardingStatus) {
      case 'BOARDED':
        return (
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
            Ukrcan
          </span>
        );
      case 'NO_SHOW':
        return (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${hasSequenceNumber(passenger.sequenceNumber) ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
            {hasSequenceNumber(passenger.sequenceNumber) ? 'Checked-in' : 'No-show'}
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

  const getScanResultStyles = (status: ScanResultStatus) => {
    switch (status) {
      case 'SUCCESS':
        return {
          wrapper: 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-100',
          banner: 'bg-green-600 text-white',
          card: 'bg-white/85 border-green-200',
          icon: <CheckCircle2 className="w-6 h-6 text-green-600" />,
          title: 'Putnik ukrcan',
          text: 'text-green-900',
          emphasis: 'BOARDING USPJEŠNO EVIDENTIRAN',
        };
      case 'ALREADY_BOARDED':
        return {
          wrapper: 'border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-100',
          banner: 'bg-amber-600 text-white',
          card: 'bg-white/85 border-amber-200',
          icon: <Info className="w-6 h-6 text-amber-600" />,
          title: 'Već boardiran',
          text: 'text-amber-900',
          emphasis: 'PUTNIK JE VEĆ BOARDIRAN',
        };
      case 'MULTIPLE':
        return {
          wrapper: 'border-amber-300 bg-gradient-to-br from-amber-50 to-yellow-100',
          banner: 'bg-amber-600 text-white',
          card: 'bg-white/85 border-amber-200',
          icon: <AlertTriangle className="w-6 h-6 text-amber-600" />,
          title: 'Više kandidata',
          text: 'text-amber-900',
          emphasis: 'POTREBNA RUČNA PROVJERA',
        };
      case 'NOT_ON_FLIGHT':
      case 'EMPTY':
      default:
        return {
          wrapper: 'border-red-300 bg-gradient-to-br from-red-50 to-rose-100',
          banner: 'bg-red-600 text-white',
          card: 'bg-white/85 border-red-200',
          icon: <XCircle className="w-6 h-6 text-red-600" />,
          title: 'Nema podudaranja',
          text: 'text-red-900',
          emphasis: 'PUTNIK NIJE PRONAĐEN',
        };
    }
  };

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
      <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 lg:gap-4 flex-wrap">
          <button
            onClick={() => router.push('/predboarding')}
            className="p-2.5 lg:p-3 rounded-lg lg:rounded-xl bg-dark-100 text-dark-600 hover:bg-dark-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 lg:w-5 lg:h-5" />
          </button>
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-xl lg:text-3xl font-bold text-dark-900">Aktivni boarding</h1>
            <p className="text-dark-500 mt-1 text-xs lg:text-sm">{todayDisplay}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-3 lg:px-4 py-2 lg:py-3 bg-white border border-dark-200 rounded-lg lg:rounded-xl text-sm lg:text-base font-semibold hover:bg-dark-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 lg:w-4 lg:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden md:inline">Osvježi</span>
          </button>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 lg:gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl lg:rounded-2xl p-3 lg:p-6 border border-blue-200">
            <div className="flex items-center gap-1.5 lg:gap-2 mb-1.5 lg:mb-2">
              <Plane className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
              <p className="text-xs lg:text-sm font-semibold text-blue-700 uppercase">Aktivni letovi</p>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-blue-900">{data.overallStats.totalFlights}</p>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl lg:rounded-2xl p-3 lg:p-6 border border-indigo-200">
            <div className="flex items-center gap-1.5 lg:gap-2 mb-1.5 lg:mb-2">
              <Users className="w-4 h-4 lg:w-5 lg:h-5 text-indigo-600" />
              <p className="text-xs lg:text-sm font-semibold text-indigo-700 uppercase">Ukupno putnika</p>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-indigo-900">{data.overallStats.totalPassengers}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl lg:rounded-2xl p-3 lg:p-6 border border-green-200">
            <div className="flex items-center gap-1.5 lg:gap-2 mb-1.5 lg:mb-2">
              <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-green-600" />
              <p className="text-xs lg:text-sm font-semibold text-green-700 uppercase">Ukrcano</p>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-green-900">{data.overallStats.totalBoarded}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl lg:rounded-2xl p-3 lg:p-6 border border-amber-200">
            <div className="flex items-center gap-1.5 lg:gap-2 mb-1.5 lg:mb-2">
              <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-amber-600" />
              <p className="text-xs lg:text-sm font-semibold text-amber-700 uppercase">Checked-in</p>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-amber-900">{checkedInCount}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl lg:rounded-2xl p-3 lg:p-6 border border-red-200">
            <div className="flex items-center gap-1.5 lg:gap-2 mb-1.5 lg:mb-2">
              <XCircle className="w-4 h-4 lg:w-5 lg:h-5 text-red-600" />
              <p className="text-xs lg:text-sm font-semibold text-red-700 uppercase">No-show</p>
            </div>
            <p className="text-2xl lg:text-3xl font-bold text-red-900">{noShowCount}</p>
          </div>
        </div>

        {/* Flight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {data.manifests.map((manifestData) => (
            <div
              key={manifestData.manifest.id}
              className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-soft border border-dark-100 hover:shadow-soft-lg transition-all cursor-pointer"
              onClick={() => router.push(`/predboarding/${manifestData.manifest.id}`)}
            >
              <div className="flex items-center gap-2 lg:gap-3 mb-2 lg:mb-3">
                {manifestData.manifest.flight.airline.logoUrl ? (
                  <img
                    src={manifestData.manifest.flight.airline.logoUrl}
                    alt={manifestData.manifest.flight.airline.name}
                    className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg object-contain bg-white border border-dark-100 p-1"
                  />
                ) : (
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-lg bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">
                    {manifestData.manifest.flight.airline.icaoCode}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-dark-900 text-xs lg:text-sm truncate">
                    {manifestData.manifest.flight.departureFlightNumber || manifestData.manifest.flight.route}
                  </p>
                  <p className="text-xs text-dark-500 truncate">{manifestData.manifest.flight.route}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 lg:gap-2 text-center">
                <div className="bg-blue-50 rounded-lg p-1.5 lg:p-2">
                  <p className="text-xs text-blue-600 font-semibold">Ukupno</p>
                  <p className="text-base lg:text-lg font-bold text-blue-900">{manifestData.stats.total}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-1.5 lg:p-2">
                  <p className="text-xs text-green-600 font-semibold">Ukrcano</p>
                  <p className="text-base lg:text-lg font-bold text-green-900">{manifestData.stats.boarded}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-1.5 lg:p-2">
                  <p className="text-xs text-amber-600 font-semibold">Čeka</p>
                  <p className="text-base lg:text-lg font-bold text-amber-900">{manifestData.stats.pending}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filters */}
        <div className="bg-white rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-soft">
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
                      if (mode.value === 'MANUAL') {
                        setSearchMode(mode.value);
                        setDeviceFeedback(null);
                        setScanResult(null);
                        setDeviceInput('');
                        lastProcessedDeviceInputRef.current = '';
                      } else {
                        openScannerModal(mode.value);
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
                        setScanResult(null);
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
                          setScanResult(null);
                          lastProcessedDeviceInputRef.current = '';
                          focusScannerInput(searchInputRef.current);
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
                  { value: 'CHECKED_IN', label: 'Checked-in' },
                  { value: 'NO_SHOW', label: 'No-show' },
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
        <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft overflow-hidden">
          <div className="p-4 lg:p-6 border-b border-dark-100">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg lg:text-xl font-bold text-dark-900">
                Putnici ({filteredPassengers.length})
              </h3>
              {(statusFilter === 'CHECKED_IN' || statusFilter === 'NO_SHOW') && filteredPassengers.length > 0 && (
                <button
                  onClick={selectAll}
                  className="px-2.5 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
                >
                  Selektuj sve
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-dark-100">
            {filteredPassengers.length === 0 ? (
              <div className="p-8 lg:p-12 text-center">
                <Users className="w-10 h-10 lg:w-12 lg:h-12 text-dark-300 mx-auto mb-3" />
                <p className="text-sm lg:text-base text-dark-500">Nema putnika koji odgovaraju filterima</p>
              </div>
            ) : (
              filteredPassengers.map((passenger) => (
                <div
                  key={passenger.id}
                  className={`p-3 lg:p-4 transition-colors ${
                    selectedPassengers.has(passenger.id) ? 'bg-blue-50' : 'hover:bg-dark-50'
                  }`}
                >
                  <div className="flex items-center gap-2 lg:gap-4">
                    {/* Checkbox (only for pending passengers) */}
                    {passenger.boardingStatus === 'NO_SHOW' && (
                      <div className="flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={selectedPassengers.has(passenger.id)}
                          onChange={() => togglePassengerSelection(passenger.id)}
                          className="w-4 h-4 lg:w-5 lg:h-5 rounded border-2 border-dark-300 text-primary-600 focus:ring-2 focus:ring-primary-500 cursor-pointer"
                        />
                      </div>
                    )}

                    {/* Seat Number */}
                    <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-lg lg:rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs lg:text-sm flex-shrink-0">
                      {passenger.seatNumber || 'N/A'}
                    </div>

                    {/* Passenger Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 lg:gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-sm lg:text-base text-dark-900 truncate">{formatPassengerDisplayName(passenger.passengerName)}</p>
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
                      <div className="flex items-center gap-2 lg:gap-3 text-xs text-dark-500 flex-wrap">
                        {passenger.sequenceNumber && <span>Seq: {passenger.sequenceNumber}</span>}
                        {passenger.passengerId && <span className="hidden md:inline">Locator: {passenger.passengerId}</span>}
                        {passenger.fareClass && passenger.fareClass !== passenger.passengerId && (
                          <span className="hidden lg:inline">Class: {passenger.fareClass}</span>
                        )}
                        <div className="flex items-center gap-1 lg:gap-1.5 bg-blue-50 text-blue-700 px-1.5 lg:px-2 py-0.5 lg:py-1 rounded text-xs font-semibold">
                          {passenger.flight.airline.logoUrl ? (
                            <img
                              src={passenger.flight.airline.logoUrl}
                              alt={passenger.flight.airline.name}
                              className="w-3.5 h-3.5 lg:w-4 lg:h-4 rounded object-contain"
                            />
                          ) : (
                            <Plane className="w-3 h-3" />
                          )}
                          <span className="truncate max-w-[80px] lg:max-w-none">{passenger.flight.departureFlightNumber || passenger.flight.route}</span>
                        </div>
                        <span className="hidden sm:inline">{passenger.flight.route}</span>
                        {passenger.flight.departureScheduledTime && (
                          <span className="hidden md:inline">Polazak: {formatTimeDisplay(passenger.flight.departureScheduledTime)}</span>
                        )}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                      {passenger.boardingStatus === 'BOARDED' ? (
                        <>
                          <span className="px-2 lg:px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                            Ukrcan
                          </span>
                          <button
                            onClick={() => updatePassengerStatus(passenger.manifestId, passenger.id, 'NO_SHOW')}
                            className="px-2.5 lg:px-3 py-1.5 lg:py-2 bg-dark-100 text-dark-600 rounded-lg lg:rounded-xl font-semibold hover:bg-dark-200 transition-colors text-xs lg:text-sm"
                          >
                            Poništi
                          </button>
                        </>
                      ) : (
                        <>
                          {getStatusBadge(passenger)}
                          <button
                            onClick={() => updatePassengerStatus(passenger.manifestId, passenger.id, 'BOARDED')}
                            className="px-3 lg:px-4 py-1.5 lg:py-2 bg-green-600 text-white rounded-lg lg:rounded-xl font-semibold hover:bg-green-700 transition-colors text-xs lg:text-sm"
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

        {isScannerModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm">
            <div className="h-full overflow-y-auto">
              <div className="min-h-full p-4 md:p-6">
                <div className="mx-auto max-w-7xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/20">
                  <div className="sticky top-0 z-10 bg-slate-950 text-white px-6 py-5 border-b border-white/10">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-sky-200 font-semibold">Scanner Workspace</p>
                        <h3 className="text-2xl font-black mt-1">Aktivni boarding skener</h3>
                        <p className="text-sm text-slate-300 mt-1">
                          Skeniranje, rezultat i lista putnika na jednom mjestu za sve aktivne letove
                        </p>
                      </div>
                      <button
                        onClick={closeScannerModal}
                        className="p-3 rounded-2xl bg-white/10 hover:bg-white/15 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6 bg-slate-50">
                    <div className="bg-white rounded-3xl p-5 shadow-soft border border-dark-100">
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
                                  void primeScannerAudio();
                                  setSearchMode(mode.value);
                                  setDeviceFeedback(null);
                                  setScanResult(null);
                                  if (mode.value !== 'MANUAL') {
                                    setDeviceInput('');
                                    lastProcessedDeviceInputRef.current = '';
                                    window.setTimeout(() => focusScannerInput(searchInputRef.current), 0);
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
                                    ? 'Ručno pretraži po imenu, sjedištu, broju leta ili ruti...'
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
                                    setScanResult(null);
                                    if (!value.trim()) {
                                      lastProcessedDeviceInputRef.current = '';
                                    }
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') {
                                    closeScannerModal();
                                  }
                                  if (e.key === 'Enter' && searchMode !== 'MANUAL') {
                                    void attemptDeviceBoarding();
                                  }
                                }}
                                className="w-full pl-12 pr-4 py-4 bg-dark-50 border border-dark-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-base"
                              />
                            </div>

                            <div className="flex items-center justify-between gap-3 flex-wrap">
                              <p className="text-xs text-dark-500">
                                Modal je optimizovan za brz scanner tok, ali možeš i ručno pretražiti bez izlaska iz modala.
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    void primeScannerAudio();
                                    playScannerFeedback('warning');
                                  }}
                                  className="px-3 py-2 text-sm bg-amber-100 text-amber-800 rounded-lg font-semibold hover:bg-amber-200 transition-colors"
                                >
                                  Test zvuk
                                </button>
                                <button
                                  onClick={() => {
                                    setDeviceInput('');
                                    setDeviceFeedback(null);
                                    setScanResult(null);
                                    lastProcessedDeviceInputRef.current = '';
                                    focusScannerInput(searchInputRef.current);
                                  }}
                                  className="px-3 py-2 text-sm bg-dark-100 text-dark-700 rounded-lg font-semibold hover:bg-dark-200 transition-colors"
                                >
                                  Očisti
                                </button>
                                {searchMode !== 'MANUAL' && (
                                  <button
                                    onClick={() => void attemptDeviceBoarding()}
                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                                  >
                                    Pretraži i ukrcaj
                                  </button>
                                )}
                              </div>
                            </div>

                            {deviceFeedback && searchMode !== 'MANUAL' && (
                              <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                                <p className="text-sm text-blue-900">{deviceFeedback}</p>
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2 flex-wrap">
                            {([
                              { value: 'ALL', label: 'Svi' },
                              { value: 'CHECKED_IN', label: 'Checked-in' },
                              { value: 'NO_SHOW', label: 'No-show' },
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

                    <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
                      <div className="p-6 border-b border-dark-100">
                        <h3 className="text-xl font-bold text-dark-900">Rezultat skeniranja</h3>
                        <p className="text-sm text-dark-500 mt-1">Detalji zadnjeg reader/scanner unosa sa jasno označenim letom</p>
                      </div>
                      {scanResult ? (() => {
                        const styles = getScanResultStyles(scanResult.status);
                        const passenger = scanResult.passenger;
                        return (
                          <div className={`m-4 rounded-2xl border p-5 ${styles.wrapper}`}>
                            <div className={`mb-4 rounded-2xl px-4 py-3 ${styles.banner}`}>
                              <div className="flex items-center gap-3">
                                {styles.icon}
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-90">{styles.title}</p>
                                  <p className="text-xl font-black leading-tight">{styles.emphasis}</p>
                                </div>
                              </div>
                            </div>
                            <div className="mb-4">
                              <p className={`text-base font-semibold ${styles.text}`}>{scanResult.message}</p>
                            </div>
                            {scanResult.scannedValue && (
                              <div className={`mb-4 rounded-xl border px-3 py-2 ${styles.card}`}>
                                <p className="text-[11px] uppercase tracking-wide text-dark-500">Scan input</p>
                                <p className="text-sm font-mono text-dark-800 break-all">{scanResult.scannedValue}</p>
                              </div>
                            )}
                            {passenger && (
                              <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] gap-4">
                                <div className="space-y-3">
                                  <div className={`rounded-2xl border px-4 py-4 ${styles.card}`}>
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dark-500">Putnik</p>
                                    <p className="text-2xl font-black text-dark-900 mt-1">{formatPassengerDisplayName(passenger.passengerName)}</p>
                                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                                      {getTitleBadge(passenger.title)}
                                      {getStatusBadge(passenger)}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className={`rounded-xl border px-3 py-3 ${styles.card}`}>
                                      <p className="text-[11px] uppercase tracking-wide text-dark-500">Sjedište</p>
                                      <p className="text-lg font-bold text-dark-900">{passenger.seatNumber || 'N/A'}</p>
                                    </div>
                                    <div className={`rounded-xl border px-3 py-3 ${styles.card}`}>
                                      <p className="text-[11px] uppercase tracking-wide text-dark-500">Seq</p>
                                      <p className="text-lg font-bold text-dark-900">{passenger.sequenceNumber || 'N/A'}</p>
                                    </div>
                                    <div className={`rounded-xl border px-3 py-3 col-span-2 ${styles.card}`}>
                                      <p className="text-[11px] uppercase tracking-wide text-dark-500">Locator</p>
                                      <p className="text-lg font-bold text-dark-900">{passenger.passengerId || 'N/A'}</p>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  <div className="rounded-2xl border border-slate-700 bg-slate-950 text-white px-4 py-4 shadow-soft">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">Let za boarding</p>
                                    <p className="text-3xl font-black mt-1">{passenger.flight.departureFlightNumber || passenger.flight.route}</p>
                                    <p className="text-sm text-slate-100 mt-1">{passenger.flight.route}</p>
                                    <div className="mt-3 flex items-center gap-2 flex-wrap text-xs text-slate-50">
                                      <span className="px-2 py-1 rounded-full bg-white/15 border border-white/10">
                                        {passenger.flight.airline.name}
                                      </span>
                                      {passenger.flight.departureScheduledTime && (
                                        <span className="px-2 py-1 rounded-full bg-white/15 border border-white/10">
                                          Polazak: {formatTimeDisplay(passenger.flight.departureScheduledTime)}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {passenger.boardedAt && (
                                    <div className={`rounded-xl border px-3 py-3 ${styles.card}`}>
                                      <p className="text-[11px] uppercase tracking-wide text-dark-500">Vrijeme boardinga</p>
                                      <p className="text-lg font-bold text-dark-900">{formatDateTimeDisplay(passenger.boardedAt)}</p>
                                    </div>
                                  )}

                                  {scanResult.matches && scanResult.matches > 1 && (
                                    <div className={`rounded-xl border px-3 py-3 ${styles.card}`}>
                                      <p className="text-[11px] uppercase tracking-wide text-dark-500">Kandidata</p>
                                      <p className="text-lg font-bold text-dark-900">{scanResult.matches}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })() : (
                        <div className="p-8 text-center text-dark-500">
                          <ScanLine className="w-10 h-10 text-dark-300 mx-auto mb-3" />
                          <p>Još nema skeniranog putnika.</p>
                        </div>
                      )}
                    </div>

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

                    <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
                      <div className="p-6 border-b border-dark-100">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xl font-bold text-dark-900">
                            Putnici ({filteredPassengers.length})
                          </h3>
                          {(statusFilter === 'CHECKED_IN' || statusFilter === 'NO_SHOW') && filteredPassengers.length > 0 && (
                            <button
                              onClick={selectAll}
                              className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
                            >
                              Selektuj sve
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="divide-y divide-dark-100 max-h-[42vh] overflow-y-auto">
                        {filteredPassengers.length === 0 ? (
                          <div className="p-12 text-center">
                            <Users className="w-12 h-12 text-dark-300 mx-auto mb-3" />
                            <p className="text-dark-500">Nema putnika koji odgovaraju filterima</p>
                          </div>
                        ) : (
                          filteredPassengers.map((passenger) => (
                            <div
                              key={`modal-${passenger.id}`}
                              className={`p-4 transition-colors ${
                                selectedPassengers.has(passenger.id) ? 'bg-blue-50' : 'hover:bg-dark-50'
                              }`}
                            >
                              <div className="flex items-center gap-4">
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
                                <div className="w-14 h-14 rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                                  {passenger.seatNumber || 'N/A'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <p className="font-bold text-dark-900">{formatPassengerDisplayName(passenger.passengerName)}</p>
                                    {getTitleBadge(passenger.title)}
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
                                      {getStatusBadge(passenger)}
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
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
