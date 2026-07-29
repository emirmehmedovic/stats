'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlightErrorCard } from '@/components/flight-errors';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import {
  AlertTriangle,
  RefreshCw,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertOctagon,
} from 'lucide-react';
import { FlightErrorStatus, FlightErrorType, FlightErrorPriority } from '@prisma/client';

interface FlightErrorResponse {
  id: string;
  errorType: FlightErrorType;
  priority: FlightErrorPriority;
  status: FlightErrorStatus;
  description: string;
  createdAt: string;
  flight: {
    id: string;
    date: string;
    route: string;
    arrivalFlightNumber: string | null;
    departureFlightNumber: string | null;
    airline?: {
      id: string;
      name: string;
      icaoCode: string;
    };
  };
  assignedTo: {
    id: string;
    name: string | null;
    email: string;
  };
  reportedBy?: {
    id: string;
    name: string | null;
    email: string;
  };
  _count?: {
    attachments: number;
    history: number;
  };
}

interface ErrorsResponse {
  success: boolean;
  data: FlightErrorResponse[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface StatsResponse {
  success: boolean;
  data: {
    summary: {
      total: number;
      pending: number;
      disputed: number;
      resolved: number;
      closed: number;
    };
    byStatus: Record<string, number>;
    byType: Record<string, number>;
    byPriority: Record<string, number>;
    byUser: Array<{
      user: { id: string; name: string | null; email: string };
      count: number;
    }>;
    resolutionTime: {
      avgHours: number;
      minHours: number;
      maxHours: number;
      count: number;
    };
    trend: Array<{ date: string; count: number }>;
  };
}

interface Filters {
  page: number;
  limit: number;
  status?: FlightErrorStatus;
  errorType?: FlightErrorType;
  priority?: FlightErrorPriority;
  search?: string;
  assignedToId?: string;
}

export default function AdminFlightErrorsPage() {
  const router = useRouter();
  const [data, setData] = useState<ErrorsResponse | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 20,
  });

  const buildFilterParams = () => {
    const params = new URLSearchParams();
    params.append('page', filters.page.toString());
    params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.errorType) params.append('errorType', filters.errorType);
    if (filters.priority) params.append('priority', filters.priority);
    if (filters.search) params.append('search', filters.search);
    if (filters.assignedToId) params.append('assignedToId', filters.assignedToId);
    return params;
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = buildFilterParams();
      const [errorsRes, statsRes] = await Promise.all([
        fetch(`/api/flight-errors?${params.toString()}`),
        fetch('/api/flight-errors/stats'),
      ]);

      if (!errorsRes.ok || !statsRes.ok) {
        throw new Error('Greška pri učitavanju');
      }

      const [errorsData, statsData] = await Promise.all([
        errorsRes.json(),
        statsRes.json(),
      ]);

      setData(errorsData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const statusOptions: { value: FlightErrorStatus | ''; label: string }[] = [
    { value: '', label: 'Svi statusi' },
    { value: 'OPEN', label: 'Otvorene' },
    { value: 'IN_PROGRESS', label: 'U obradi' },
    { value: 'RESOLVED', label: 'Riješene' },
    { value: 'DISPUTED', label: 'Osporene' },
    { value: 'CLOSED', label: 'Zatvorene' },
  ];

  const priorityOptions: { value: FlightErrorPriority | ''; label: string }[] = [
    { value: '', label: 'Svi prioriteti' },
    { value: 'URGENT', label: 'Hitne' },
    { value: 'HIGH', label: 'Visok' },
    { value: 'MEDIUM', label: 'Srednji' },
    { value: 'LOW', label: 'Nizak' },
  ];

  return (
      <div className="p-4 lg:p-8 space-y-4 lg:space-y-6">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl lg:rounded-3xl bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white shadow-soft-xl p-4 md:p-6 lg:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(239,68,68,0.15),transparent_25%),radial-gradient(circle_at_85%_0%,rgba(249,115,22,0.12),transparent_25%)]"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-2.5 lg:px-3 py-1 rounded-full bg-white/10 backdrop-blur text-[10px] lg:text-xs uppercase tracking-[0.2em] text-slate-200">
                  <AlertTriangle className="w-3 h-3" />
                  Admin Panel
                </div>
                <h1 className="text-2xl lg:text-3xl font-bold">Greške na Letovima</h1>
                <p className="text-xs lg:text-sm text-slate-200">
                  Pregled svih prijavljenih grešaka i statistike
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchData}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Osvježi
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard
              label="Ukupno"
              value={stats.data.summary.total}
              icon={BarChart3}
              gradient="from-slate-50 to-slate-100"
              textColor="text-slate-700"
            />
            <StatCard
              label="Na čekanju"
              value={stats.data.summary.pending}
              icon={Clock}
              gradient="from-amber-50 to-amber-100"
              textColor="text-amber-700"
            />
            <StatCard
              label="Osporene"
              value={stats.data.summary.disputed}
              icon={AlertOctagon}
              gradient="from-purple-50 to-purple-100"
              textColor="text-purple-700"
            />
            <StatCard
              label="Riješene"
              value={stats.data.summary.resolved}
              icon={CheckCircle}
              gradient="from-green-50 to-green-100"
              textColor="text-green-700"
            />
            <StatCard
              label="Zatvorene"
              value={stats.data.summary.closed}
              icon={XCircle}
              gradient="from-slate-50 to-slate-100"
              textColor="text-slate-600"
            />
            <StatCard
              label="Pros. vrijeme"
              value={`${stats.data.resolutionTime.avgHours.toFixed(1)}h`}
              icon={Clock}
              gradient="from-blue-50 to-blue-100"
              textColor="text-blue-700"
            />
          </div>
        )}

        {/* Top Users with Most Errors */}
        {stats && stats.data.byUser.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Korisnici sa najviše grešaka</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.data.byUser.slice(0, 5).map((item, index) => (
                <button
                  key={item.user.id}
                  onClick={() => setFilters({ ...filters, assignedToId: item.user.id, page: 1 })}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                    filters.assignedToId === item.user.id
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="font-medium">{item.user.name || item.user.email}</span>
                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                    {item.count}
                  </span>
                </button>
              ))}
              {filters.assignedToId && (
                <button
                  onClick={() => setFilters({ ...filters, assignedToId: undefined, page: 1 })}
                  className="text-sm text-slate-500 hover:text-slate-700 underline"
                >
                  Obriši filter
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 shadow-soft">
            <p className="text-sm text-red-700">{error}</p>
            <Button variant="outline" size="sm" className="mt-2" onClick={fetchData}>
              Pokušaj ponovo
            </Button>
          </div>
        )}

        {/* Filters + List */}
        <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft border border-dark-100 overflow-hidden">
          <div className="p-4 lg:p-5 border-b border-dark-100 bg-slate-50/70">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <input
                type="text"
                placeholder="Pretraži po opisu, ruti..."
                value={filters.search || ''}
                onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />

              {/* Status filter */}
              <select
                value={filters.status || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    status: e.target.value as FlightErrorStatus | undefined,
                    page: 1,
                  })
                }
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              {/* Priority filter */}
              <select
                value={filters.priority || ''}
                onChange={(e) =>
                  setFilters({
                    ...filters,
                    priority: e.target.value as FlightErrorPriority | undefined,
                    page: 1,
                  })
                }
                className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {priorityOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="p-4 lg:p-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
              </div>
            ) : data?.data && data.data.length > 0 ? (
              <div className="space-y-3">
                {data.data.map((flightError) => (
                  <FlightErrorCard
                    key={flightError.id}
                    error={flightError}
                    onClick={() => router.push(`/admin/flight-errors/${flightError.id}`)}
                    showAssignee
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Nema grešaka koje odgovaraju filterima</p>
              </div>
            )}

            {data && data.data.length > 0 && (
              <div className="pt-4 mt-4 border-t border-slate-100">
                <Pagination
                  currentPage={data.pagination.page}
                  totalPages={data.pagination.totalPages}
                  totalItems={data.pagination.total}
                  itemsPerPage={filters.limit}
                  onPageChange={(page) => setFilters({ ...filters, page })}
                  onItemsPerPageChange={(limit) => setFilters({ ...filters, limit, page: 1 })}
                />
              </div>
            )}
          </div>
        </div>
      </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  gradient,
  textColor,
}: {
  label: string;
  value: number | string;
  icon: typeof BarChart3;
  gradient: string;
  textColor: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-xl lg:rounded-2xl border border-dark-100 bg-gradient-to-br ${gradient} shadow-soft p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] lg:text-xs text-dark-500 font-semibold uppercase tracking-wide mb-1">
            {label}
          </p>
          <p className={`text-xl lg:text-2xl font-bold ${textColor}`}>{value}</p>
        </div>
        <Icon className={`w-6 h-6 ${textColor} opacity-40`} />
      </div>
    </div>
  );
}
