'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FlightFilters } from '@/types/flight';
import { Airline } from '@prisma/client';
import { getMonthEndDateString, getMonthStartDateString, getTodayDateString } from '@/lib/dates';

interface FlightsFiltersProps {
  filters: FlightFilters;
  onFiltersChange: (filters: FlightFilters) => void;
}

const OPERATION_TYPE_LABELS: Record<string, string> = {
  SCHEDULED: 'Redovan',
  CHARTER: 'Charter',
  MEDEVAC: 'Medicinska evakuacija',
};

export function FlightsFilters({ filters, onFiltersChange }: FlightsFiltersProps) {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [isLoadingAirlines, setIsLoadingAirlines] = useState(true);

  const today = getTodayDateString();
  const monthStart = getMonthStartDateString(today);
  const monthEnd = getMonthEndDateString(today);

  useEffect(() => {
    fetchAirlines();
  }, []);

  const fetchAirlines = async () => {
    try {
      const response = await fetch('/api/airlines');
      if (response.ok) {
        const result = await response.json();
        setAirlines(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching airlines:', error);
    } finally {
      setIsLoadingAirlines(false);
    }
  };

  const handleFilterChange = (key: keyof FlightFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
      page: 1, // Reset to first page when filters change
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({
      page: 1,
      limit: filters.limit,
      dateFrom: monthStart,
      dateTo: monthEnd,
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.airlineId ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.route ||
    filters.operationType;

  return (
    <div className="bg-white/90 backdrop-blur rounded-3xl border border-dark-100 shadow-soft px-5 py-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-dark-800">Filteri</h2>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="text-xs"
          >
            Očisti filtere
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-xs text-textMuted mb-1.5">
            Pretraga
          </label>
          <Input
            id="search"
            type="text"
            placeholder="Pretraži letove..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            className="h-9 text-sm"
          />
        </div>

        {/* Airline */}
        <div>
          <label htmlFor="airline" className="block text-xs text-textMuted mb-1.5">
            Aviokompanija
          </label>
          <select
            id="airline"
            value={filters.airlineId || ''}
            onChange={(e) => handleFilterChange('airlineId', e.target.value || undefined)}
            disabled={isLoadingAirlines}
            className="h-9 w-full rounded-xl border border-borderSoft bg-white px-3 text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            <option value="">Sve aviokompanije</option>
            {airlines.map((airline) => (
              <option key={airline.id} value={airline.id}>
                {airline.name} ({airline.icaoCode})
              </option>
            ))}
          </select>
        </div>

        {/* Route */}
        <div>
          <label htmlFor="route" className="block text-xs text-textMuted mb-1.5">
            Ruta
          </label>
          <Input
            id="route"
            type="text"
            placeholder="npr. TZL-IST"
            value={filters.route || ''}
            onChange={(e) => handleFilterChange('route', e.target.value || undefined)}
            className="h-9 text-sm"
          />
        </div>

        {/* Operation Type */}
        <div>
          <label htmlFor="operationType" className="block text-xs text-textMuted mb-1.5">
            Tip operacije
          </label>
          <select
            id="operationType"
            value={filters.operationType || ''}
            onChange={(e) => handleFilterChange('operationType', e.target.value || undefined)}
            className="h-9 w-full rounded-xl border border-borderSoft bg-white px-3 text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            <option value="">Svi tipovi</option>
            <option value="SCHEDULED">Redovan</option>
            <option value="CHARTER">Charter</option>
            <option value="MEDEVAC">Medicinska evakuacija</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label htmlFor="dateFrom" className="block text-xs text-textMuted mb-1.5">
            Datum od
          </label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
            className="h-9 text-sm"
          />
        </div>

        {/* Date To */}
        <div>
          <label htmlFor="dateTo" className="block text-xs text-textMuted mb-1.5">
            Datum do
          </label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-borderSoft">
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-primarySoft px-3 py-1 text-xs text-brand-primary">
                Pretraga: {filters.search}
                <button
                  onClick={() => handleFilterChange('search', undefined)}
                  className="hover:text-brand-primary/70"
                >
                  ×
                </button>
              </span>
            )}
            {filters.airlineId && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-primarySoft px-3 py-1 text-xs text-brand-primary">
                Aviokompanija:{' '}
                {airlines.find((a) => a.id === filters.airlineId)?.name || filters.airlineId}
                <button
                  onClick={() => handleFilterChange('airlineId', undefined)}
                  className="hover:text-brand-primary/70"
                >
                  ×
                </button>
              </span>
            )}
            {filters.route && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-primarySoft px-3 py-1 text-xs text-brand-primary">
                Ruta: {filters.route}
                <button
                  onClick={() => handleFilterChange('route', undefined)}
                  className="hover:text-brand-primary/70"
                >
                  ×
                </button>
              </span>
            )}
            {filters.operationType && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-primarySoft px-3 py-1 text-xs text-brand-primary">
                Tip:{' '}
                {OPERATION_TYPE_LABELS[filters.operationType] || filters.operationType}
                <button
                  onClick={() => handleFilterChange('operationType', undefined)}
                  className="hover:text-brand-primary/70"
                >
                  ×
                </button>
              </span>
            )}
            {filters.dateFrom && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-800/10 px-3 py-1 text-xs text-primary-900 border border-primary-300">
                Od: {filters.dateFrom}
                <button
                  onClick={() => handleFilterChange('dateFrom', undefined)}
                  className="hover:text-primary-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.dateTo && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-800/10 px-3 py-1 text-xs text-primary-900 border border-primary-300">
                Do: {filters.dateTo}
                <button
                  onClick={() => handleFilterChange('dateTo', undefined)}
                  className="hover:text-primary-900"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
