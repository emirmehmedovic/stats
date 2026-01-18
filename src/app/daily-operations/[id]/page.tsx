'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, Plane, Clock, Users, Package, Mail, Calendar, Building2, MapPin, Settings, AlertCircle, CheckCircle2, ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error';
import { showToast } from '@/components/ui/toast';
import { MainLayout } from '@/components/layout/MainLayout';
import { ValidationWarningModal } from '@/components/daily-operations/ValidationWarningModal';
import { PassengerBreakdownInput, type PassengerBreakdown } from '@/components/daily-operations/PassengerBreakdownInput';
import { MultipleDelaysInput, type DelayInput } from '@/components/daily-operations/MultipleDelaysInput';
import { LdmMessageInput } from '@/components/daily-operations/LdmMessageInput';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { formatDateString, formatDateTimeDisplay, formatDateTimeLocalValue, getDateStringInTimeZone, getTodayDateString, TIME_ZONE_SARAJEVO } from '@/lib/dates';
import type { LdmData } from '@/lib/parsers/ldm-parser';

type Flight = {
  id: string;
  date: string;
  route: string;
  registration: string;
  operationTypeId: string;
  flightTypeId?: string | null;
  operationType: {
    id: string;
    code: string;
    name: string;
  };
  flightType?: {
    id: string;
    code: string;
    name: string;
  } | null;
  availableSeats: number | null;
  airline: {
    name: string;
    icaoCode: string;
  };
  aircraftType: {
    id: string;
    model: string;
    seats: number;
    mtow: number;
  } | null;
  arrivalFlightNumber: string | null;
  arrivalScheduledTime: string | null;
  arrivalActualTime: string | null;
  arrivalEnginesOffTime: string | null;
  arrivalPassengers: number | null;
  arrivalLoadFactor: number | null;
  arrivalFerryIn: boolean;
  arrivalInfants: number | null;
  arrivalBaggage: number | null;
  arrivalCargo: number | null;
  arrivalMail: number | null;
  departureFlightNumber: string | null;
  departureScheduledTime: string | null;
  departureActualTime: string | null;
  departurePassengers: number | null;
  departureLoadFactor: number | null;
  departureFerryOut: boolean;
  departureInfants: number | null;
  departureBaggage: number | null;
  departureCargo: number | null;
  departureMail: number | null;
  isLocked: boolean;
  isVerified: boolean;
  verifiedByUser?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  delays?: Array<{
    id: string;
    phase: 'ARR' | 'DEP';
    delayCodeId: string;
    delayCode: {
      id: string;
      code: string;
      description: string;
      category: string;
    };
    minutes: number;
    isPrimary: boolean;
    comment: string | null;
  }>;
};

export default function FlightDataEntryPage() {
  const router = useRouter();
  const params = useParams();
  const flightId = params.id as string;
  const searchParams = useSearchParams();
  const returnDate = searchParams?.get('date');
  const returnPath = returnDate
    ? `/daily-operations?date=${encodeURIComponent(returnDate)}`
    : '/daily-operations';

  const [flight, setFlight] = useState<Flight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [airlines, setAirlines] = useState<Array<{ id: string; name: string; icaoCode: string }>>([]);
  const [aircraftTypes, setAircraftTypes] = useState<Array<{ id: string; model: string; seats: number; mtow: number }>>([]);
  const [operationTypes, setOperationTypes] = useState<Array<{
    id: string;
    code: string;
    name: string;
    flightTypeLinks?: Array<{
      flightType: { id: string; code: string; name: string; isActive: boolean };
    }>;
  }>>([]);
  const [availableFlightTypes, setAvailableFlightTypes] = useState<Array<{ id: string; code: string; name: string; isActive: boolean }>>([]);
  const [delayCodes, setDelayCodes] = useState<Array<{ id: string; code: string; description: string; category: string }>>([]);
  const [airlineSearch, setAirlineSearch] = useState('');
  const [aircraftTypeSearch, setAircraftTypeSearch] = useState('');
  const [isVerificationLocked, setIsVerificationLocked] = useState(false);
  const [pendingVerificationDate, setPendingVerificationDate] = useState<string | null>(null);
  const [isDepartureExpanded, setIsDepartureExpanded] = useState(false);
  const [isArrivalExpanded, setIsArrivalExpanded] = useState(false);
  const [userRole, setUserRole] = useState<'ADMIN' | 'MANAGER' | 'OPERATIONS' | 'VIEWER' | 'STW' | null>(null);
  const [airlineRoutes, setAirlineRoutes] = useState<Array<{ route: string; destination: string; country: string }>>([]);

  const [formData, setFormData] = useState({
    // Basic info (editable)
    airlineId: '',
    aircraftTypeId: '',
    route: '',
    registration: '',
    availableSeats: '',
    operationTypeId: '',
    flightTypeId: '',
    // Arrival
    arrivalFlightNumber: '',
    arrivalScheduledTime: '',
    arrivalActualTime: '',
    arrivalEnginesOffTime: '',
    arrivalStatus: 'OPERATED',
    arrivalCancelReason: '',
    arrivalPassengers: '',
    arrivalMalePassengers: '',
    arrivalFemalePassengers: '',
    arrivalChildren: '',
    arrivalInfants: '',
    arrivalBaggage: '',
    arrivalBaggageCount: '',
    arrivalCargo: '',
    arrivalMail: '',
    arrivalFerryIn: false,
    // Departure
    departureFlightNumber: '',
    departureScheduledTime: '',
    departureActualTime: '',
    departureDoorClosingTime: '',
    departureStatus: 'OPERATED',
    departureCancelReason: '',
    departurePassengers: '',
    departureMalePassengers: '',
    departureFemalePassengers: '',
    departureChildren: '',
    departureInfants: '',
    departureNoShow: '',
    departureBaggage: '',
    departureBaggageCount: '',
    departureCargo: '',
    departureMail: '',
    departureFerryOut: false,
    isVerified: false,
  });

  // Delays state (separate from formData)
  const [arrivalDelays, setArrivalDelays] = useState<DelayInput[]>([]);
  const [departureDelays, setDepartureDelays] = useState<DelayInput[]>([]);

  // Validation warning modal
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const maxScheduledDateTimeLocal = flight
    ? `${getDateStringInTimeZone(new Date(flight.date), TIME_ZONE_SARAJEVO)}T23:59`
    : '';
  const maxTodayDateTimeLocal = `${getTodayDateString()}T23:59`;

  // Check if arrival or departure data exists
  const hasArrivalData = flight && (
    flight.arrivalFlightNumber ||
    flight.arrivalScheduledTime ||
    flight.arrivalActualTime ||
    flight.arrivalEnginesOffTime ||
    flight.arrivalPassengers !== null ||
    flight.arrivalInfants !== null ||
    flight.arrivalBaggage !== null ||
    flight.arrivalCargo !== null ||
    flight.arrivalMail !== null
  );

  const hasDepartureData = flight && (
    flight.departureFlightNumber ||
    flight.departureScheduledTime ||
    flight.departureActualTime ||
    flight.departurePassengers !== null ||
    flight.departureInfants !== null ||
    flight.departureBaggage !== null ||
    flight.departureCargo !== null ||
    flight.departureMail !== null
  );

  useEffect(() => {
    fetchFormData();
    fetchFlight();

    // Get user role from localStorage (set by AuthCheck)
    const role = localStorage.getItem('userRole') as 'ADMIN' | 'MANAGER' | 'OPERATIONS' | 'VIEWER' | 'STW' | null;
    setUserRole(role);
  }, [flightId]);

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchAirlines(airlineSearch);
    }, 300);

    return () => clearTimeout(handle);
  }, [airlineSearch]);

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchAircraftTypes(aircraftTypeSearch);
    }, 300);

    return () => clearTimeout(handle);
  }, [aircraftTypeSearch]);

  useEffect(() => {
    if (formData.airlineId) {
      fetchAirlineRoutes(formData.airlineId);
    } else {
      setAirlineRoutes([]);
    }
  }, [formData.airlineId]);

  useEffect(() => {
    if (!formData.operationTypeId) {
      setAvailableFlightTypes([]);
      if (formData.flightTypeId) {
        setFormData(prev => ({ ...prev, flightTypeId: '' }));
      }
      return;
    }

    if (operationTypes.length === 0) {
      return;
    }

    const currentOperationType = operationTypes.find((type) => type.id === formData.operationTypeId);
    const linkedFlightTypes = currentOperationType?.flightTypeLinks?.map((link) => link.flightType) || [];
    const activeFlightTypes = linkedFlightTypes.filter((type) => type.isActive);
    setAvailableFlightTypes(activeFlightTypes);

    if (formData.flightTypeId && !activeFlightTypes.some((type) => type.id === formData.flightTypeId)) {
      setFormData(prev => ({ ...prev, flightTypeId: '' }));
    }
  }, [formData.operationTypeId, operationTypes, formData.flightTypeId]);

  useEffect(() => {
    if (!flight) return;
    const todayStr = getTodayDateString();
    const flightDateStr = getDateStringInTimeZone(new Date(flight.date), TIME_ZONE_SARAJEVO);
    if (flightDateStr !== todayStr) {
      setIsVerificationLocked(false);
      return;
    }

    const checkPending = async () => {
      try {
        const res = await fetch(`/api/daily-operations/verification/pending?date=${todayStr}`);
        const data = await res.json();
        if (!res.ok || !data?.success) {
          setIsVerificationLocked(true);
          setPendingVerificationDate(null);
          return;
        }
        setIsVerificationLocked(!data?.data?.allVerified);
        setPendingVerificationDate(data?.data?.latestPendingDate || null);
      } catch (err) {
        console.error('Error fetching pending verification status:', err);
        setIsVerificationLocked(true);
        setPendingVerificationDate(null);
      }
    };

    checkPending();
  }, [flight]);

  const fetchAirlines = async (search?: string) => {
    try {
      const allAirlines: Array<{ id: string; name: string; icaoCode: string }> = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const params = new URLSearchParams({
          page: String(page),
          limit: '100',
        });
        if (search) {
          params.set('search', search);
        }

        const res = await fetch(`/api/airlines?${params.toString()}`);
        if (!res.ok) break;

        const data = await res.json();
        allAirlines.push(...(data.data || []));
        hasMore = !!data.pagination?.hasMore;
        page += 1;
      }

      setAirlines(allAirlines);
    } catch (error) {
      console.error('Error fetching airlines:', error);
    }
  };

  const fetchAircraftTypes = async (search?: string) => {
    try {
      const params = new URLSearchParams();
      if (search) {
        params.set('search', search);
      }

      const res = await fetch(`/api/aircraft-types?${params.toString()}`);
      if (!res.ok) return;

      const data = await res.json();
      setAircraftTypes(data.data || []);
    } catch (error) {
      console.error('Error fetching aircraft types:', error);
    }
  };

  const fetchAirlineRoutes = async (airlineId: string) => {
    try {
      const response = await fetch(`/api/airlines/${airlineId}/routes`);
      const result = await response.json();
      if (result.success) {
        setAirlineRoutes(result.data);
      }
    } catch (err) {
      console.error('Error fetching airline routes:', err);
      setAirlineRoutes([]);
    }
  };

  const fetchFormData = async () => {
    try {
      const [operationTypesRes, delayCodesRes] = await Promise.all([
        fetch('/api/operation-types?activeOnly=true&includeFlightTypes=true'),
        fetch('/api/delay-codes'),
      ]);

      await fetchAirlines();
      await fetchAircraftTypes();

      if (operationTypesRes.ok) {
        const operationTypesData = await operationTypesRes.json();
        setOperationTypes(operationTypesData.data || []);
      }

      if (delayCodesRes.ok) {
        const delayCodesData = await delayCodesRes.json();
        setDelayCodes(delayCodesData.data || []);
      }
    } catch (err) {
      console.error('Error fetching form data:', err);
    }
  };

  const fetchFlight = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/flights/${flightId}`);
      const result = await response.json();

      if (result.success) {
        const flightData = result.data;

        // Default status to SCHEDULED unless explicitly set or actual time exists
        const resolvedArrivalStatus =
          flightData.arrivalStatus
            ? flightData.arrivalStatus
            : flightData.arrivalActualTime
              ? 'OPERATED'
              : 'OPERATED';
        const resolvedDepartureStatus =
          flightData.departureStatus
            ? flightData.departureStatus
            : flightData.departureActualTime
              ? 'OPERATED'
              : 'OPERATED';
        const resolvedRoute =
          typeof flightData.route === 'string'
            ? flightData.route
            : flightData.route?.name || flightData.route?.code || '';
        const cleanedFlight = { ...flightData, route: resolvedRoute };
        setFlight(cleanedFlight);

        // Populate form with existing data
        setFormData({
          airlineId: flightData.airline?.id || flightData.airlineId || '',
          aircraftTypeId: flightData.aircraftType?.id || '',
          route: resolvedRoute,
          registration: flightData.registration || '',
          availableSeats: flightData.availableSeats?.toString() || '',
          operationTypeId: flightData.operationType?.id || flightData.operationTypeId || '',
          flightTypeId: flightData.flightType?.id || flightData.flightTypeId || '',
          arrivalFlightNumber: flightData.arrivalFlightNumber || '',
          arrivalScheduledTime: formatDateTimeLocalValue(flightData.arrivalScheduledTime),
          arrivalActualTime: formatDateTimeLocalValue(flightData.arrivalActualTime),
          arrivalEnginesOffTime: formatDateTimeLocalValue(flightData.arrivalEnginesOffTime) || '',
          arrivalStatus: resolvedArrivalStatus,
          arrivalCancelReason: flightData.arrivalCancelReason || '',
          arrivalPassengers: flightData.arrivalPassengers?.toString() || '',
          arrivalMalePassengers: flightData.arrivalMalePassengers?.toString() || '',
          arrivalFemalePassengers: flightData.arrivalFemalePassengers?.toString() || '',
          arrivalChildren: flightData.arrivalChildren?.toString() || '',
          arrivalInfants: flightData.arrivalInfants?.toString() || '',
          arrivalBaggage: flightData.arrivalBaggage?.toString() || '',
          arrivalBaggageCount: flightData.arrivalBaggageCount?.toString() || '',
          arrivalCargo: flightData.arrivalCargo?.toString() || '',
          arrivalMail: flightData.arrivalMail?.toString() || '',
          arrivalFerryIn: flightData.arrivalFerryIn || false,
          departureFlightNumber: flightData.departureFlightNumber || '',
          departureScheduledTime: formatDateTimeLocalValue(flightData.departureScheduledTime),
          departureActualTime: formatDateTimeLocalValue(flightData.departureActualTime),
          departureDoorClosingTime: formatDateTimeLocalValue(flightData.departureDoorClosingTime) || `${flightData.date}T00:00`,
          departureStatus: resolvedDepartureStatus,
          departureCancelReason: flightData.departureCancelReason || '',
          departurePassengers: flightData.departurePassengers?.toString() || '',
          departureMalePassengers: flightData.departureMalePassengers?.toString() || '',
          departureFemalePassengers: flightData.departureFemalePassengers?.toString() || '',
          departureChildren: flightData.departureChildren?.toString() || '',
          departureInfants: flightData.departureInfants?.toString() || '',
          departureNoShow: flightData.departureNoShow?.toString() || '',
          departureBaggage: flightData.departureBaggage?.toString() || '',
          departureBaggageCount: flightData.departureBaggageCount?.toString() || '',
          departureCargo: flightData.departureCargo?.toString() || '',
          departureMail: flightData.departureMail?.toString() || '',
          departureFerryOut: flightData.departureFerryOut || false,
          isVerified: !!flightData.isVerified,
        });

        if (flightData.airline?.id) {
          setAirlines(prev => {
            if (prev.some(a => a.id === flightData.airline?.id)) {
              return prev;
            }
            return [
              { id: flightData.airline.id, name: flightData.airline.name, icaoCode: flightData.airline.icaoCode },
              ...prev,
            ];
          });
        }

        // Populate delays
        if (flightData.delays && Array.isArray(flightData.delays)) {
          const arrDelays = flightData.delays
            .filter((d: any) => d.phase === 'ARR')
            .map((d: any) => ({
              id: d.id,
              delayCodeId: d.delayCodeId,
              minutes: d.minutes,
              isPrimary: d.isPrimary,
              comment: d.comment || '',
              unofficialReason: d.unofficialReason || '',
            }));

          const depDelays = flightData.delays
            .filter((d: any) => d.phase === 'DEP')
            .map((d: any) => ({
              id: d.id,
              delayCodeId: d.delayCodeId,
              minutes: d.minutes,
              isPrimary: d.isPrimary,
              comment: d.comment || '',
              unofficialReason: d.unofficialReason || '',
            }));

          setArrivalDelays(arrDelays);
          setDepartureDelays(depDelays);
        }
      } else {
        setError(result.error || 'Let nije pronađen');
      }
    } catch (err) {
      setError('Greška pri učitavanju leta');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent, bypassWarnings = false) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    try {
      // Build payload - only include fields that have values
      const payload: any = {
        registration: formData.registration || null,
        availableSeats: formData.availableSeats ? parseInt(formData.availableSeats) : null,
        operationTypeId: formData.operationTypeId || undefined,
        flightTypeId: formData.flightTypeId ? formData.flightTypeId : null,
        arrivalFlightNumber: formData.arrivalFlightNumber || null,
        arrivalScheduledTime: formData.arrivalScheduledTime ? new Date(formData.arrivalScheduledTime).toISOString() : null,
        arrivalActualTime: formData.arrivalActualTime ? new Date(formData.arrivalActualTime).toISOString() : null,
        arrivalEnginesOffTime: formData.arrivalEnginesOffTime ? (() => {
          const date = new Date(formData.arrivalEnginesOffTime);
          return !isNaN(date.getTime()) ? date.toISOString() : null;
        })() : null,
        arrivalStatus: formData.arrivalStatus || 'OPERATED',
        arrivalCancelReason: formData.arrivalStatus === 'CANCELLED' ? formData.arrivalCancelReason || null : null,
        arrivalPassengers: formData.arrivalFerryIn
          ? null
          : formData.arrivalPassengers
          ? parseInt(formData.arrivalPassengers)
          : null,
        arrivalMalePassengers: formData.arrivalFerryIn
          ? null
          : formData.arrivalMalePassengers
          ? parseInt(formData.arrivalMalePassengers)
          : null,
        arrivalFemalePassengers: formData.arrivalFerryIn
          ? null
          : formData.arrivalFemalePassengers
          ? parseInt(formData.arrivalFemalePassengers)
          : null,
        arrivalChildren: formData.arrivalFerryIn
          ? null
          : formData.arrivalChildren
          ? parseInt(formData.arrivalChildren)
          : null,
        arrivalInfants: formData.arrivalFerryIn
          ? null
          : formData.arrivalInfants
          ? parseInt(formData.arrivalInfants)
          : null,
        arrivalBaggage: formData.arrivalBaggage ? parseInt(formData.arrivalBaggage) : null,
        arrivalBaggageCount: formData.arrivalBaggageCount ? parseInt(formData.arrivalBaggageCount) : null,
        arrivalCargo: formData.arrivalCargo ? parseInt(formData.arrivalCargo) : null,
        arrivalMail: formData.arrivalMail ? parseInt(formData.arrivalMail) : null,
        arrivalFerryIn: formData.arrivalFerryIn,
        departureFlightNumber: formData.departureFlightNumber || null,
        departureScheduledTime: formData.departureScheduledTime ? new Date(formData.departureScheduledTime).toISOString() : null,
        departureActualTime: formData.departureActualTime ? new Date(formData.departureActualTime).toISOString() : null,
        departureDoorClosingTime: formData.departureDoorClosingTime ? (() => {
          const date = new Date(formData.departureDoorClosingTime);
          return !isNaN(date.getTime()) ? date.toISOString() : null;
        })() : null,
        departureStatus: formData.departureStatus || 'OPERATED',
        departureCancelReason: formData.departureStatus === 'CANCELLED' ? formData.departureCancelReason || null : null,
        departurePassengers: formData.departureFerryOut
          ? null
          : formData.departurePassengers
          ? parseInt(formData.departurePassengers)
          : null,
        departureMalePassengers: formData.departureFerryOut
          ? null
          : formData.departureMalePassengers
          ? parseInt(formData.departureMalePassengers)
          : null,
        departureFemalePassengers: formData.departureFerryOut
          ? null
          : formData.departureFemalePassengers
          ? parseInt(formData.departureFemalePassengers)
          : null,
        departureChildren: formData.departureFerryOut
          ? null
          : formData.departureChildren
          ? parseInt(formData.departureChildren)
          : null,
        departureInfants: formData.departureFerryOut
          ? null
          : formData.departureInfants
          ? parseInt(formData.departureInfants)
          : null,
        departureNoShow: formData.departureNoShow ? parseInt(formData.departureNoShow) : null,
        departureBaggage: formData.departureBaggage ? parseInt(formData.departureBaggage) : null,
        departureBaggageCount: formData.departureBaggageCount ? parseInt(formData.departureBaggageCount) : null,
        departureCargo: formData.departureCargo ? parseInt(formData.departureCargo) : null,
        departureMail: formData.departureMail ? parseInt(formData.departureMail) : null,
        departureFerryOut: formData.departureFerryOut,
        confirmLowLoadFactor: bypassWarnings, // Flag za bypass upozorenja
        isVerified: formData.isVerified,
      };

      // Add optional fields only if they have values
      if (formData.airlineId) {
        payload.airlineId = formData.airlineId;
      }
      if (formData.aircraftTypeId) {
        payload.aircraftTypeId = formData.aircraftTypeId;
      }
      if (formData.route) {
        payload.route = formData.route;
      }

      // Prepare delays array from state
      const delays: any[] = [
        ...arrivalDelays.map((d) => ({
          phase: 'ARR',
          delayCodeId: d.delayCodeId,
          minutes: d.minutes,
          isPrimary: d.isPrimary,
          comment: d.comment || null,
          unofficialReason: d.unofficialReason || null,
        })),
        ...departureDelays.map((d) => ({
          phase: 'DEP',
          delayCodeId: d.delayCodeId,
          minutes: d.minutes,
          isPrimary: d.isPrimary,
          comment: d.comment || null,
          unofficialReason: d.unofficialReason || null,
        })),
      ];
      payload.delays = delays;

      const response = await fetch(`/api/flights/${flightId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Podaci su uspješno sačuvani!', 'success');
        router.push(returnPath);
      } else if (result.requiresConfirmation && result.warnings) {
        // Prikaži warning modal
        setValidationWarnings(result.warnings);
        setShowWarningModal(true);
        setPendingSubmit(true);
      } else if (result.validationErrors) {
        // Prikaži validation errors
        setError(result.validationErrors.join('\n'));
      } else {
        setError(result.error || 'Greška pri čuvanju podataka');
      }
    } catch (err) {
      setError('Greška pri čuvanju podataka');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting || isReadOnly) return;
    const confirmed = window.confirm('Da li ste sigurni da želite obrisati ovaj let?');
    if (!confirmed) return;

    setIsDeleting(true);
    setError('');

    try {
      const response = await fetch(`/api/flights/${flightId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const result = await response.json();

      if (response.ok) {
        showToast('Let je uspješno obrisan.', 'success');
        router.push(returnPath);
      } else {
        setError(result.error || 'Greška pri brisanju leta');
      }
    } catch (err) {
      console.error(err);
      setError('Greška pri brisanju leta');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleWarningConfirm = () => {
    setShowWarningModal(false);
    setPendingSubmit(false);
    // Re-submit sa bypass flag-om
    const fakeEvent = { preventDefault: () => {} } as FormEvent;
    handleSubmit(fakeEvent, true);
  };

  const handleWarningCancel = () => {
    setShowWarningModal(false);
    setPendingSubmit(false);
    setValidationWarnings([]);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBooleanChange = (field: string, value: boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFerryToggle = (
    field: 'arrivalFerryIn' | 'departureFerryOut',
    checked: boolean
  ) => {
    setFormData(prev => {
      const next = { ...prev, [field]: checked };
      if (field === 'arrivalFerryIn' && checked) {
        next.arrivalPassengers = '';
        next.arrivalMalePassengers = '';
        next.arrivalFemalePassengers = '';
        next.arrivalChildren = '';
        next.arrivalInfants = '';
      }
      if (field === 'departureFerryOut' && checked) {
        next.departurePassengers = '';
        next.departureMalePassengers = '';
        next.departureFemalePassengers = '';
        next.departureChildren = '';
        next.departureInfants = '';
      }
      return next;
    });
  };

  const handleLdmDataParsed = (data: LdmData, phase: 'arrival' | 'departure') => {
    setFormData(prev => {
      const next = { ...prev };

      // Popuni zajedničke podatke (registration, capacity) samo iz dolaznog LDM-a
      if (phase === 'arrival') {
        if (data.registration) {
          next.registration = data.registration;
        }
        if (data.capacity) {
          next.availableSeats = data.capacity.toString();
        }
        if (data.flightNumber) {
          next.arrivalFlightNumber = data.flightNumber;
        }
      }

      if (phase === 'departure') {
        if (data.registration) {
          next.registration = data.registration;
        }
        if (data.capacity) {
          next.availableSeats = data.capacity.toString();
        }
        if (data.flightNumber) {
          next.departureFlightNumber = data.flightNumber;
        }
      }

      // Popuni passenger podatke
      if (phase === 'arrival') {
        if (data.totalPassengers !== null) next.arrivalPassengers = data.totalPassengers.toString();
        if (data.male !== null) next.arrivalMalePassengers = data.male.toString();
        if (data.female !== null) next.arrivalFemalePassengers = data.female.toString();
        if (data.children !== null) next.arrivalChildren = data.children.toString();
        if (data.infants !== null) next.arrivalInfants = data.infants.toString();
        if (data.baggageWeight !== null) next.arrivalBaggage = data.baggageWeight.toString();
        if (data.baggageCount !== null) next.arrivalBaggageCount = data.baggageCount.toString();
      } else {
        if (data.totalPassengers !== null) next.departurePassengers = data.totalPassengers.toString();
        if (data.male !== null) next.departureMalePassengers = data.male.toString();
        if (data.female !== null) next.departureFemalePassengers = data.female.toString();
        if (data.children !== null) next.departureChildren = data.children.toString();
        if (data.infants !== null) next.departureInfants = data.infants.toString();
        if (data.baggageWeight !== null) next.departureBaggage = data.baggageWeight.toString();
        if (data.baggageCount !== null) next.departureBaggageCount = data.baggageCount.toString();
      }

      return next;
    });

    showToast('LDM podaci uspješno primijenjeni na formu', 'success');
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <LoadingSpinner text="Učitavam let..." />
        </div>
      </MainLayout>
    );
  }

  if (error && !flight) {
    return (
      <MainLayout>
        <div className="p-8">
          <ErrorDisplay error={error} onBack={() => router.push(returnPath)} />
        </div>
      </MainLayout>
    );
  }

  if (!flight) return null;

  const routeDisplay =
    typeof flight.route === 'string'
      ? flight.route
      : (flight.route as any)?.name || (flight.route as any)?.code || '';
  const flightDateDisplay = formatDateString(
    getDateStringInTimeZone(new Date(flight.date), TIME_ZONE_SARAJEVO)
  );
  // ADMIN can edit verified flights and bypass verification lock
  const isReadOnly =
    flight.isLocked ||
    (flight.isVerified && userRole !== 'ADMIN') ||
    (isVerificationLocked && userRole !== 'ADMIN');
  const displayValue = (value?: string | number | null) => {
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  };
  const displayDateTime = (value?: string | null) => {
    if (!value) return '-';
    return formatDateTimeDisplay(value);
  };
  const formId = 'daily-operations-form';
  const getDelaySummary = (delays: DelayInput[]) => {
    const summary = delays
      .map((delay) => {
        const code = delayCodes.find((item) => item.id === delay.delayCodeId)?.code;
        const minutes = delay.minutes ? `${delay.minutes}m` : '';
        const parts = [code, minutes].filter(Boolean);
        return parts.length ? parts.join(' ') : null;
      })
      .filter(Boolean)
      .join(', ');
    return summary || '-';
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-8">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push(returnPath)}
          className="flex items-center gap-2 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Nazad na pregled
        </Button>

        {/* Flight Info Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 to-dark-800 text-white shadow-soft-xl">
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 opacity-10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-500 opacity-10 rounded-full blur-3xl -ml-24 -mb-24"></div>

          <div className="relative z-10 p-8">
            {/* Title & Status Row */}
            <div className="flex flex-col lg:flex-row items-start justify-between gap-6 mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Plane className="w-5 h-5" />
                  </div>
                  <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Flight Operations</span>
                </div>
                <h1 className="text-3xl font-bold">Dnevne operacije - {routeDisplay}</h1>
              </div>
              <div className="flex flex-col items-start lg:items-end gap-3 w-full lg:w-auto">
                <div className="flex flex-wrap gap-2 justify-start lg:justify-end">
                  {flight.isLocked && (
                    <span className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-sm font-semibold flex items-center gap-2">
                      🔒 Zaključan
                    </span>
                  )}
                  {flight.isVerified && (
                    <span className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-sm font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" />
                      Verifikovan
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="submit"
                    form={formId}
                    disabled={isSaving || isReadOnly}
                    className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
                  >
                    {isSaving ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Čuvam...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Sačuvaj
                      </span>
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting || isReadOnly}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-100 border border-red-400/30"
                  >
                    {isDeleting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-red-100 border-t-transparent rounded-full animate-spin" />
                        Brišem...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Trash2 className="w-4 h-4" />
                        Obriši
                      </span>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Flight Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide font-medium">Ruta</p>
                <p className="text-xl font-bold">{routeDisplay || '-'}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide font-medium">Broj leta</p>
                <p className="text-lg font-bold">{displayValue(formData.arrivalFlightNumber)}</p>
                <p className="text-xs text-slate-300">ARR</p>
                <p className="text-lg font-bold mt-2">{displayValue(formData.departureFlightNumber)}</p>
                <p className="text-xs text-slate-300">DEP</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide font-medium">Aviokompanija</p>
                <p className="text-xl font-bold">{flight.airline?.icaoCode || '-'}</p>
                <p className="text-xs text-slate-300">{flight.airline?.name || ''}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide font-medium">Datum</p>
                <p className="text-xl font-bold">{flightDateDisplay}</p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
                <p className="text-xs text-slate-400 mb-1 uppercase tracking-wide font-medium">Avion</p>
                <p className="text-xl font-bold">{flight.aircraftType?.model || '-'}</p>
                {flight.registration && (
                  <p className="text-xs text-slate-300">{flight.registration}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Alert Cards */}
        {isVerificationLocked && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-3xl p-6 flex items-start gap-4 shadow-soft">
            <div className="p-3 bg-amber-100 rounded-2xl">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-amber-900 mb-1">Potrebna verifikacija</p>
              <p className="text-sm text-amber-800">
                Verifikujte prethodne operacije{pendingVerificationDate ? ` za ${formatDateString(pendingVerificationDate)}` : ''}
                na stranici Dnevne operacije kako biste mogli unositi podatke za današnje letove.
              </p>
            </div>
          </div>
        )}
        {flight.isVerified && (
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200 rounded-3xl p-6 flex items-start gap-4 shadow-soft">
            <div className="p-3 bg-emerald-100 rounded-2xl">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900 mb-1">Let verifikovan</p>
              <p className="text-sm text-emerald-800">
                Let je verifikovan i više se ne može uređivati.
              </p>
              {flight.verifiedByUser && (
                <p className="text-xs text-emerald-700 mt-2 font-medium">
                  Verifikovao: {flight.verifiedByUser.name || flight.verifiedByUser.email}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Form */}
        <form id={formId} onSubmit={handleSubmit} className="space-y-8">
          <fieldset disabled={isReadOnly} className="space-y-8">
            {/* Basic Information Section */}
            <div className="relative overflow-hidden bg-white rounded-3xl shadow-soft border border-slate-200">
              {/* Decorative blob */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-slate-100 opacity-50 rounded-full blur-3xl -mr-20 -mt-20"></div>

              <div className="relative z-10 p-8">
                {/* Section Header */}
                <div className="flex items-center justify-between mb-8 pb-6 border-b-2 border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl shadow-sm">
                      <Settings className="w-6 h-6 text-slate-700" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">Osnovne informacije</h2>
                      <p className="text-sm text-slate-600 font-medium">Opšti podaci o letu</p>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="flex flex-col gap-2">
                    {/* Door Closing Time Badge */}
                    {hasDepartureData && (
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        formData.departureDoorClosingTime
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formData.departureDoorClosingTime ? '✓ Zatvaranje vrata uneseno' : '⚠ Zatvaranje vrata nije uneseno'}</span>
                      </div>
                    )}

                    {/* Engines Off Time Badge */}
                    {hasArrivalData && (
                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                        formData.arrivalEnginesOffTime
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formData.arrivalEnginesOffTime ? '✓ Gašenje motora uneseno' : '⚠ Gašenje motora nije uneseno'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Date - Read Only */}
            <div>
              <Label>
                <Calendar className="w-4 h-4 inline mr-1" />
                Datum
              </Label>
              <Input
                value={flightDateDisplay}
                disabled
                className="bg-slate-50"
              />
            </div>

            {/* Airline - Editable */}
            <div>
              <Label>
                <Building2 className="w-4 h-4 inline mr-1" />
                Aviokompanija
              </Label>
              <SearchableSelect
                options={airlines.map(airline => ({
                  value: airline.id,
                  label: airline.name,
                  subtitle: airline.icaoCode,
                }))}
                value={formData.airlineId}
                onChange={(value) => handleChange('airlineId', value)}
                onSearchChange={setAirlineSearch}
                placeholder="Izaberite aviokompaniju"
                searchPlaceholder="Pretraga aviokompanije..."
              />
            </div>

            {/* ICAO Code - Auto-updated from airline */}
            <div>
              <Label>ICAO kod</Label>
              <Input
                value={airlines.find(a => a.id === formData.airlineId)?.icaoCode || ''}
                disabled
                className="bg-slate-50"
                placeholder="Auto-odabrano"
              />
            </div>

            {/* Route - Editable */}
            <div>
              <Label>
                <MapPin className="w-4 h-4 inline mr-1" />
                Ruta
              </Label>
              {airlineRoutes.length > 0 ? (
                <select
                  value={formData.route}
                  onChange={(e) => handleChange('route', e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all bg-white text-slate-900"
                  disabled={isReadOnly}
                >
                  <option value="">Odaberi rutu</option>
                  {airlineRoutes.map((route) => (
                    <option key={route.route} value={route.route}>
                      {route.route} - {route.destination}, {route.country}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={formData.route}
                  onChange={(e) => handleChange('route', e.target.value)}
                  placeholder="FMM-Memmingen"
                  disabled={isReadOnly}
                />
              )}
              {formData.airlineId && airlineRoutes.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Nema definisanih ruta za ovu aviokompaniju. Dodajte rute na stranici Aviokompanije.
                </p>
              )}
            </div>

            {/* Aircraft Type - Editable */}
            <div>
              <Label>
                <Plane className="w-4 h-4 inline mr-1" />
                Tip aviona
              </Label>
              <SearchableSelect
                options={aircraftTypes.map(type => ({
                  value: type.id,
                  label: type.model,
                  subtitle: `${type.seats} sjedišta`,
                }))}
                value={formData.aircraftTypeId}
                onChange={(value) => handleChange('aircraftTypeId', value)}
                onSearchChange={setAircraftTypeSearch}
                placeholder="Izaberite tip aviona"
                searchPlaceholder="Pretraga tipa aviona..."
              />
            </div>

            {/* MTOW - Auto-updated from aircraft type */}
            <div>
              <Label>MTOW (kg)</Label>
              <Input
                value={aircraftTypes.find(t => t.id === formData.aircraftTypeId)?.mtow?.toLocaleString() || ''}
                disabled
                className="bg-slate-50"
                placeholder="Auto-odabrano"
              />
            </div>

            {/* Registration - Editable */}
            <div>
              <Label>Registracija</Label>
              <Input
                value={formData.registration}
                onChange={(e) => handleChange('registration', e.target.value)}
                placeholder="HA-LYG"
              />
            </div>

            {/* Available Seats - Editable (with default from aircraft type) */}
            <div>
              <Label>Raspoloživa mjesta</Label>
              <Input
                type="number"
                min="0"
                value={formData.availableSeats || aircraftTypes.find(t => t.id === formData.aircraftTypeId)?.seats?.toString() || ''}
                onChange={(e) => handleChange('availableSeats', e.target.value)}
                placeholder={aircraftTypes.find(t => t.id === formData.aircraftTypeId)?.seats?.toString() || "186"}
              />
              {aircraftTypes.find(t => t.id === formData.aircraftTypeId) && (
                <p className="text-xs text-slate-500 mt-1">
                  Default: {aircraftTypes.find(t => t.id === formData.aircraftTypeId)?.seats} sjedišta
                </p>
              )}
            </div>

            {/* Operation Type - Editable */}
            <div>
              <Label>Tip operacije</Label>
              <select
                value={formData.operationTypeId}
                onChange={(e) => handleChange('operationTypeId', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Izaberite tip operacije</option>
                {operationTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {typeof type.name === 'string' ? type.name : type.code}
                  </option>
                ))}
              </select>
            </div>

            {/* Flight Type - Depends on operation type */}
            <div>
              <Label>Tip leta</Label>
              <select
                value={formData.flightTypeId}
                onChange={(e) => handleChange('flightTypeId', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!formData.operationTypeId || availableFlightTypes.length === 0}
              >
                <option value="">
                  {formData.operationTypeId ? 'Izaberite tip leta' : 'Prvo odaberite tip operacije'}
                </option>
                {availableFlightTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {formData.operationTypeId && availableFlightTypes.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Nema povezanih tipova leta za odabrani tip operacije.
                </p>
              )}
            </div>
                </div>
              </div>
            </div>

            {/* Departure Section */}
            {hasDepartureData && (
            <div className="relative overflow-hidden bg-white rounded-3xl shadow-soft border-l-8 border-orange-400">
              {/* Decorative blobs */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-100 opacity-40 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-100 opacity-40 rounded-full blur-3xl -ml-24 -mb-24"></div>

              <div className="relative z-10">
                {/* Section Header - Collapsible */}
                <div
                  className="flex items-center justify-between p-8 cursor-pointer hover:bg-orange-50/30 transition-colors group"
                  onClick={() => setIsDepartureExpanded(!isDepartureExpanded)}
                  role="button"
                  aria-expanded={isDepartureExpanded}
                  aria-controls="departure-section"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-gradient-to-br from-orange-100 to-amber-100 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                      <Plane className="w-6 h-6 text-orange-600 transform -rotate-45" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-orange-900">Odlazak (Departure)</h2>
                      <p className="text-sm text-orange-700 font-medium">Podaci o odlasku leta</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                      {isDepartureExpanded ? 'Kliknite za zatvaranje' : 'Kliknite za otvaranje'}
                    </span>
                    <ChevronDown
                      className={`w-6 h-6 text-orange-600 transition-all duration-300 group-hover:scale-110 ${
                        isDepartureExpanded ? 'transform rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                <div
                  className={`px-8 pb-8 transition-[max-height,opacity,transform] duration-300 ease-in-out overflow-hidden ${
                    isDepartureExpanded ? 'max-h-[3000px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'
                  }`}
                  id="departure-section"
                  aria-hidden={!isDepartureExpanded}
                >
                  <div className="space-y-6 pt-2">
                    <div className="rounded-2xl border border-orange-200/60 bg-white/70 p-4 shadow-sm">
                      <LdmMessageInput
                        phase="departure"
                        onDataParsed={(data) => handleLdmDataParsed(data, 'departure')}
                      />
                    </div>

                    <div className="rounded-2xl border border-orange-200/60 bg-white/70 p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                          <Label htmlFor="departureFlightNumber">Broj leta</Label>
                          <Input
                            id="departureFlightNumber"
                            value={formData.departureFlightNumber}
                            onChange={(e) => handleChange('departureFlightNumber', e.target.value)}
                            placeholder="W62830"
                          />
                        </div>

                        <div>
                          <Label htmlFor="departureScheduledTime" className="text-base font-semibold">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Planirano vrijeme
                          </Label>
                          <Input
                            id="departureScheduledTime"
                            type="datetime-local"
                            value={formData.departureScheduledTime}
                            max={maxScheduledDateTimeLocal}
                            onChange={(e) => handleChange('departureScheduledTime', e.target.value)}
                            className="text-base font-medium"
                            disabled={flight.isLocked}
                          />
                        </div>

                        <div>
                          <Label htmlFor="departureActualTime" className="text-base font-semibold">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Stvarno vrijeme
                          </Label>
                          <Input
                            id="departureActualTime"
                            type="datetime-local"
                            value={formData.departureActualTime}
                            max={maxTodayDateTimeLocal}
                            onChange={(e) => handleChange('departureActualTime', e.target.value)}
                            className="text-base font-medium"
                            disabled={flight.isLocked}
                          />
                        </div>

                        <div>
                          <Label htmlFor="departureStatus" className="text-orange-900 font-semibold">
                            Status odlaska
                            <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-orange-700">
                              Obavezno
                            </span>
                          </Label>
                          <select
                            id="departureStatus"
                            value={formData.departureStatus}
                            onChange={(e) => handleChange('departureStatus', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                          >
                            <option value="OPERATED">Realizovan</option>
                            <option value="CANCELLED">Otkazan</option>
                            <option value="DIVERTED">Divertovan</option>
                            <option value="SCHEDULED">Zakazan</option>
                            <option value="NOT_OPERATED">Nije realizovan</option>
                          </select>
                          <p className="mt-1 text-xs text-orange-700">
                            Odaberite status odlaska prije čuvanja.
                          </p>
                        </div>

                        {formData.departureStatus === 'CANCELLED' && (
                          <div className="md:col-span-2 lg:col-span-3">
                            <Label htmlFor="departureCancelReason">Razlog otkazivanja odlaska</Label>
                            <Input
                              id="departureCancelReason"
                              value={formData.departureCancelReason}
                              onChange={(e) => handleChange('departureCancelReason', e.target.value)}
                              placeholder="Unesite razlog otkazivanja"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-2xl">
                      <Label htmlFor="departureDoorClosingTime" className="text-base font-semibold flex items-center gap-2 mb-2">
                        <Clock className="w-4 h-4" />
                        ⚠️ Vrijeme zatvaranja vrata
                      </Label>
                      <p className="text-xs text-amber-700 mb-3">
                        Kritičan parametar tačnosti - ako su vrata zatvorena na vrijeme, niste odgovorni za dalja kašnjenja
                      </p>
                      <Input
                        id="departureDoorClosingTime"
                        type="datetime-local"
                        value={formData.departureDoorClosingTime}
                        max={maxTodayDateTimeLocal}
                        onChange={(e) => handleChange('departureDoorClosingTime', e.target.value)}
                        className="text-base font-medium"
                        disabled={flight.isLocked}
                      />
                    </div>

                    <div className="rounded-2xl border border-orange-200/60 bg-orange-50/50 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-4 h-4 text-orange-700" />
                        <h3 className="text-sm font-semibold text-orange-900">Putnici</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={formData.departureFerryOut}
                              onChange={(e) => handleFerryToggle('departureFerryOut', e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300"
                              disabled={flight.isLocked}
                            />
                            Ferry OUT (prazan let bez putnika)
                          </label>
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="departurePassengers">
                            <Users className="w-4 h-4 inline mr-1" />
                            Ukupan broj putnika
                          </Label>
                          <Input
                            id="departurePassengers"
                            type="number"
                            min="0"
                            max="999"
                            value={formData.departurePassengers}
                            onChange={(e) => handleChange('departurePassengers', e.target.value)}
                            placeholder="0"
                            disabled={formData.departureFerryOut}
                          />
                        </div>

                        <div>
                          <Label htmlFor="departureNoShow" className="text-orange-900 font-semibold">
                            No Show
                            <span className="text-xs text-slate-500 ml-1">(automatski iz boardinga)</span>
                          </Label>
                          <Input
                            id="departureNoShow"
                            type="number"
                            min="0"
                            value={formData.departureNoShow}
                            onChange={(e) => handleChange('departureNoShow', e.target.value)}
                            placeholder="0"
                            className="border-orange-200 focus-visible:ring-orange-300 bg-white"
                          />
                        </div>

                        <div>
                          <Label htmlFor="departureInfants">
                            Bebe u naručju
                            <span className="text-xs text-slate-500 ml-1">(ne računaju se u putnike)</span>
                          </Label>
                          <Input
                            id="departureInfants"
                            type="number"
                            min="0"
                            value={formData.departureInfants}
                            onChange={(e) => handleChange('departureInfants', e.target.value)}
                            placeholder="0"
                            disabled={formData.departureFerryOut}
                          />
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-orange-200/60 bg-white/70 p-4">
                        <PassengerBreakdownInput
                          totalPassengers={parseInt(formData.departurePassengers) || 0}
                          male={parseInt(formData.departureMalePassengers) || 0}
                          female={parseInt(formData.departureFemalePassengers) || 0}
                          children={parseInt(formData.departureChildren) || 0}
                          onChange={(breakdown) => {
                            setFormData((prev) => ({
                              ...prev,
                              departureMalePassengers: breakdown.male.toString(),
                              departureFemalePassengers: breakdown.female.toString(),
                              departureChildren: breakdown.children.toString(),
                            }));
                          }}
                          label="Breakdown putnika (odlazak)"
                          disabled={formData.departureFerryOut}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-orange-200/60 bg-white/70 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Package className="w-4 h-4 text-orange-700" />
                        <h3 className="text-sm font-semibold text-orange-900">Prtljag i teret</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                          <Label htmlFor="departureBaggageCount">
                            <Package className="w-4 h-4 inline mr-1" />
                            Broj prtljaga (komadi)
                          </Label>
                          <Input
                            id="departureBaggageCount"
                            type="number"
                            min="0"
                            value={formData.departureBaggageCount}
                            onChange={(e) => handleChange('departureBaggageCount', e.target.value)}
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <Label htmlFor="departureBaggage">
                            <Package className="w-4 h-4 inline mr-1" />
                            Prtljag (kg)
                          </Label>
                          <Input
                            id="departureBaggage"
                            type="number"
                            min="0"
                            value={formData.departureBaggage}
                            onChange={(e) => handleChange('departureBaggage', e.target.value)}
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <Label htmlFor="departureCargo">Cargo (kg)</Label>
                          <Input
                            id="departureCargo"
                            type="number"
                            min="0"
                            value={formData.departureCargo}
                            onChange={(e) => handleChange('departureCargo', e.target.value)}
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <Label htmlFor="departureMail">
                            <Mail className="w-4 h-4 inline mr-1" />
                            Pošta (kg)
                          </Label>
                          <Input
                            id="departureMail"
                            type="number"
                            min="0"
                            value={formData.departureMail}
                            onChange={(e) => handleChange('departureMail', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-orange-200/60 bg-orange-50/50 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-700" />
                          <h3 className="text-sm font-semibold text-orange-900">Kašnjenja (DEP)</h3>
                        </div>
                        <span className="text-xs text-orange-700 font-semibold">
                          {getDelaySummary(departureDelays)}
                        </span>
                      </div>
                      <MultipleDelaysInput
                        phase="DEP"
                        airlineId={formData.airlineId}
                        delays={departureDelays}
                        onChange={setDepartureDelays}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}

            {/* Arrival Section */}
            {hasArrivalData && (
            <div className="relative overflow-hidden bg-white rounded-3xl shadow-soft border-l-8 border-blue-400">
              {/* Decorative blobs */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100 opacity-40 rounded-full blur-3xl -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-cyan-100 opacity-40 rounded-full blur-3xl -ml-24 -mb-24"></div>

              <div className="relative z-10">
                {/* Section Header - Collapsible */}
                <div
                  className="flex items-center justify-between p-8 cursor-pointer hover:bg-blue-50/30 transition-colors group"
                  onClick={() => setIsArrivalExpanded(!isArrivalExpanded)}
                  role="button"
                  aria-expanded={isArrivalExpanded}
                  aria-controls="arrival-section"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl shadow-sm group-hover:scale-110 transition-transform">
                      <Plane className="w-6 h-6 text-blue-600 transform rotate-[135deg]" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-blue-900">Dolazak (Arrival)</h2>
                      <p className="text-sm text-blue-700 font-medium">Podaci o dolasku leta</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                      {isArrivalExpanded ? 'Kliknite za zatvaranje' : 'Kliknite za otvaranje'}
                    </span>
                    <ChevronDown
                      className={`w-6 h-6 text-blue-600 transition-all duration-300 group-hover:scale-110 ${
                        isArrivalExpanded ? 'transform rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>

                <div
                  className={`px-8 pb-8 transition-[max-height,opacity,transform] duration-300 ease-in-out overflow-hidden ${
                    isArrivalExpanded ? 'max-h-[3000px] opacity-100 translate-y-0' : 'max-h-0 opacity-0 -translate-y-2 pointer-events-none'
                  }`}
                  id="arrival-section"
                  aria-hidden={!isArrivalExpanded}
                >
                  <div className="space-y-6 pt-2">
                    <div className="rounded-2xl border border-blue-200/60 bg-white/70 p-4 shadow-sm">
                      <LdmMessageInput
                        phase="arrival"
                        onDataParsed={(data) => handleLdmDataParsed(data, 'arrival')}
                      />
                    </div>

                    <div className="rounded-2xl border border-blue-200/60 bg-white/70 p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                          <Label htmlFor="arrivalFlightNumber">Broj leta</Label>
                          <Input
                            id="arrivalFlightNumber"
                            value={formData.arrivalFlightNumber}
                            onChange={(e) => handleChange('arrivalFlightNumber', e.target.value)}
                            placeholder="W62829"
                          />
                        </div>

                        <div>
                          <Label htmlFor="arrivalScheduledTime" className="text-base font-semibold">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Planirano vrijeme
                          </Label>
                          <Input
                            id="arrivalScheduledTime"
                            type="datetime-local"
                            value={formData.arrivalScheduledTime}
                            max={maxScheduledDateTimeLocal}
                            onChange={(e) => handleChange('arrivalScheduledTime', e.target.value)}
                            className="text-base font-medium"
                            disabled={flight.isLocked}
                          />
                        </div>

                        <div>
                          <Label htmlFor="arrivalActualTime" className="text-base font-semibold">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Stvarno vrijeme
                          </Label>
                          <Input
                            id="arrivalActualTime"
                            type="datetime-local"
                            value={formData.arrivalActualTime}
                            max={maxTodayDateTimeLocal}
                            onChange={(e) => handleChange('arrivalActualTime', e.target.value)}
                            className="text-base font-medium"
                            disabled={flight.isLocked}
                          />
                        </div>
                      </div>

                      <div className="p-5 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-2xl mt-5">
                        <Label htmlFor="arrivalEnginesOffTime" className="text-base font-semibold flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4" />
                          ⚠️ Vrijeme gašenja kolizije (Engines Off)
                        </Label>
                        <p className="text-xs text-slate-600 mb-2">
                          Vrijeme kada su motori ugašeni nakon slijetanja
                        </p>
                        <Input
                          id="arrivalEnginesOffTime"
                          type="datetime-local"
                          value={formData.arrivalEnginesOffTime}
                          max={maxTodayDateTimeLocal}
                          onChange={(e) => handleChange('arrivalEnginesOffTime', e.target.value)}
                          className="text-base font-medium"
                          disabled={flight.isLocked}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
                        <div>
                          <Label htmlFor="arrivalStatus" className="text-blue-900 font-semibold">
                            Status dolaska
                            <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                              Obavezno
                            </span>
                          </Label>
                          <select
                            id="arrivalStatus"
                            value={formData.arrivalStatus}
                            onChange={(e) => handleChange('arrivalStatus', e.target.value)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                          >
                            <option value="OPERATED">Realizovan</option>
                            <option value="CANCELLED">Otkazan</option>
                            <option value="DIVERTED">Divertovan</option>
                            <option value="SCHEDULED">Zakazan</option>
                            <option value="NOT_OPERATED">Nije realizovan</option>
                          </select>
                          <p className="mt-1 text-xs text-blue-700">
                            Odaberite status dolaska prije čuvanja.
                          </p>
                        </div>

                        {formData.arrivalStatus === 'CANCELLED' && (
                          <div className="md:col-span-2 lg:col-span-3">
                            <Label htmlFor="arrivalCancelReason">Razlog otkazivanja dolaska</Label>
                            <Input
                              id="arrivalCancelReason"
                              value={formData.arrivalCancelReason}
                              onChange={(e) => handleChange('arrivalCancelReason', e.target.value)}
                              placeholder="Unesite razlog otkazivanja"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-200/60 bg-blue-50/50 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Users className="w-4 h-4 text-blue-700" />
                        <h3 className="text-sm font-semibold text-blue-900">Putnici</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div className="md:col-span-2 lg:col-span-3">
                          <label className="flex items-center gap-2 text-sm text-slate-700">
                            <input
                              type="checkbox"
                              checked={formData.arrivalFerryIn}
                              onChange={(e) => handleFerryToggle('arrivalFerryIn', e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300"
                              disabled={flight.isLocked}
                            />
                            Ferry IN (prazan let bez putnika)
                          </label>
                        </div>

                        <div className="md:col-span-2">
                          <Label htmlFor="arrivalPassengers">
                            <Users className="w-4 h-4 inline mr-1" />
                            Ukupan broj putnika
                          </Label>
                          <Input
                            id="arrivalPassengers"
                            type="number"
                            min="0"
                            max="999"
                            value={formData.arrivalPassengers}
                            onChange={(e) => handleChange('arrivalPassengers', e.target.value)}
                            placeholder="0"
                            disabled={formData.arrivalFerryIn}
                          />
                        </div>

                        <div>
                          <Label htmlFor="arrivalInfants">
                            Bebe u naručju
                            <span className="text-xs text-slate-500 ml-1">(ne računaju se u putnike)</span>
                          </Label>
                          <Input
                            id="arrivalInfants"
                            type="number"
                            min="0"
                            value={formData.arrivalInfants}
                            onChange={(e) => handleChange('arrivalInfants', e.target.value)}
                            placeholder="0"
                            disabled={formData.arrivalFerryIn}
                          />
                        </div>
                      </div>

                      <div className="mt-4 rounded-2xl border border-blue-200/60 bg-white/70 p-4">
                        <PassengerBreakdownInput
                          totalPassengers={parseInt(formData.arrivalPassengers) || 0}
                          male={parseInt(formData.arrivalMalePassengers) || 0}
                          female={parseInt(formData.arrivalFemalePassengers) || 0}
                          children={parseInt(formData.arrivalChildren) || 0}
                          onChange={(breakdown) => {
                            setFormData((prev) => ({
                              ...prev,
                              arrivalMalePassengers: breakdown.male.toString(),
                              arrivalFemalePassengers: breakdown.female.toString(),
                              arrivalChildren: breakdown.children.toString(),
                            }));
                          }}
                          label="Breakdown putnika (dolazak)"
                          disabled={formData.arrivalFerryIn}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-200/60 bg-white/70 p-5">
                      <div className="flex items-center gap-2 mb-4">
                        <Package className="w-4 h-4 text-blue-700" />
                        <h3 className="text-sm font-semibold text-blue-900">Prtljag i teret</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        <div>
                          <Label htmlFor="arrivalBaggageCount">
                            <Package className="w-4 h-4 inline mr-1" />
                            Broj prtljaga (komadi)
                          </Label>
                          <Input
                            id="arrivalBaggageCount"
                            type="number"
                            min="0"
                            value={formData.arrivalBaggageCount}
                            onChange={(e) => handleChange('arrivalBaggageCount', e.target.value)}
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <Label htmlFor="arrivalBaggage">
                            <Package className="w-4 h-4 inline mr-1" />
                            Prtljag (kg)
                          </Label>
                          <Input
                            id="arrivalBaggage"
                            type="number"
                            min="0"
                            value={formData.arrivalBaggage}
                            onChange={(e) => handleChange('arrivalBaggage', e.target.value)}
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <Label htmlFor="arrivalCargo">Cargo (kg)</Label>
                          <Input
                            id="arrivalCargo"
                            type="number"
                            min="0"
                            value={formData.arrivalCargo}
                            onChange={(e) => handleChange('arrivalCargo', e.target.value)}
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <Label htmlFor="arrivalMail">
                            <Mail className="w-4 h-4 inline mr-1" />
                            Pošta (kg)
                          </Label>
                          <Input
                            id="arrivalMail"
                            type="number"
                            min="0"
                            value={formData.arrivalMail}
                            onChange={(e) => handleChange('arrivalMail', e.target.value)}
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-blue-200/60 bg-blue-50/50 p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-blue-700" />
                          <h3 className="text-sm font-semibold text-blue-900">Kašnjenja (ARR)</h3>
                        </div>
                        <span className="text-xs text-blue-700 font-semibold">
                          {getDelaySummary(arrivalDelays)}
                        </span>
                      </div>
                      <MultipleDelaysInput
                        phase="ARR"
                        airlineId={formData.airlineId}
                        delays={arrivalDelays}
                        onChange={setArrivalDelays}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            )}
        </fieldset>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Summary */}
        <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl shadow-soft border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Sažetak za verifikaciju</h3>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {flightDateDisplay}
            </span>
          </div>
          <div className="overflow-x-auto">
            <div className="min-w-[980px] w-full border border-slate-200 rounded-2xl overflow-hidden bg-white">
              <table className="min-w-[980px] w-full text-sm">
              <thead className="text-left text-slate-600 bg-slate-100/80">
                <tr>
                  <th className="py-2 pr-4 font-semibold sticky left-0 z-10 bg-slate-100/80">Sekcija</th>
                  <th className="py-2 pr-4 font-semibold">Broj leta</th>
                  <th className="py-2 pr-4 font-semibold">Planirano</th>
                  <th className="py-2 pr-4 font-semibold">Stvarno</th>
                  <th className="py-2 pr-4 font-semibold">Engines Off / Door Closed</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-4 font-semibold">Razlog</th>
                  <th className="py-2 pr-4 font-semibold">Putnici</th>
                  <th className="py-2 pr-4 font-semibold">Muški</th>
                  <th className="py-2 pr-4 font-semibold">Ženski</th>
                  <th className="py-2 pr-4 font-semibold">Djeca</th>
                  <th className="py-2 pr-4 font-semibold">Bebe</th>
                  <th className="py-2 pr-4 font-semibold">No Show</th>
                  <th className="py-2 pr-4 font-semibold">Broj kofera</th>
                  <th className="py-2 pr-4 font-semibold">Prtljag (kg)</th>
                  <th className="py-2 pr-4 font-semibold">Cargo</th>
                  <th className="py-2 pr-4 font-semibold">Pošta</th>
                  <th className="py-2 pr-4 font-semibold">Ferry</th>
                  <th className="py-2 pr-4 font-semibold">Delay kodovi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {hasArrivalData && (
                <tr className="bg-blue-50/70 hover:bg-blue-50/90 transition-colors">
                  <td className="py-3 pr-4 font-semibold text-blue-700 sticky left-0 z-10 bg-blue-50/70">Dolazak</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalFlightNumber)}</td>
                  <td className="py-3 pr-4">{displayDateTime(formData.arrivalScheduledTime)}</td>
                  <td className="py-3 pr-4">{displayDateTime(formData.arrivalActualTime)}</td>
                  <td className="py-3 pr-4">{displayDateTime(formData.arrivalEnginesOffTime)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalStatus)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalCancelReason)}</td>
                  <td className="py-3 pr-4">
                    {formData.arrivalFerryIn ? '-' : displayValue(formData.arrivalPassengers)}
                  </td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalMalePassengers)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalFemalePassengers)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalChildren)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalInfants)}</td>
                  <td className="py-3 pr-4">-</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalBaggageCount)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalBaggage)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalCargo)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalMail)}</td>
                  <td className="py-3 pr-4">{formData.arrivalFerryIn ? 'Ferry IN' : '-'}</td>
                  <td className="py-3 pr-4">{getDelaySummary(arrivalDelays)}</td>
                </tr>
                )}
                {hasDepartureData && (
                <tr className="bg-orange-50/60 hover:bg-orange-50/90 transition-colors">
                  <td className="py-3 pr-4 font-semibold text-orange-700 sticky left-0 z-10 bg-orange-50/60">Odlazak</td>
                  <td className="py-3 pr-4">{displayValue(formData.departureFlightNumber)}</td>
                  <td className="py-3 pr-4">{displayDateTime(formData.departureScheduledTime)}</td>
                  <td className="py-3 pr-4">{displayDateTime(formData.departureActualTime)}</td>
                  <td className="py-3 pr-4">{displayDateTime(formData.departureDoorClosingTime)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.departureStatus)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.departureCancelReason)}</td>
                  <td className="py-3 pr-4">
                    {formData.departureFerryOut ? '-' : displayValue(formData.departurePassengers)}
                  </td>
                  <td className="py-3 pr-4">{displayValue(formData.departureMalePassengers)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.departureFemalePassengers)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.departureChildren)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.departureInfants)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.departureNoShow)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.departureBaggageCount)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.departureBaggage)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.departureCargo)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.departureMail)}</td>
                  <td className="py-3 pr-4">{formData.departureFerryOut ? 'Ferry OUT' : '-'}</td>
                  <td className="py-3 pr-4">{getDelaySummary(departureDelays)}</td>
                </tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>

        {/* Load Factor Display */}
        {(hasArrivalData || hasDepartureData) && (
        <div className="bg-white/90 rounded-3xl shadow-soft border border-slate-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Load Factor</h2>
              <p className="text-sm text-slate-500">Popunjenost aviona</p>
            </div>
          </div>

          <div className={`grid grid-cols-1 ${hasArrivalData && hasDepartureData ? 'md:grid-cols-2' : ''} gap-4`}>
            {/* Arrival Load Factor */}
            {hasArrivalData && (
            <div className="bg-blue-50/60 rounded-2xl border border-blue-200/60 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Plane className="w-4 h-4 text-blue-600 transform -rotate-45" />
                <h3 className="text-sm font-semibold text-blue-900">Dolazak</h3>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Kapacitet</span>
                  <span className="font-medium text-slate-900">
                    {formData.availableSeats ||
                     (formData.aircraftTypeId && aircraftTypes.find(t => t.id === formData.aircraftTypeId)?.seats) ||
                     '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Putnici</span>
                  <span className="font-medium text-slate-900">{formData.arrivalPassengers || 0}</span>
                </div>
                <div className="h-px bg-slate-200 my-3"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Load Factor</span>
                  {(() => {
                    const capacity = parseInt(formData.availableSeats) ||
                                   (formData.aircraftTypeId && aircraftTypes.find(t => t.id === formData.aircraftTypeId)?.seats) ||
                                   0;
                    const passengers = parseInt(formData.arrivalPassengers) || 0;
                    if (capacity > 0 && passengers > 0 && !formData.arrivalFerryIn) {
                      const loadFactor = (passengers / capacity) * 100;
                      return (
                        <div className="text-right">
                          <span className="text-xl font-bold text-slate-900">
                            {loadFactor.toFixed(2)}%
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {passengers} / {capacity}
                          </p>
                        </div>
                      );
                    }
                    return <span className="text-sm text-slate-400">N/A</span>;
                  })()}
                </div>
              </div>
            </div>
            )}

            {/* Departure Load Factor */}
            {hasDepartureData && (
            <div className="bg-orange-50/60 rounded-2xl border border-orange-200/60 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Plane className="w-4 h-4 text-orange-600 transform rotate-45" />
                <h3 className="text-sm font-semibold text-orange-900">Odlazak</h3>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Kapacitet</span>
                  <span className="font-medium text-slate-900">
                    {formData.availableSeats ||
                     (formData.aircraftTypeId && aircraftTypes.find(t => t.id === formData.aircraftTypeId)?.seats) ||
                     '-'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Putnici</span>
                  <span className="font-medium text-slate-900">{formData.departurePassengers || 0}</span>
                </div>
                <div className="h-px bg-slate-200 my-3"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Load Factor</span>
                  {(() => {
                    const capacity = parseInt(formData.availableSeats) ||
                                   (formData.aircraftTypeId && aircraftTypes.find(t => t.id === formData.aircraftTypeId)?.seats) ||
                                   0;
                    const passengers = parseInt(formData.departurePassengers) || 0;
                    if (capacity > 0 && passengers > 0 && !formData.departureFerryOut) {
                      const loadFactor = (passengers / capacity) * 100;
                      return (
                        <div className="text-right">
                          <span className="text-xl font-bold text-slate-900">
                            {loadFactor.toFixed(2)}%
                          </span>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {passengers} / {capacity}
                          </p>
                        </div>
                      );
                    }
                    return <span className="text-sm text-slate-400">N/A</span>;
                  })()}
                </div>
              </div>
            </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-600">
              <strong>Napomena:</strong> Load factor se automatski izračunava i čuva kada sačuvate podatke.
              Koristi se raspoloživa mjesta ako je uneseno, inače standardni kapacitet tipa aviona.
            </p>
          </div>
        </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col gap-3">
              <p className="text-sm text-slate-600">
                💡 Provjerite sve podatke prije čuvanja, posebno <strong>vrijeme zatvaranja vrata</strong>
              </p>
              <label className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-sm">
                <input
                  type="checkbox"
                  checked={formData.isVerified}
                  onChange={(e) => handleBooleanChange('isVerified', e.target.checked)}
                  className="h-5 w-5 rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  disabled={isReadOnly}
                />
                <span>Verifikovano — podaci za ovaj let su pregledani</span>
              </label>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(returnPath)}
                disabled={isSaving}
              >
                Odustani
              </Button>
              <Button
                type="submit"
                disabled={isSaving || isReadOnly}
                className="bg-gradient-to-r from-dark-900 to-dark-800 hover:from-dark-800 hover:to-dark-700 text-white px-6"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Čuvam...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Sačuvaj podatke
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Validation Warning Modal */}
      <ValidationWarningModal
        isOpen={showWarningModal}
        warnings={validationWarnings}
        onConfirm={handleWarningConfirm}
        onCancel={handleWarningCancel}
      />
      </div>
    </MainLayout>
  );
}
