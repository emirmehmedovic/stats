'use client';

import { Button } from '@/components/ui/button';
import { TicketStatus, TicketPriority, TicketCategory, TicketLocation, TicketSystem } from '@prisma/client';
import { X, Filter } from 'lucide-react';

export interface TicketFiltersState {
  search?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  location?: TicketLocation;
  system?: TicketSystem;
  dateFrom?: string;
  dateTo?: string;
  reporterName?: string;
  page: number;
  limit: number;
}

interface TicketFiltersProps {
  filters: TicketFiltersState;
  onFiltersChange: (filters: TicketFiltersState) => void;
}

const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Otvoren',
  IN_PROGRESS: 'U obradi',
  RESOLVED: 'Riješen',
  CLOSED: 'Zatvoren',
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Nizak',
  MEDIUM: 'Srednji',
  HIGH: 'Visok',
  URGENT: 'Hitan',
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  HARDWARE: 'Hardver',
  SOFTWARE: 'Softver',
  NETWORK: 'Mreža',
  ACCESS: 'Pristup',
  EMAIL: 'Email',
  PRINTER: 'Štampač',
  OTHER: 'Ostalo',
};

const LOCATION_LABELS: Record<TicketLocation, string> = {
  CHECKIN_1: 'Check-in 1',
  CHECKIN_2: 'Check-in 2',
  CHECKIN_3: 'Check-in 3',
  CHECKIN_4: 'Check-in 4',
  CHECKIN_5: 'Check-in 5',
  CHECKIN_6: 'Check-in 6',
  CHECKIN_7: 'Check-in 7',
  CHECKIN_8: 'Check-in 8',
  BOARDING_1: 'Boarding 1',
  BOARDING_2: 'Boarding 2',
  BOARDING_3: 'Boarding 3',
  BOARDING_4: 'Boarding 4',
  OFFICE_NAPLATE: 'Kanc. Naplate',
  OFFICE_INFO: 'Kanc. Info',
  OTHER: 'Ostalo',
};

const SYSTEM_LABELS: Record<TicketSystem, string> = {
  GONOW: 'GoNow',
  DCS_CRANE: 'DCS Crane',
  NIKO: 'NIKO',
  PRINTER: 'Printer',
  OTHER: 'Ostalo',
};

export function TicketFilters({ filters, onFiltersChange }: TicketFiltersProps) {
  const handleFilterChange = (key: keyof TicketFiltersState, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1,
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      page: 1,
      limit: filters.limit,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.status ||
    filters.priority ||
    filters.category ||
    filters.location ||
    filters.system ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.reporterName;

  const inputClass = "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent";
  const selectClass = "h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent";
  const labelClass = "block text-xs font-medium text-slate-500 mb-1";

  return (
    <div className="border border-slate-200 rounded-xl bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 text-slate-700">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filteri</span>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700"
          >
            <X className="w-3 h-3 mr-1" />
            Očisti
          </Button>
        )}
      </div>

      <div className="p-4">
        {/* Row 1: Search, Reporter, Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          <div>
            <label className={labelClass}>Pretraga</label>
            <input
              type="text"
              placeholder="Pretraži tikete..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Reporter</label>
            <input
              type="text"
              placeholder="Ime reportera..."
              value={filters.reporterName || ''}
              onChange={(e) => handleFilterChange('reporterName', e.target.value || undefined)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Datum od</label>
            <input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Datum do</label>
            <input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Row 2: Status, Priority, Category, System, Location */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={filters.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
              className={selectClass}
            >
              <option value="">Svi</option>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Prioritet</label>
            <select
              value={filters.priority || ''}
              onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
              className={selectClass}
            >
              <option value="">Svi</option>
              {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Kategorija</label>
            <select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              className={selectClass}
            >
              <option value="">Sve</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Sistem</label>
            <select
              value={filters.system || ''}
              onChange={(e) => handleFilterChange('system', e.target.value || undefined)}
              className={selectClass}
            >
              <option value="">Svi</option>
              {Object.entries(SYSTEM_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Lokacija</label>
            <select
              value={filters.location || ''}
              onChange={(e) => handleFilterChange('location', e.target.value || undefined)}
              className={selectClass}
            >
              <option value="">Sve</option>
              {Object.entries(LOCATION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Active filters display */}
      {hasActiveFilters && (
        <div className="px-4 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {filters.search && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                Pretraga: {filters.search}
                <button onClick={() => handleFilterChange('search', undefined)} className="hover:text-slate-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.reporterName && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                Reporter: {filters.reporterName}
                <button onClick={() => handleFilterChange('reporterName', undefined)} className="hover:text-slate-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.dateFrom && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                Od: {filters.dateFrom}
                <button onClick={() => handleFilterChange('dateFrom', undefined)} className="hover:text-slate-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.dateTo && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                Do: {filters.dateTo}
                <button onClick={() => handleFilterChange('dateTo', undefined)} className="hover:text-slate-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.status && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                Status: {STATUS_LABELS[filters.status]}
                <button onClick={() => handleFilterChange('status', undefined)} className="hover:text-slate-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.priority && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                Prioritet: {PRIORITY_LABELS[filters.priority]}
                <button onClick={() => handleFilterChange('priority', undefined)} className="hover:text-slate-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.category && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                Kategorija: {CATEGORY_LABELS[filters.category]}
                <button onClick={() => handleFilterChange('category', undefined)} className="hover:text-slate-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.system && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                Sistem: {SYSTEM_LABELS[filters.system]}
                <button onClick={() => handleFilterChange('system', undefined)} className="hover:text-slate-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filters.location && (
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                Lokacija: {LOCATION_LABELS[filters.location]}
                <button onClick={() => handleFilterChange('location', undefined)} className="hover:text-slate-900">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
