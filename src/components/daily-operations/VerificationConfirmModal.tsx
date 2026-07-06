'use client';

import { CheckCircle2, X, Plane, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FlightSummary {
  flightNumber: string | null;
  passengers: number | null;
  male: number | null;
  female: number | null;
  children: number | null;
  infants: number | null;
  isFerry: boolean;
}

interface VerificationConfirmModalProps {
  isOpen: boolean;
  arrival: FlightSummary | null;
  departure: FlightSummary | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function VerificationConfirmModal({
  isOpen,
  arrival,
  departure,
  onConfirm,
  onCancel,
}: VerificationConfirmModalProps) {
  if (!isOpen) return null;

  const renderFlightSummary = (
    title: string,
    data: FlightSummary | null,
    ferryLabel: string
  ) => {
    if (!data) return null;

    const hasBreakdown = data.male !== null || data.female !== null || data.children !== null;

    return (
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Plane className="w-4 h-4 text-slate-600" />
          <span className="font-semibold text-slate-800">{title}</span>
          {data.flightNumber && (
            <span className="text-sm text-slate-500">({data.flightNumber})</span>
          )}
        </div>

        {data.isFerry ? (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <span className="text-amber-800 font-medium">{ferryLabel}</span>
            <span className="text-amber-600 text-sm">- bez putnika</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-500" />
              <span className="text-slate-700">
                <span className="font-semibold">{data.passengers ?? 0}</span> putnika
              </span>
              {data.infants !== null && data.infants > 0 && (
                <span className="text-slate-500 text-sm">
                  + {data.infants} beba
                </span>
              )}
            </div>

            {hasBreakdown && (
              <div className="flex flex-wrap gap-2 text-sm">
                {data.male !== null && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    M: {data.male}
                  </span>
                )}
                {data.female !== null && (
                  <span className="bg-pink-100 text-pink-800 px-2 py-1 rounded">
                    F: {data.female}
                  </span>
                )}
                {data.children !== null && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                    CHD: {data.children}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg animate-in fade-in zoom-in">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Potvrda verifikacije
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Disclaimer */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-5">
              <p className="text-emerald-900 font-medium">
                Potvrdujem da sam pregledao/la podatke i da su uneseni podaci tacni.
              </p>
            </div>

            {/* Flight Summaries */}
            <div className="space-y-3 mb-6">
              <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Pregled podataka
              </h3>

              {renderFlightSummary('Dolazak', arrival, 'Ferry In')}
              {renderFlightSummary('Odlazak', departure, 'Ferry Out')}

              {!arrival && !departure && (
                <p className="text-slate-500 italic text-sm">
                  Nema podataka o letovima za prikaz.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button
                onClick={onCancel}
                variant="outline"
                className="flex-1"
              >
                Odustani
              </Button>
              <Button
                onClick={onConfirm}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
              >
                Potvrdi verifikaciju
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
