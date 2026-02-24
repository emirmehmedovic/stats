'use client';

import { useEffect, useMemo, useState } from 'react';
import { Shield, Activity, Clock, TrendingUp, Users, CalendarDays } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';

interface WorkerLeaderboardItem {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  position: string;
  workedDays: number;
  onTimeDays: number;
  totalLateMinutes: number;
  averageLateMinutes: number;
  totalOvertimeMinutes: number;
  punctualityRate: number;
}

interface AccessControlStats {
  period: string;
  totalEvents: number;
  uniqueUsers: number;
  recentEvents: Array<{
    id: string;
    eventTime: Date;
    userName: string;
    placeName: string;
    eventId: number | null;
  }>;
  recentEventsHasMore: boolean;
  topWorkersByPunctuality: WorkerLeaderboardItem[];
  topWorkersByLateMinutes: WorkerLeaderboardItem[];
  topWorkersByOvertime: WorkerLeaderboardItem[];
}

const EVENTS_PAGE_SIZE = 10;

export default function AccessControlPage() {
  const [stats, setStats] = useState<AccessControlStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMoreEvents, setIsLoadingMoreEvents] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'all'>('today');
  const [eventsOffset, setEventsOffset] = useState(0);

  useEffect(() => {
    setEventsOffset(0);
  }, [period]);

  useEffect(() => {
    fetchStats();
  }, [period, eventsOffset]);

  const periodLabel = useMemo(() => {
    if (period === 'today') return 'Danas';
    if (period === 'week') return 'Zadnjih 7 dana';
    if (period === 'month') return 'Zadnjih 30 dana';
    return 'Cijeli period';
  }, [period]);

  const fetchStats = async () => {
    const isLoadMore = eventsOffset > 0;
    if (isLoadMore) {
      setIsLoadingMoreEvents(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(
        `/api/access-control/stats?period=${period}&eventsLimit=${EVENTS_PAGE_SIZE}&eventsOffset=${eventsOffset}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data: AccessControlStats = await response.json();

      setStats((prev) => {
        if (isLoadMore && prev) {
          return {
            ...data,
            recentEvents: [...prev.recentEvents, ...data.recentEvents],
          };
        }
        return data;
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      if (isLoadMore) {
        setIsLoadingMoreEvents(false);
      } else {
        setIsLoading(false);
      }
    }
  };

  const handleLoadMoreEvents = () => {
    if (!stats?.recentEventsHasMore || isLoadingMoreEvents) {
      return;
    }

    setEventsOffset((prev) => prev + EVENTS_PAGE_SIZE);
  };

  const renderLeaderboard = (
    title: string,
    icon: React.ReactNode,
    rows: WorkerLeaderboardItem[] | undefined,
    mode: 'punctuality' | 'late' | 'overtime'
  ) => {
    const gradientConfig = {
      punctuality: 'from-emerald-50/50 via-white/70 to-green-100/50',
      late: 'from-orange-50/50 via-white/70 to-amber-100/50',
      overtime: 'from-violet-50/50 via-white/70 to-purple-100/50',
    };

    const blurConfig = {
      punctuality: 'bg-emerald-200',
      late: 'bg-orange-200',
      overtime: 'bg-violet-200',
    };

    return (
      <div className="bg-white rounded-3xl shadow-soft border-[6px] border-white overflow-hidden relative group">
        <div className={`absolute inset-0 bg-gradient-to-br ${gradientConfig[mode]} opacity-70 group-hover:opacity-90 transition-all pointer-events-none`}></div>
        <div className={`absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 ${blurConfig[mode]} rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-all pointer-events-none`}></div>
        <div className={`absolute bottom-0 left-0 w-32 h-32 ${blurConfig[mode]} rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 transition-all pointer-events-none`}></div>

        <div className="relative z-10 px-6 py-4 border-b border-dark-100 flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl shadow-soft ${
            mode === 'punctuality' ? 'bg-emerald-100' :
            mode === 'late' ? 'bg-orange-100' :
            'bg-violet-100'
          }`}>
            {icon}
          </div>
          <h2 className="text-base font-bold text-dark-900">{title}</h2>
        </div>
        <div className="relative z-10 overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-dark-50/80">
              <tr>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-dark-600 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-dark-600 uppercase tracking-wider">Radnik</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-dark-600 uppercase tracking-wider">Pozicija</th>
                <th className="px-6 py-3 text-left text-[10px] font-bold text-dark-600 uppercase tracking-wider">Rezultat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-100">
              {rows && rows.length > 0 ? (
                rows.map((worker, index) => (
                  <tr key={worker.employeeId} className="hover:bg-gradient-to-r hover:from-primary-50/20 hover:to-blue-50/10 transition-all">
                    <td className="px-6 py-4 text-sm font-bold text-dark-900">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-dark-900">{worker.employeeName}</div>
                      <div className="text-xs text-dark-500 font-medium">#{worker.employeeNumber} • {worker.workedDays} dana</div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-dark-700">{worker.position}</td>
                    <td className="px-6 py-4 text-sm font-bold">
                      {mode === 'punctuality' && (
                        <span className="text-emerald-700">{worker.punctualityRate}% ({worker.onTimeDays}/{worker.workedDays})</span>
                      )}
                      {mode === 'late' && (
                        <span className="text-orange-700">{worker.totalLateMinutes} min (avg {worker.averageLateMinutes})</span>
                      )}
                      {mode === 'overtime' && (
                        <span className="text-violet-700">{worker.totalOvertimeMinutes} min</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-sm font-semibold text-dark-500">Nema podataka za odabrani period.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (error) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="bg-white rounded-3xl shadow-soft p-8 border-[6px] border-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 via-white/70 to-orange-100/50 opacity-70"></div>
            <div className="relative z-10 flex items-start gap-4">
              <div className="p-3 bg-red-100 rounded-2xl shadow-soft">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-bold text-red-900 mb-1 text-lg">Greška</h3>
                <p className="text-red-700 font-medium">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-8">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-dark-900 flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-soft">
                <Shield className="h-7 w-7 text-white" />
              </div>
              Access Control
            </h1>
            <p className="text-dark-600 mt-2 ml-1">Top radnici po tačnosti, kašnjenju i prekovremenom</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPeriod('today')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                period === 'today' ? 'bg-primary-600 text-white shadow-soft' : 'bg-dark-50 text-dark-700 hover:bg-dark-100 border border-dark-200'
              }`}
            >
              Danas
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                period === 'week' ? 'bg-primary-600 text-white shadow-soft' : 'bg-dark-50 text-dark-700 hover:bg-dark-100 border border-dark-200'
              }`}
            >
              7 dana
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                period === 'month' ? 'bg-primary-600 text-white shadow-soft' : 'bg-dark-50 text-dark-700 hover:bg-dark-100 border border-dark-200'
              }`}
            >
              30 dana
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-4 py-2 rounded-xl font-semibold transition-all ${
                period === 'all' ? 'bg-primary-600 text-white shadow-soft' : 'bg-dark-50 text-dark-700 hover:bg-dark-100 border border-dark-200'
              }`}
            >
              Sve
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-dark-600 font-medium">Učitavam podatke...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer flex flex-col justify-between h-[140px] relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-200 rounded-full blur-2xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-100 rounded-full blur-3xl -mb-12 -ml-12 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-blue-100 rounded-xl">
                      <CalendarDays className="w-4 h-4 text-blue-600" />
                    </div>
                    <p className="text-[10px] uppercase tracking-wide text-blue-700 font-bold">Period</p>
                  </div>
                  <p className="text-3xl font-bold text-blue-800">{periodLabel}</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer flex flex-col justify-between h-[140px] relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/60 via-white/70 to-emerald-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-green-200 rounded-full blur-2xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-emerald-100 rounded-full blur-3xl -mb-12 -ml-12 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-green-100 rounded-xl">
                      <Activity className="w-4 h-4 text-green-600" />
                    </div>
                    <p className="text-[10px] uppercase tracking-wide text-green-700 font-bold">Ukupno eventa</p>
                  </div>
                  <p className="text-3xl font-bold text-green-800">{stats?.totalEvents || 0}</p>
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer flex flex-col justify-between h-[140px] relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50/60 via-white/70 to-purple-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-violet-200 rounded-full blur-2xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-100 rounded-full blur-3xl -mb-12 -ml-12 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-violet-100 rounded-xl">
                      <Users className="w-4 h-4 text-violet-600" />
                    </div>
                    <p className="text-[10px] uppercase tracking-wide text-violet-700 font-bold">Aktivni korisnici</p>
                  </div>
                  <p className="text-3xl font-bold text-violet-800">{stats?.uniqueUsers || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-soft border-[6px] border-white relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white/70 to-indigo-100/30 opacity-70 pointer-events-none"></div>
              <div className="absolute top-0 right-0 -mt-4 -mr-8 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none"></div>
              <div className="relative z-10 flex items-start gap-3">
                <div className="p-2.5 bg-blue-100 rounded-2xl shadow-soft flex-shrink-0">
                  <Shield className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-dark-900 mb-1">Napomena</h3>
                  <p className="text-sm text-dark-700 font-medium">
                    Tačnost = procenat završenih radnih dana bez kašnjenja. Kašnjenje i prekovremeni se računaju iz obrađenih `work_days` zapisa.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5">
              {renderLeaderboard('Top Radnici Po Tačnosti', <Clock className="h-5 w-5 text-emerald-600" />, stats?.topWorkersByPunctuality, 'punctuality')}
              {renderLeaderboard('Top Radnici Po Kašnjenju', <Activity className="h-5 w-5 text-orange-600" />, stats?.topWorkersByLateMinutes, 'late')}
              {renderLeaderboard('Top Radnici Po Prekovremenom', <TrendingUp className="h-5 w-5 text-violet-600" />, stats?.topWorkersByOvertime, 'overtime')}
            </div>

            <div className="bg-white rounded-3xl shadow-soft border-[6px] border-white overflow-hidden relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-white/70 to-blue-100/50 opacity-70 group-hover:opacity-90 transition-all pointer-events-none rounded-3xl"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-cyan-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-all pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 transition-all pointer-events-none"></div>

              <div className="relative z-10 px-6 py-4 border-b border-dark-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-cyan-100 rounded-2xl shadow-soft">
                    <Activity className="h-5 w-5 text-cyan-600" />
                  </div>
                  <h2 className="text-lg font-bold text-dark-900">Nedavni Eventi</h2>
                </div>
                <span className="text-sm font-semibold text-dark-500 bg-dark-50 px-3 py-1.5 rounded-full">Učitano: {stats?.recentEvents.length || 0}</span>
              </div>
              <div className="relative z-10 overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-dark-50/80">
                    <tr>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-dark-600 uppercase tracking-wider">Vrijeme</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-dark-600 uppercase tracking-wider">Korisnik</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-dark-600 uppercase tracking-wider">Lokacija</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-dark-600 uppercase tracking-wider">Event ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100">
                    {stats?.recentEvents && stats.recentEvents.length > 0 ? (
                      stats.recentEvents.map((event) => (
                        <tr key={event.id} className="hover:bg-gradient-to-r hover:from-cyan-50/20 hover:to-blue-50/10 transition-all">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-dark-900">{new Date(event.eventTime).toLocaleString('bs-BA')}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-dark-900">{event.userName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-dark-700">{event.placeName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-500">{event.eventId || 'N/A'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center">
                          <p className="text-sm font-semibold text-dark-500">Nema eventa za prikaz</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {stats?.recentEventsHasMore && (
                <div className="relative z-10 px-6 py-4 border-t border-dark-100">
                  <button
                    onClick={handleLoadMoreEvents}
                    disabled={isLoadingMoreEvents}
                    className="w-full py-3 rounded-xl bg-dark-50 text-dark-700 hover:bg-dark-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold shadow-soft hover:shadow-soft-lg border border-dark-200"
                  >
                    {isLoadingMoreEvents ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-dark-600 border-t-transparent rounded-full animate-spin" />
                        Učitavanje...
                      </span>
                    ) : (
                      'Učitaj više eventa'
                    )}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
