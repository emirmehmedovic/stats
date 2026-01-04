'use client';

import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plane, Users, Building2, TrendingUp } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { formatDateDisplay, getTodayDateString } from '@/lib/dates';

interface DashboardStats {
  today: {
    flights: number;
    passengers: number;
    arrivals: number;
    departures: number;
    loadFactor: number;
  };
  activeAirlines: number;
  flightsPerDay: Array<{
    date: string;
    count: number;
  }>;
  passengersPerDay: Array<{
    date: string;
    passengers: number;
  }>;
  loadFactor7Days: Array<{
    date: string;
    value: number;
  }>;
  punctuality7Days: Array<{
    date: string;
    value: number;
  }>;
  topAirlines: Array<{
    airline: string;
    icaoCode: string;
    count: number;
  }>;
  operationTypes: Array<{
    type: string;
    count: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const flightsTrend = useMemo(() => {
    return stats?.flightsPerDay.map((item) => {
      return {
        label: formatDateDisplay(item.date),
        value: item.count,
      };
    }) ?? [];
  }, [stats?.flightsPerDay]);

  const passengersTrend = useMemo(() => {
    return stats?.passengersPerDay.map((item) => {
      return {
        label: formatDateDisplay(item.date),
        value: item.passengers,
      };
    }) ?? [];
  }, [stats?.passengersPerDay]);

  const loadFactor7d = useMemo(() => {
    return stats?.loadFactor7Days.map((item) => {
      return {
        label: formatDateDisplay(item.date),
        value: item.value,
      };
    }) ?? [];
  }, [stats?.loadFactor7Days]);

  const punctuality7d = useMemo(() => {
    return stats?.punctuality7Days.map((item) => {
      return {
        label: formatDateDisplay(item.date),
        value: item.value,
      };
    }) ?? [];
  }, [stats?.punctuality7Days]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/dashboard/stats');

      if (!response.ok) {
        throw new Error('Greška pri učitavanju statistike');
      }

      const result = await response.json();
      setStats(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
              <p className="text-dark-500">Učitavam statistiku...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !stats) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
            <p className="text-sm text-red-700">{error || 'Greška pri učitavanju'}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const todayLabel = formatDateDisplay(getTodayDateString());

  return (
    <MainLayout>
      <div className="p-8 space-y-8">
        {/* Pregled */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-8 text-white shadow-soft-xl relative overflow-hidden flex flex-col justify-between h-[340px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-dark-300 text-sm font-medium mb-1">Današnji promet</p>
                  <h3 className="text-4xl font-bold tracking-tight">{stats.today.passengers.toLocaleString('bs-BA')}</h3>
                  <p className="text-xs text-dark-300 mt-1">Putnici (dolazak + odlazak)</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                {[
                  { label: 'Letova danas', value: stats.today.flights, accent: 'text-primary-200' },
                  { label: 'Pros. popunjenost', value: `${stats.today.loadFactor}%`, accent: 'text-blue-200' },
                  { label: 'Aktivne aviokompanije', value: stats.activeAirlines, accent: 'text-amber-200' },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[11px] uppercase tracking-wide text-dark-200 font-semibold">{item.label}</p>
                    <p className={`text-xl font-bold ${item.accent}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-auto">
              <p className="text-xs text-dark-300 mb-2">{todayLabel}</p>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white text-dark-900 flex items-center justify-center font-bold shadow-soft">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-dark-200">Praćenje prometa u realnom vremenu</p>
                  <p className="text-xs text-dark-300">Automatski osvježeno</p>
                </div>
              </div>
            </div>
          </div>

          <div className="xl:col-span-2 space-y-6">
            <div className="flex flex-wrap gap-6">
              {[
                {
                  title: 'Letovi danas',
                  value: stats.today.flights,
                  icon: Plane,
                  trend: '+12%',
                  color: 'text-blue-600',
                  bgColor: 'bg-blue-50',
                  badge: 'Danas',
                  size: 'md:basis-1/3',
                },
                {
                  title: 'Putnika danas',
                  value: stats.today.passengers.toLocaleString('bs-BA'),
                  icon: Users,
                  trend: '+8%',
                color: 'text-blue-600',
                bgColor: 'bg-blue-50',
                  badge: 'Dolazak + odlazak',
                  size: 'md:basis-1/3',
                },
                {
                  title: 'Prosječna popunjenost',
                  value: `${stats.today.loadFactor}%`,
                  icon: TrendingUp,
                  trend: 'Stabilno',
                  color: 'text-indigo-600',
                  bgColor: 'bg-indigo-50',
                  badge: 'Današnji letovi',
                  size: 'md:basis-1/3',
                },
                {
                  title: 'Odlazni putnici',
                  value: stats.today.departures.toLocaleString('bs-BA'),
                  icon: Plane,
                  trend: 'Danas',
                  color: 'text-orange-600',
                  bgColor: 'bg-orange-50',
                  badge: 'Polasci',
                  size: 'md:basis-1/6',
                },
                {
                  title: 'Dolazni putnici',
                  value: stats.today.arrivals.toLocaleString('bs-BA'),
                  icon: Plane,
                  trend: 'Danas',
                  color: 'text-amber-600',
                  bgColor: 'bg-amber-50',
                  badge: 'Dolazak',
                  size: 'md:basis-1/6',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className={`bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer flex flex-col justify-between h-[160px] relative overflow-hidden border-[6px] border-white basis-full ${item.size} flex-grow`}
                  style={{ minWidth: '200px' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[2px] transition-all"></div>
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-primary-200 rounded-full blur-2xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-100 rounded-full blur-3xl -mb-12 -ml-12 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>

                  <div className="flex justify-between items-start relative z-10">
                    <div className={`p-3.5 rounded-2xl ${item.bgColor} group-hover:scale-110 transition-transform`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <span className="px-3 py-1 bg-dark-50 rounded-full text-[10px] font-bold text-dark-500 uppercase tracking-wide">
                      {item.badge}
                    </span>
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-3xl font-bold text-dark-900 mb-1">{item.value}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-dark-500">{item.title}</span>
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full ml-auto">{item.trend}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Analitika i pregled lidera */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-primary-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-dark-900">Analitika letova</h3>
                  <p className="text-sm text-dark-500">Trend letova u zadnjih 30 dana</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-4 py-2 rounded-xl text-sm font-medium bg-dark-50 text-dark-600">
                    Zadnjih 30 dana
                  </span>
                </div>
              </div>

              <div className="h-[260px] w-full">
                {flightsTrend.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={flightsTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorFlights" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 12 }}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                      formatter={(value: number) => [value, 'Letova']}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#2563eb"
                      strokeWidth={4}
                      dot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7, fill: '#1d4ed8', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-dark-400">Nema dostupnih podataka</div>
              )}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white/70 to-blue-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-lg font-bold text-dark-900">Promet putnika</h3>
                  <p className="text-sm text-dark-500">Ukupan broj putnika po danu (30 dana)</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-4 py-2 rounded-xl text-sm font-medium bg-dark-50 text-dark-600">
                    Zadnjih 30 dana
                  </span>
                </div>
              </div>

              <div className="h-[260px] w-full">
                {passengersTrend.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={passengersTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPassengers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 12 }}
                      tickFormatter={(value) => value.toLocaleString('bs-BA')}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                      formatter={(value: number) => [value.toLocaleString('bs-BA'), 'Putnika']}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#2563eb"
                      strokeWidth={4}
                      dot={{ r: 5, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7, fill: '#1d4ed8', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-dark-400">Nema dostupnih podataka</div>
              )}
              </div>
            </div>
          </div>

          <div className="xl:col-span-1 flex flex-col gap-6">
            <div className="bg-white rounded-3xl p-6 shadow-soft">
              <h3 className="text-lg font-bold text-dark-900 mb-4">Top aviokompanije</h3>
              <div className="space-y-3">
                {stats.topAirlines.map((airline) => (
                  <div
                    key={airline.icaoCode}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-dark-50 border border-dark-100"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 font-bold flex items-center justify-center">
                      {airline.icaoCode}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-dark-900">{airline.airline}</p>
                      <p className="text-xs text-dark-500 uppercase tracking-wide">{airline.icaoCode}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-dark-900">{airline.count}</p>
                      <p className="text-[11px] text-dark-500">letova</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-soft flex-1">
              <h3 className="text-lg font-bold text-dark-900 mb-4">Tipovi operacija</h3>
              <div className="grid grid-cols-2 gap-3">
                {stats.operationTypes.map((op) => (
                  <div key={op.type} className="p-3 rounded-2xl border border-dark-100 hover:border-primary-200 hover:bg-primary-50 transition-all">
                    <p className="text-sm font-semibold text-dark-900">{op.type}</p>
                    <p className="text-xs text-dark-500 mt-1">Ukupno {op.count}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Load factor & Punctuality (7 dana) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
            <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-indigo-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-dark-900">Load factor (7 dana)</h3>
                <p className="text-sm text-dark-500">Prosječna popunjenost po danu</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-semibold">7d</span>
            </div>
            <div className="h-[240px] w-full">
              {loadFactor7d.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={loadFactor7d} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      tickFormatter={(value) => `${value}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                      formatter={(value: number) => [`${value}%`, 'Load factor']}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#6366f1"
                      strokeWidth={4}
                      dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#6366f1', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-dark-400">Nema dostupnih podataka</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/70 to-blue-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
            <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-dark-900">Tačnost (7 dana)</h3>
                <p className="text-sm text-dark-500">On-time performance po danu</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-semibold">7d</span>
            </div>
            <div className="h-[240px] w-full">
              {punctuality7d.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={punctuality7d} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPunctuality" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9ca3af', fontSize: 12 }}
                      tickFormatter={(value) => `${value}%`}
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{ stroke: '#e2e8f0', strokeWidth: 2 }}
                      formatter={(value: number) => [`${value}%`, 'Tačnost']}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#2563eb"
                      strokeWidth={4}
                      dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6, fill: '#1d4ed8', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-dark-400">Nema dostupnih podataka</div>
              )}
            </div>
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
