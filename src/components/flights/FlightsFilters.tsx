'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AsyncSearchableSelect } from '@/components/ui/AsyncSearchableSelect';
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

const FLIGHT_STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Zakazano',
  OPERATED: 'Operisano',
  CANCELLED: 'Otkazano',
  DIVERTED: 'Preusmjereno',
  NOT_OPERATED: 'Nije operisano',
};

export function FlightsFilters({ filters, onFiltersChange }: FlightsFiltersProps) {
  const today = getTodayDateString();
  const monthStart = getMonthStartDateString(today);
  const monthEnd = getMonthEndDateString(today);

  // Store selected airline name for display in chips
  const [selectedAirlineName, setSelectedAirlineName] = useState<string | null>(null);

  // Async search for airlines
  const fetchAirlineOptions = useCallback(async (search: string) => {
    try {
      const response = await fetch(`/api/airlines?search=${encodeURIComponent(search)}&limit=20`);
      if (response.ok) {
        const result = await response.json();
        return (result.data || []).map((airline: Airline) => ({
          value: airline.id,
          label: airline.icaoCode || airline.iataCode || airline.name,
          subtitle: airline.name,
        }));
      }
    } catch (error) {
      console.error('Error fetching airlines:', error);
    }
    return [];
  }, []);

  // Fetch initial airline option when value is set
  const fetchInitialAirline = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/airlines/${id}`);
      if (response.ok) {
        const result = await response.json();
        const airline = result.data;
        if (airline) {
          setSelectedAirlineName(airline.name);
          return {
            value: airline.id,
            label: airline.icaoCode || airline.iataCode || airline.name,
            subtitle: airline.name,
          };
        }
      }
    } catch (error) {
      console.error('Error fetching airline:', error);
    }
    return null;
  }, []);

  // Async search for routes
  const fetchRouteOptions = useCallback(async (search: string) => {
    try {
      const params = new URLSearchParams();
      params.append('search', search);
      params.append('limit', '20');
      if (filters.airlineId) {
        params.append('airlines', filters.airlineId);
      }
      const response = await fetch(`/api/routes?${params.toString()}`);
      if (response.ok) {
        const result = await response.json();
        return (result.data || []).map((route: string) => ({
          value: route,
          label: route,
        }));
      }
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
    return [];
  }, [filters.airlineId]);

  // Fetch initial route option
  const fetchInitialRoute = useCallback(async (route: string) => {
    return { value: route, label: route };
  }, []);

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
    filters.operationType ||
    filters.arrivalStatus ||
    filters.departureStatus ||
    filters.bothCancelled;

  return (
    <div className="bg-white/90 backdrop-blur rounded-2xl lg:rounded-3xl border border-dark-100 shadow-soft px-4 lg:px-5 py-3 lg:py-4 mb-4 lg:mb-6">
      <div className="flex items-center justify-between mb-3 lg:mb-4">
        <h2 className="text-xs lg:text-sm font-semibold text-dark-800">Filteri</h2>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-[10px] lg:text-xs text-textMuted mb-1 lg:mb-1.5">
            Pretraga
          </label>
          <Input
            id="search"
            type="text"
            placeholder="Pretraži letove..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
            className="h-8 lg:h-9 text-xs lg:text-sm"
          />
        </div>

        {/* Airline */}
        <div>
          <label htmlFor="airline" className="block text-[10px] lg:text-xs text-textMuted mb-1 lg:mb-1.5">
            Aviokompanija
          </label>
          <AsyncSearchableSelect
            value={filters.airlineId || ''}
            onChange={(value, option) => {
              // When airline changes, clear route filter and save name
              setSelectedAirlineName(option?.subtitle || option?.label || null);
              onFiltersChange({
                ...filters,
                airlineId: value || undefined,
                route: undefined,
                page: 1,
              });
            }}
            fetchOptions={fetchAirlineOptions}
            fetchInitialOption={fetchInitialAirline}
            placeholder="Sve aviokompanije"
            searchPlaceholder="Pretraži aviokompaniju..."
            typeToSearchText="Kucajte za pretragu..."
            noResultsText="Nema rezultata"
            className="text-xs lg:text-sm"
          />
        </div>

        {/* Route */}
        <div>
          <label htmlFor="route" className="block text-[10px] lg:text-xs text-textMuted mb-1 lg:mb-1.5">
            Ruta {filters.airlineId && <span className="text-primary-600">(filtrirano)</span>}
          </label>
          <AsyncSearchableSelect
            value={filters.route || ''}
            onChange={(value) => handleFilterChange('route', value || undefined)}
            fetchOptions={fetchRouteOptions}
            fetchInitialOption={fetchInitialRoute}
            placeholder={filters.airlineId ? 'Pretraži rutu' : 'Sve rute'}
            searchPlaceholder="Pretraži rutu..."
            typeToSearchText="Kucajte za pretragu (npr. TZL)..."
            noResultsText="Nema ruta"
            className="text-xs lg:text-sm"
          />
        </div>

        {/* Operation Type */}
        <div>
          <label htmlFor="operationType" className="block text-[10px] lg:text-xs text-textMuted mb-1 lg:mb-1.5">
            Tip operacije
          </label>
          <select
            id="operationType"
            value={filters.operationType || ''}
            onChange={(e) => handleFilterChange('operationType', e.target.value || undefined)}
            className="h-8 lg:h-9 w-full rounded-xl border border-borderSoft bg-white px-2 lg:px-3 text-xs lg:text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
          >
            <option value="">Svi tipovi</option>
            <option value="SCHEDULED">Redovan</option>
            <option value="CHARTER">Charter</option>
            <option value="MEDEVAC">Medicinska evakuacija</option>
          </select>
        </div>

        {/* Date From */}
        <div>
          <label htmlFor="dateFrom" className="block text-[10px] lg:text-xs text-textMuted mb-1 lg:mb-1.5">
            Datum od
          </label>
          <Input
            id="dateFrom"
            type="date"
            value={filters.dateFrom || ''}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value || undefined)}
            className="h-8 lg:h-9 text-xs lg:text-sm"
          />
        </div>

        {/* Date To */}
        <div>
          <label htmlFor="dateTo" className="block text-[10px] lg:text-xs text-textMuted mb-1 lg:mb-1.5">
            Datum do
          </label>
          <Input
            id="dateTo"
            type="date"
            value={filters.dateTo || ''}
            onChange={(e) => handleFilterChange('dateTo', e.target.value || undefined)}
            className="h-8 lg:h-9 text-xs lg:text-sm"
          />
        </div>

        {/* Arrival Status */}
        <div>
          <label htmlFor="arrivalStatus" className="block text-[10px] lg:text-xs text-textMuted mb-1 lg:mb-1.5">
            Status dolaska
          </label>
          <select
            id="arrivalStatus"
            value={filters.arrivalStatus || ''}
            onChange={(e) => handleFilterChange('arrivalStatus', e.target.value || undefined)}
            disabled={filters.bothCancelled}
            className="h-8 lg:h-9 w-full rounded-xl border border-borderSoft bg-white px-2 lg:px-3 text-xs lg:text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-50"
          >
            <option value="">Svi statusi</option>
            {Object.entries(FLIGHT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Departure Status */}
        <div>
          <label htmlFor="departureStatus" className="block text-[10px] lg:text-xs text-textMuted mb-1 lg:mb-1.5">
            Status odlaska
          </label>
          <select
            id="departureStatus"
            value={filters.departureStatus || ''}
            onChange={(e) => handleFilterChange('departureStatus', e.target.value || undefined)}
            disabled={filters.bothCancelled}
            className="h-8 lg:h-9 w-full rounded-xl border border-borderSoft bg-white px-2 lg:px-3 text-xs lg:text-sm text-textMain focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-50"
          >
            <option value="">Svi statusi</option>
            {Object.entries(FLIGHT_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="mt-3 lg:mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => {
            if (filters.bothCancelled) {
              onFiltersChange({
                ...filters,
                bothCancelled: undefined,
                arrivalStatus: undefined,
                departureStatus: undefined,
                page: 1,
              });
            } else {
              onFiltersChange({
                ...filters,
                bothCancelled: true,
                arrivalStatus: undefined,
                departureStatus: undefined,
                page: 1,
              });
            }
          }}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            filters.bothCancelled
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          Samo potpuno otkazani
        </button>
      </div>

      {/* Active filters indicator */}
      {hasActiveFilters && (
        <div className="mt-3 lg:mt-4 pt-3 lg:pt-4 border-t border-borderSoft">
          <div className="flex flex-wrap gap-1.5 lg:gap-2">
            {filters.search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-primarySoft px-2.5 lg:px-3 py-1 text-[10px] lg:text-xs text-brand-primary">
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
                {selectedAirlineName || filters.airlineId}
                <button
                  onClick={() => {
                    setSelectedAirlineName(null);
                    handleFilterChange('airlineId', undefined);
                  }}
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
            {filters.arrivalStatus && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800 border border-amber-300">
                Dolazak: {FLIGHT_STATUS_LABELS[filters.arrivalStatus] || filters.arrivalStatus}
                <button
                  onClick={() => handleFilterChange('arrivalStatus', undefined)}
                  className="hover:text-amber-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.departureStatus && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800 border border-amber-300">
                Odlazak: {FLIGHT_STATUS_LABELS[filters.departureStatus] || filters.departureStatus}
                <button
                  onClick={() => handleFilterChange('departureStatus', undefined)}
                  className="hover:text-amber-900"
                >
                  ×
                </button>
              </span>
            )}
            {filters.bothCancelled && (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-3 py-1 text-xs text-red-800 border border-red-300">
                Potpuno otkazani
                <button
                  onClick={() => handleFilterChange('bothCancelled', undefined)}
                  className="hover:text-red-900"
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
