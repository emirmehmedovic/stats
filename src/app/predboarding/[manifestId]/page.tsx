'use client';

import { useEffect, useRef, useState } from 'react';
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
  Info,
  X,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { showToast } from '@/components/ui/toast';
import { formatDateStringWithDay, formatTimeDisplay, formatDateTimeDisplay } from '@/lib/dates';

interface Passenger {
  id: string;
  seatNumber: string | null;
  passengerName: string;
  rawPassengerName?: string | null;
  sequenceNumber?: string | null;
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

type StatusFilter = 'ALL' | 'CHECKED_IN' | 'NO_SHOW' | 'BOARDED';
type SearchMode = 'MANUAL' | 'READER' | 'SCANNER';
type ScanResultStatus = 'SUCCESS' | 'ALREADY_BOARDED' | 'NOT_ON_FLIGHT' | 'MULTIPLE' | 'EMPTY';

type ScanResult = {
  status: ScanResultStatus;
  message: string;
  passenger?: Passenger | null;
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

  const structuredMatch = normalized.match(
    /(?:^|\s)M\d[A-Z]+(?:[\/-][A-Z]+)+\s+([A-Z0-9]{6,7})(?=\s|$)/
  );
  if (structuredMatch) {
    const fullLocator = structuredMatch[1];
    locatorTokens.add(fullLocator);

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
  passengers: Passenger[],
  flight: Flight,
  rawPayload: string
) => {
  const nameTokens = extractReaderNameTokens(rawPayload);
  const flightTokens = extractBoardingPassFlightTokens(rawPayload);
  const seatTokens = extractBoardingPassSeatTokens(rawPayload);
  const locatorTokens = extractBoardingPassLocatorTokens(rawPayload);

  if (locatorTokens.length === 0 && nameTokens.length === 0) {
    return passengers.filter((passenger) => passengerMatchesQuery(passenger, flight, rawPayload));
  }

  let candidates = passengers;

  if (locatorTokens.length > 0) {
    candidates = candidates.filter((passenger) => {
      const passengerLocator = normalizeFlightValue(passenger.passengerId || '');
      return passengerLocator !== '' && locatorTokens.some((token) => expandLocatorVariants(token).has(passengerLocator));
    });

    if (candidates.length === 0) return [];
  }

  if (flightTokens.length > 0) {
    const flightMatched = candidates.filter((passenger) =>
      matchesFlightTokens(flight.departureFlightNumber, flightTokens)
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
    return passengerMatchesQuery(passenger, flight, rawPayload);
  }

  const passengerName = normalizeSearchValue(passenger.passengerName);
  if (!nameTokens.every((token) => matchesNameToken(passengerName, token))) {
    return false;
  }

  if (flightTokens.length > 0 && !matchesFlightTokens(flight.departureFlightNumber, flightTokens)) {
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

export default function BoardingInterfacePage() {
  const router = useRouter();
  const params = useParams();
  const manifestId = params?.manifestId as string;
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const lastProcessedDeviceInputRef = useRef('');

  const [data, setData] = useState<ManifestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchMode, setSearchMode] = useState<SearchMode>('MANUAL');
  const [deviceInput, setDeviceInput] = useState('');
  const [deviceFeedback, setDeviceFeedback] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('CHECKED_IN');
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [selectedPassengers, setSelectedPassengers] = useState<Set<string>>(new Set());
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);

  useEffect(() => {
    if (manifestId) {
      fetchManifest();
    }
  }, [manifestId]);

  useEffect(() => {
    if (searchMode !== 'MANUAL') {
      focusScannerInput(searchInputRef.current);
    } else {
      lastProcessedDeviceInputRef.current = '';
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
    if (searchMode === 'MANUAL') return;

    const query = deviceInput.trim();
    if (query.length < 6) return;
    if (query === lastProcessedDeviceInputRef.current) return;

    const timeoutId = window.setTimeout(() => {
      lastProcessedDeviceInputRef.current = query;
      void attemptDeviceBoarding(query);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [deviceInput, searchMode, data]);

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
      ? data.manifest.passengers.filter((passenger) =>
          passengerMatchesQuery(passenger, data.manifest.flight, query)
        )
      : resolveDevicePayloadCandidates(data.manifest.passengers, data.manifest.flight, query);
    const pendingMatches = allMatches.filter((passenger) => passenger.boardingStatus === 'NO_SHOW');
    const boardedMatches = allMatches.filter((passenger) => passenger.boardingStatus === 'BOARDED');

    if (pendingMatches.length === 1) {
      const passenger = pendingMatches[0];
      const message = `Pronađen putnik ${formatPassengerDisplayName(passenger.passengerName)}. Boarding je evidentiran.`;
      setDeviceFeedback(message);
      setScanResult({
        status: 'SUCCESS',
        message,
        passenger,
        matches: allMatches.length,
        scannedValue: query,
      });
      showToast(message, 'success');
      playScannerFeedback('success');
      await updatePassengerStatus(passenger.id, 'BOARDED');
      setSelectedPassengers(new Set());
      setDeviceInput('');
      lastProcessedDeviceInputRef.current = '';
      focusScannerInput(searchInputRef.current);
      return;
    }

    if (boardedMatches.length === 1 && pendingMatches.length === 0 && allMatches.length === 1) {
      const passenger = boardedMatches[0];
      const message = `Putnik ${formatPassengerDisplayName(passenger.passengerName)} je već boardiran.`;
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
      const message = 'Putnik nije na ovom letu ili nije pronađen u manifestu.';
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
    const message = `Pronađeno je više kandidata (${candidateCount}). Provjerite detalje putnika u listi.`;
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
    if (statusFilter === 'CHECKED_IN') {
      if (!isCheckedInNotBoarded(passenger)) return false;
    } else if (statusFilter === 'NO_SHOW') {
      if (!isNoShowPassenger(passenger)) return false;
    } else if (statusFilter === 'BOARDED') {
      if (passenger.boardingStatus !== 'BOARDED') return false;
    }

    return true;
  }) || [];

  const checkedInCount = data?.manifest.passengers.filter(isCheckedInNotBoarded).length || 0;
  const noShowCount = data?.manifest.passengers.filter(isNoShowPassenger).length || 0;

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

  const getScanResultStyles = (status: ScanResultStatus) => {
    switch (status) {
      case 'SUCCESS':
        return {
          wrapper: 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-100',
          banner: 'bg-green-600 text-white',
          card: 'bg-white/80 border-green-200',
          icon: <CheckCircle2 className="w-6 h-6 text-green-600" />,
          title: 'Putnik ukrcan',
          text: 'text-green-900',
          subtext: 'text-green-700',
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
          subtext: 'text-amber-700',
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
          subtext: 'text-amber-700',
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
          subtext: 'text-red-700',
          emphasis: 'PUTNIK NIJE PRONAĐEN',
        };
    }
  };

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
            <h1 className="text-xl lg:text-3xl font-bold text-dark-900">Boarding interfejs</h1>
            <p className="text-dark-500 mt-1 text-xs lg:text-sm truncate">{manifest.originalFileName}</p>
          </div>
          <button
            onClick={() => router.push('/predboarding/active')}
            className="px-3 lg:px-4 py-2 lg:py-3 bg-blue-600 text-white rounded-lg lg:rounded-xl text-sm lg:text-base font-semibold hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <Users className="w-4 h-4 lg:w-5 lg:h-5" />
            <span className="hidden md:inline">Multi-flight view</span>
            <span className="md:hidden">Multi-view</span>
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting || manifest.boardingStatus !== 'IN_PROGRESS'}
            className="px-3 lg:px-4 py-2 lg:py-3 bg-red-600 text-white rounded-lg lg:rounded-xl text-sm lg:text-base font-semibold hover:bg-red-700 disabled:bg-dark-200 disabled:text-dark-400 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                <span className="hidden md:inline">Brišem...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden md:inline">Obriši manifest</span>
                <span className="md:hidden">Obriši</span>
              </>
            )}
          </button>
          <button
            onClick={() => setShowFinalizeConfirm(true)}
            disabled={isFinalizing || manifest.boardingStatus !== 'IN_PROGRESS'}
            className="px-4 lg:px-6 py-2 lg:py-3 bg-green-600 text-white rounded-lg lg:rounded-xl text-sm lg:text-base font-semibold hover:bg-green-700 disabled:bg-dark-200 disabled:text-dark-400 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isFinalizing ? (
              <>
                <Loader2 className="w-4 h-4 lg:w-5 lg:h-5 animate-spin" />
                <span className="hidden md:inline">Finalizujem...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5" />
                <span className="hidden md:inline">Završi boarding</span>
                <span className="md:hidden">Završi</span>
              </>
            )}
          </button>
        </div>

        {/* Flight Info */}
        <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-2xl lg:rounded-3xl p-4 lg:p-6 text-white shadow-soft-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-8 -mb-8"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-3 lg:mb-4 gap-3">
              <div className="flex items-center gap-2 lg:gap-4 flex-1 min-w-0">
                {manifest.flight.airline.logoUrl ? (
                  <img
                    src={manifest.flight.airline.logoUrl}
                    alt={manifest.flight.airline.name}
                    className="w-10 h-10 lg:w-14 lg:h-14 rounded-lg lg:rounded-xl object-contain bg-white p-1.5 lg:p-2"
                  />
                ) : (
                  <div className="w-10 h-10 lg:w-14 lg:h-14 rounded-lg lg:rounded-xl bg-white/10 text-white font-bold flex items-center justify-center text-sm lg:text-base backdrop-blur-md">
                    {manifest.flight.airline.icaoCode}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-base lg:text-xl font-bold truncate">{manifest.flight.airline.name}</h2>
                  <p className="text-dark-300 text-xs lg:text-sm">{manifest.flight.airline.icaoCode}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {manifest.flight.departureFlightNumber ? (
                  <>
                    <p className="text-lg lg:text-2xl font-bold">{manifest.flight.departureFlightNumber}</p>
                    <p className="text-dark-300 text-xs lg:text-sm">{manifest.flight.route}</p>
                  </>
                ) : (
                  <p className="text-base lg:text-xl font-bold text-primary-200">{manifest.flight.route}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 lg:gap-3">
              <div className="p-2.5 lg:p-3 rounded-xl lg:rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-dark-200 mb-1">Datum</p>
                <p className="text-xs lg:text-sm font-bold">{formatDateStringWithDay(manifest.flight.date)}</p>
              </div>
              <div className="p-2.5 lg:p-3 rounded-xl lg:rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-dark-200 mb-1">Polazak</p>
                <p className="text-xs lg:text-sm font-bold">
                  {manifest.flight.departureScheduledTime ? formatTimeDisplay(manifest.flight.departureScheduledTime) : 'N/A'}
                </p>
              </div>
              <div className="p-2.5 lg:p-3 rounded-xl lg:rounded-2xl bg-white/5 border border-white/10">
                <p className="text-xs text-dark-200 mb-1">Avion</p>
                <p className="text-xs lg:text-sm font-bold">{manifest.flight.aircraftType?.model || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 lg:gap-4">
          {[
            { label: 'Ukupno', value: stats.total, color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Users },
            { label: 'Ukrcano', value: stats.boarded, color: 'bg-green-50 text-green-700 border-green-200', icon: CheckCircle2 },
            { label: 'Checked-in', value: checkedInCount, color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
            { label: 'No-show', value: noShowCount, color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
            { label: 'Muškarci', value: stats.male, color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Users },
            { label: 'Žene', value: stats.female, color: 'bg-pink-50 text-pink-700 border-pink-200', icon: Users },
            { label: 'Djeca', value: stats.children, color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Users },
            { label: 'Bebe', value: stats.infants, color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Baby },
          ].map((stat) => (
            <div key={stat.label} className={`p-3 lg:p-4 rounded-xl lg:rounded-2xl border ${stat.color}`}>
              <div className="flex items-center gap-1.5 lg:gap-2 mb-1.5 lg:mb-2">
                <stat.icon className="w-3 h-3 lg:w-4 lg:h-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">{stat.label}</p>
              </div>
              <p className="text-xl lg:text-2xl font-bold">{stat.value}</p>
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
                    className={`px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl font-semibold text-xs lg:text-sm transition-all flex items-center gap-2 ${
                      searchMode === mode.value
                        ? 'bg-dark-900 text-white'
                        : 'bg-dark-100 text-dark-600 hover:bg-dark-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                    {mode.label}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col md:flex-row gap-3 lg:gap-4">
              <div className="flex-1 space-y-3">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" />
                  <input
                    ref={searchInputRef}
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
                    className="w-full pl-10 lg:pl-12 pr-3 lg:pr-4 py-2.5 lg:py-3 text-sm lg:text-base bg-dark-50 border border-dark-200 rounded-lg lg:rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                {searchMode !== 'MANUAL' && (
                  <div className="flex items-center justify-between gap-2 lg:gap-3 flex-wrap">
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
                        className="px-2.5 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm bg-dark-100 text-dark-700 rounded-lg font-semibold hover:bg-dark-200 transition-colors"
                      >
                        Očisti
                      </button>
                      <button
                        onClick={() => void attemptDeviceBoarding()}
                        className="px-3 lg:px-4 py-1.5 lg:py-2 text-xs lg:text-sm bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                      >
                        Pretraži i ukrcaj
                      </button>
                    </div>
                  </div>
                )}

                {deviceFeedback && searchMode !== 'MANUAL' && (
                  <div className="rounded-lg lg:rounded-xl border border-blue-200 bg-blue-50 px-3 lg:px-4 py-2 lg:py-3">
                    <p className="text-xs lg:text-sm text-blue-900">{deviceFeedback}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2 flex-wrap">
                {([
                  { value: 'ALL', label: 'Svi' },
                  { value: 'CHECKED_IN', label: 'Checked-in' },
                  { value: 'BOARDED', label: 'Boarded' },
                  { value: 'NO_SHOW', label: 'No-show' }
                ] as Array<{ value: StatusFilter; label: string }>).map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setStatusFilter(filter.value)}
                    className={`px-3 lg:px-4 py-2 lg:py-3 rounded-lg lg:rounded-xl font-semibold text-xs lg:text-sm transition-all whitespace-nowrap ${
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
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl lg:rounded-2xl p-3 lg:p-4 shadow-soft">
            <div className="flex items-center justify-between gap-3 lg:gap-4 flex-wrap">
              <div className="flex items-center gap-2 lg:gap-3">
                <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-blue-600" />
                <span className="font-semibold text-sm lg:text-base text-blue-900">
                  Selektovano: {selectedPassengers.size} {selectedPassengers.size === 1 ? 'putnik' : 'putnika'}
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => bulkUpdateStatus('BOARDED')}
                  disabled={isBulkUpdating}
                  className="px-3 lg:px-4 py-1.5 lg:py-2 bg-green-600 text-white rounded-lg lg:rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors text-xs lg:text-sm flex items-center gap-2"
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
                  className="px-3 lg:px-4 py-1.5 lg:py-2 bg-dark-100 text-dark-700 rounded-lg lg:rounded-xl font-semibold hover:bg-dark-200 disabled:opacity-50 transition-colors text-xs lg:text-sm"
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
                Lista putnika ({filteredPassengers.length})
              </h3>
              <div className="flex items-center gap-2 lg:gap-3">
                {(statusFilter === 'CHECKED_IN' || statusFilter === 'NO_SHOW') && filteredPassengers.length > 0 && (
                  <button
                    onClick={selectAll}
                    className="px-2.5 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition-colors"
                  >
                    Selektuj sve
                  </button>
                )}
                <Filter className="w-4 h-4 lg:w-5 lg:h-5 text-dark-400" />
              </div>
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
                    <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-lg lg:rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs lg:text-sm flex-shrink-0">
                      {passenger.seatNumber || 'N/A'}
                    </div>

                    {/* Passenger Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 lg:gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-sm lg:text-base text-dark-900 truncate">{formatPassengerDisplayName(passenger.passengerName)}</p>
                        {getTitleBadge(passenger.title)}
                        {passenger.isInfant && (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-semibold flex items-center gap-1">
                            <Baby className="w-3 h-3" />
                            <span className="hidden md:inline">Infant</span>
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 lg:gap-4 text-xs text-dark-500 flex-wrap">
                        {passenger.sequenceNumber && <span>Seq: {passenger.sequenceNumber}</span>}
                        {passenger.passengerId && <span className="hidden md:inline">Locator: {passenger.passengerId}</span>}
                        {passenger.fareClass && passenger.fareClass !== passenger.passengerId && <span className="hidden lg:inline">Class: {passenger.fareClass}</span>}
                        {passenger.confirmationDate && <span className="hidden xl:inline">Confirmed: {passenger.confirmationDate}</span>}
                      </div>
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                      {getStatusBadge(passenger)}

                      {passenger.boardingStatus === 'NO_SHOW' && (
                        <button
                          onClick={() => updatePassengerStatus(passenger.id, 'BOARDED')}
                          className="px-3 lg:px-4 py-1.5 lg:py-2 bg-green-600 text-white rounded-lg lg:rounded-xl font-semibold hover:bg-green-700 transition-colors text-xs lg:text-sm"
                        >
                          Ukrcaj
                        </button>
                      )}

                      {passenger.boardingStatus === 'BOARDED' && (
                        <button
                          onClick={() => updatePassengerStatus(passenger.id, 'NO_SHOW')}
                          className="px-2.5 lg:px-3 py-1.5 lg:py-2 bg-dark-100 text-dark-600 rounded-lg lg:rounded-xl font-semibold hover:bg-dark-200 transition-colors text-xs lg:text-sm"
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

        {isScannerModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm">
            <div className="h-full overflow-y-auto">
              <div className="min-h-full p-4 md:p-6">
                <div className="mx-auto max-w-7xl bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/20">
                  <div className="sticky top-0 z-10 bg-slate-950 text-white px-6 py-5 border-b border-white/10">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <p className="text-xs uppercase tracking-[0.22em] text-sky-200 font-semibold">Scanner Workspace</p>
                        <h3 className="text-2xl font-black mt-1">Boarding skeniranje</h3>
                        <p className="text-sm text-slate-300 mt-1">
                          Scanner, reader i ručna pretraga na jednom mjestu za let {manifest.flight.departureFlightNumber || manifest.flight.route}
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
                                    ? 'Ručno pretraži po imenu, sjedištu ili broju leta...'
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
                                U modalu možeš skenirati ili ručno pretražiti. Rezultat i lista su odmah ispod.
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

                    <div className="bg-white rounded-3xl shadow-soft overflow-hidden">
                      <div className="p-6 border-b border-dark-100">
                        <h3 className="text-xl font-bold text-dark-900">Rezultat skeniranja</h3>
                        <p className="text-sm text-dark-500 mt-1">Detalji zadnjeg reader/scanner unosa</p>
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
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div className={`rounded-2xl border px-4 py-4 ${styles.card}`}>
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-dark-500">Putnik</p>
                                    <p className="text-2xl font-black text-dark-900 mt-1">{formatPassengerDisplayName(passenger.passengerName)}</p>
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                                  <div className={`rounded-xl border px-3 py-3 ${styles.card}`}>
                                    <p className="text-[11px] uppercase tracking-wide text-dark-500">Let</p>
                                    <p className="text-lg font-bold text-dark-900">{manifest.flight.departureFlightNumber || manifest.flight.route}</p>
                                    <p className="text-xs text-dark-500 mt-1">{manifest.flight.route}</p>
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
                            Lista putnika ({filteredPassengers.length})
                          </h3>
                          <div className="flex items-center gap-3">
                            {(statusFilter === 'CHECKED_IN' || statusFilter === 'NO_SHOW') && filteredPassengers.length > 0 && (
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
                                <div className="w-16 h-16 rounded-xl bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-sm flex-shrink-0">
                                  {passenger.seatNumber || 'N/A'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className="font-bold text-dark-900">{formatPassengerDisplayName(passenger.passengerName)}</p>
                                    {getTitleBadge(passenger.title)}
                                    {passenger.isInfant && (
                                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-xs font-semibold flex items-center gap-1">
                                        <Baby className="w-3 h-3" />
                                        Infant
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-4 text-xs text-dark-500 flex-wrap">
                                    {passenger.sequenceNumber && <span>Seq: {passenger.sequenceNumber}</span>}
                                    {passenger.passengerId && <span>Locator: {passenger.passengerId}</span>}
                                    {passenger.fareClass && passenger.fareClass !== passenger.passengerId && <span>Class: {passenger.fareClass}</span>}
                                    {passenger.confirmationDate && <span>Confirmed: {passenger.confirmationDate}</span>}
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                  {getStatusBadge(passenger)}
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
