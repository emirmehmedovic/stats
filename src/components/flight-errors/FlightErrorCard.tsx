'use client';

import { FlightErrorStatus, FlightErrorType, FlightErrorPriority } from '@prisma/client';
import { ErrorStatusBadge } from './ErrorStatusBadge';
import { ErrorPriorityBadge } from './ErrorPriorityBadge';
import { getErrorTypeLabel } from './ErrorTypeBadge';
import { format } from 'date-fns';
import { bs } from 'date-fns/locale';
import { AlertTriangle, Plane, Calendar, ChevronRight, Paperclip } from 'lucide-react';

interface FlightErrorCardProps {
  error: {
    id: string;
    errorType: FlightErrorType;
    priority: FlightErrorPriority;
    status: FlightErrorStatus;
    description: string;
    createdAt: string | Date;
    flight: {
      id: string;
      date: string | Date;
      route: string;
      arrivalFlightNumber: string | null;
      departureFlightNumber: string | null;
      airline?: {
        name: string;
        icaoCode: string;
      };
    };
    assignedTo?: {
      id: string;
      name: string | null;
      email: string;
    };
    _count?: {
      attachments: number;
    };
  };
  onClick?: () => void;
  showAssignee?: boolean;
}

// Map error types to colors for the left accent
const errorTypeColors: Record<FlightErrorType, { accent: string; light: string }> = {
  GENERAL: { accent: 'bg-slate-500', light: 'bg-slate-50' },
  DEPARTURE_PASSENGERS: { accent: 'bg-indigo-500', light: 'bg-indigo-50' },
  ARRIVAL_PASSENGERS: { accent: 'bg-cyan-600', light: 'bg-cyan-50' },
  AIRCRAFT_TYPE: { accent: 'bg-teal-500', light: 'bg-teal-50' },
  OPERATION_TYPE: { accent: 'bg-emerald-500', light: 'bg-emerald-50' },
  FLIGHT_TYPE: { accent: 'bg-lime-600', light: 'bg-lime-50' },
  NOT_VERIFIED: { accent: 'bg-rose-500', light: 'bg-rose-50' },
};

export function FlightErrorCard({ error, onClick, showAssignee = false }: FlightErrorCardProps) {
  const flightDate = new Date(error.flight.date);
  const createdDate = new Date(error.createdAt);
  const flightNumber = error.flight.departureFlightNumber || error.flight.arrivalFlightNumber || 'N/A';
  const isPending = error.status === FlightErrorStatus.OPEN || error.status === FlightErrorStatus.IN_PROGRESS;
  const colors = errorTypeColors[error.errorType] || errorTypeColors.GENERAL;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex ${
        isPending ? 'border-slate-300' : 'border-slate-200'
      }`}
    >
      {/* Left Accent Bar */}
      <div className={`w-1.5 ${colors.accent} flex-shrink-0`} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header Row */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Error Type Label */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Tip greške
                </span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">
                {getErrorTypeLabel(error.errorType)}
              </h3>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ErrorPriorityBadge priority={error.priority} />
              <ErrorStatusBadge status={error.status} />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
            Opis problema
          </div>
          <p className="text-slate-700 leading-relaxed">
            {error.description}
          </p>
        </div>

        {/* Flight Info */}
        <div className={`px-4 py-3 ${colors.light}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-slate-700">
                <Plane className="w-4 h-4 text-slate-500" />
                <span className="font-medium">{error.flight.route}</span>
                <span className="text-slate-400">|</span>
                <span>{flightNumber}</span>
                {error.flight.airline && (
                  <>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500">{error.flight.airline.icaoCode}</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>{format(flightDate, 'dd.MM.yyyy', { locale: bs })}</span>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Prijavljeno {format(createdDate, 'dd.MM.yyyy HH:mm', { locale: bs })}</span>
          <div className="flex items-center gap-3">
            {error._count?.attachments ? (
              <span className="flex items-center gap-1">
                <Paperclip className="w-3 h-3" />
                {error._count.attachments}
              </span>
            ) : null}
            {showAssignee && error.assignedTo && (
              <span>Dodijeljeno: {error.assignedTo.name || error.assignedTo.email}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
