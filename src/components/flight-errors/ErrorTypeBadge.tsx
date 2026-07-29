'use client';

import { FlightErrorType } from '@prisma/client';

interface ErrorTypeBadgeProps {
  errorType: FlightErrorType;
  size?: 'sm' | 'md';
}

const typeConfig: Record<FlightErrorType, { label: string; className: string }> = {
  GENERAL: {
    label: 'Opća greška',
    className: 'bg-gray-50 text-gray-700 border border-gray-200',
  },
  DEPARTURE_PASSENGERS: {
    label: 'Odlazni putnici',
    className: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  },
  ARRIVAL_PASSENGERS: {
    label: 'Dolazni putnici',
    className: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
  },
  AIRCRAFT_TYPE: {
    label: 'Tip aviona',
    className: 'bg-teal-50 text-teal-700 border border-teal-200',
  },
  OPERATION_TYPE: {
    label: 'Tip operacije',
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  FLIGHT_TYPE: {
    label: 'Tip leta',
    className: 'bg-lime-50 text-lime-700 border border-lime-200',
  },
  NOT_VERIFIED: {
    label: 'Let nije verifikovan',
    className: 'bg-rose-50 text-rose-700 border border-rose-200',
  },
};

export function ErrorTypeBadge({ errorType, size = 'sm' }: ErrorTypeBadgeProps) {
  const config = typeConfig[errorType];
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses} ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export function getErrorTypeLabel(errorType: FlightErrorType): string {
  return typeConfig[errorType]?.label || errorType;
}
