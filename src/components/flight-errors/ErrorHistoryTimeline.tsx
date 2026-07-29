'use client';

import { FlightErrorStatus } from '@prisma/client';
import { format } from 'date-fns';
import { bs } from 'date-fns/locale';
import { CheckCircle, AlertTriangle, Clock, FileText, XCircle, Plus, Paperclip } from 'lucide-react';

interface HistoryItem {
  id: string;
  action: string;
  fromStatus: FlightErrorStatus | null;
  toStatus: FlightErrorStatus | null;
  notes: string | null;
  createdAt: string | Date;
  performedBy: {
    id: string;
    name: string | null;
  };
}

interface ErrorHistoryTimelineProps {
  history: HistoryItem[];
}

const actionConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  CREATED: {
    icon: Plus,
    color: 'text-blue-600 bg-blue-100',
    label: 'Greška prijavljena',
  },
  STATUS_CHANGED: {
    icon: Clock,
    color: 'text-amber-600 bg-amber-100',
    label: 'Status promijenjen',
  },
  RESOLVED: {
    icon: CheckCircle,
    color: 'text-green-600 bg-green-100',
    label: 'Greška riješena',
  },
  DISPUTED: {
    icon: AlertTriangle,
    color: 'text-purple-600 bg-purple-100',
    label: 'Greška osporena',
  },
  CLOSED: {
    icon: XCircle,
    color: 'text-slate-600 bg-slate-100',
    label: 'Greška zatvorena',
  },
  ATTACHMENT_ADDED: {
    icon: Paperclip,
    color: 'text-indigo-600 bg-indigo-100',
    label: 'Prilog dodan',
  },
};

const statusLabels: Record<FlightErrorStatus, string> = {
  OPEN: 'Otvoren',
  IN_PROGRESS: 'U obradi',
  RESOLVED: 'Riješen',
  DISPUTED: 'Osporen',
  CLOSED: 'Zatvoren',
};

export function ErrorHistoryTimeline({ history }: ErrorHistoryTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>Nema historije promjena</p>
      </div>
    );
  }

  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {history.map((item, index) => {
          const config = actionConfig[item.action] || actionConfig.STATUS_CHANGED;
          const Icon = config.icon;
          const isLast = index === history.length - 1;
          const createdAt = new Date(item.createdAt);

          return (
            <li key={item.id}>
              <div className="relative pb-8">
                {/* Connecting line */}
                {!isLast && (
                  <span
                    className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-slate-200"
                    aria-hidden="true"
                  />
                )}

                <div className="relative flex items-start space-x-4">
                  {/* Icon */}
                  <div className="relative">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-900">
                        {config.label}
                      </p>
                      <time className="text-xs text-slate-500">
                        {format(createdAt, 'dd.MM.yyyy HH:mm', { locale: bs })}
                      </time>
                    </div>

                    {/* Status change info */}
                    {item.fromStatus && item.toStatus && (
                      <p className="text-sm text-slate-600 mt-1">
                        <span className="text-slate-400">{statusLabels[item.fromStatus]}</span>
                        <span className="mx-2 text-slate-400">→</span>
                        <span className="font-medium">{statusLabels[item.toStatus]}</span>
                      </p>
                    )}

                    {/* Notes */}
                    {item.notes && (
                      <p className="mt-2 text-sm text-slate-700 bg-slate-50 rounded-lg p-3 border border-slate-100">
                        {item.notes}
                      </p>
                    )}

                    {/* Performed by */}
                    <p className="mt-2 text-xs text-slate-500">
                      {item.performedBy.name || 'Nepoznat korisnik'}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
