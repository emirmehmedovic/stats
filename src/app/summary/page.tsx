'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { BarChart3, TrendingUp, TrendingDown, Users, Plane, Package, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface SummaryStats {
  totalPassengers: number;
  totalArrivalPassengers: number;
  totalDeparturePassengers: number;
  totalOperations: number;
  totalBaggage: number;
  totalCargo: number;
  scheduledOperations: number;
  charterOperations: number;
  scheduledPassengers: number;
  charterPassengers: number;
  loadFactor: number;
  arrivalOnTimeRate: number;
  departureOnTimeRate: number;
  arrivalDelayRate: number;
  departureDelayRate: number;
  airlineStats: Array<{
    airline: string;
    passengers: number;
    operations: number;
    logoUrl: string | null;
  }>;
  destinationStats: Array<{
    destination: string;
    arrivalPassengers: number;
    departurePassengers: number;
    totalBaggage: number;
  }>;
  comparison: {
    passengerGrowth: number;
    operationsGrowth: number;
    baggageGrowth: number;
  };
}

export default function SummaryPage() {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [stats, setStats] = useState<SummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchSummaryStats();
  }, [selectedMonth]);

  const fetchSummaryStats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/summary?month=${selectedMonth}`);
      if (!response.ok) throw new Error('Failed to fetch summary');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('bs-BA').format(num);
  };

  const formatGrowth = (growth: number) => {
    const isPositive = growth >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span className="font-semibold">{isPositive ? '+' : ''}{growth.toFixed(1)}%</span>
      </div>
    );
  };

  const formatMonthDisplay = (monthString: string) => {
    const [year, month] = monthString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    const monthNames = ['Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun', 'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'];
    return `${monthNames[date.getMonth()]} ${year}`;
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const [year, month] = selectedMonth.split('-').map(Number);
    let newMonth = month + (direction === 'next' ? 1 : -1);
    let newYear = year;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setSelectedMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
  };

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
              <p className="text-dark-500">Učitavam podatke...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900 text-white shadow-soft-xl p-6 md:p-7">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(59,130,246,0.12),transparent_25%),radial-gradient(circle_at_85%_0%,rgba(56,189,248,0.12),transparent_25%)]"></div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur text-xs uppercase tracking-[0.2em] text-slate-200">
                <BarChart3 className="w-3 h-3" />
                Statistika
              </div>
              <h1 className="text-3xl font-bold">Pregled statistike</h1>
              <p className="text-sm text-slate-200">Ukupni rezultati i analitika za izabrani period</p>
              {stats && (
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 text-xs text-slate-200 border border-white/10">
                    <Users className="w-4 h-4 text-primary-200" />
                    <span>Putnika: {formatNumber(stats.totalPassengers)}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 text-xs text-slate-200 border border-white/10">
                    <Plane className="w-4 h-4 text-primary-200" />
                    <span>Operacija: {formatNumber(stats.totalOperations)}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 text-xs text-slate-200 border border-white/10">
                    <Package className="w-4 h-4 text-primary-200" />
                    <span>Prtljaga: {formatNumber(stats.totalBaggage)} kg</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 bg-white/5 backdrop-blur rounded-2xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => navigateMonth('prev')}
                  className="p-3 hover:bg-white/10 transition-colors"
                  title="Prethodni mjesec"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <div className="flex items-center gap-2 px-3">
                  <Calendar className="w-5 h-5 text-primary-200" />
                  <div className="flex flex-col min-w-[140px]">
                    <span className="text-xs text-slate-300">Period</span>
                    <span className="text-sm font-bold text-white">{formatMonthDisplay(selectedMonth)}</span>
                  </div>
                </div>
                <button
                  onClick={() => navigateMonth('next')}
                  className="p-3 hover:bg-white/10 transition-colors"
                  title="Sljedeći mjesec"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {stats ? (
          <>
            {/* Main stats cards */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Passengers */}
              <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-primary-200 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-all"></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-primary-50 rounded-2xl group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-primary-600" />
                    </div>
                    {stats.comparison && formatGrowth(stats.comparison.passengerGrowth)}
                  </div>
                  <div className="text-3xl font-bold text-dark-900 mb-1">{formatNumber(stats.totalPassengers)}</div>
                  <div className="text-sm font-medium text-dark-500">Ukupno putnika</div>
                </div>
              </div>

              {/* Total Operations */}
              <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/60 via-white/70 to-slate-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-slate-200 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-all"></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
                      <Plane className="w-6 h-6 text-slate-600" />
                    </div>
                    {stats.comparison && formatGrowth(stats.comparison.operationsGrowth)}
                  </div>
                  <div className="text-3xl font-bold text-dark-900 mb-1">{formatNumber(stats.totalOperations)}</div>
                  <div className="text-sm font-medium text-dark-500">Ukupno operacija</div>
                </div>
              </div>

              {/* Total Baggage */}
              <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white/70 to-blue-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-blue-200 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-all"></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-50 rounded-2xl group-hover:scale-110 transition-transform">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    {stats.comparison && formatGrowth(stats.comparison.baggageGrowth)}
                  </div>
                  <div className="text-3xl font-bold text-dark-900 mb-1">{formatNumber(stats.totalBaggage)} kg</div>
                  <div className="text-sm font-medium text-dark-500">Ukupno prtljage</div>
                </div>
              </div>

              {/* Arrival/Departure Split */}
              <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50/60 via-white/70 to-gray-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-gray-200 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-all"></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gray-50 rounded-2xl group-hover:scale-110 transition-transform">
                      <BarChart3 className="w-6 h-6 text-gray-600" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-dark-500">Dolasci:</span>
                      <span className="text-xl font-bold text-dark-900">{formatNumber(stats.totalArrivalPassengers)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-dark-500">Odlasci:</span>
                      <span className="text-xl font-bold text-dark-900">{formatNumber(stats.totalDeparturePassengers)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Operation Type Stats */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Scheduled Operations */}
              <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-primary-200 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-all"></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-primary-50 rounded-2xl group-hover:scale-110 transition-transform">
                      <Plane className="w-6 h-6 text-primary-600" />
                    </div>
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold uppercase tracking-wide">
                      Redovne
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-dark-900 mb-1">{formatNumber(stats.scheduledOperations)}</div>
                  <div className="text-sm font-medium text-dark-500">Redovne operacije</div>
                </div>
              </div>

              {/* Charter Operations */}
              <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white/70 to-blue-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-blue-200 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-all"></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-blue-50 rounded-2xl group-hover:scale-110 transition-transform">
                      <Plane className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">
                      Vanredne
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-dark-900 mb-1">{formatNumber(stats.charterOperations)}</div>
                  <div className="text-sm font-medium text-dark-500">Vanredne operacije</div>
                </div>
              </div>

              {/* Scheduled Passengers */}
              <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/60 via-white/70 to-slate-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-slate-200 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-all"></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-slate-50 rounded-2xl group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-slate-600" />
                    </div>
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-bold uppercase tracking-wide">
                      Redovne
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-dark-900 mb-1">{formatNumber(stats.scheduledPassengers)}</div>
                  <div className="text-sm font-medium text-dark-500">Putnici (redovne)</div>
                </div>
              </div>

              {/* Charter Passengers */}
              <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50/60 via-white/70 to-gray-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-gray-200 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-all"></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 bg-gray-50 rounded-2xl group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-gray-600" />
                    </div>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase tracking-wide">
                      Vanredne
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-dark-900 mb-1">{formatNumber(stats.charterPassengers)}</div>
                  <div className="text-sm font-medium text-dark-500">Putnici (vanredne)</div>
                </div>
              </div>
            </section>

            {/* Airlines breakdown */}
            <section className="bg-white rounded-3xl shadow-soft overflow-hidden">
              <div className="px-8 py-6 border-b border-dark-100">
                <h2 className="text-lg font-bold text-dark-900">Putnici po aviokompanijama</h2>
                <p className="text-sm text-dark-500 mt-1">Detaljni pregled po aviokompanijama</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-50">
                    <tr>
                      <th className="px-8 py-4 text-left text-xs font-bold text-dark-700 uppercase tracking-wider">
                        Aviokompanija
                      </th>
                      <th className="px-8 py-4 text-right text-xs font-bold text-dark-700 uppercase tracking-wider">
                        Broj putnika
                      </th>
                      <th className="px-8 py-4 text-right text-xs font-bold text-dark-700 uppercase tracking-wider">
                        Broj operacija
                      </th>
                      <th className="px-8 py-4 text-right text-xs font-bold text-dark-700 uppercase tracking-wider">
                        Prosječno putnika
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100">
                    {stats.airlineStats.map((airline, idx) => (
                      <tr key={idx} className="hover:bg-dark-50 transition-colors">
                        <td className="px-8 py-5 text-sm font-semibold text-dark-900">
                          <div className="flex items-center gap-3">
                            {airline.logoUrl ? (
                              <img
                                src={airline.logoUrl}
                                alt={airline.airline}
                                className="w-12 h-12 object-contain rounded-xl"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center">
                                <Plane className="w-5 h-5 text-primary-600" />
                              </div>
                            )}
                            <span>{airline.airline}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-sm text-dark-900 text-right font-bold">
                          {formatNumber(airline.passengers)}
                        </td>
                        <td className="px-8 py-5 text-sm text-dark-700 text-right font-medium">
                          {formatNumber(airline.operations)}
                        </td>
                        <td className="px-8 py-5 text-sm text-dark-700 text-right font-medium">
                          {airline.operations > 0 ? formatNumber(Math.round(airline.passengers / airline.operations)) : '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Destinations breakdown */}
            <section className="bg-white rounded-3xl shadow-soft overflow-hidden">
              <div className="px-8 py-6 border-b border-dark-100">
                <h2 className="text-lg font-bold text-dark-900">Putnici po destinacijama</h2>
                <p className="text-sm text-dark-500 mt-1">Dolasci, odlasci i prtljaga po rutama</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-50">
                    <tr>
                      <th className="px-8 py-4 text-left text-xs font-bold text-dark-700 uppercase tracking-wider">
                        Destinacija
                      </th>
                      <th className="px-8 py-4 text-right text-xs font-bold text-dark-700 uppercase tracking-wider">
                        Dolasci
                      </th>
                      <th className="px-8 py-4 text-right text-xs font-bold text-dark-700 uppercase tracking-wider">
                        Odlasci
                      </th>
                      <th className="px-8 py-4 text-right text-xs font-bold text-dark-700 uppercase tracking-wider">
                        Ukupno putnika
                      </th>
                      <th className="px-8 py-4 text-right text-xs font-bold text-dark-700 uppercase tracking-wider">
                        Prtljaga (kg)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100">
                    {stats.destinationStats.map((dest, idx) => (
                      <tr key={idx} className="hover:bg-dark-50 transition-colors">
                        <td className="px-8 py-5 text-sm font-semibold text-dark-900">
                          {dest.destination}
                        </td>
                        <td className="px-8 py-5 text-sm text-dark-700 text-right font-medium">
                          {formatNumber(dest.arrivalPassengers)}
                        </td>
                        <td className="px-8 py-5 text-sm text-dark-700 text-right font-medium">
                          {formatNumber(dest.departurePassengers)}
                        </td>
                        <td className="px-8 py-5 text-sm text-dark-900 text-right font-bold">
                          {formatNumber(dest.arrivalPassengers + dest.departurePassengers)}
                        </td>
                        <td className="px-8 py-5 text-sm text-dark-700 text-right font-medium">
                          {formatNumber(dest.totalBaggage)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Performance Metrics */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Load Factor */}
              <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white/70 to-slate-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-slate-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-all"></div>

                <div className="relative z-10">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-dark-900">Load Factor</h2>
                    <p className="text-sm text-dark-500">Prosječna popunjenost</p>
                  </div>
                  <div className="flex items-center justify-center h-[200px]">
                    <div className="text-center">
                      <div className="text-6xl font-bold text-slate-700 mb-2">
                        {stats.loadFactor.toFixed(1)}%
                      </div>
                      <p className="text-sm text-dark-600">Popunjenost sjedišta</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Arrival Delays */}
              <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-gray-50/50 via-white/70 to-gray-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-gray-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-all"></div>

                <div className="relative z-10">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-dark-900">Dolasci - Tačnost</h2>
                    <p className="text-sm text-dark-500">On-time performance</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-dark-600">Na vrijeme:</span>
                      <span className="text-2xl font-bold text-green-600">{stats.arrivalOnTimeRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-dark-600">Kašnjenje:</span>
                      <span className="text-2xl font-bold text-red-600">{stats.arrivalDelayRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-dark-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ width: `${stats.arrivalOnTimeRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Departure Delays */}
              <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-50/50 via-white/70 to-zinc-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-zinc-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-all"></div>

                <div className="relative z-10">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-dark-900">Odlasci - Tačnost</h2>
                    <p className="text-sm text-dark-500">On-time performance</p>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-dark-600">Na vrijeme:</span>
                      <span className="text-2xl font-bold text-green-600">{stats.departureOnTimeRate.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-dark-600">Kašnjenje:</span>
                      <span className="text-2xl font-bold text-red-600">{stats.departureDelayRate.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-dark-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-green-500 h-full rounded-full transition-all"
                        style={{ width: `${stats.departureOnTimeRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Charts Section */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Airlines Chart */}
              <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-primary-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-all"></div>

                <div className="relative z-10">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-dark-900">Top aviokompanije</h2>
                    <p className="text-sm text-dark-500">Broj putnika po aviokompanijama</p>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.airlineStats.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="airline"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)'
                          }}
                          itemStyle={{ color: '#fff' }}
                          cursor={{ fill: '#f8fafc' }}
                        />
                        <Legend />
                        <Bar dataKey="passengers" fill="#3b82f6" name="Putnici" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Destinations Chart */}
              <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/70 to-blue-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-all"></div>

                <div className="relative z-10">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-dark-900">Top destinacije</h2>
                    <p className="text-sm text-dark-500">Dolasci vs odlasci</p>
                  </div>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.destinationStats.slice(0, 8)}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis
                          dataKey="destination"
                          tick={{ fontSize: 11, fill: '#64748b' }}
                          angle={-45}
                          textAnchor="end"
                          height={80}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 12, fill: '#64748b' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0f172a',
                            border: 'none',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)'
                          }}
                          itemStyle={{ color: '#fff' }}
                          cursor={{ fill: '#f8fafc' }}
                        />
                        <Legend />
                        <Bar dataKey="arrivalPassengers" fill="#10b981" name="Dolasci" radius={[8, 8, 0, 0]} />
                        <Bar dataKey="departurePassengers" fill="#f59e0b" name="Odlasci" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </section>

            {/* Pie Chart - Airline Market Share */}
            <section className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-indigo-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-all"></div>

              <div className="relative z-10">
                <div className="mb-6">
                  <h2 className="text-lg font-bold text-dark-900">Tržišni udio aviokompanija</h2>
                  <p className="text-sm text-dark-500">Udio po broju putnika</p>
                </div>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.airlineStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ payload, percent }) =>
                          payload && percent !== undefined
                            ? `${payload.airline}: ${(percent * 100).toFixed(1)}%`
                            : ''
                        }
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="passengers"
                      >
                        {stats.airlineStats.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)'
                        }}
                        itemStyle={{ color: '#fff' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </section>
          </>
        ) : (
          <div className="bg-white rounded-3xl shadow-soft p-12 text-center">
            <p className="text-dark-500">Nema podataka za izabrani period</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
