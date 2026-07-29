'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import {
  ErrorStatusBadge,
  ErrorPriorityBadge,
  ErrorTypeBadge,
  ErrorResolutionForm,
  ErrorDisputeForm,
  ErrorHistoryTimeline,
} from '@/components/flight-errors';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Edit, RefreshCw, Paperclip, Upload, Plane, Calendar, Users, FileText } from 'lucide-react';
import { getErrorTypeLabel } from '@/components/flight-errors/ErrorTypeBadge';
import { format } from 'date-fns';
import { bs } from 'date-fns/locale';
import { FlightErrorStatus, FlightErrorType, FlightErrorPriority } from '@prisma/client';

interface FlightErrorDetail {
  id: string;
  errorType: FlightErrorType;
  priority: FlightErrorPriority;
  status: FlightErrorStatus;
  description: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  disputeReason: string | null;
  disputedAt: string | null;
  closedNotes: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  flight: {
    id: string;
    date: string;
    route: string;
    arrivalFlightNumber: string | null;
    departureFlightNumber: string | null;
    arrivalPassengers: number | null;
    departurePassengers: number | null;
    airline?: {
      id: string;
      name: string;
      icaoCode: string;
    };
    aircraftType?: {
      id: string;
      model: string;
    };
    operationType?: {
      id: string;
      name: string;
      code: string;
    };
    flightType?: {
      id: string;
      name: string;
      code: string;
    } | null;
  };
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
  };
  closedBy?: {
    id: string;
    name: string | null;
  } | null;
  attachments: Array<{
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    uploadedAt: string;
    uploadedBy: {
      id: string;
      name: string | null;
    };
  }>;
  history: Array<{
    id: string;
    action: string;
    fromStatus: FlightErrorStatus | null;
    toStatus: FlightErrorStatus | null;
    notes: string | null;
    createdAt: string;
    performedBy: {
      id: string;
      name: string | null;
    };
  }>;
}

// Helper to format old values for display
const fieldLabels: Record<string, string> = {
  departurePassengers: 'Odlazni putnici',
  arrivalPassengers: 'Dolazni putnici',
  departureMalePassengers: 'Odlazni muškarci',
  departureFemalePassengers: 'Odlazne žene',
  departureChildren: 'Odlazna djeca',
  departureInfants: 'Odlazne bebe',
  arrivalMalePassengers: 'Dolazni muškarci',
  arrivalFemalePassengers: 'Dolazne žene',
  arrivalChildren: 'Dolazna djeca',
  arrivalInfants: 'Dolazne bebe',
  aircraftTypeId: 'Tip aviona',
  operationTypeId: 'Tip operacije',
  flightTypeId: 'Tip leta',
};

function formatOldValues(
  oldValue: Record<string, unknown>,
  _errorType: FlightErrorType
): Array<{ label: string; value: string }> {
  const result: Array<{ label: string; value: string }> = [];

  for (const [key, value] of Object.entries(oldValue)) {
    const label = fieldLabels[key] || key;
    let displayValue = '-';

    if (value !== null && value !== undefined) {
      if (typeof value === 'number') {
        displayValue = value.toString();
      } else if (typeof value === 'string') {
        // For IDs, we just show that it was set (actual name would require lookup)
        displayValue = key.endsWith('Id') ? '(postavljen)' : value;
      } else {
        displayValue = String(value);
      }
    }

    result.push({ label, value: displayValue });
  }

  return result;
}

export default function ErrorReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<FlightErrorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeForm, setActiveForm] = useState<'resolve' | 'dispute' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fetchError = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/flight-errors/${id}`);

      if (!response.ok) {
        throw new Error('Greška nije pronađena');
      }

      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        throw new Error(result.error || 'Greška pri učitavanju');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchError();
    }
  }, [id]);

  const handleResolve = async (notes: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/flight-errors/${id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Greška pri rješavanju');
      }

      // Check for more pending errors
      const pendingResponse = await fetch('/api/flight-errors/my-pending');
      const pendingResult = await pendingResponse.json();

      if (pendingResult.success && pendingResult.data.length > 0) {
        // Redirect to the next error
        const nextError = pendingResult.data[0];
        router.push(`/error-review/${nextError.id}`);
      } else {
        // No more errors, redirect to error-review list (which will show success message)
        router.push('/error-review');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri rješavanju');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDispute = async (reason: string) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/flight-errors/${id}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disputeReason: reason }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Greška pri osporavanju');
      }

      // Check for more pending errors
      const pendingResponse = await fetch('/api/flight-errors/my-pending');
      const pendingResult = await pendingResponse.json();

      if (pendingResult.success && pendingResult.data.length > 0) {
        // Redirect to the next error
        const nextError = pendingResult.data[0];
        router.push(`/error-review/${nextError.id}`);
      } else {
        // No more errors, redirect to error-review list
        router.push('/error-review');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri osporavanju');
    } finally {
      setIsSubmitting(false);
    }
  };

  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/flight-errors/${id}/attachments`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Greška pri uploadu');
      }

      // Refresh data
      await fetchError();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri uploadu');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const isPending = data?.status === 'OPEN' || data?.status === 'IN_PROGRESS';
  const flightNumber = data?.flight.departureFlightNumber || data?.flight.arrivalFlightNumber || 'N/A';

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (error || !data) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 max-w-lg mx-auto">
            <p className="text-sm text-red-700">{error || 'Greška nije pronađena'}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/error-review')}>
              Nazad na listu
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 lg:p-8 space-y-4 lg:space-y-6 max-w-6xl mx-auto">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/error-review')}
          className="text-slate-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Nazad na listu grešaka
        </Button>

        {/* Main Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Top section with error info */}
          <div className="p-6 border-b border-slate-100">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="flex-1">
                {/* Error Type - Most Prominent */}
                <div className="mb-4">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                    Tip greške
                  </p>
                  <h1 className="text-2xl font-bold text-slate-900">
                    {getErrorTypeLabel(data.errorType)}
                  </h1>
                </div>

                {/* Status badges */}
                <div className="flex flex-wrap items-center gap-2">
                  <ErrorPriorityBadge priority={data.priority} size="md" />
                  <ErrorStatusBadge status={data.status} size="md" />
                </div>
              </div>

              {isPending && (
                <Button
                  onClick={() => router.push(`/daily-operations/${data.flight.id}?date=${data.flight.date.split('T')[0]}&errorId=${id}`)}
                  className="bg-slate-800 hover:bg-slate-900 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Uredi let
                </Button>
              )}
            </div>
          </div>

          {/* Description section */}
          <div className="p-6 bg-slate-50 border-b border-slate-100">
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                  Opis problema
                </p>
                <p className="text-slate-800 leading-relaxed">{data.description}</p>
                <p className="text-xs text-slate-500 mt-3">
                  Prijavljeno {format(new Date(data.createdAt), 'dd.MM.yyyy u HH:mm', { locale: bs })}
                </p>
              </div>
            </div>
          </div>

          {/* Flight info section */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Plane className="w-5 h-5 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Informacije o letu
              </h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Ruta</p>
                <p className="font-semibold text-slate-900">{data.flight.route}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Broj leta</p>
                <p className="font-semibold text-slate-900">{flightNumber}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Datum</p>
                <p className="font-semibold text-slate-900">
                  {format(new Date(data.flight.date), 'dd.MM.yyyy', { locale: bs })}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-xs text-slate-500 mb-1">Aviokompanija</p>
                <p className="font-semibold text-slate-900">{data.flight.airline?.name || '-'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Old Values - Show what was reported as problematic */}
            {isPending && data.oldValue && Object.keys(data.oldValue).length > 0 && (
              <div className="bg-white rounded-2xl border-2 border-amber-200 shadow-sm p-6">
                <div className="flex items-center gap-2 mb-4">
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide">
                    Vrijednosti prijavljene kao pogrešne
                  </h2>
                </div>
                <p className="text-sm text-slate-600 mb-4">
                  Ove vrijednosti su bile zabilježene u momentu prijave greške. Morate ih izmijeniti da biste mogli označiti grešku kao riješenu.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {formatOldValues(data.oldValue, data.errorType).map((item, index) => (
                    <div key={index} className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                      <p className="text-xs text-amber-700 mb-1">{item.label}</p>
                      <p className="font-semibold text-amber-900">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Additional Flight Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                  Trenutne vrijednosti na letu
                </h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Dolazni putnici</p>
                  <p className="font-semibold text-slate-900">{data.flight.arrivalPassengers ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Odlazni putnici</p>
                  <p className="font-semibold text-slate-900">{data.flight.departurePassengers ?? '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Tip aviona</p>
                  <p className="font-semibold text-slate-900">{data.flight.aircraftType?.model || '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Tip operacije</p>
                  <p className="font-semibold text-slate-900">{data.flight.operationType?.name || '-'}</p>
                </div>
              </div>
              {data.flight.flightType && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 mb-1">Tip leta</p>
                  <p className="font-semibold text-slate-900">{data.flight.flightType.name}</p>
                </div>
              )}
            </div>

            {/* Action Forms */}
            {isPending && (
              <div className="space-y-4">
                {activeForm === 'resolve' && (
                  <ErrorResolutionForm
                    onSubmit={handleResolve}
                    onCancel={() => setActiveForm(null)}
                    isSubmitting={isSubmitting}
                  />
                )}

                {activeForm === 'dispute' && (
                  <ErrorDisputeForm
                    onSubmit={handleDispute}
                    onCancel={() => setActiveForm(null)}
                    isSubmitting={isSubmitting}
                  />
                )}

                {!activeForm && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-semibold text-slate-900 mb-2">Akcije</h3>
                    <p className="text-sm text-slate-600 mb-4">
                      Kliknite &quot;Uredi let&quot; iznad da ispravite podatke, a zatim označite grešku kao riješenu.
                      Ako smatrate da prijavljena greška nije ispravna, možete je osporiti.
                    </p>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => setActiveForm('resolve')}
                        className="bg-slate-800 hover:bg-slate-900 text-white"
                      >
                        Označi kao riješeno
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setActiveForm('dispute')}
                        className="border-slate-300 text-slate-700 hover:bg-slate-50"
                      >
                        Ospori grešku
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Dispute info */}
            {data.status === 'DISPUTED' && data.disputeReason && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-2">Razlog osporavanja</h3>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{data.disputeReason}</p>
                {data.disputedAt && (
                  <p className="text-xs text-slate-500 mt-3">
                    Osporeno {format(new Date(data.disputedAt), 'dd.MM.yyyy u HH:mm', { locale: bs })}
                  </p>
                )}
              </div>
            )}

            {/* Closed info */}
            {(data.status === 'CLOSED' || data.status === 'RESOLVED') && data.closedBy && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h3 className="font-semibold text-slate-900 mb-2">
                  {data.status === 'RESOLVED' ? 'Greška riješena' : 'Zatvoreno od strane administratora'}
                </h3>
                {data.closedNotes && (
                  <p className="text-sm text-slate-700 mb-2">{data.closedNotes}</p>
                )}
                <p className="text-xs text-slate-500">
                  {data.closedBy.name || 'Administrator'} | {data.closedAt && format(new Date(data.closedAt), 'dd.MM.yyyy u HH:mm', { locale: bs })}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Attachments */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Prilozi</h2>
                </div>
                {isPending && (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    />
                    <span className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-800">
                      <Upload className="w-4 h-4" />
                      {isUploading ? 'Učitavanje...' : 'Dodaj prilog'}
                    </span>
                  </label>
                )}
              </div>

              {data.attachments.length > 0 ? (
                <ul className="space-y-2">
                  {data.attachments.map((attachment) => (
                    <li
                      key={attachment.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(attachment.fileSize / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  Nema priloga
                </p>
              )}
            </div>

            {/* History */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">Historija promjena</h2>
              </div>
              <ErrorHistoryTimeline history={data.history} />
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
