'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { getDateStringDaysAgo, getTodayDateString } from '@/lib/dates';
import * as XLSX from 'xlsx';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { X } from 'lucide-react';

type RouteStats = {
  route: string;
  frequency: number;
  totalPassengers: number;
  totalSeatsOffered: number;
  arrivalCount: number;
  departureCount: number;
  airlines: string[];
  airlinesCount: number;
  avgPassengersPerFlight: number;
  loadFactor: number;
  avgDelayArrival: number;
  avgDelayDeparture: number;
};

type DestinationStats = {
  destination: string;
  routeCount: number;
  totalFlights: number;
  totalPassengers: number;
};

type AnalyticsData = {
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalRoutes: number;
    totalFlights: number;
    totalPassengers: number;
    avgLoadFactor: number;
    avgPassengersPerRoute: number;
    topRoute: RouteStats | null;
    busiestRoute: RouteStats | null;
  };
  routes: RouteStats[];
  byDestination: DestinationStats[];
  pagination?: {
    page: number;
    limit: number;
  };
  filters?: {
    airlines: string[];
    routes: string[];
    direction: string;
  };
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

export default function RouteAnalyticsPage() {
  const [dateFrom, setDateFrom] = useState(getDateStringDaysAgo(30));
  const [dateTo, setDateTo] = useState(getTodayDateString());
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [airlineOptions, setAirlineOptions] = useState<Array<{ icaoCode: string; name: string }>>([]);
  const [routeOptions, setRouteOptions] = useState<string[]>([]);
  const [airlineSelectValue, setAirlineSelectValue] = useState('');
  const [routeSelectValue, setRouteSelectValue] = useState('');
  const [limit, setLimit] = useState('20');
  const [airlines, setAirlines] = useState<Array<{ icaoCode: string; name: string }>>([]);
  const [direction, setDirection] = useState<'all' | 'arrival' | 'departure'>('all');
  
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const summary = data?.summary || {
    totalRoutes: 0,
    totalFlights: 0,
    totalPassengers: 0,
    avgLoadFactor: 0,
    avgPassengersPerRoute: 0,
    topRoute: null,
    busiestRoute: null,
  };

  // Fetch airlines for filter
  useEffect(() => {
    fetch('/api/airlines?page=1&limit=100')
      .then((res) => res.json())
      .then((data) => {
        setAirlines(data.data || []);
        setAirlineOptions(data.data || []);
      })
      .catch((err) => console.error('Failed to fetch airlines:', err));
  }, []);

  useEffect(() => {
    fetch('/api/routes?page=1&limit=100')
      .then((res) => res.json())
      .then((data) => setRouteOptions(data.data || []))
      .catch((err) => console.error('Failed to fetch routes:', err));
  }, []);

  const fetchAirlineOptions = useCallback(async (search: string) => {
    const trimmed = search.trim();
    if (!trimmed) {
      setAirlineOptions(airlines);
      return;
    }
    try {
      const response = await fetch(`/api/airlines?search=${encodeURIComponent(trimmed)}&page=1&limit=100`);
      if (!response.ok) return;
      const result = await response.json();
      setAirlineOptions(result.data || []);
    } catch (err) {
      console.error('Failed to fetch airlines:', err);
    }
  }, [airlines]);

  const fetchRouteOptions = useCallback(async (search: string) => {
    const trimmed = search.trim();
    if (!trimmed) return;
    try {
      const response = await fetch(`/api/routes?search=${encodeURIComponent(trimmed)}&page=1&limit=100`);
      if (!response.ok) return;
      const result = await response.json();
      setRouteOptions(result.data || []);
    } catch (err) {
      console.error('Failed to fetch routes:', err);
    }
  }, []);

  const addAirline = (code: string) => {
    setSelectedAirlines((prev) => (prev.includes(code) ? prev : [...prev, code]));
  };

  const removeAirline = (code: string) => {
    setSelectedAirlines((prev) => prev.filter((item) => item !== code));
  };

  const addRoute = (route: string) => {
    setSelectedRoutes((prev) => (prev.includes(route) ? prev : [...prev, route]));
  };

  const removeRoute = (route: string) => {
    setSelectedRoutes((prev) => prev.filter((item) => item !== route));
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        dateFrom,
        dateTo,
        limit,
      });

      if (selectedAirlines.length > 0) {
        params.append('airlines', selectedAirlines.join(','));
      }
      if (selectedRoutes.length > 0) {
        params.append('routes', selectedRoutes.join(','));
      }
      if (direction !== 'all') {
        params.append('direction', direction);
      }

      const response = await fetch(`/api/analytics/routes?${params.toString()}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analytics');
      }

      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const exportToExcel = () => {
    if (!data) return;

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Izvještaj analize ruta'],
      ['Period', `${data.period.from} do ${data.period.to}`],
      [],
      ['Sažetak'],
      ['Ukupno ruta', data.summary.totalRoutes],
      ['Ukupno letova', data.summary.totalFlights],
      ['Ukupno putnika', data.summary.totalPassengers],
      ['Prosječan load factor', `${data.summary.avgLoadFactor}%`],
      ['Prosj. putnika po ruti', data.summary.avgPassengersPerRoute],
      [],
      ['Top ruta po frekvenciji', data.summary.topRoute?.route || 'N/A'],
      ['Letovi', data.summary.topRoute?.frequency || 0],
      [],
      ['Najprometnija ruta po putnicima', data.summary.busiestRoute?.route || 'N/A'],
      ['Ukupno putnika', data.summary.busiestRoute?.totalPassengers || 0],
    ];
    const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Sažetak');

    // Routes sheet
    const routesData = data.routes.map((route) => ({
      'Ruta': route.route,
      'Ukupno letova': route.frequency,
      'Dolazni': route.arrivalCount,
      'Odlazni': route.departureCount,
      'Ukupno putnika': route.totalPassengers,
      'Ponuđena sjedišta': route.totalSeatsOffered,
      'Load factor (%)': route.loadFactor,
      'Prosj. putnika/let': route.avgPassengersPerFlight,
      'Broj aviokompanija': route.airlinesCount,
      'Aviokompanije': route.airlines.join(', '),
      'Prosj. kašnjenje dolazak (min)': route.avgDelayArrival,
      'Prosj. kašnjenje odlazak (min)': route.avgDelayDeparture,
    }));
    const wsRoutes = XLSX.utils.json_to_sheet(routesData);
    XLSX.utils.book_append_sheet(wb, wsRoutes, 'Rute');

    // Destinations sheet
    if (data.byDestination && data.byDestination.length > 0) {
      const destData = data.byDestination.map((dest) => ({
        'Destinacija': dest.destination,
        'Broj ruta': dest.routeCount,
        'Ukupno letova': dest.totalFlights,
        'Ukupno putnika': dest.totalPassengers,
      }));
      const wsDest = XLSX.utils.json_to_sheet(destData);
      XLSX.utils.book_append_sheet(wb, wsDest, 'Po destinacijama');
    }

    XLSX.writeFile(wb, `analiza-ruta-${dateFrom}-do-${dateTo}.xlsx`);
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-8">
        {/* Filters - Dashboard stil */}
        <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden border-[6px] border-white">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-blue-100/50 opacity-70"></div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold text-dark-900 mb-6">Filteri</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateFrom" className="text-dark-600 font-medium">
                Datum od
              </Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="dateTo" className="text-dark-600 font-medium">
                Datum do
              </Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="limit" className="text-dark-600 font-medium">
                Top rute
              </Label>
              <Input
                id="limit"
                type="number"
                min="5"
                max="100"
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="direction" className="text-dark-600 font-medium">
                Smjer
              </Label>
              <select
                id="direction"
                value={direction}
                onChange={(e) => setDirection(e.target.value as 'all' | 'arrival' | 'departure')}
                className="mt-1 w-full rounded-md border border-dark-100 bg-white px-3 py-2 text-sm focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="all">Svi letovi</option>
                <option value="arrival">Dolazni</option>
                <option value="departure">Odlazni</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={fetchAnalytics}
                disabled={loading}
                className="w-full bg-gradient-to-br from-dark-900 to-dark-800 text-white hover:from-dark-800 hover:to-dark-700 shadow-soft-lg"
              >
                {loading ? 'Učitavam...' : 'Generiši izvještaj'}
              </Button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label className="text-dark-600 font-medium">Aviokompanije</Label>
              <SearchableSelect
                options={airlineOptions.map((airline) => ({
                  value: airline.icaoCode,
                  label: airline.icaoCode,
                  subtitle: airline.name,
                }))}
                value={airlineSelectValue}
                onChange={(value) => {
                  if (value) {
                    addAirline(value);
                  }
                  setAirlineSelectValue('');
                }}
                onSearchChange={(search) => fetchAirlineOptions(search)}
                placeholder="Izaberite aviokompaniju"
                searchPlaceholder="Pretraga aviokompanija..."
                className="mt-2"
              />
              {selectedAirlines.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedAirlines.map((code) => (
                    <span key={code} className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                      {code}
                      <button type="button" onClick={() => removeAirline(code)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedAirlines([])}
                    className="px-3 py-1.5 rounded-xl text-xs bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Očisti sve
                  </button>
                </div>
              )}
            </div>
            <div>
              <Label className="text-dark-600 font-medium">Rute</Label>
              <SearchableSelect
                options={routeOptions.map((route) => ({
                  value: route,
                  label: route,
                }))}
                value={routeSelectValue}
                onChange={(value) => {
                  if (value) {
                    addRoute(value);
                  }
                  setRouteSelectValue('');
                }}
                onSearchChange={(search) => fetchRouteOptions(search)}
                placeholder="Izaberite rutu"
                searchPlaceholder="Pretraga ruta..."
                className="mt-2"
              />
              {selectedRoutes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedRoutes.map((route) => (
                    <span key={route} className="inline-flex items-center gap-1 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                      {route}
                      <button type="button" onClick={() => removeRoute(route)}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedRoutes([])}
                    className="px-3 py-1.5 rounded-xl text-xs bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Očisti sve rute
                  </button>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
              {error}
            </div>
          )}
          </div>
        </div>

        {/* Results */}
        {data && (
          <>
            {/* Summary Cards - Dashboard stil */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-200 rounded-full blur-xl opacity-60"></div>
                <div className="relative z-10">
                  <div className="text-xs text-dark-600 font-semibold uppercase tracking-wide mb-2">Ukupno ruta</div>
                  <div className="text-4xl font-bold text-primary-600">{summary.totalRoutes}</div>
                  <div className="text-xs text-dark-500 mt-2">Jedinstvene rute</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-indigo-200 rounded-full blur-xl opacity-60"></div>
                <div className="relative z-10">
                  <div className="text-xs text-dark-600 font-semibold uppercase tracking-wide mb-2">Ukupno letova</div>
                  <div className="text-4xl font-bold text-indigo-600">{summary.totalFlights}</div>
                  <div className="text-xs text-dark-500 mt-2">U izabranom periodu</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/60 via-white/70 to-green-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-green-200 rounded-full blur-xl opacity-60"></div>
                <div className="relative z-10">
                  <div className="text-xs text-dark-600 font-semibold uppercase tracking-wide mb-2">Ukupno putnika</div>
                  <div className="text-4xl font-bold text-green-600">{Number(summary.totalPassengers).toLocaleString()}</div>
                  <div className="text-xs text-dark-500 mt-2">Na svim rutama</div>
                </div>
              </div>

              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 via-white/70 to-amber-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-amber-200 rounded-full blur-xl opacity-60"></div>
                <div className="relative z-10">
                  <div className="text-xs text-dark-600 font-semibold uppercase tracking-wide mb-2">Prosječan load factor</div>
                  <div className="text-4xl font-bold text-amber-600">{summary.avgLoadFactor}%</div>
                  <div className="text-xs text-dark-500 mt-2">Prosjek po rutama</div>
                </div>
              </div>
            </div>

            {/* Top Routes Chart - Dashboard stil */}
            <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden border-[6px] border-white">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-white/70 to-blue-100/40 opacity-60"></div>
              <div className="relative z-10">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-dark-900">Top rute po frekvenciji</h2>
                  <Button
                    onClick={exportToExcel}
                    className="bg-white border-2 border-dark-200 text-dark-900 hover:bg-dark-50 hover:border-dark-300 shadow-soft"
                  >
                    Export u Excel
                  </Button>
                </div>

              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={(data.routes || []).slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="route" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="frequency" fill="#3b82f6" name="Ukupno letova" />
                  <Bar dataKey="totalPassengers" fill="#10b981" name="Ukupno putnika" />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>

            {/* Destinations Pie Chart - Dashboard stil */}
            {data.byDestination && data.byDestination.length > 0 && (
              <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/40 via-white/70 to-indigo-100/40 opacity-60"></div>
                <div className="relative z-10">
                  <h2 className="text-xl font-bold text-dark-900 mb-6">Top 10 destinacija po putnicima</h2>

                <ResponsiveContainer width="100%" height={400}>
                  <PieChart>
                    <Pie
                      data={data.byDestination}
                      dataKey="totalPassengers"
                      nameKey="destination"
                      cx="50%"
                      cy="50%"
                      outerRadius={120}
                      label={({ payload }) =>
                        payload
                          ? `${payload.destination}: ${payload.totalPassengers.toLocaleString()}`
                          : ''
                      }
                      labelLine={true}
                    >
                      {data.byDestination.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Detailed Routes Table - Dashboard stil */}
            <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden border-[6px] border-white">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-white/70 to-blue-100/40 opacity-60"></div>
              <div className="relative z-10">
                <h2 className="text-xl font-bold text-dark-900 mb-6">Detaljna statistika ruta</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-dark-50 border-b-2 border-dark-100">
                    <tr>
                      <th className="text-left p-3 font-semibold text-dark-600">Ruta</th>
                      <th className="text-right p-3 font-semibold text-dark-600">Letovi</th>
                      <th className="text-right p-3 font-semibold text-dark-600">Putnici</th>
                      <th className="text-right p-3 font-semibold text-dark-600">Load factor</th>
                      <th className="text-right p-3 font-semibold text-dark-600">Prosj. putnika/let</th>
                      <th className="text-right p-3 font-semibold text-dark-600">Aviokompanije</th>
                      <th className="text-right p-3 font-semibold text-dark-600">Prosj. kašnjenje DOL</th>
                      <th className="text-right p-3 font-semibold text-dark-600">Prosj. kašnjenje ODL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.routes || []).map((route, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-dark-100 hover:bg-dark-50 transition-colors"
                      >
                        <td className="p-3 font-medium text-dark-900">{route.route}</td>
                        <td className="p-3 text-right text-dark-600">{route.frequency}</td>
                        <td className="p-3 text-right text-dark-600">{route.totalPassengers.toLocaleString()}</td>
                        <td className="p-3 text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            route.loadFactor >= 85 
                              ? 'bg-green-100 text-green-800'
                              : route.loadFactor >= 70
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {route.loadFactor}%
                          </span>
                        </td>
                        <td className="p-3 text-right text-dark-600">{route.avgPassengersPerFlight}</td>
                        <td className="p-3 text-right">
                          <span className="text-dark-600 text-xs" title={route.airlines.join(', ')}>
                            {route.airlinesCount} {route.airlinesCount === 1 ? 'kompanija' : 'kompanije'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className={route.avgDelayArrival > 15 ? 'text-red-600 font-medium' : 'text-dark-600'}>
                            {route.avgDelayArrival} min
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <span className={route.avgDelayDeparture > 15 ? 'text-red-600 font-medium' : 'text-dark-600'}>
                            {route.avgDelayDeparture} min
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {(data.routes || []).length === 0 && (
                <div className="text-center py-12 text-dark-500">
                  Nema podataka o rutama za izabrani period.
                </div>
              )}
              </div>
            </div>

            {/* Best/Worst Routes - Dashboard stil */}
            {summary.topRoute && summary.busiestRoute && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white/70 to-blue-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-200 rounded-full blur-xl opacity-60"></div>
                  <div className="relative z-10">
                    <h3 className="text-xs text-dark-600 font-semibold uppercase tracking-wide mb-3">Najfrekventnija ruta</h3>
                    {data.summary.topRoute ? (
                      <>
                        <div className="text-3xl font-bold text-primary-600 mb-2">
                          {data.summary.topRoute.route}
                        </div>
                        <div className="text-sm text-dark-600">
                          {data.summary.topRoute.frequency} letova
                        </div>
                        <div className="text-sm text-dark-600 mt-1">
                          {data.summary.topRoute.totalPassengers.toLocaleString()} putnika
                        </div>
                        <div className="text-sm text-dark-600 mt-1">
                          Load factor: {data.summary.topRoute.loadFactor}%
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-dark-400">Nema podataka o ruti</div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-50/60 via-white/70 to-green-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-green-200 rounded-full blur-xl opacity-60"></div>
                  <div className="relative z-10">
                    <h3 className="text-xs text-dark-600 font-semibold uppercase tracking-wide mb-3">Najprometnija ruta (po putnicima)</h3>
                    {data.summary.busiestRoute ? (
                      <>
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {data.summary.busiestRoute.route}
                        </div>
                        <div className="text-sm text-dark-600">
                          {data.summary.busiestRoute.totalPassengers.toLocaleString()} putnika
                        </div>
                        <div className="text-sm text-dark-600 mt-1">
                          {data.summary.busiestRoute.frequency} letova
                        </div>
                        <div className="text-sm text-dark-600 mt-1">
                          Load factor: {data.summary.busiestRoute.loadFactor}%
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-dark-400">Nema podataka o ruti</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
