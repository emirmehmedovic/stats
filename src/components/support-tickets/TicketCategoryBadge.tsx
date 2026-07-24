'use client';

import { TicketCategory } from '@prisma/client';

interface TicketCategoryBadgeProps {
  category: TicketCategory;
  size?: 'sm' | 'md';
}

const categoryConfig: Record<TicketCategory, { label: string; className: string }> = {
  HARDWARE: {
    label: 'Hardver',
    className: 'bg-purple-50 text-purple-700 border border-purple-200',
  },
  SOFTWARE: {
    label: 'Softver',
    className: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  },
  NETWORK: {
    label: 'Mreža',
    className: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  },
  ACCESS: {
    label: 'Pristup',
    className: 'bg-teal-50 text-teal-700 border border-teal-200',
  },
  EMAIL: {
    label: 'Email',
    className: 'bg-blue-50 text-blue-700 border border-blue-200',
  },
  PRINTER: {
    label: 'Štampač',
    className: 'bg-gray-50 text-gray-700 border border-gray-200',
  },
  OTHER: {
    label: 'Ostalo',
    className: 'bg-slate-50 text-slate-600 border border-slate-200',
  },
};

export function TicketCategoryBadge({ category, size = 'sm' }: TicketCategoryBadgeProps) {
  const config = categoryConfig[category];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${config.className}`}
    >
      {config.label}
    </span>
  );
}
