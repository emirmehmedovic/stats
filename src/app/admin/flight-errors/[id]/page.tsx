'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ErrorStatusBadge,
  ErrorPriorityBadge,
  ErrorTypeBadge,
  ErrorHistoryTimeline,
} from '@/components/flight-errors';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Paperclip,
  User,
  UserCheck,
  CheckCircle,
  XCircle,
} from 'lucide-react';
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
  reportedBy: {
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

export default function AdminFlightErrorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<FlightErrorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [closeNotes, setCloseNotes] = useState('');
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [isFalseReport, setIsFalseReport] = useState(false);

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

  const handleClose = async (newStatus: 'RESOLVED' | 'CLOSED') => {
    setIsClosing(true);
    try {
      const response = await fetch(`/api/flight-errors/${id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newStatus, closedNotes: closeNotes, isFalseReport }),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Greška pri zatvaranju');
      }

      await fetchError();
      setShowCloseForm(false);
      setCloseNotes('');
      setIsFalseReport(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri zatvaranju');
    } finally {
      setIsClosing(false);
    }
  };

  const canClose = data?.status !== 'CLOSED';
  const flightNumber = data?.flight.departureFlightNumber || data?.flight.arrivalFlightNumber || 'N/A';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 max-w-lg mx-auto">
          <p className="text-sm text-red-700">{error || 'Greška nije pronađena'}</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => router.push('/admin/flight-errors')}>
            Nazad na listu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/flight-errors')}
          className="text-slate-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Nazad na listu
        </Button>

        {/* Header */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">
                    {data.flight.route} | {flightNumber}
                  </h1>
                  <p className="text-sm text-slate-500">
                    {data.flight.airline?.name} | {format(new Date(data.flight.date), 'dd.MM.yyyy', { locale: bs })}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ErrorTypeBadge errorType={data.errorType} size="md" />
                <ErrorPriorityBadge priority={data.priority} size="md" />
                <ErrorStatusBadge status={data.status} size="md" />
              </div>
            </div>

            {canClose && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCloseForm(!showCloseForm)}
                >
                  Zatvori grešku
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Close form */}
        {showCloseForm && canClose && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
            <h3 className="font-semibold text-slate-900 mb-4">Admin zatvaranje</h3>
            <textarea
              value={closeNotes}
              onChange={(e) => setCloseNotes(e.target.value)}
              placeholder="Napomena (opcionalno)..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg mb-4 resize-none"
              disabled={isClosing}
            />

            {/* False Report Checkbox - only show for disputed errors */}
            {data.status === 'DISPUTED' && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFalseReport}
                    onChange={(e) => setIsFalseReport(e.target.checked)}
                    className="mt-1 h-4 w-4 text-red-600 border-red-300 rounded focus:ring-red-500"
                    disabled={isClosing}
                  />
                  <div>
                    <span className="font-medium text-red-900">Označi kao lažnu prijavu</span>
                    <p className="text-sm text-red-700 mt-1">
                      Označite ovu opciju ako je prijava bila neosnovana ili namjerno lažna.
                      Ovo će se zabilježiti u statistici prijavitelja.
                    </p>
                  </div>
                </label>
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => handleClose('RESOLVED')}
                disabled={isClosing}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {isClosing ? 'Šaljem...' : 'Označi kao riješeno'}
              </Button>
              <Button
                onClick={() => handleClose('CLOSED')}
                disabled={isClosing}
                variant="outline"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Zatvori bez rješenja
              </Button>
              <Button
                variant="ghost"
                onClick={() => setShowCloseForm(false)}
                disabled={isClosing}
              >
                Odustani
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Opis greške</h2>
              <p className="text-slate-700 whitespace-pre-wrap">{data.description}</p>
              <p className="text-xs text-slate-500 mt-4">
                Prijavljeno {format(new Date(data.createdAt), 'dd.MM.yyyy HH:mm', { locale: bs })}
              </p>
            </div>

            {/* Users info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Reporter */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Prijavio/la</span>
                </div>
                <p className="font-semibold text-blue-900">
                  {data.reportedBy.name || data.reportedBy.email}
                </p>
                <p className="text-xs text-blue-600">{data.reportedBy.email}</p>
              </div>

              {/* Assignee */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">Dodijeljeno</span>
                </div>
                <p className="font-semibold text-amber-900">
                  {data.assignedTo.name || data.assignedTo.email}
                </p>
                <p className="text-xs text-amber-600">{data.assignedTo.email}</p>
              </div>
            </div>

            {/* Flight Details */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Podaci o letu</h2>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-slate-500">Ruta</dt>
                  <dd className="font-medium text-slate-900">{data.flight.route}</dd>
                </div>
                <div>
                  <dt className="text-slate-500">Datum</dt>
                  <dd className="font-medium text-slate-900">
                    {format(new Date(data.flight.date), 'dd.MM.yyyy', { locale: bs })}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Aviokompanija</dt>
                  <dd className="font-medium text-slate-900">
                    {data.flight.airline?.name || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Tip aviona</dt>
                  <dd className="font-medium text-slate-900">
                    {data.flight.aircraftType?.model || 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Dolazni putnici</dt>
                  <dd className="font-medium text-slate-900">
                    {data.flight.arrivalPassengers ?? 'N/A'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Odlazni putnici</dt>
                  <dd className="font-medium text-slate-900">
                    {data.flight.departurePassengers ?? 'N/A'}
                  </dd>
                </div>
              </dl>

              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => router.push(`/daily-operations/${data.flight.id}?date=${data.flight.date.split('T')[0]}`)}
              >
                Otvori let
              </Button>
            </div>

            {/* Value diff */}
            {(data.oldValue || data.newValue) && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Promjene vrijednosti</h2>
                <div className="grid grid-cols-2 gap-4">
                  {data.oldValue && (
                    <div className="bg-red-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-red-800 mb-2">Stare vrijednosti</h3>
                      <pre className="text-xs text-red-700 whitespace-pre-wrap">
                        {JSON.stringify(data.oldValue, null, 2)}
                      </pre>
                    </div>
                  )}
                  {data.newValue && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-green-800 mb-2">Nove vrijednosti</h3>
                      <pre className="text-xs text-green-700 whitespace-pre-wrap">
                        {JSON.stringify(data.newValue, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dispute info */}
            {data.status === 'DISPUTED' && data.disputeReason && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
                <h3 className="font-semibold text-purple-900 mb-2">Razlog osporavanja</h3>
                <p className="text-sm text-purple-700 whitespace-pre-wrap">{data.disputeReason}</p>
                {data.disputedAt && (
                  <p className="text-xs text-purple-500 mt-3">
                    Osporeno {format(new Date(data.disputedAt), 'dd.MM.yyyy HH:mm', { locale: bs })}
                  </p>
                )}
              </div>
            )}

            {/* Closed info */}
            {data.closedBy && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
                <h3 className="font-semibold text-slate-900 mb-2">Zatvoreno</h3>
                {data.closedNotes && (
                  <p className="text-sm text-slate-700 mb-2">{data.closedNotes}</p>
                )}
                <p className="text-xs text-slate-500">
                  {data.closedBy.name || 'Admin'} | {data.closedAt && format(new Date(data.closedAt), 'dd.MM.yyyy HH:mm', { locale: bs })}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Attachments */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Prilozi</h2>

              {data.attachments.length > 0 ? (
                <ul className="space-y-2">
                  {data.attachments.map((attachment) => (
                    <li
                      key={attachment.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 hover:bg-slate-100"
                    >
                      <Paperclip className="w-4 h-4 text-slate-400" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {(attachment.fileSize / 1024).toFixed(1)} KB | {attachment.uploadedBy.name || 'Korisnik'}
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
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Historija</h2>
              <ErrorHistoryTimeline history={data.history} />
            </div>
          </div>
        </div>
      </div>
  );
}
