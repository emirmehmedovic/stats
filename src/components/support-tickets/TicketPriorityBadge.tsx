'use client';

import { TicketPriority } from '@prisma/client';

interface TicketPriorityBadgeProps {
  priority: TicketPriority;
  size?: 'sm' | 'md';
}

const priorityConfig: Record<TicketPriority, { label: string; className: string }> = {
  LOW: {
    label: 'Nizak',
    className: 'bg-slate-50 text-slate-600 border border-slate-200',
  },
  MEDIUM: {
    label: 'Srednji',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  HIGH: {
    label: 'Visok',
    className: 'bg-orange-50 text-orange-700 border border-orange-200',
  },
  URGENT: {
    label: 'Hitan',
    className: 'bg-red-50 text-red-700 border border-red-200',
  },
};

export function TicketPriorityBadge({ priority, size = 'sm' }: TicketPriorityBadgeProps) {
  const config = priorityConfig[priority];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${config.className}`}
    >
      {config.label}
    </span>
  );
}
