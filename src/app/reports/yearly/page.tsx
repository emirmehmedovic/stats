'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';

interface YearlyReportData {
  mode: 'single';
  year: number;
  totals: {
    flights: number;
    arrivalFlights: number;
    arrivalPassengers: number;
    arrivalInfants: number;
    arrivalBaggage: number;
    arrivalCargo: number;
    arrivalMail: number;
    departureFlights: number;
    departurePassengers: number;
    departureInfants: number;
    departureBaggage: number;
    departureCargo: number;
    departureMail: number;
    totalPassengers: number;
    totalBaggage: number;
    totalCargo: number;
    totalMail: number;
  };
  monthlyBreakdown: Array<{
    month: string;
    monthNumber: number;
    flights: number;
    passengers: number;
    arrivalFlights: number;
    departureFlights: number;
    cargo: number;
  }>;
  loadFactor: {
    overall: number | null;
    totalPassengers: number;
    totalSeats: number;
    byMonth: Array<{
      monthNumber: number;
      month: string;
      passengers: number;
      seats: number;
      loadFactor: number | null;
    }>;
  };
  punctuality: {
    overallOnTimeRate: number | null;
    overallAvgDelayMinutes: number | null;
    totalDelaySamples: number;
    byMonth: Array<{
      monthNumber: number;
      month: string;
      onTimeRate: number | null;
      avgDelayMinutes: number | null;
      delaySamples: number;
    }>;
  };
  routes: {
    topByPassengers: Array<{
      route: string;
      flights: number;
      passengers: number;
      avgPassengers: number | null;
      loadFactor: number | null;
      avgDelayMinutes: number | null;
      onTimeRate: number | null;
    }>;
    topByLoadFactor: Array<{
      route: string;
      flights: number;
      passengers: number;
      avgPassengers: number | null;
      loadFactor: number | null;
      avgDelayMinutes: number | null;
      onTimeRate: number | null;
    }>;
    mostDelayed: Array<{
      route: string;
      flights: number;
      avgDelayMinutes: number | null;
      onTimeRate: number | null;
    }>;
    leastDelayed: Array<{
      route: string;
      flights: number;
      avgDelayMinutes: number | null;
      onTimeRate: number | null;
    }>;
    lowestAvgPassengers: Array<{
      route: string;
      flights: number;
      avgPassengers: number | null;
      loadFactor: number | null;
    }>;
  };
  routesAll: Array<{
    route: string;
    flights: number;
    passengers: number;
    avgPassengers: number | null;
    loadFactor: number | null;
    avgDelayMinutes: number | null;
    onTimeRate: number | null;
  }>;
  airlinesAll: Array<{
    airline: string;
    icaoCode: string;
    flights: number;
    passengers: number;
    avgPassengers: number | null;
    loadFactor: number | null;
    avgDelayMinutes: number | null;
    onTimeRate: number | null;
  }>;
  yoyComparison: {
    flights: {
      current: number;
      previous: number;
      growth: number;
    };
    passengers: {
      current: number;
      previous: number;
      growth: number;
    };
    cargo: {
      current: number;
      previous: number;
      growth: number;
    };
  };
  byAirline: Array<{
    airline: string;
    icaoCode: string;
    flights: number;
    passengers: number;
  }>;
  seasonalAnalysis: Array<{
    quarter: string;
    flights: number;
    passengers: number;
    avgFlightsPerMonth: number;
  }>;
  hasPreviousYearData: boolean;
}

interface MultiYearReportData {
  mode: 'multi';
  years: number[];
  yearsData: YearlyReportData[];
  comparisons: {
    commonRoutes: Array<{
      route: string;
      totalPassengers: number;
      perYear: Array<{
        year: number;
        flights: number;
        passengers: number;
        loadFactor: number | null;
        avgDelayMinutes: number | null;
        onTimeRate: number | null;
      }>;
    }>;
    commonAirlines: Array<{
      airline: string;
      icaoCode: string;
      totalPassengers: number;
      perYear: Array<{
        year: number;
        flights: number;
        passengers: number;
        loadFactor: number | null;
        avgDelayMinutes: number | null;
        onTimeRate: number | null;
      }>;
    }>;
  };
}

type YearlyReportPayload = YearlyReportData | MultiYearReportData;

export default function YearlyReportPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [comparisonYears, setComparisonYears] = useState<string[]>([]);
  const [comparisonYearSelect, setComparisonYearSelect] = useState('');
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [reportData, setReportData] = useState<YearlyReportData | null>(null);
  const [multiReportData, setMultiReportData] = useState<MultiYearReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isComparisonMode && comparisonYears.length < 2) {
        throw new Error('Odaberite najmanje dvije godine za komparaciju');
      }
      const query = isComparisonMode
        ? `/api/reports/yearly?years=${encodeURIComponent(comparisonYears.join(','))}`
        : `/api/reports/yearly?year=${selectedYear}`;
      const response = await fetch(query);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri učitavanju izvještaja');
      }

      const result = await response.json();
      const payload = result.data as YearlyReportPayload;
      if (payload.mode === 'multi') {
        setMultiReportData(payload);
        setReportData(null);
      } else {
        setReportData(payload);
        setMultiReportData(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportToExcel = () => {
    if (!reportData || reportData.mode !== 'single') return;

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['GODIŠNJI IZVJEŠTAJ - Aerodrom Tuzla'],
      ['Godina:', reportData.year],
      [],
      ['UKUPNO'],
      ['Ukupno letova:', reportData.totals.flights],
      ['Ukupno putnika:', reportData.totals.totalPassengers],
      ['Load faktor (%):', reportData.loadFactor.overall ?? '-'],
      ['Tačnost (%):', reportData.punctuality.overallOnTimeRate ?? '-'],
      ['Ukupno prtljaga (kg):', reportData.totals.totalBaggage],
      ['Ukupno cargo (kg):', reportData.totals.totalCargo],
      ['Ukupno pošte (kg):', reportData.totals.totalMail],
      [],
      ['DOLAZAK'],
      ['Letova:', reportData.totals.arrivalFlights],
      ['Putnika:', reportData.totals.arrivalPassengers],
      ['Bebe:', reportData.totals.arrivalInfants],
      ['Prtljag (kg):', reportData.totals.arrivalBaggage],
      ['Cargo (kg):', reportData.totals.arrivalCargo],
      ['Pošta (kg):', reportData.totals.arrivalMail],
      [],
      ['ODLAZAK'],
      ['Letova:', reportData.totals.departureFlights],
      ['Putnika:', reportData.totals.departurePassengers],
      ['Bebe:', reportData.totals.departureInfants],
      ['Prtljag (kg):', reportData.totals.departureBaggage],
      ['Cargo (kg):', reportData.totals.departureCargo],
      ['Pošta (kg):', reportData.totals.departureMail],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Sažetak');

    // Monthly breakdown sheet
    const monthlyData = reportData.monthlyBreakdown.map(m => ({
      'Mjesec': m.month,
      'Letovi': m.flights,
      'Putnici': m.passengers,
      'Dolazaka': m.arrivalFlights,
      'Odlazaka': m.departureFlights,
      'Cargo (kg)': m.cargo,
    }));

    const monthlySheet = XLSX.utils.json_to_sheet(monthlyData);
    XLSX.utils.book_append_sheet(wb, monthlySheet, 'Mjesečni pregled');

    // Seasonal analysis sheet
    const seasonalData = reportData.seasonalAnalysis.map(s => ({
      'Kvartal': s.quarter,
      'Letovi': s.flights,
      'Putnici': s.passengers,
      'Prosječno letova/mj': s.avgFlightsPerMonth,
    }));

    const seasonalSheet = XLSX.utils.json_to_sheet(seasonalData);
    XLSX.utils.book_append_sheet(wb, seasonalSheet, 'Sezonska analiza');

    // By airline sheet
    const airlineData = reportData.byAirline.map(a => ({
      'Aviokompanija': a.airline,
      'ICAO kod': a.icaoCode,
      'Broj letova': a.flights,
      'Broj putnika': a.passengers,
    }));

    const airlineSheet = XLSX.utils.json_to_sheet(airlineData);
    XLSX.utils.book_append_sheet(wb, airlineSheet, 'Po aviokompanijama');

    // YoY comparison sheet (if previous year data exists)
    if (reportData.hasPreviousYearData) {
      const yoyData = [
        ['YEAR-OVER-YEAR KOMPARACIJA'],
        ['Metrika', reportData.year - 1, reportData.year, 'Rast (%)'],
        ['Letovi', reportData.yoyComparison.flights.previous, reportData.yoyComparison.flights.current, reportData.yoyComparison.flights.growth.toFixed(2) + '%'],
        ['Putnici', reportData.yoyComparison.passengers.previous, reportData.yoyComparison.passengers.current, reportData.yoyComparison.passengers.growth.toFixed(2) + '%'],
        ['Cargo (kg)', reportData.yoyComparison.cargo.previous, reportData.yoyComparison.cargo.current, reportData.yoyComparison.cargo.growth.toFixed(2) + '%'],
      ];

      const yoySheet = XLSX.utils.aoa_to_sheet(yoyData);
      XLSX.utils.book_append_sheet(wb, yoySheet, 'YoY komparacija');
    }

    // Download
    XLSX.writeFile(wb, `Godisnji_izvjestaj_${reportData.year}.xlsx`);
  };

  const yearOptions = Array.from({ length: currentDate.getFullYear() - 2009 }, (_, index) =>
    String(2010 + index)
  ).reverse();

  const addComparisonYear = () => {
    if (!comparisonYearSelect) return;
    setComparisonYears((prev) =>
      prev.includes(comparisonYearSelect)
        ? prev
        : [...prev, comparisonYearSelect].sort((a, b) => Number(a) - Number(b))
    );
    setComparisonYearSelect('');
  };

  const removeComparisonYear = (year: string) => {
    setComparisonYears((prev) => prev.filter((item) => item !== year));
  };

  const resetFilters = () => {
    setSelectedYear(currentDate.getFullYear().toString());
    setComparisonYears([]);
    setComparisonYearSelect('');
    setIsComparisonMode(false);
  };

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
  const buildComparisonData = (
    metric: 'flights' | 'passengers' | 'loadFactor' | 'onTimeRate' | 'avgDelay'
  ) =>
    multiReportData
      ? monthLabels.map((label, index) => {
          const monthNumber = index + 1;
          const row: Record<string, string | number | null> = { month: label };
          multiReportData.yearsData.forEach((yearData) => {
            let value: number | null = null;
            if (metric === 'flights') {
              const monthRow = yearData.monthlyBreakdown.find(
                (item) => item.monthNumber === monthNumber
              );
              value = monthRow?.flights ?? 0;
            }
            if (metric === 'passengers') {
              const monthRow = yearData.monthlyBreakdown.find(
                (item) => item.monthNumber === monthNumber
              );
              value = monthRow?.passengers ?? 0;
            }
            if (metric === 'loadFactor') {
              const monthRow = yearData.loadFactor.byMonth.find(
                (item) => item.monthNumber === monthNumber
              );
              value = monthRow?.loadFactor ?? null;
            }
            if (metric === 'onTimeRate') {
              const monthRow = yearData.punctuality.byMonth.find(
                (item) => item.monthNumber === monthNumber
              );
              value = monthRow?.onTimeRate ?? null;
            }
            if (metric === 'avgDelay') {
              const monthRow = yearData.punctuality.byMonth.find(
                (item) => item.monthNumber === monthNumber
              );
              value = monthRow?.avgDelayMinutes ?? null;
            }
            row[String(yearData.year)] = value ?? 0;
          });
          return row;
        })
      : [];

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Year Picker */}
        <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="year">Izaberite godinu</Label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-borderSoft bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                disabled={isComparisonMode}
              >
                {yearOptions.map((year) => (
                  <option key={`year-${year}`} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="comparisonYears">Komparacija godina (dodaj)</Label>
              <div className="mt-1 flex items-center gap-2">
                <select
                  id="comparisonYears"
                  value={comparisonYearSelect}
                  onChange={(e) => setComparisonYearSelect(e.target.value)}
                  className="h-10 w-full rounded-xl border border-borderSoft bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                  disabled={!isComparisonMode}
                >
                  <option value="">Izaberite godinu</option>
                  {yearOptions.map((year) => (
                    <option key={`compare-${year}`} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addComparisonYear}
                  disabled={!isComparisonMode || !comparisonYearSelect}
                >
                  Dodaj
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <input
                  id="comparisonMode"
                  type="checkbox"
                  checked={isComparisonMode}
                  onChange={(e) => setIsComparisonMode(e.target.checked)}
                  className="h-4 w-4 rounded border-borderSoft"
                />
                <Label htmlFor="comparisonMode" className="text-sm">
                  Uporedi više godina
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={fetchReport}
                  disabled={isLoading}
                  className="bg-primary-600 hover:bg-primary-600/90 text-white"
                >
                  {isLoading ? 'Učitavam...' : 'Prikaži izvještaj'}
                </Button>
                {reportData && (
                  <Button
                    onClick={handleExportToExcel}
                    variant="outline"
                  >
                    Exportuj u Excel
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                >
                  Reset filtere
                </Button>
              </div>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {comparisonYears.length === 0 && (
              <span className="text-xs text-dark-500">Nema odabranih godina</span>
            )}
            {comparisonYears.map((year) => (
              <span
                key={`selected-${year}`}
                className="inline-flex items-center gap-2 rounded-full bg-dark-50 px-3 py-1 text-xs text-dark-700"
              >
                {year}
                <button
                  type="button"
                  onClick={() => removeComparisonYear(year)}
                  className="text-dark-400 hover:text-dark-700"
                  aria-label={`Ukloni ${year}`}
                  disabled={!isComparisonMode}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Report Data */}
        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Ukupno letova</p>
                <p className="text-3xl font-semibold text-primary-600">{reportData.totals.flights}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Ukupno putnika</p>
                <p className="text-3xl font-semibold text-primary-600">{reportData.totals.totalPassengers}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Dolazaka</p>
                <p className="text-3xl font-semibold text-success">{reportData.totals.arrivalFlights}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Odlazaka</p>
                <p className="text-3xl font-semibold text-success">{reportData.totals.departureFlights}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Load faktor</p>
                <p className="text-3xl font-semibold text-primary-600">
                  {reportData.loadFactor.overall !== null ? `${reportData.loadFactor.overall}%` : '-'}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Tačnost</p>
                <p className="text-3xl font-semibold text-primary-600">
                  {reportData.punctuality.overallOnTimeRate !== null ? `${reportData.punctuality.overallOnTimeRate}%` : '-'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Prosj. putnika po letu</p>
                <p className="text-2xl font-semibold text-primary-600">
                  {reportData.totals.flights > 0
                    ? (reportData.totals.totalPassengers / reportData.totals.flights).toFixed(1)
                    : '-'}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Ukupno prtljaga (kg)</p>
                <p className="text-2xl font-semibold text-primary-600">{reportData.totals.totalBaggage}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Ukupno cargo (kg)</p>
                <p className="text-2xl font-semibold text-primary-600">{reportData.totals.totalCargo}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Ukupno pošte (kg)</p>
                <p className="text-2xl font-semibold text-primary-600">{reportData.totals.totalMail}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Prosj. kašnjenje</p>
                <p className="text-2xl font-semibold text-primary-600">
                  {reportData.punctuality.overallAvgDelayMinutes !== null
                    ? `${reportData.punctuality.overallAvgDelayMinutes} min`
                    : '-'}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Uzorci kašnjenja</p>
                <p className="text-2xl font-semibold text-primary-600">
                  {reportData.punctuality.totalDelaySamples}
                </p>
              </div>
            </div>

            {/* YoY Comparison */}
            {reportData.hasPreviousYearData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                  <p className="text-xs text-dark-500 mb-1">Rast letova (YoY)</p>
                  <p className={`text-3xl font-semibold ${reportData.yoyComparison.flights.growth >= 0 ? 'text-success' : 'text-red-500'}`}>
                    {reportData.yoyComparison.flights.growth >= 0 ? '+' : ''}{reportData.yoyComparison.flights.growth.toFixed(1)}%
                  </p>
                  <p className="text-xs text-dark-500 mt-2">
                    {reportData.year - 1}: {reportData.yoyComparison.flights.previous} | {reportData.year}: {reportData.yoyComparison.flights.current}
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                  <p className="text-xs text-dark-500 mb-1">Rast putnika (YoY)</p>
                  <p className={`text-3xl font-semibold ${reportData.yoyComparison.passengers.growth >= 0 ? 'text-success' : 'text-red-500'}`}>
                    {reportData.yoyComparison.passengers.growth >= 0 ? '+' : ''}{reportData.yoyComparison.passengers.growth.toFixed(1)}%
                  </p>
                  <p className="text-xs text-dark-500 mt-2">
                    {reportData.year - 1}: {reportData.yoyComparison.passengers.previous} | {reportData.year}: {reportData.yoyComparison.passengers.current}
                  </p>
                </div>
                <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                  <p className="text-xs text-dark-500 mb-1">Rast carga (YoY)</p>
                  <p className={`text-3xl font-semibold ${reportData.yoyComparison.cargo.growth >= 0 ? 'text-success' : 'text-red-500'}`}>
                    {reportData.yoyComparison.cargo.growth >= 0 ? '+' : ''}{reportData.yoyComparison.cargo.growth.toFixed(1)}%
                  </p>
                  <p className="text-xs text-dark-500 mt-2">
                    {reportData.year - 1}: {reportData.yoyComparison.cargo.previous} kg | {reportData.year}: {reportData.yoyComparison.cargo.current} kg
                  </p>
                </div>
              </div>
            )}

            {/* Monthly Trend Chart */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Mjesečni trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.monthlyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                  <XAxis
                    dataKey="month"
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
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="flights"
                    stroke="#3392C5"
                    strokeWidth={2}
                    dot={{ fill: '#3392C5', r: 4 }}
                    name="Letovi"
                  />
                  <Line
                    type="monotone"
                    dataKey="passengers"
                    stroke="#16A34A"
                    strokeWidth={2}
                    dot={{ fill: '#16A34A', r: 4 }}
                    name="Putnici"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Seasonal Analysis Chart */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Sezonska analiza (kvartali)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.seasonalAnalysis}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                  <XAxis
                    dataKey="quarter"
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
                  <Legend />
                  <Bar dataKey="flights" fill="#3392C5" radius={[8, 8, 0, 0]} name="Letovi" />
                  <Bar dataKey="passengers" fill="#16A34A" radius={[8, 8, 0, 0]} name="Putnici" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Load Factor & Punctuality */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Load faktor kroz godinu</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={reportData.loadFactor.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDEDF1" />
                    <XAxis dataKey="monthNumber" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
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
                    <Line type="monotone" dataKey="loadFactor" stroke="#0EA5E9" strokeWidth={2} name="Load faktor (%)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Tačnost kroz godinu</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={reportData.punctuality.byMonth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDEDF1" />
                    <XAxis dataKey="monthNumber" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
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
                    <Line type="monotone" dataKey="onTimeRate" stroke="#16A34A" strokeWidth={2} name="Tačnost (%)" />
                    <Line type="monotone" dataKey="avgDelayMinutes" stroke="#F97316" strokeWidth={2} name="Prosj. kašnjenje (min)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Monthly Breakdown Table */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Mjesečni pregled</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100 bg-dark-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Mjesec
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Letovi
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Putnici
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Dolazaka
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Odlazaka
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Cargo (kg)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.monthlyBreakdown.map((month, index) => (
                      <tr
                        key={`${month.monthNumber}-${month.month}-${index}`}
                        className="border-b border-dark-100 hover:bg-dark-50"
                      >
                        <td className="px-4 py-3 text-sm font-medium">{month.month}</td>
                        <td className="px-4 py-3 text-sm text-right">{month.flights}</td>
                        <td className="px-4 py-3 text-sm text-right">{month.passengers}</td>
                        <td className="px-4 py-3 text-sm text-right">{month.arrivalFlights}</td>
                        <td className="px-4 py-3 text-sm text-right">{month.departureFlights}</td>
                        <td className="px-4 py-3 text-sm text-right">{month.cargo}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-dark-100 bg-dark-50">
                    <tr>
                      <td className="px-4 py-3 text-sm font-semibold">UKUPNO</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">{reportData.totals.flights}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">{reportData.totals.totalPassengers}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">{reportData.totals.arrivalFlights}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">{reportData.totals.departureFlights}</td>
                      <td className="px-4 py-3 text-sm text-right font-semibold">{reportData.totals.totalCargo}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Route Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Najuspješnije rute (putnici)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-dark-100 bg-dark-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                          Ruta
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                          Putnici
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                          Letovi
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                          Load faktor
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.routes.topByPassengers.map((route, index) => (
                        <tr key={`top-passengers-${route.route}-${index}`} className="border-b border-dark-100 hover:bg-dark-50">
                          <td className="px-4 py-3 text-sm font-medium">{route.route}</td>
                          <td className="px-4 py-3 text-sm text-right">{route.passengers}</td>
                          <td className="px-4 py-3 text-sm text-right">{route.flights}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            {route.loadFactor !== null ? `${route.loadFactor}%` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Najuspješnije rute (load faktor)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-dark-100 bg-dark-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                          Ruta
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                          Load faktor
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                          Prosj. putnika
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                          Letovi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.routes.topByLoadFactor.map((route, index) => (
                        <tr key={`top-load-${route.route}-${index}`} className="border-b border-dark-100 hover:bg-dark-50">
                          <td className="px-4 py-3 text-sm font-medium">{route.route}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            {route.loadFactor !== null ? `${route.loadFactor}%` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {route.avgPassengers !== null ? route.avgPassengers.toFixed(1) : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">{route.flights}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Najproblematičnije rute</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-dark-100 bg-dark-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                          Ruta
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                          Prosj. kašnjenje
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                          Tačnost
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.routes.mostDelayed.map((route, index) => (
                        <tr key={`most-delayed-${route.route}-${index}`} className="border-b border-dark-100 hover:bg-dark-50">
                          <td className="px-4 py-3 text-sm font-medium">{route.route}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            {route.avgDelayMinutes !== null ? `${route.avgDelayMinutes} min` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {route.onTimeRate !== null ? `${route.onTimeRate}%` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Rute s najmanje kašnjenja</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-dark-100 bg-dark-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                          Ruta
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                          Prosj. kašnjenje
                        </th>
                        <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                          Tačnost
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.routes.leastDelayed.map((route, index) => (
                        <tr key={`least-delayed-${route.route}-${index}`} className="border-b border-dark-100 hover:bg-dark-50">
                          <td className="px-4 py-3 text-sm font-medium">{route.route}</td>
                          <td className="px-4 py-3 text-sm text-right">
                            {route.avgDelayMinutes !== null ? `${route.avgDelayMinutes} min` : '-'}
                          </td>
                          <td className="px-4 py-3 text-sm text-right">
                            {route.onTimeRate !== null ? `${route.onTimeRate}%` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Rute s najmanje putnika (prosjek)</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100 bg-dark-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Ruta
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Prosj. putnika
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Letovi
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Load faktor
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.routes.lowestAvgPassengers.map((route, index) => (
                      <tr key={`low-pax-${route.route}-${index}`} className="border-b border-dark-100 hover:bg-dark-50">
                        <td className="px-4 py-3 text-sm font-medium">{route.route}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          {route.avgPassengers !== null ? route.avgPassengers.toFixed(1) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">{route.flights}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          {route.loadFactor !== null ? `${route.loadFactor}%` : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* By Airline Table */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Po aviokompanijama</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Aviokompanija
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        ICAO
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Letovi
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Putnici
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.byAirline.map((airline) => (
                      <tr key={airline.icaoCode} className="border-b border-dark-100">
                        <td className="px-4 py-3 text-sm">{airline.airline}</td>
                        <td className="px-4 py-3 text-sm font-mono">{airline.icaoCode}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{airline.flights}</td>
                        <td className="px-4 py-3 text-sm text-right">{airline.passengers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {multiReportData && (
          <>
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-dark-900">Komparacija godina</h3>
                <p className="text-sm text-dark-500">Uporedni prikaz po mjesecima (svi grafici)</p>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-dark-700 mb-2">Letovi</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={buildComparisonData('flights')}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDEDF1" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
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
                      {multiReportData.yearsData.map((yearData) => (
                        <Line
                          key={`year-flights-${yearData.year}`}
                          type="monotone"
                          dataKey={String(yearData.year)}
                          strokeWidth={2}
                          stroke={`hsl(${(yearData.year * 37) % 360} 65% 45%)`}
                          name={String(yearData.year)}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-700 mb-2">Putnici</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={buildComparisonData('passengers')}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDEDF1" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
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
                      {multiReportData.yearsData.map((yearData) => (
                        <Line
                          key={`year-passengers-${yearData.year}`}
                          type="monotone"
                          dataKey={String(yearData.year)}
                          strokeWidth={2}
                          stroke={`hsl(${(yearData.year * 37) % 360} 65% 45%)`}
                          name={String(yearData.year)}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-700 mb-2">Load faktor (%)</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={buildComparisonData('loadFactor')}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDEDF1" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
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
                      {multiReportData.yearsData.map((yearData) => (
                        <Line
                          key={`year-load-${yearData.year}`}
                          type="monotone"
                          dataKey={String(yearData.year)}
                          strokeWidth={2}
                          stroke={`hsl(${(yearData.year * 37) % 360} 65% 45%)`}
                          name={String(yearData.year)}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-700 mb-2">Tačnost (%)</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={buildComparisonData('onTimeRate')}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDEDF1" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
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
                      {multiReportData.yearsData.map((yearData) => (
                        <Line
                          key={`year-ontime-${yearData.year}`}
                          type="monotone"
                          dataKey={String(yearData.year)}
                          strokeWidth={2}
                          stroke={`hsl(${(yearData.year * 37) % 360} 65% 45%)`}
                          name={String(yearData.year)}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-700 mb-2">Prosječno kašnjenje (min)</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={buildComparisonData('avgDelay')}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#EDEDF1" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
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
                      {multiReportData.yearsData.map((yearData) => (
                        <Line
                          key={`year-delay-${yearData.year}`}
                          type="monotone"
                          dataKey={String(yearData.year)}
                          strokeWidth={2}
                          stroke={`hsl(${(yearData.year * 37) % 360} 65% 45%)`}
                          name={String(yearData.year)}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Sažetak po godinama</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100 bg-dark-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Godina
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Letovi
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Putnici
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Dolazaka
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Odlazaka
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Load faktor
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Tačnost
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Prosj. kašnjenje
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Prtljag
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Cargo
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Pošta
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Prosj. putnika
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {multiReportData.yearsData.map((yearData, index) => (
                      <tr key={`summary-${yearData.year}-${index}`} className="border-b border-dark-100 hover:bg-dark-50">
                        <td className="px-4 py-3 text-sm font-medium">{yearData.year}</td>
                        <td className="px-4 py-3 text-sm text-right">{yearData.totals.flights}</td>
                        <td className="px-4 py-3 text-sm text-right">{yearData.totals.totalPassengers}</td>
                        <td className="px-4 py-3 text-sm text-right">{yearData.totals.arrivalFlights}</td>
                        <td className="px-4 py-3 text-sm text-right">{yearData.totals.departureFlights}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          {yearData.loadFactor.overall !== null ? `${yearData.loadFactor.overall}%` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {yearData.punctuality.overallOnTimeRate !== null ? `${yearData.punctuality.overallOnTimeRate}%` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {yearData.punctuality.overallAvgDelayMinutes !== null ? `${yearData.punctuality.overallAvgDelayMinutes} min` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">{yearData.totals.totalBaggage}</td>
                        <td className="px-4 py-3 text-sm text-right">{yearData.totals.totalCargo}</td>
                        <td className="px-4 py-3 text-sm text-right">{yearData.totals.totalMail}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          {yearData.totals.flights > 0
                            ? (yearData.totals.totalPassengers / yearData.totals.flights).toFixed(1)
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Zajedničke rute kroz godine</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100 bg-dark-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Ruta
                      </th>
                      {multiReportData.yearsData.map((yearData) => (
                        <th
                          key={`route-header-${yearData.year}`}
                          className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase"
                        >
                          {yearData.year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {multiReportData.comparisons.commonRoutes.map((route, index) => (
                      <tr key={`route-compare-${route.route}-${index}`} className="border-b border-dark-100 hover:bg-dark-50">
                        <td className="px-4 py-3 text-sm font-medium">{route.route}</td>
                        {route.perYear.map((stats) => (
                          <td key={`route-${route.route}-${stats.year}`} className="px-4 py-3 text-xs text-dark-700">
                            <div>Letovi: {stats.flights}</div>
                            <div>Putnici: {stats.passengers}</div>
                            <div>LF: {stats.loadFactor !== null ? `${stats.loadFactor}%` : '-'}</div>
                            <div>Tačnost: {stats.onTimeRate !== null ? `${stats.onTimeRate}%` : '-'}</div>
                            <div>Kašnjenje: {stats.avgDelayMinutes !== null ? `${stats.avgDelayMinutes} min` : '-'}</div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Zajedničke aviokompanije kroz godine</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100 bg-dark-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Aviokompanija
                      </th>
                      {multiReportData.yearsData.map((yearData) => (
                        <th
                          key={`airline-header-${yearData.year}`}
                          className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase"
                        >
                          {yearData.year}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {multiReportData.comparisons.commonAirlines.map((airline, index) => (
                      <tr key={`airline-compare-${airline.icaoCode}-${index}`} className="border-b border-dark-100 hover:bg-dark-50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {airline.airline} ({airline.icaoCode})
                        </td>
                        {airline.perYear.map((stats) => (
                          <td key={`airline-${airline.icaoCode}-${stats.year}`} className="px-4 py-3 text-xs text-dark-700">
                            <div>Letovi: {stats.flights}</div>
                            <div>Putnici: {stats.passengers}</div>
                            <div>LF: {stats.loadFactor !== null ? `${stats.loadFactor}%` : '-'}</div>
                            <div>Tačnost: {stats.onTimeRate !== null ? `${stats.onTimeRate}%` : '-'}</div>
                            <div>Kašnjenje: {stats.avgDelayMinutes !== null ? `${stats.avgDelayMinutes} min` : '-'}</div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
