'use client';

import { useState, useEffect } from 'react';
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
import { Calendar, Plane, Users, TrendingUp, Clock, AlertCircle } from 'lucide-react';
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
  }>;
  routeBreakdown: Array<{
    route: string;
    flights: number;
  }>;
};

const COLORS = ['#3392C5', '#16A34A', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#10B981', '#F97316'];

export default function MonthlyTrendPage() {
  const [data, setData] = useState<TrendData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTrendData();
  }, []);

  const fetchTrendData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/comparison/trends?type=monthly');
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

  if (isLoading) {
    return (
      <MainLayout>
      <div className="p-8">
        <div className="flex justify-center py-12">
          <LoadingSpinner text="Učitavam mjesečni trend..." />
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
        <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-brand-primary" />
            <h1 className="text-2xl font-semibold text-dark-900">Mjesečni trend</h1>
          </div>
          <p className="text-sm text-dark-500">{data.period}</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Plane className="w-5 h-5 text-brand-primary" />
              <p className="text-xs text-dark-500">Ukupno letova</p>
            </div>
            <p className="text-3xl font-bold text-dark-900">{data.summary.flights}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-green-600" />
              <p className="text-xs text-dark-500">Ukupno putnika</p>
            </div>
            <p className="text-3xl font-bold text-dark-900">{data.summary.passengers.toLocaleString()}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <p className="text-xs text-dark-500">Load Factor</p>
            </div>
            <p className="text-3xl font-bold text-dark-900">{data.summary.loadFactor.toFixed(1)}%</p>
          </div>

          <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-xs text-dark-500">Kašnjenja</p>
            </div>
            <p className="text-3xl font-bold text-dark-900">{data.summary.delays}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <p className="text-xs text-dark-500">Prosječno kašnjenje</p>
            </div>
            <p className="text-3xl font-bold text-dark-900">{data.summary.avgDelayMinutes.toFixed(0)} min</p>
          </div>
        </div>

        {/* Daily Flights Chart */}
        <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Dnevni letovi</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data.dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
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
                stroke="#3392C5"
                strokeWidth={2}
                name="Letovi"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Daily Passengers Chart */}
        <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Dnevni putnici</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
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
              <Bar dataKey="passengers" fill="#16A34A" name="Putnici" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Load Factor Chart */}
        <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Load Factor po danu</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data.dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
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
                stroke="#8B5CF6"
                strokeWidth={2}
                name="Load Factor (%)"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Airlines Breakdown */}
          <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
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
          <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
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

        {/* Top Routes */}
        <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
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
              <Bar dataKey="flights" fill="#3392C5" name="Letovi" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </MainLayout>
  );
}


