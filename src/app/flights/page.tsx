'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlightsTable } from '@/components/flights/FlightsTable';
import { FlightsFilters } from '@/components/flights/FlightsFilters';
import { BulkDeleteModal } from '@/components/flights/BulkDeleteModal';
import { FlightsResponse, FlightFilters } from '@/types/flight';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { MainLayout } from '@/components/layout/MainLayout';
import { getMonthEndDateString, getMonthStartDateString, getTodayDateString } from '@/lib/dates';
import { Upload, Calendar, FileText, Plane, Sparkles, BarChart3, Trash2, FileDown, Download } from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import { MonthlyScheduleExport } from '@/components/reports/MonthlyScheduleExport';
import { ScheduleCSVExport } from '@/components/reports/ScheduleCSVExport';
import { ScheduleCSVWebExport } from '@/components/reports/ScheduleCSVWebExport';

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
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isMonthlyExportOpen, setIsMonthlyExportOpen] = useState(false);
  const [isCSVExportOpen, setIsCSVExportOpen] = useState(false);
  const [isCSVWebExportOpen, setIsCSVWebExportOpen] = useState(false);

  const handleBulkDelete = async (dateFrom: string, dateTo: string) => {
    try {
      const response = await fetch('/api/flights/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dateFrom, dateTo }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Greška pri brisanju letova');
      }

      showToast(`Uspješno obrisano ${result.data.deletedCount} letova`, 'success');
      fetchFlights(); // Refresh the list
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Greška pri brisanju letova';
      showToast(message, 'error');
      throw error;
    }
  };

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
      <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white shadow-soft-xl p-4 md:p-6 lg:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,0.12),transparent_25%),radial-gradient(circle_at_85%_0%,rgba(56,189,248,0.12),transparent_25%)]"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-2.5 lg:px-3 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] lg:text-xs uppercase tracking-[0.2em] text-slate-200">
                <Sparkles className="w-3 h-3" />
                Kontrola letova
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold">Lista letova</h1>
              <p className="text-xs lg:text-sm text-slate-200">Pregled, import i brzi unos operacija</p>
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-xl lg:rounded-2xl bg-white/10 text-[10px] lg:text-xs text-slate-200 border border-white/10">
                  <Plane className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary-200" />
                  <span>Ukupno: {data?.pagination.total || 0}</span>
                </div>
                <div className="flex items-center gap-1.5 lg:gap-2 px-2.5 lg:px-3 py-1.5 lg:py-2 rounded-xl lg:rounded-2xl bg-white/10 text-[10px] lg:text-xs text-slate-200 border border-white/10">
                  <BarChart3 className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-primary-200" />
                  <span>Stranica {data?.pagination.page || 1}/{data?.pagination.totalPages || 1}</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 text-xs text-slate-200 border border-white/10">
                  <Upload className="w-4 h-4 text-primary-200" />
                  <span>Brzi import i unos</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-start lg:justify-end gap-2 lg:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMonthlyExportOpen(true)}
                className="flex items-center gap-1.5 lg:gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-200 border-green-400/30 text-xs lg:text-sm"
              >
                <FileDown className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Mjesečni PDF</span>
                <span className="sm:hidden">PDF</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCSVExportOpen(true)}
                className="flex items-center gap-1.5 lg:gap-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-200 border-blue-400/30 text-xs lg:text-sm"
              >
                <Download className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">CSV FIDS</span>
                <span className="sm:hidden">FIDS</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCSVWebExportOpen(true)}
                className="flex items-center gap-1.5 lg:gap-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-200 border-emerald-400/30 text-xs lg:text-sm"
              >
                <Download className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">CSV Web</span>
                <span className="sm:hidden">Web</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="flex items-center gap-1.5 lg:gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-200 border-red-400/30 text-xs lg:text-sm"
              >
                <Trash2 className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                <span className="hidden sm:inline">Masovno brisanje</span>
                <span className="sm:hidden">Brisanje</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/flights/import-schedule')}
                className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Calendar className="w-4 h-4" />
                Import rasporeda
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/flights/import-schedule-changes')}
                className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <Calendar className="w-4 h-4" />
                Schedule Changes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/flights/import')}
                className="hidden md:flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <FileText className="w-4 h-4" />
                Kompletan import
              </Button>
              <Button
                size="sm"
                className="bg-primary-500 hover:bg-primary-600 text-white flex items-center gap-1.5 lg:gap-2 shadow-lg text-xs lg:text-sm"
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
              className="relative overflow-hidden rounded-xl lg:rounded-2xl border border-dark-100 bg-white shadow-soft p-4 lg:p-5"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-80`}></div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] lg:text-xs text-dark-500 font-semibold uppercase tracking-wide mb-1">{card.label}</p>
                  <p className={`text-xl lg:text-2xl font-bold ${card.text}`}>{card.value}</p>
                </div>
                <span className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl lg:rounded-2xl bg-white/80 border border-white/40 shadow-sm flex items-center justify-center text-sm font-semibold text-dark-500">
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
        <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft border border-dark-100 overflow-hidden">
          <div className="p-4 lg:p-5 border-b border-dark-100 bg-slate-50/70">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <p className="text-[10px] lg:text-xs uppercase tracking-[0.15em] text-dark-500 font-semibold">Filteri i pregled</p>
                <p className="text-xs lg:text-sm text-dark-600">Preciziraj rutu, kompaniju ili datum</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: 1 })}
                className="text-xs"
              >
                Reset paginacije
              </Button>
            </div>
          </div>
          <div className="p-4 lg:p-5 space-y-4 lg:space-y-6">
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

        {/* Bulk Delete Modal */}
        <BulkDeleteModal
          isOpen={isBulkDeleteModalOpen}
          onClose={() => setIsBulkDeleteModalOpen(false)}
          onConfirm={handleBulkDelete}
        />

        {/* Monthly Schedule Export Modal */}
        <MonthlyScheduleExport
          isOpen={isMonthlyExportOpen}
          onClose={() => setIsMonthlyExportOpen(false)}
        />

        {/* CSV Export Modal for Flight Management */}
        <ScheduleCSVExport
          isOpen={isCSVExportOpen}
          onClose={() => setIsCSVExportOpen(false)}
        />

        {/* CSV Web Export Modal */}
        <ScheduleCSVWebExport
          isOpen={isCSVWebExportOpen}
          onClose={() => setIsCSVWebExportOpen(false)}
        />
      </div>
    </MainLayout>
  );
}
