'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlightsTable } from '@/components/flights/FlightsTable';
import { FlightsFilters } from '@/components/flights/FlightsFilters';
import { FlightsResponse, FlightFilters } from '@/types/flight';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { MainLayout } from '@/components/layout/MainLayout';
import { getMonthEndDateString, getMonthStartDateString, getTodayDateString } from '@/lib/dates';
import { Upload, Calendar, FileText, Plane, Sparkles, BarChart3 } from 'lucide-react';

export default function FlightsPage() {
  const router = useRouter();
  const today = getTodayDateString();
  const monthStart = getMonthStartDateString(today);
  const monthEnd = getMonthEndDateString(today);
  const [data, setData] = useState<FlightsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FlightFilters>({
    page: 1,
    limit: 20,
    dateFrom: monthStart,
    dateTo: monthEnd,
  });

  const fetchFlights = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.airlineId) params.append('airlineId', filters.airlineId);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      if (filters.route) params.append('route', filters.route);
      if (filters.operationType) params.append('operationType', filters.operationType);

      const response = await fetch(`/api/flights?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Greška pri učitavanju letova');
      }

      const result: FlightsResponse = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlights();
  }, [filters]);

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white shadow-soft-xl p-6 md:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,0.12),transparent_25%),radial-gradient(circle_at_85%_0%,rgba(56,189,248,0.12),transparent_25%)]"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs uppercase tracking-[0.2em] text-slate-200">
                <Sparkles className="w-3 h-3" />
                Kontrola letova
              </div>
              <h1 className="text-3xl font-bold">Lista letova</h1>
              <p className="text-sm text-slate-200">Pregled, import i brzi unos operacija</p>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 text-xs text-slate-200 border border-white/10">
                  <Plane className="w-4 h-4 text-primary-200" />
                  <span>Ukupno: {data?.pagination.total || 0}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 text-xs text-slate-200 border border-white/10">
                  <BarChart3 className="w-4 h-4 text-primary-200" />
                  <span>Stranica {data?.pagination.page || 1}/{data?.pagination.totalPages || 1}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 text-xs text-slate-200 border border-white/10">
                  <Upload className="w-4 h-4 text-primary-200" />
                  <span>Brzi import i unos</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-start lg:justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push('/flights/import-schedule')}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Calendar className="w-4 h-4" />
                Import rasporeda
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/flights/import')}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <FileText className="w-4 h-4" />
                Kompletan import
              </Button>
              <Button
                className="bg-primary-500 hover:bg-primary-600 text-white flex items-center gap-2 shadow-lg"
                onClick={() => router.push('/flights/new')}
              >
                + Dodaj let
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            {
              label: 'Ukupno letova',
              value: data?.pagination.total || 0,
              accent: 'from-primary-50 via-white to-primary-100',
              text: 'text-primary-700',
            },
            {
              label: 'Stranica',
              value: `${data?.pagination.page || 1} / ${data?.pagination.totalPages || 1}`,
              accent: 'from-slate-50 via-white to-slate-100',
              text: 'text-dark-700',
            },
            {
              label: 'Prikazano',
              value: data?.data.length || 0,
              accent: 'from-indigo-50 via-white to-indigo-100',
              text: 'text-indigo-700',
            },
            {
              label: 'Po stranici',
              value: filters.limit,
              accent: 'from-blue-50 via-white to-blue-100',
              text: 'text-primary-700',
            },
          ].map((card) => (
            <div
              key={card.label}
              className="relative overflow-hidden rounded-2xl border border-dark-100 bg-white shadow-soft p-5"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-80`}></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-xs text-dark-500 font-semibold uppercase tracking-wide mb-1">{card.label}</p>
                  <p className={`text-2xl font-bold ${card.text}`}>{card.value}</p>
                </div>
                <span className="w-10 h-10 rounded-2xl bg-white/80 border border-white/40 shadow-sm flex items-center justify-center text-sm font-semibold text-dark-500">
                  ···
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-soft">
            <p className="text-sm text-red-700">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => fetchFlights()}
            >
              Pokušaj ponovo
            </Button>
          </div>
        )}

        {/* Filters + Table */}
        <div className="bg-white rounded-3xl shadow-soft border border-dark-100 overflow-hidden">
          <div className="p-5 border-b border-dark-100 bg-slate-50/70">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-dark-500 font-semibold">Filteri i pregled</p>
                <p className="text-sm text-dark-600">Preciziraj rutu, kompaniju ili datum</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: 1 })}
              >
                Reset paginacije
              </Button>
            </div>
          </div>
          <div className="p-5 space-y-6">
            <FlightsFilters filters={filters} onFiltersChange={setFilters} />
            <div className="rounded-2xl border border-dark-100 overflow-hidden shadow-sm">
              <FlightsTable data={data?.data || []} isLoading={isLoading} />
            </div>
            {data && data.data.length > 0 && (
              <div className="pt-2">
                <Pagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  totalItems={data.pagination.total}
                  itemsPerPage={filters.limit || 20}
                  onPageChange={(page) => setFilters({ ...filters, page })}
                  onItemsPerPageChange={(limit) => setFilters({ ...filters, limit, page: 1 })}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
