'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Calendar, Plane, Users, TrendingUp, Clock, AlertCircle, Package, Percent, Layers } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading';
import { ErrorDisplay } from '@/components/ui/error';

import { MainLayout } from '@/components/layout/MainLayout';
type TrendData = {
  period: string;
  start: string;
  end: string;
  summary: {
    flights: number;
    passengers: number;
    arrivalPassengers: number;
    departurePassengers: number;
    operations: number;
    noShowPercent: number;
    avgBaggageCount: number;
    avgPassengersPerOperation: number;
    arrivalLoadFactor: number;
    departureLoadFactor: number;
    avgSeatsPerOperation: number;
    avgSeatsPerFlight: number;
    baggagePerPassenger: number;
    totalSeats: number;
    totalDelayMinutes: number;
    delayRatePercent: number;
    avgDelayMinutesAllFlights: number;
    noShowCount: number;
    totalFerryLegs: number;
    avgFlightsPerDay: number;
    avgPassengersPerDay: number;
    distinctRoutes: number;
    avgFlightsPerRoute: number;
    loadFactor: number;
    delays: number;
    avgDelayMinutes: number;
  };
  dailyData: Array<{
    date: string;
    label: string;
    flights: number;
    passengers: number;
    loadFactor: number;
    delays: number;
  }>;
  airlineBreakdown: Array<{
    name: string;
    icaoCode: string;
    flights: number;
    passengers: number;
  }>;
  operationTypeBreakdown: Array<{
    name: string;
    code: string;
    flights: number;
    avgLoadFactor: number;
    passengers: number;
    seats: number;
  }>;
  routeBreakdown: Array<{
    route: string;
    flights: number;
  }>;
  routePassengersBreakdown: Array<{
    route: string;
    passengers: number;
  }>;
  routeLoadFactorBreakdown: Array<{
    route: string;
    loadFactor: number;
  }>;
};

const COLORS = ['#64748b', '#94a3b8', '#a1a1aa', '#78716c', '#9ca3af', '#6b7280', '#a8a29e', '#52525b'];

const InfoTip = ({ text }: { text: string }) => (
  <span className="relative inline-flex items-center group">
    <span className="text-[10px] text-slate-400 cursor-help">ⓘ</span>
    <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 rounded-lg bg-dark-900 px-2.5 py-2 text-[11px] text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
      {text}
    </span>
  </span>
);

export default function YearlyTrendPage() {
  const [data, setData] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [trendGranularity, setTrendGranularity] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  useEffect(() => {
    fetchTrendData();
  }, []);

  const fetchTrendData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/comparison/trends?type=yearly');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Greška pri učitavanju podataka');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsLoading(false);
    }
  };

  const trendGranularityLabel = {
    daily: 'Dnevno',
    weekly: 'Sedmično',
    monthly: 'Mjesečno',
  }[trendGranularity];

  const getIsoWeek = (date: Date) => {
    // ISO week number based on nearest Thursday.
    const dateCopy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = dateCopy.getUTCDay() || 7;
    dateCopy.setUTCDate(dateCopy.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(dateCopy.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil((((dateCopy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNumber;
  };

  const aggregatedTrendData = useMemo(() => {
    if (!data) return [];
    if (trendGranularity === 'daily') {
      return data.dailyData;
    }

    const groupMap = new Map<string, {
      date: string;
      label: string;
      flights: number;
      passengers: number;
      delays: number;
      loadFactorSum: number;
      loadFactorCount: number;
    }>();

    data.dailyData.forEach((item) => {
      const parsedDate = new Date(item.date);
      if (Number.isNaN(parsedDate.getTime())) return;

      let key = '';
      let label = '';
      let groupDate = new Date(parsedDate);

      if (trendGranularity === 'weekly') {
        const day = (groupDate.getDay() + 6) % 7;
        groupDate.setDate(groupDate.getDate() - day);
        groupDate.setHours(0, 0, 0, 0);
        key = groupDate.toISOString().slice(0, 10);
        label = `W${getIsoWeek(groupDate)} ${groupDate.toLocaleDateString('bs-BA', {
          day: '2-digit',
          month: '2-digit',
        })}`;
      } else {
        groupDate = new Date(groupDate.getFullYear(), groupDate.getMonth(), 1);
        key = `${groupDate.getFullYear()}-${String(groupDate.getMonth() + 1).padStart(2, '0')}`;
        label = groupDate.toLocaleDateString('bs-BA', { month: 'short', year: 'numeric' });
      }

      const existing = groupMap.get(key);
      if (existing) {
        existing.flights += item.flights;
        existing.passengers += item.passengers;
        existing.delays += item.delays;
        existing.loadFactorSum += item.loadFactor;
        existing.loadFactorCount += 1;
      } else {
        groupMap.set(key, {
          date: key,
          label,
          flights: item.flights,
          passengers: item.passengers,
          delays: item.delays,
          loadFactorSum: item.loadFactor,
          loadFactorCount: 1,
        });
      }
    });

    return Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => ({
        date: value.date,
        label: value.label,
        flights: value.flights,
        passengers: value.passengers,
        delays: value.delays,
        loadFactor: value.loadFactorCount > 0 ? value.loadFactorSum / value.loadFactorCount : 0,
      }));
  }, [data, trendGranularity]);

  if (isLoading) {
    return (
      <MainLayout>
      <div className="p-8">
        <div className="flex justify-center py-12">
          <LoadingSpinner text="Učitavam godišnji trend..." />
        </div>
      </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
      <div className="p-8">
        <ErrorDisplay error={error} onRetry={fetchTrendData} />
      </div>
      </MainLayout>
    );
  }

  if (!data) return null;

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 to-dark-800 px-6 py-6 text-white shadow-soft-xl">
          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-white/10 blur-3xl -mr-12 -mt-12"></div>
          <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-slate-500/20 blur-3xl -ml-10 -mb-10"></div>
          <div className="relative z-10 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-white">Godišnji trend</h1>
              <p className="text-sm text-dark-200">{data.period}</p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 xl:col-span-4 bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-8 text-white shadow-soft-xl relative overflow-hidden flex flex-col justify-between min-h-[340px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-400/20 rounded-full blur-3xl -ml-12 -mb-12"></div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-dark-300 text-sm font-medium mb-1">Godišnji promet</p>
                  <h3 className="text-4xl font-bold tracking-tight">{data.summary.passengers.toLocaleString('bs-BA')}</h3>
                  <p className="text-xs text-dark-300 mt-1">Putnici (dolazak + odlazak)</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                {[
                  { label: 'Letova ukupno', value: data.summary.flights, accent: 'text-slate-200' },
                  { label: 'Pros. popunjenost', value: `${data.summary.loadFactor.toFixed(1)}%`, accent: 'text-stone-200' },
                  { label: 'Operacija', value: data.summary.operations, accent: 'text-zinc-200' },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[11px] uppercase tracking-wide text-dark-200 font-semibold">{item.label}</p>
                    <p className={`text-xl font-bold ${item.accent}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-auto">
              <p className="text-xs text-dark-300 mb-2">{data.period}</p>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white text-dark-900 flex items-center justify-center font-bold shadow-soft">
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-dark-200">Pregled prometa u periodu</p>
                  <p className="text-xs text-dark-300">Automatski izračun</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
          {[
            {
              title: 'Ukupno letova',
              value: data.summary.flights.toLocaleString(),
              icon: Plane,
              badge: 'Period',
              trend: 'Godišnji trend',
              color: 'text-slate-700',
              bgColor: 'bg-slate-100',
              surface: 'bg-gradient-to-br from-slate-50 via-white to-sky-50',
              span: 'md:col-span-1',
            },
            {
              title: 'Ukupno putnika',
              value: data.summary.passengers.toLocaleString(),
              icon: Users,
              badge: 'Dolazak + odlazak',
              trend: 'Godišnji trend',
              color: 'text-stone-700',
              bgColor: 'bg-stone-100',
              surface: 'bg-gradient-to-br from-stone-50 via-white to-neutral-50',
              span: 'md:col-span-1',
            },
            {
              title: 'Prosječna popunjenost',
              value: `${data.summary.loadFactor.toFixed(1)}%`,
              icon: TrendingUp,
              badge: 'Današnji letovi',
              trend: 'Stabilno',
              color: 'text-zinc-700',
              bgColor: 'bg-zinc-100',
              surface: 'bg-gradient-to-br from-zinc-50 via-white to-sky-50',
              span: 'md:col-span-2 xl:col-span-1',
            },
            {
              title: 'Odlazni putnici',
              value: data.summary.departurePassengers.toLocaleString(),
              icon: Plane,
              badge: 'Polasci',
              trend: 'Danas',
              color: 'text-neutral-700',
              bgColor: 'bg-neutral-100',
              surface: 'bg-gradient-to-br from-neutral-50 via-white to-stone-50',
              span: 'md:col-span-1',
            },
            {
              title: 'Dolazni putnici',
              value: data.summary.arrivalPassengers.toLocaleString(),
              icon: Plane,
              badge: 'Dolazak',
              trend: 'Danas',
              color: 'text-gray-700',
              bgColor: 'bg-gray-100',
              surface: 'bg-white',
              span: 'md:col-span-1',
            },
            {
              title: 'Load Factor ARR',
              value: `${data.summary.arrivalLoadFactor.toFixed(1)}%`,
              icon: TrendingUp,
              badge: 'ARR',
              trend: 'Prosjek',
              color: 'text-stone-700',
              bgColor: 'bg-stone-100',
              surface: 'bg-gradient-to-br from-stone-50 via-white to-zinc-50',
              tip: 'Prosječna popunjenost za dolazne letove (putnici / raspoloživa sjedišta).',
              span: 'md:col-span-1',
            },
            {
              title: 'Load Factor DEP',
              value: `${data.summary.departureLoadFactor.toFixed(1)}%`,
              icon: TrendingUp,
              badge: 'DEP',
              trend: 'Prosjek',
              color: 'text-zinc-700',
              bgColor: 'bg-zinc-100',
              surface: 'bg-gradient-to-br from-zinc-50 via-white to-neutral-50',
              tip: 'Prosječna popunjenost za odlazne letove (putnici / raspoloživa sjedišta).',
              span: 'md:col-span-1',
            },
            {
              title: 'No show (%)',
              value: `${data.summary.noShowPercent.toFixed(1)}%`,
              icon: Users,
              badge: 'Odlazak',
              trend: 'Udio',
              color: 'text-neutral-700',
              bgColor: 'bg-neutral-100',
              surface: 'bg-gradient-to-br from-neutral-50 via-white to-stone-50',
              tip: 'Procenat putnika koji se nisu pojavili na odlasku (no show / odlazni putnici).',
              span: 'md:col-span-1',
            },
            {
              title: 'Ptlj/operacija',
              value: data.summary.avgBaggageCount.toFixed(1),
              icon: Package,
              badge: 'Komada',
              trend: 'Prosjek',
              color: 'text-gray-700',
              bgColor: 'bg-gray-100',
              surface: 'bg-gradient-to-br from-gray-50 via-white to-zinc-50',
              tip: 'Prosječan broj komada prtljaga po operaciji (ARR + DEP).',
              span: 'md:col-span-1',
            },
            {
              title: 'Putnici/operacija',
              value: data.summary.avgPassengersPerOperation.toFixed(1),
              icon: Users,
              badge: 'Prosjek',
              trend: 'Operacije',
              color: 'text-stone-700',
              bgColor: 'bg-stone-100',
              surface: 'bg-gradient-to-br from-stone-50 via-white to-slate-50',
              tip: 'Prosječan broj putnika po operaciji (dolazak + odlazak).',
              span: 'md:col-span-1',
            },
            {
              title: 'Kašnjenja',
              value: data.summary.delays.toLocaleString(),
              icon: AlertCircle,
              badge: 'Letovi',
              trend: 'Udio',
              color: 'text-slate-700',
              bgColor: 'bg-slate-100',
              surface: 'bg-gradient-to-br from-slate-50 via-white to-blue-50',
              span: 'md:col-span-1',
            },
            {
              title: 'Prosj. kašnjenje',
              value: `${data.summary.avgDelayMinutes.toFixed(0)} min`,
              icon: Clock,
              badge: 'Delay',
              trend: 'Prosjek',
              color: 'text-zinc-700',
              bgColor: 'bg-zinc-100',
              surface: 'bg-gradient-to-br from-zinc-50 via-white to-stone-50',
              span: 'md:col-span-1',
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className={`${card.surface} rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white hover:shadow-soft-lg transition-shadow ${card.span}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${card.bgColor} ${card.color}`}>
                      {card.badge}
                    </div>
                    <p className="text-sm text-dark-600 mt-3 flex items-center gap-2">
                      {card.title}
                      {card.tip ? <InfoTip text={card.tip} /> : null}
                    </p>
                    <p className="text-3xl font-bold text-dark-900 mt-1">{card.value}</p>
                    <p className="text-xs text-dark-500 mt-2">{card.trend}</p>
                  </div>
                  <div className={`p-3 rounded-2xl ${card.bgColor}`}>
                    <Icon className={`w-5 h-5 ${card.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        </div>

        {/* Additional KPIs */}
        <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Dodatni KPI</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 auto-rows-fr">
            {[
              {
                title: 'Prosj. letova po danu',
                value: data.summary.avgFlightsPerDay.toFixed(1),
                icon: Calendar,
                badge: 'Dnevno',
                trend: 'Prosjek',
                color: 'text-slate-700',
                bgColor: 'bg-slate-100',
                surface: 'bg-gradient-to-br from-slate-50 via-white to-sky-50',
                tip: 'Prosječan broj letova po danu u odabranom periodu.',
                span: 'xl:col-span-1',
              },
              {
                title: 'Prosj. putnika po danu',
                value: data.summary.avgPassengersPerDay.toFixed(0),
                icon: Users,
                badge: 'Dnevno',
                trend: 'Prosjek',
                color: 'text-stone-700',
                bgColor: 'bg-stone-100',
                surface: 'bg-gradient-to-br from-stone-50 via-white to-neutral-50',
                tip: 'Prosječan broj putnika po danu u odabranom periodu.',
                span: 'xl:col-span-1',
              },
              {
                title: 'Ukupno sjedišta',
                value: data.summary.totalSeats.toLocaleString(),
                icon: Layers,
                badge: 'Kapacitet',
                trend: 'Ukupno',
                color: 'text-zinc-700',
                bgColor: 'bg-zinc-100',
                surface: 'bg-white',
                tip: 'Ukupan kapacitet sjedišta za sve operacije u periodu.',
                span: 'xl:col-span-1',
              },
              {
                title: 'Sjedišta/let',
                value: data.summary.avgSeatsPerFlight.toFixed(1),
                icon: Layers,
                badge: 'Prosjek',
                trend: 'Letovi',
                color: 'text-neutral-700',
                bgColor: 'bg-neutral-100',
                surface: 'bg-gradient-to-br from-neutral-50 via-white to-stone-50',
                tip: 'Prosječan broj raspoloživih sjedišta po letu.',
                span: 'xl:col-span-1',
              },
              {
                title: 'Sjedišta/operacija',
                value: data.summary.avgSeatsPerOperation.toFixed(1),
                icon: Layers,
                badge: 'Prosjek',
                trend: 'Operacije',
                color: 'text-gray-700',
                bgColor: 'bg-gray-100',
                surface: 'bg-gradient-to-br from-gray-50 via-white to-slate-50',
                tip: 'Prosječan broj raspoloživih sjedišta po operaciji.',
                span: 'xl:col-span-1',
              },
              {
                title: 'Udio kašnjenja',
                value: `${data.summary.delayRatePercent.toFixed(1)}%`,
                icon: Percent,
                badge: 'Letovi',
                trend: 'Udio',
                color: 'text-slate-700',
                bgColor: 'bg-slate-100',
                surface: 'bg-gradient-to-br from-slate-50 via-white to-neutral-50',
                tip: 'Procenat letova sa najmanje jednim kašnjenjem.',
                span: 'xl:col-span-1',
              },
              {
                title: 'Ukupno kašnjenje',
                value: `${data.summary.totalDelayMinutes.toLocaleString()} min`,
                icon: Clock,
                badge: 'Minute',
                trend: 'Ukupno',
                color: 'text-stone-700',
                bgColor: 'bg-stone-100',
                surface: 'bg-gradient-to-br from-stone-50 via-white to-blue-50',
                tip: 'Ukupan broj minuta kašnjenja za sve letove u periodu.',
                span: 'xl:col-span-1',
              },
              {
                title: 'Kašnjenje/let',
                value: `${data.summary.avgDelayMinutesAllFlights.toFixed(1)} min`,
                icon: Clock,
                badge: 'Prosjek',
                trend: 'Letovi',
                color: 'text-zinc-700',
                bgColor: 'bg-zinc-100',
                surface: 'bg-white',
                tip: 'Prosječno kašnjenje kada se raspodijeli na sve letove.',
                span: 'xl:col-span-1',
              },
              {
                title: 'No show (broj)',
                value: data.summary.noShowCount.toLocaleString(),
                icon: AlertCircle,
                badge: 'Odlazak',
                trend: 'Ukupno',
                color: 'text-neutral-700',
                bgColor: 'bg-neutral-100',
                surface: 'bg-gradient-to-br from-neutral-50 via-white to-stone-50',
                tip: 'Ukupan broj no show putnika na odlasku.',
                span: 'xl:col-span-1',
              },
              {
                title: 'Prtljag/putnik',
                value: data.summary.baggagePerPassenger.toFixed(2),
                icon: Package,
                badge: 'Komada',
                trend: 'Prosjek',
                color: 'text-gray-700',
                bgColor: 'bg-gray-100',
                surface: 'bg-gradient-to-br from-gray-50 via-white to-slate-50',
                tip: 'Prosječan broj komada prtljaga po putniku.',
                span: 'xl:col-span-1',
              },
              {
                title: 'Ferry operacije',
                value: data.summary.totalFerryLegs.toLocaleString(),
                icon: Plane,
                badge: 'Prazni',
                trend: 'Operacije',
                color: 'text-slate-700',
                bgColor: 'bg-slate-100',
                surface: 'bg-gradient-to-br from-slate-50 via-white to-stone-50',
                tip: 'Broj operacija bez putnika (ferry).',
                span: 'xl:col-span-1',
              },
              {
                title: 'Broj ruta',
                value: data.summary.distinctRoutes.toLocaleString(),
                icon: Plane,
                badge: 'Rute',
                trend: 'Ukupno',
                color: 'text-stone-700',
                bgColor: 'bg-stone-100',
                surface: 'bg-gradient-to-br from-stone-50 via-white to-neutral-50',
                tip: 'Broj različitih ruta u periodu.',
                span: 'xl:col-span-1',
              },
              {
                title: 'Letova po ruti',
                value: data.summary.avgFlightsPerRoute.toFixed(1),
                icon: Plane,
                badge: 'Prosjek',
                trend: 'Rute',
                color: 'text-zinc-700',
                bgColor: 'bg-zinc-100',
                surface: 'bg-gradient-to-br from-zinc-50 via-white to-slate-50',
                tip: 'Prosječan broj letova po ruti.',
                span: 'xl:col-span-1',
              },
            ].map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className={`${card.surface} rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white hover:shadow-soft-lg transition-shadow ${card.span}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${card.bgColor} ${card.color}`}>
                        {card.badge}
                      </div>
                      <p className="text-sm text-dark-600 mt-3 flex items-center gap-2">
                        {card.title}
                        {card.tip ? <InfoTip text={card.tip} /> : null}
                      </p>
                      <p className="text-3xl font-bold text-dark-900 mt-1">{card.value}</p>
                      <p className="text-xs text-dark-500 mt-2">{card.trend}</p>
                    </div>
                    <div className={`p-3 rounded-2xl ${card.bgColor}`}>
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Flights Chart */}
        <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h3 className="text-lg font-semibold text-dark-900">
              Letovi ({trendGranularityLabel.toLowerCase()})
            </h3>
            <div className="flex items-center rounded-full bg-slate-100 p-1 border border-slate-200">
              {[
                { value: 'daily', label: 'Dnevno' },
                { value: 'weekly', label: 'Sedmično' },
                { value: 'monthly', label: 'Mjesečno' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setTrendGranularity(option.value as 'daily' | 'weekly' | 'monthly')}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                    trendGranularity === option.value
                      ? 'bg-white text-dark-900 shadow-sm'
                      : 'text-dark-600 hover:text-dark-900'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={aggregatedTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 10, fill: '#9A9A9A' }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tick={{ fontSize: 11, fill: '#9A9A9A' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E2E4',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="flights"
                stroke="#64748b"
                strokeWidth={2}
                name="Letovi"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Passengers Chart */}
        <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">
            Putnici ({trendGranularityLabel.toLowerCase()})
          </h3>
          <ResponsiveContainer width="100%" height={500}>
            <BarChart data={aggregatedTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 10, fill: '#9A9A9A' }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tick={{ fontSize: 11, fill: '#9A9A9A' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E2E4',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
              />
              <Legend />
              <Bar dataKey="passengers" fill="#94a3b8" name="Putnici" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Load Factor Chart */}
        <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">
            Load Factor ({trendGranularityLabel.toLowerCase()})
          </h3>
          <ResponsiveContainer width="100%" height={500}>
            <LineChart data={aggregatedTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 10, fill: '#9A9A9A' }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis tick={{ fontSize: 11, fill: '#9A9A9A' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E2E4',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="loadFactor"
                stroke="#78716c"
                strokeWidth={2}
                name="Load Factor (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Airlines Breakdown */}
          <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">Po kompanijama</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.airlineBreakdown}
                  dataKey="flights"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ payload }) => payload ? `${payload.name} (${payload.flights})` : ""}
                >
                  {data.airlineBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Operation Types Breakdown */}
          <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">Po tipovima operacije</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.operationTypeBreakdown}
                  dataKey="flights"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={({ payload }) => payload ? `${payload.name} (${payload.flights})` : ""}
                >
                  {data.operationTypeBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Load Factor po tipu operacije</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.operationTypeBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#9A9A9A' }} width={140} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Load Factor']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E2E4',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend />
              <Bar dataKey="avgLoadFactor" fill="#78716c" name="Load Factor (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Routes */}
        <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Top 10 ruta</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.routeBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
              <YAxis dataKey="route" type="category" tick={{ fontSize: 11, fill: '#9A9A9A' }} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E2E4',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}
              />
              <Legend />
              <Bar dataKey="flights" fill="#64748b" name="Letovi" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Routes by Passengers */}
        <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Top 5 ruta po putnicima</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.routePassengersBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
              <YAxis dataKey="route" type="category" tick={{ fontSize: 11, fill: '#9A9A9A' }} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E2E4',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend />
              <Bar dataKey="passengers" fill="#94a3b8" name="Putnici" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Top 5 ruta po load factoru</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data.routeLoadFactorBreakdown} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
              <YAxis dataKey="route" type="category" tick={{ fontSize: 11, fill: '#9A9A9A' }} width={100} />
              <Tooltip
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Load Factor']}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E2E4',
                  borderRadius: '12px',
                  fontSize: '12px',
                }}
              />
              <Legend />
              <Bar dataKey="loadFactor" fill="#a1a1aa" name="Load Factor (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </MainLayout>
  );
}
