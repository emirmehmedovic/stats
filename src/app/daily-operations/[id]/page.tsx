'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Save, Plane, Clock, Users, Package, Mail, Calendar, Building2, MapPin, Settings, AlertCircle, CheckCircle2 } from 'lucide-react';
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
import { formatDateString, formatDateTimeDisplay, formatDateTimeLocalValue, getDateStringInTimeZone, getTodayDateString, TIME_ZONE_SARAJEVO } from '@/lib/dates';

type Flight = {
  id: string;
  date: string;
  route: string;
  registration: string;
  operationTypeId: string;
  operationType: {
    id: string;
    code: string;
    name: string;
  };
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
  arrivalPassengers: number | null;
  arrivalFerryIn: boolean;
  arrivalInfants: number | null;
  arrivalBaggage: number | null;
  arrivalCargo: number | null;
  arrivalMail: number | null;
  departureFlightNumber: string | null;
  departureScheduledTime: string | null;
  departureActualTime: string | null;
  departurePassengers: number | null;
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

  const [flight, setFlight] = useState<Flight | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [airlines, setAirlines] = useState<Array<{ id: string; name: string; icaoCode: string }>>([]);
  const [aircraftTypes, setAircraftTypes] = useState<Array<{ id: string; model: string; seats: number; mtow: number }>>([]);
  const [operationTypes, setOperationTypes] = useState<Array<{ id: string; code: string; name: string }>>([]);
  const [delayCodes, setDelayCodes] = useState<Array<{ id: string; code: string; description: string; category: string }>>([]);
  const [airlineSearch, setAirlineSearch] = useState('');
  const [isVerificationLocked, setIsVerificationLocked] = useState(false);
  const [pendingVerificationDate, setPendingVerificationDate] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Basic info (editable)
    airlineId: '',
    aircraftTypeId: '',
    route: '',
    registration: '',
    availableSeats: '',
    operationTypeId: '',
    // Arrival
    arrivalFlightNumber: '',
    arrivalScheduledTime: '',
    arrivalActualTime: '',
    arrivalStatus: 'SCHEDULED',
    arrivalCancelReason: '',
    arrivalPassengers: '',
    arrivalMalePassengers: '',
    arrivalFemalePassengers: '',
    arrivalChildren: '',
    arrivalInfants: '',
    arrivalBaggage: '',
    arrivalCargo: '',
    arrivalMail: '',
    arrivalFerryIn: false,
    // Departure
    departureFlightNumber: '',
    departureScheduledTime: '',
    departureActualTime: '',
    departureDoorClosingTime: '',
    departureStatus: 'SCHEDULED',
    departureCancelReason: '',
    departurePassengers: '',
    departureMalePassengers: '',
    departureFemalePassengers: '',
    departureChildren: '',
    departureInfants: '',
    departureBaggage: '',
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

  useEffect(() => {
    fetchFlight();
    fetchFormData();
  }, [flightId]);

  useEffect(() => {
    const handle = setTimeout(() => {
      fetchAirlines(airlineSearch);
    }, 300);

    return () => clearTimeout(handle);
  }, [airlineSearch]);

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

  const fetchFormData = async () => {
    try {
      const [aircraftRes, operationTypesRes, delayCodesRes] = await Promise.all([
        fetch('/api/aircraft-types'),
        fetch('/api/operation-types?activeOnly=true'),
        fetch('/api/delay-codes'),
      ]);

      await fetchAirlines();

      if (aircraftRes.ok) {
        const aircraftData = await aircraftRes.json();
        setAircraftTypes(aircraftData.data || []);
      }

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
          flightData.arrivalStatus && flightData.arrivalStatus !== 'OPERATED'
            ? flightData.arrivalStatus
            : flightData.arrivalActualTime
              ? 'OPERATED'
              : 'SCHEDULED';
        const resolvedDepartureStatus =
          flightData.departureStatus && flightData.departureStatus !== 'OPERATED'
            ? flightData.departureStatus
            : flightData.departureActualTime
              ? 'OPERATED'
              : 'SCHEDULED';
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
          arrivalFlightNumber: flightData.arrivalFlightNumber || '',
          arrivalScheduledTime: formatDateTimeLocalValue(flightData.arrivalScheduledTime),
          arrivalActualTime: formatDateTimeLocalValue(flightData.arrivalActualTime),
          arrivalStatus: resolvedArrivalStatus,
          arrivalCancelReason: flightData.arrivalCancelReason || '',
          arrivalPassengers: flightData.arrivalPassengers?.toString() || '',
          arrivalMalePassengers: flightData.arrivalMalePassengers?.toString() || '',
          arrivalFemalePassengers: flightData.arrivalFemalePassengers?.toString() || '',
          arrivalChildren: flightData.arrivalChildren?.toString() || '',
          arrivalInfants: flightData.arrivalInfants?.toString() || '',
          arrivalBaggage: flightData.arrivalBaggage?.toString() || '',
          arrivalCargo: flightData.arrivalCargo?.toString() || '',
          arrivalMail: flightData.arrivalMail?.toString() || '',
          arrivalFerryIn: flightData.arrivalFerryIn || false,
          departureFlightNumber: flightData.departureFlightNumber || '',
          departureScheduledTime: formatDateTimeLocalValue(flightData.departureScheduledTime),
          departureActualTime: formatDateTimeLocalValue(flightData.departureActualTime),
          departureDoorClosingTime: formatDateTimeLocalValue(flightData.departureDoorClosingTime),
          departureStatus: resolvedDepartureStatus,
          departureCancelReason: flightData.departureCancelReason || '',
          departurePassengers: flightData.departurePassengers?.toString() || '',
          departureMalePassengers: flightData.departureMalePassengers?.toString() || '',
          departureFemalePassengers: flightData.departureFemalePassengers?.toString() || '',
          departureChildren: flightData.departureChildren?.toString() || '',
          departureInfants: flightData.departureInfants?.toString() || '',
          departureBaggage: flightData.departureBaggage?.toString() || '',
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
        arrivalFlightNumber: formData.arrivalFlightNumber || null,
        arrivalScheduledTime: formData.arrivalScheduledTime ? new Date(formData.arrivalScheduledTime).toISOString() : null,
        arrivalActualTime: formData.arrivalActualTime ? new Date(formData.arrivalActualTime).toISOString() : null,
        arrivalStatus: formData.arrivalStatus || 'SCHEDULED',
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
        arrivalCargo: formData.arrivalCargo ? parseInt(formData.arrivalCargo) : null,
        arrivalMail: formData.arrivalMail ? parseInt(formData.arrivalMail) : null,
        arrivalFerryIn: formData.arrivalFerryIn,
        departureFlightNumber: formData.departureFlightNumber || null,
        departureScheduledTime: formData.departureScheduledTime ? new Date(formData.departureScheduledTime).toISOString() : null,
        departureActualTime: formData.departureActualTime ? new Date(formData.departureActualTime).toISOString() : null,
        departureDoorClosingTime: formData.departureDoorClosingTime ? new Date(formData.departureDoorClosingTime).toISOString() : null,
        departureStatus: formData.departureStatus || 'SCHEDULED',
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
        departureBaggage: formData.departureBaggage ? parseInt(formData.departureBaggage) : null,
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
        router.push('/daily-operations');
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
          <ErrorDisplay error={error} onBack={() => router.push('/daily-operations')} />
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
  const isReadOnly = isVerificationLocked || flight.isLocked || flight.isVerified;
  const displayValue = (value?: string | number | null) => {
    if (value === null || value === undefined || value === '') return '-';
    return String(value);
  };
  const displayDateTime = (value?: string | null) => {
    if (!value) return '-';
    return formatDateTimeDisplay(value);
  };
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
      <div className="p-8 space-y-6">
      {/* Hero Header - Izdvojen i vizuelno naglašen */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white shadow-soft-xl p-8 border-4 border-dark-700">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.12),transparent_25%)]"></div>
        <div className="relative z-10">
          <Button
            variant="outline"
            onClick={() => router.push('/daily-operations')}
            className="flex items-center gap-2 mb-6 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4" />
            Nazad na pregled
          </Button>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400 mb-3 font-semibold">📋 OPŠTE INFORMACIJE O LETU</p>
              <h1 className="text-4xl font-bold mb-4">Dnevne operacije</h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-base">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Ruta:</span>
                  <span className="px-4 py-2 rounded-xl bg-white/15 backdrop-blur border border-white/30 font-bold text-lg">
                    {String(routeDisplay || '')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Aviokompanija:</span>
                  <span className="font-semibold">
                    {flight.airline?.name || ''} ({flight.airline?.icaoCode || ''})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Datum:</span>
                  <span className="px-4 py-2 rounded-xl bg-white/15 backdrop-blur border border-white/30 font-bold">
                    {flightDateDisplay}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-medium">Tip aviona:</span>
                  <span className="font-semibold">
                    {flight.aircraftType?.model || '-'}
                  </span>
                </div>
              </div>
            </div>
            {flight.isLocked && (
              <div className="px-6 py-3 rounded-2xl bg-red-500/20 border-2 border-red-400/40 text-red-200 font-bold">
                🔒 Let zaključan
              </div>
            )}
          </div>
        </div>
      </div>

      {isVerificationLocked && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
          <p className="text-sm text-amber-800">
            Verifikujte prethodne operacije{pendingVerificationDate ? ` za ${formatDateString(pendingVerificationDate)}` : ''}
            na stranici Dnevne operacije kako biste mogli unositi podatke za današnje letove.
          </p>
        </div>
      )}
      {flight.isVerified && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5" />
          <div className="text-sm text-emerald-800">
            <p>Let je verifikovan i više se ne može uređivati.</p>
            {flight.verifiedByUser && (
              <p className="text-xs text-emerald-700 mt-1">
                Verifikovao: {flight.verifiedByUser.name || flight.verifiedByUser.email}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <fieldset disabled={isReadOnly} className="space-y-6">
        {/* Basic Information Section */}
        <div className="bg-gradient-to-br from-slate-50 to-white rounded-3xl shadow-lg border-4 border-slate-300 p-8">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-md">
              <Settings className="w-7 h-7 text-slate-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">⚙️ Osnovne informacije</h2>
              <p className="text-sm text-slate-600 font-medium">Opšti podaci o letu</p>
            </div>
          </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
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
              <Input
                value={airlineSearch}
                onChange={(e) => setAirlineSearch(e.target.value)}
                placeholder="Pretraga aviokompanije..."
                className="mb-2"
              />
              <select
                value={formData.airlineId}
                onChange={(e) => handleChange('airlineId', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Izaberite aviokompaniju</option>
                {airlines.map((airline) => (
                  <option key={airline.id} value={airline.id}>
                    {airline.name} ({airline.icaoCode})
                  </option>
                ))}
              </select>
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
              <Input
                value={formData.route}
                onChange={(e) => handleChange('route', e.target.value)}
                placeholder="FMM-Memmingen"
              />
            </div>

            {/* Aircraft Type - Editable */}
            <div>
              <Label>Tip aviona</Label>
              <select
                value={formData.aircraftTypeId}
                onChange={(e) => handleChange('aircraftTypeId', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Izaberite tip aviona</option>
                {aircraftTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.model} ({type.seats} sjedišta)
                  </option>
                ))}
              </select>
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Izaberite tip operacije</option>
                {operationTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {typeof type.name === 'string' ? type.name : type.code}
                  </option>
                ))}
              </select>
            </div>
            </div>
        </div>

        {/* Arrival Section - Vizuelno izdvojena */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-3xl shadow-lg border-4 border-blue-400 p-8">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-blue-200">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center shadow-md">
              <Plane className="w-7 h-7 text-blue-700 transform -rotate-45" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-blue-900 uppercase tracking-wide">🛬 Dolazak (Arrival)</h2>
              <p className="text-sm text-blue-700 font-medium">Podaci o dolasku leta</p>
            </div>
          </div>

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
                onChange={(e) => handleChange('arrivalActualTime', e.target.value)}
                className="text-base font-medium"
                disabled={flight.isLocked}
              />
            </div>

            <div>
              <Label htmlFor="arrivalStatus">Status dolaska</Label>
              <select
                id="arrivalStatus"
                value={formData.arrivalStatus}
                onChange={(e) => handleChange('arrivalStatus', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="OPERATED">Realizovan</option>
                <option value="CANCELLED">Otkazan</option>
                <option value="DIVERTED">Divertovan</option>
                <option value="SCHEDULED">Zakazan</option>
              </select>
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

            <div className="md:col-span-2 lg:col-span-3">
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

            {/* Passenger Breakdown */}
            <div className="md:col-span-2 lg:col-span-3">
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

            {/* Arrival Delays - Multiple */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <MultipleDelaysInput
                phase="ARR"
                airlineId={formData.airlineId}
                delays={arrivalDelays}
                onChange={setArrivalDelays}
              />
            </div>
        </div>

        {/* Departure Section - Vizuelno izdvojena */}
        <div className="bg-gradient-to-br from-slate-100 to-white rounded-3xl shadow-lg border-4 border-slate-400 p-8">
          <div className="flex items-center gap-4 mb-8 pb-6 border-b-2 border-slate-300">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-200 to-slate-400 flex items-center justify-center shadow-md">
              <Plane className="w-7 h-7 text-slate-700 transform rotate-45" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">🛫 Odlazak (Departure)</h2>
              <p className="text-sm text-slate-700 font-medium">Podaci o odlasku leta</p>
            </div>
          </div>

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
                onChange={(e) => handleChange('departureActualTime', e.target.value)}
                className="text-base font-medium"
                disabled={flight.isLocked}
              />
            </div>
            </div>

            {/* Door Closing Time - CRITICAL PARAMETER */}
            <div className="mt-4 p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl">
              <Label htmlFor="departureDoorClosingTime" className="text-base font-semibold flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4" />
                ⚠️ Vrijeme zatvaranja vrata
              </Label>
              <p className="text-xs text-amber-700 mb-3">Kritičan parametar tačnosti - ako su vrata zatvorena na vrijeme, niste odgovorni za dalja kašnjenja</p>
              <Input
                id="departureDoorClosingTime"
                type="datetime-local"
                value={formData.departureDoorClosingTime}
                onChange={(e) => handleChange('departureDoorClosingTime', e.target.value)}
                className="text-base font-medium"
                disabled={flight.isLocked}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div>
              <Label htmlFor="departureStatus">Status odlaska</Label>
              <select
                id="departureStatus"
                value={formData.departureStatus}
                onChange={(e) => handleChange('departureStatus', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="OPERATED">Realizovan</option>
                <option value="CANCELLED">Otkazan</option>
                <option value="DIVERTED">Divertovan</option>
                <option value="SCHEDULED">Zakazan</option>
              </select>
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

            <div className="md:col-span-2 lg:col-span-3">
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

            {/* Passenger Breakdown */}
            <div className="md:col-span-2 lg:col-span-3">
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

            {/* Departure Delays - Multiple */}
            <div className="mt-6 pt-6 border-t border-slate-200">
              <MultipleDelaysInput
                phase="DEP"
                airlineId={formData.airlineId}
                delays={departureDelays}
                onChange={setDepartureDelays}
              />
            </div>
        </div>
        </fieldset>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Sažetak za verifikaciju</h3>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {flightDateDisplay}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-sm">
              <thead className="text-left text-slate-500 bg-slate-50">
                <tr>
                  <th className="py-2 pr-4 font-semibold sticky left-0 z-10 bg-slate-50">Sekcija</th>
                  <th className="py-2 pr-4 font-semibold">Broj leta</th>
                  <th className="py-2 pr-4 font-semibold">Planirano</th>
                  <th className="py-2 pr-4 font-semibold">Stvarno</th>
                  <th className="py-2 pr-4 font-semibold">Zatvaranje vrata</th>
                  <th className="py-2 pr-4 font-semibold">Status</th>
                  <th className="py-2 pr-4 font-semibold">Razlog</th>
                  <th className="py-2 pr-4 font-semibold">Putnici</th>
                  <th className="py-2 pr-4 font-semibold">Muški</th>
                  <th className="py-2 pr-4 font-semibold">Ženski</th>
                  <th className="py-2 pr-4 font-semibold">Djeca</th>
                  <th className="py-2 pr-4 font-semibold">Bebe</th>
                  <th className="py-2 pr-4 font-semibold">Prtljag</th>
                  <th className="py-2 pr-4 font-semibold">Cargo</th>
                  <th className="py-2 pr-4 font-semibold">Pošta</th>
                  <th className="py-2 pr-4 font-semibold">Ferry</th>
                  <th className="py-2 pr-4 font-semibold">Delay kodovi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 pr-4 font-semibold text-blue-700 sticky left-0 z-10 bg-white">Dolazak</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalFlightNumber)}</td>
                  <td className="py-3 pr-4">{displayDateTime(formData.arrivalScheduledTime)}</td>
                  <td className="py-3 pr-4">{displayDateTime(formData.arrivalActualTime)}</td>
                  <td className="py-3 pr-4">-</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalStatus)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalCancelReason)}</td>
                  <td className="py-3 pr-4">
                    {formData.arrivalFerryIn ? '-' : displayValue(formData.arrivalPassengers)}
                  </td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalMalePassengers)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalFemalePassengers)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalChildren)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalInfants)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalBaggage)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalCargo)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.arrivalMail)}</td>
                  <td className="py-3 pr-4">{formData.arrivalFerryIn ? 'Ferry IN' : '-'}</td>
                  <td className="py-3 pr-4">{getDelaySummary(arrivalDelays)}</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-semibold text-emerald-700 sticky left-0 z-10 bg-white">Odlazak</td>
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
                  <td className="py-3 pr-4">{displayValue(formData.departureBaggage)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.departureCargo)}</td>
                  <td className="py-3 pr-4">{displayValue(formData.departureMail)}</td>
                  <td className="py-3 pr-4">{formData.departureFerryOut ? 'Ferry OUT' : '-'}</td>
                  <td className="py-3 pr-4">{getDelaySummary(departureDelays)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6">
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
                onClick={() => router.push('/daily-operations')}
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
