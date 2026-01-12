'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { formatDateDisplay, getDateStringDaysAgo, getTodayDateString } from '@/lib/dates';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { X } from 'lucide-react';

interface PunctualityData {
  filters: {
    dateFrom: string;
    dateTo: string;
    airlines: string[];
    routes: string[];
    operationTypeId: string;
    direction: string;
  };
  summary: {
    totalFlights: number;
    arrivalFlights: number;
    departureFlights: number;
    onTimePercentage: number;
    arrivalOnTimePercentage: number;
    departureOnTimePercentage: number;
    avgArrivalDelay: number;
    avgDepartureDelay: number;
  };
  byAirline: Array<{
    airline: string;
    icaoCode: string;
    totalFlights: number;
    arrivalOnTimePercentage: number;
    departureOnTimePercentage: number;
    overallOnTimePercentage: number;
    avgArrivalDelay: number;
    avgDepartureDelay: number;
  }>;
  dailyTrend: Array<{
    date: string;
    displayDate: string;
    onTimePercentage: number;
    flights: number;
  }>;
  distribution: {
    onTime: number;
    shortDelay: number;
    mediumDelay: number;
    longDelay: number;
    veryLongDelay: number;
  };
  worstPerformers: Array<any>;
}

interface Airline {
  id: string;
  name: string;
  icaoCode: string;
}

interface OperationType {
  id: string;
  code: string;
  name: string;
}

export default function PunctualityPage() {
  const [dateFrom, setDateFrom] = useState(getDateStringDaysAgo(30));
  const [dateTo, setDateTo] = useState(getTodayDateString());
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [airlineOptions, setAirlineOptions] = useState<Airline[]>([]);
  const [routeOptions, setRouteOptions] = useState<string[]>([]);
  const [airlineSelectValue, setAirlineSelectValue] = useState('');
  const [routeSelectValue, setRouteSelectValue] = useState('');
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
  const [selectedOperationType, setSelectedOperationType] = useState('ALL');
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [direction, setDirection] = useState<'all' | 'arrival' | 'departure'>('all');
  const [analyticsData, setAnalyticsData] = useState<PunctualityData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAirlines = async () => {
    try {
      const response = await fetch('/api/airlines?page=1&limit=100');
      if (!response.ok) return;
      const result = await response.json();
      setAirlines(result.data || []);
      setAirlineOptions(result.data || []);
    } catch (err) {
      console.error('Error fetching airlines:', err);
    }
  };

  useEffect(() => {
    fetchAirlines();
  }, []);

  useEffect(() => {
    const fetchOperationTypes = async () => {
      try {
        const response = await fetch('/api/operation-types?activeOnly=true');
        if (response.ok) {
          const result = await response.json();
          setOperationTypes(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching operation types:', err);
      }
    };

    fetchOperationTypes();
  }, []);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch('/api/routes?page=1&limit=100');
        if (!response.ok) return;
        const result = await response.json();
        setRouteOptions(result.data || []);
      } catch (err) {
        console.error('Error fetching routes:', err);
      }
    };

    fetchRoutes();
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
      console.error('Error fetching airlines:', err);
    }
  }, [airlines]);

  const fetchRouteOptions = useCallback(async (search: string) => {
    const trimmed = search.trim();
    if (!trimmed) {
      return;
    }
    try {
      const response = await fetch(`/api/routes?search=${encodeURIComponent(trimmed)}&page=1&limit=100`);
      if (!response.ok) return;
      const result = await response.json();
      setRouteOptions(result.data || []);
    } catch (err) {
      console.error('Error fetching routes:', err);
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
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ dateFrom, dateTo });

      if (selectedAirlines.length > 0) {
        params.append('airlines', selectedAirlines.join(','));
      }
      if (selectedRoutes.length > 0) {
        params.append('routes', selectedRoutes.join(','));
      }
      if (selectedOperationType && selectedOperationType !== 'ALL') {
        params.append('operationTypeId', selectedOperationType);
      }
      if (direction !== 'all') {
        params.append('direction', direction);
      }

      const response = await fetch(`/api/analytics/punctuality?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri učitavanju analize');
      }

      const result = await response.json();
      setAnalyticsData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToExcel = () => {
    if (!analyticsData) return;

    const wb = XLSX.utils.book_new();

    // Summary
    const operationTypeLabel =
      selectedOperationType === 'ALL'
        ? 'SVE'
        : operationTypes.find((type) => type.id === selectedOperationType)?.name || selectedOperationType;

    const summaryData = [
      ['ANALIZA TAČNOSTI - Aerodrom Tuzla'],
      ['Period:', `${analyticsData.filters.dateFrom} - ${analyticsData.filters.dateTo}`],
      ['Aviokompanije:', analyticsData.filters.airlines.length ? analyticsData.filters.airlines.join(', ') : 'SVE'],
      ['Rute:', analyticsData.filters.routes.length ? analyticsData.filters.routes.join(', ') : 'SVE'],
      ['Tip saobraćaja:', operationTypeLabel],
      ['Smjer:', analyticsData.filters.direction === 'arrival' ? 'Dolazni' : analyticsData.filters.direction === 'departure' ? 'Odlazni' : 'Svi'],
      [],
      ['SAŽETAK'],
      ['Ukupno letova:', analyticsData.summary.totalFlights],
      ['On-time performance:', `${analyticsData.summary.onTimePercentage}%`],
      ['Dolazak on-time:', `${analyticsData.summary.arrivalOnTimePercentage}%`],
      ['Odlazak on-time:', `${analyticsData.summary.departureOnTimePercentage}%`],
      ['Prosječno kašnjenje dolazak (min):', analyticsData.summary.avgArrivalDelay],
      ['Prosječno kašnjenje odlazak (min):', analyticsData.summary.avgDepartureDelay],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Sažetak');

    // By airline
    const airlineData = analyticsData.byAirline.map(a => ({
      'Aviokompanija': a.airline,
      'ICAO': a.icaoCode,
      'Letovi': a.totalFlights,
      'On-time %': a.overallOnTimePercentage,
      'Dolazak on-time %': a.arrivalOnTimePercentage,
      'Odlazak on-time %': a.departureOnTimePercentage,
      'Prosječno kašnjenje dolazak (min)': a.avgArrivalDelay,
      'Prosječno kašnjenje odlazak (min)': a.avgDepartureDelay,
    }));

    const airlineSheet = XLSX.utils.json_to_sheet(airlineData);
    XLSX.utils.book_append_sheet(wb, airlineSheet, 'Po aviokompanijama');

    XLSX.writeFile(wb, `Punctuality_${formatDateDisplay(getTodayDateString())}.xlsx`);
  };

  const distributionChartData = analyticsData ? [
    { range: '< 15 min', label: 'Na vrijeme', count: analyticsData.distribution.onTime },
    { range: '15-29 min', label: 'Kratko', count: analyticsData.distribution.shortDelay },
    { range: '30-59 min', label: 'Srednje', count: analyticsData.distribution.mediumDelay },
    { range: '60-119 min', label: 'Dugo', count: analyticsData.distribution.longDelay },
    { range: '≥ 120 min', label: 'Vrlo dugo', count: analyticsData.distribution.veryLongDelay },
  ] : [];

  const filteredDailyTrend = analyticsData?.dailyTrend.filter((d) => d.flights > 0) ?? [];
  const selectedOperationTypeName =
    selectedOperationType === 'ALL'
      ? ''
      : operationTypes.find((type) => type.id === selectedOperationType)?.name || selectedOperationType;
  const showActiveFilters =
    selectedAirlines.length > 0 ||
    selectedRoutes.length > 0 ||
    selectedOperationType !== 'ALL' ||
    direction !== 'all';
  const directionLabel = direction === 'arrival' ? 'Dolazni' : direction === 'departure' ? 'Odlazni' : 'Svi';

  const handleResetFilters = () => {
    setSelectedAirlines([]);
    setSelectedRoutes([]);
    setAirlineSelectValue('');
    setRouteSelectValue('');
    setSelectedOperationType('ALL');
    setDirection('all');
  };

  return (
    <MainLayout>
      <div className="p-8 space-y-8">
        {/* Filters - Dashboard stil */}
        <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-visible border-[6px] border-white">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-blue-100/50 opacity-70"></div>
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-dark-900 mb-6">Filteri</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dateFrom">Datum od</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="dateTo">Datum do</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="operationType">Tip saobraćaja</Label>
              <select
                id="operationType"
                value={selectedOperationType}
                onChange={(e) => setSelectedOperationType(e.target.value)}
                className="w-full mt-1 flex h-10 rounded-xl border border-dark-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="ALL">Svi tipovi saobraćaja</option>
                {operationTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name} ({type.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="direction">Smjer</Label>
              <select
                id="direction"
                value={direction}
                onChange={(e) => setDirection(e.target.value as 'all' | 'arrival' | 'departure')}
                className="w-full mt-1 flex h-10 rounded-xl border border-dark-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="all">Svi letovi</option>
                <option value="arrival">Dolazni</option>
                <option value="departure">Odlazni</option>
              </select>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <Label>Aviokompanije</Label>
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
              <Label>Rute</Label>
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
          <div className="flex gap-3 mt-6">
            <Button
              onClick={fetchAnalytics}
              disabled={isLoading}
              className="bg-gradient-to-br from-dark-900 to-dark-800 text-white hover:from-dark-800 hover:to-dark-700 shadow-soft-lg"
            >
              {isLoading ? 'Učitavam...' : 'Prikaži analizu'}
            </Button>
            <Button
              onClick={handleResetFilters}
              type="button"
              variant="outline"
              className="bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-soft"
            >
              Resetuj filtere
            </Button>
            {analyticsData && (
              <Button onClick={handleExportToExcel} className="bg-white border-2 border-dark-200 text-dark-900 hover:bg-dark-50 hover:border-dark-300 shadow-soft">
                Exportuj u Excel
              </Button>
            )}
          </div>
          {showActiveFilters && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
              {selectedAirlines.length > 0 && (
                <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                  Kompanije: {selectedAirlines.join(', ')}
                </span>
              )}
              {selectedRoutes.length > 0 && (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                  Rute: {selectedRoutes.join(', ')}
                </span>
              )}
              {selectedOperationType !== 'ALL' && (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                  Saobraćaj: {selectedOperationTypeName}
                </span>
              )}
              {direction !== 'all' && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                  Smjer: {directionLabel}
                </span>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Results */}
        {analyticsData && (
          <>
            {/* Summary Cards - Dashboard stil */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-200 rounded-full blur-xl opacity-60"></div>
                <div className="relative z-10">
                  <p className="text-xs text-dark-600 font-semibold uppercase tracking-wide mb-2">On-time performance</p>
                  <p className="text-4xl font-bold text-primary-600">{analyticsData.summary.onTimePercentage}%</p>
                  <p className="text-xs text-dark-500 mt-2">Ukupno</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/60 via-white/70 to-green-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-green-200 rounded-full blur-xl opacity-60"></div>
                <div className="relative z-10">
                  <p className="text-xs text-dark-600 font-semibold uppercase tracking-wide mb-2">Dolazak on-time</p>
                  <p className="text-4xl font-bold text-green-600">{analyticsData.summary.arrivalOnTimePercentage}%</p>
                  <p className="text-xs text-dark-500 mt-2">{analyticsData.summary.arrivalFlights} letova</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-white/70 to-emerald-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-emerald-200 rounded-full blur-xl opacity-60"></div>
                <div className="relative z-10">
                  <p className="text-xs text-dark-600 font-semibold uppercase tracking-wide mb-2">Odlazak on-time</p>
                  <p className="text-4xl font-bold text-emerald-600">{analyticsData.summary.departureOnTimePercentage}%</p>
                  <p className="text-xs text-dark-500 mt-2">{analyticsData.summary.departureFlights} letova</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 via-white/70 to-orange-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-orange-200 rounded-full blur-xl opacity-60"></div>
                <div className="relative z-10">
                  <p className="text-xs text-dark-600 font-semibold uppercase tracking-wide mb-2">Prosječno kašnjenje</p>
                  <p className="text-4xl font-bold text-orange-600">
                    {Math.round((analyticsData.summary.avgArrivalDelay + analyticsData.summary.avgDepartureDelay) / 2)} min
                  </p>
                  <p className="text-xs text-dark-500 mt-2">
                    ↓ {analyticsData.summary.avgArrivalDelay} / ↑ {analyticsData.summary.avgDepartureDelay}
                  </p>
                </div>
              </div>
            </div>

            {/* Daily Trend Chart - Dashboard stil */}
            <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden border-[6px] border-white">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-white/70 to-blue-100/40 opacity-60"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-dark-900 mb-6">Trend tačnosti po danima</h3>
                <ResponsiveContainer width="100%" height={300}>
                <LineChart data={filteredDailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11, fill: '#9A9A9A' }}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#9A9A9A' }}
                    domain={[0, 100]}
                    label={{ value: 'On-time %', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: '#9A9A9A' } }}
                  />
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
                    dataKey="onTimePercentage"
                    stroke="#3392C5"
                    strokeWidth={2}
                    dot={{ fill: '#3392C5', r: 4 }}
                    name="On-time %"
                  />
                </LineChart>
              </ResponsiveContainer>
              </div>
            </div>

            {/* Distribution Chart - Dashboard stil */}
            <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden border-[6px] border-white">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/40 via-white/70 to-orange-100/40 opacity-60"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-dark-900 mb-6">Distribucija kašnjenja</h3>
                <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distributionChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                  <XAxis
                    dataKey="range"
                    tick={{ fontSize: 11, fill: '#9A9A9A' }}
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
                  <Bar dataKey="count" fill="#3392C5" radius={[8, 8, 0, 0]} name="Broj letova/operacija" />
                </BarChart>
              </ResponsiveContainer>
              </div>
            </div>

            {/* By Airline Table - Dashboard stil */}
            <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden border-[6px] border-white">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/40 via-white/70 to-blue-100/40 opacity-60"></div>
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-dark-900 mb-6">Po aviokompanijama</h3>
                <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100 bg-dark-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Aviokompanija
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Letovi
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        On-time %
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Dolazak on-time
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Odlazak on-time
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Pros. kašnjenje
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.byAirline.map((airline) => (
                      <tr key={airline.icaoCode} className="border-b border-dark-100 hover:bg-dark-50">
                        <td className="px-4 py-3 text-sm">
                          <div>{airline.airline}</div>
                          <div className="text-xs text-dark-500 font-mono">{airline.icaoCode}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">{airline.totalFlights}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          <span
                            className={`font-semibold ${
                              airline.overallOnTimePercentage >= 80
                                ? 'text-success'
                                : airline.overallOnTimePercentage >= 60
                                ? 'text-primary-600'
                                : 'text-red-500'
                            }`}
                          >
                            {airline.overallOnTimePercentage}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-right">{airline.arrivalOnTimePercentage}%</td>
                        <td className="px-4 py-3 text-sm text-right">{airline.departureOnTimePercentage}%</td>
                        <td className="px-4 py-3 text-sm text-right">
                          {Math.round((airline.avgArrivalDelay + airline.avgDepartureDelay) / 2)} min
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>
            </div>

            {/* Worst Performers - Dashboard stil */}
            {analyticsData.worstPerformers.length > 0 && (
              <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-red-50/40 via-white/70 to-red-100/40 opacity-60"></div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-dark-900 mb-6">Top 20 najkasnijelih letova</h3>
                  <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-dark-100 bg-dark-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">Datum</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">Aviokompanija</th>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">Ruta</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">Dolazak kašnjenje</th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">Odlazak kašnjenje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.worstPerformers.map((flight, idx) => (
                        <tr key={idx} className="border-b border-dark-100 hover:bg-dark-50">
                          <td className="px-4 py-3 text-sm">{formatDateDisplay(flight.date)}</td>
                          <td className="px-4 py-3 text-sm">{flight.airline}</td>
                          <td className="px-4 py-3 text-sm font-medium">{flight.route}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            {flight.arrivalDelay !== null ? (
                              <span className={flight.arrivalDelay >= 15 ? 'text-red-500 font-semibold' : ''}>
                                {flight.arrivalDelay} min
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {flight.departureDelay !== null ? (
                              <span className={flight.departureDelay >= 15 ? 'text-red-500 font-semibold' : ''}>
                                {flight.departureDelay} min
                              </span>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
