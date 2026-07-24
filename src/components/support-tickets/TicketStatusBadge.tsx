'use client';

import { TicketStatus } from '@prisma/client';

interface TicketStatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<TicketStatus, { label: string; className: string }> = {
  OPEN: {
    label: 'Otvoren',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  IN_PROGRESS: {
    label: 'U obradi',
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  RESOLVED: {
    label: 'Riješen',
    className: 'bg-green-50 text-green-700 border border-green-200',
  },
  CLOSED: {
    label: 'Zatvoren',
    className: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
};

export function TicketStatusBadge({ status, size = 'sm' }: TicketStatusBadgeProps) {
  const config = statusConfig[status];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${config.className}`}
    >
      {config.label}
    </span>
  );
}
