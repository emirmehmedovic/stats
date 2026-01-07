'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { formatDateDisplay } from '@/lib/dates';

interface MonthlyReportData {
  mode: 'single';
  year: number;
  month: number;
  monthName: string;
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
  dailyBreakdown: Array<{
    date: string;
    dayNumber: number;
    dayOfWeek: string;
    flights: number;
    passengers: number;
    arrivalFlights: number;
    departureFlights: number;
  }>;
  loadFactor: {
    overall: number | null;
    totalPassengers: number;
    totalSeats: number;
    byDay: Array<{
      dayNumber: number;
      passengers: number;
      seats: number;
      loadFactor: number | null;
    }>;
  };
  punctuality: {
    overallOnTimeRate: number | null;
    overallAvgDelayMinutes: number | null;
    totalDelaySamples: number;
    byDay: Array<{
      dayNumber: number;
      onTimeRate: number | null;
      avgDelayMinutes: number | null;
      delaySamples: number;
    }>;
  };
  byAirline: Array<{
    airline: string;
    icaoCode: string;
    flights: number;
    passengers: number;
    arrivalFlights: number;
    departureFlights: number;
  }>;
  topRoutes: Array<{
    route: string;
    flights: number;
    passengers: number;
  }>;
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
}

interface MultiMonthlyReportData {
  mode: 'multi';
  periods: string[];
  periodsData: MonthlyReportData[];
  comparisons: {
    commonRoutes: Array<{
      route: string;
      totalPassengers: number;
      perPeriod: Array<{
        period: string;
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
      perPeriod: Array<{
        period: string;
        flights: number;
        passengers: number;
        loadFactor: number | null;
        avgDelayMinutes: number | null;
        onTimeRate: number | null;
      }>;
    }>;
  };
}

type MonthlyReportPayload = MonthlyReportData | MultiMonthlyReportData;

export default function MonthlyReportPage() {
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((currentDate.getMonth() + 1).toString().padStart(2, '0'));
  const [comparisonYear, setComparisonYear] = useState(currentDate.getFullYear().toString());
  const [comparisonMonth, setComparisonMonth] = useState((currentDate.getMonth() + 1).toString().padStart(2, '0'));
  const [comparisonYears, setComparisonYears] = useState<string[]>([]);
  const [comparisonPeriods, setComparisonPeriods] = useState<string[]>([]);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [sameMonthComparison, setSameMonthComparison] = useState(false);
  const [reportData, setReportData] = useState<MonthlyReportData | null>(null);
  const [multiReportData, setMultiReportData] = useState<MultiMonthlyReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isComparisonMode && sameMonthComparison && comparisonYears.length < 2) {
        throw new Error('Odaberite najmanje dvije godine za isti mjesec');
      }
      if (isComparisonMode && !sameMonthComparison && comparisonPeriods.length < 2) {
        throw new Error('Odaberite najmanje dva perioda za komparaciju');
      }
      const periods = sameMonthComparison
        ? comparisonYears.map((year) => `${year}-${selectedMonth}`)
        : comparisonPeriods;
      const query = isComparisonMode
        ? `/api/reports/monthly?periods=${encodeURIComponent(periods.join(','))}`
        : `/api/reports/monthly?year=${selectedYear}&month=${selectedMonth}`;
      const response = await fetch(query);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri učitavanju izvještaja');
      }

      const result = await response.json();
      const payload = result.data as MonthlyReportPayload;
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
      ['MJESEČNI IZVJEŠTAJ - Aerodrom Tuzla'],
      ['Period:', reportData.monthName],
      [],
      ['UKUPNO'],
      ['Ukupno letova:', reportData.totals.flights],
      ['Ukupno putnika:', reportData.totals.totalPassengers],
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

    // Daily breakdown sheet
    const dailyData = reportData.dailyBreakdown.map(d => ({
      'Datum': d.date,
      'Dan': d.dayOfWeek,
      'Letovi': d.flights,
      'Putnici': d.passengers,
      'Dolazaka': d.arrivalFlights,
      'Odlazaka': d.departureFlights,
    }));

    const dailySheet = XLSX.utils.json_to_sheet(dailyData);
    XLSX.utils.book_append_sheet(wb, dailySheet, 'Po danima');

    // By airline sheet
    const airlineData = reportData.byAirline.map(a => ({
      'Aviokompanija': a.airline,
      'ICAO kod': a.icaoCode,
      'Broj letova': a.flights,
      'Broj putnika': a.passengers,
      'Dolazaka': a.arrivalFlights,
      'Odlazaka': a.departureFlights,
    }));

    const airlineSheet = XLSX.utils.json_to_sheet(airlineData);
    XLSX.utils.book_append_sheet(wb, airlineSheet, 'Po aviokompanijama');

    // Top routes sheet
    const routesData = reportData.topRoutes.map(r => ({
      'Ruta': r.route,
      'Broj letova': r.flights,
      'Broj putnika': r.passengers,
    }));

    const routesSheet = XLSX.utils.json_to_sheet(routesData);
    XLSX.utils.book_append_sheet(wb, routesSheet, 'Top rute');

    // Download
    XLSX.writeFile(wb, `Mjesecni_izvjestaj_${reportData.year}_${reportData.month.toString().padStart(2, '0')}.xlsx`);
  };

  const yearOptions = Array.from({ length: currentDate.getFullYear() - 2009 }, (_, index) =>
    String(2010 + index)
  ).reverse();
  const monthOptions = [
    { value: '01', label: 'Januar' },
    { value: '02', label: 'Februar' },
    { value: '03', label: 'Mart' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Maj' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Avgust' },
    { value: '09', label: 'Septembar' },
    { value: '10', label: 'Oktobar' },
    { value: '11', label: 'Novembar' },
    { value: '12', label: 'Decembar' },
  ];

  const addComparisonPeriod = () => {
    const period = `${comparisonYear}-${comparisonMonth}`;
    if (!comparisonYear || !comparisonMonth) return;
    setComparisonPeriods((prev) =>
      prev.includes(period) ? prev : [...prev, period].sort()
    );
  };

  const addComparisonYear = () => {
    if (!comparisonYear) return;
    setComparisonYears((prev) =>
      prev.includes(comparisonYear)
        ? prev
        : [...prev, comparisonYear].sort((a, b) => Number(a) - Number(b))
    );
  };

  const removeComparisonPeriod = (period: string) => {
    setComparisonPeriods((prev) => prev.filter((item) => item !== period));
  };

  const removeComparisonYear = (year: string) => {
    setComparisonYears((prev) => prev.filter((item) => item !== year));
  };

  const resetFilters = () => {
    setSelectedYear(currentDate.getFullYear().toString());
    setSelectedMonth((currentDate.getMonth() + 1).toString().padStart(2, '0'));
    setComparisonYear(currentDate.getFullYear().toString());
    setComparisonMonth((currentDate.getMonth() + 1).toString().padStart(2, '0'));
    setComparisonPeriods([]);
    setComparisonYears([]);
    setIsComparisonMode(false);
    setSameMonthComparison(false);
  };

  const buildComparisonData = (
    metric: 'flights' | 'passengers' | 'loadFactor' | 'onTimeRate' | 'avgDelay'
  ) =>
    multiReportData
      ? Array.from({ length: 31 }, (_, index) => {
          const dayNumber = index + 1;
          const row: Record<string, string | number | null> = { day: dayNumber };
          multiReportData.periodsData.forEach((periodData) => {
            let value: number | null = null;
            if (metric === 'flights') {
              const dayRow = periodData.dailyBreakdown.find((item) => item.dayNumber === dayNumber);
              value = dayRow?.flights ?? 0;
            }
            if (metric === 'passengers') {
              const dayRow = periodData.dailyBreakdown.find((item) => item.dayNumber === dayNumber);
              value = dayRow?.passengers ?? 0;
            }
            if (metric === 'loadFactor') {
              const dayRow = periodData.loadFactor.byDay.find((item) => item.dayNumber === dayNumber);
              value = dayRow?.loadFactor ?? null;
            }
            if (metric === 'onTimeRate') {
              const dayRow = periodData.punctuality.byDay.find((item) => item.dayNumber === dayNumber);
              value = dayRow?.onTimeRate ?? null;
            }
            if (metric === 'avgDelay') {
              const dayRow = periodData.punctuality.byDay.find((item) => item.dayNumber === dayNumber);
              value = dayRow?.avgDelayMinutes ?? null;
            }
            row[`${periodData.year}-${String(periodData.month).padStart(2, '0')}`] = value ?? 0;
          });
          return row;
        })
      : [];

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Month/Year Picker */}
        <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="year">Godina</Label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-dark-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
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
              <Label htmlFor="month">Mjesec</Label>
              <select
                id="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full mt-1 flex h-10 rounded-xl border border-dark-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                disabled={isComparisonMode}
              >
                {monthOptions.map((month) => (
                  <option key={`month-${month.value}`} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
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
                  Uporedi periode
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
          <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="comparisonYear">Komparacija godina</Label>
              <select
                id="comparisonYear"
                value={comparisonYear}
                onChange={(e) => setComparisonYear(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-dark-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                disabled={!isComparisonMode}
              >
                {yearOptions.map((year) => (
                  <option key={`compare-year-${year}`} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="comparisonMonth">Komparacija mjesec</Label>
              {sameMonthComparison ? (
                <div className="mt-1 h-10 w-full rounded-xl border border-dark-100 bg-slate-50 px-3 py-2 text-sm text-dark-500 flex items-center">
                  {monthOptions.find((month) => month.value === selectedMonth)?.label || selectedMonth}
                </div>
              ) : (
                <select
                  id="comparisonMonth"
                  value={comparisonMonth}
                  onChange={(e) => setComparisonMonth(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-dark-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                  disabled={!isComparisonMode}
                >
                  {monthOptions.map((month) => (
                    <option key={`compare-month-${month.value}`} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={sameMonthComparison ? addComparisonYear : addComparisonPeriod}
                disabled={!isComparisonMode}
              >
                {sameMonthComparison ? 'Dodaj godinu' : 'Dodaj period'}
              </Button>
              <div className="flex flex-wrap gap-2">
                {!sameMonthComparison && comparisonPeriods.length === 0 && (
                  <span className="text-xs text-dark-500">Nema odabranih perioda</span>
                )}
                {sameMonthComparison && comparisonYears.length === 0 && (
                  <span className="text-xs text-dark-500">Nema odabranih godina</span>
                )}
                {!sameMonthComparison && comparisonPeriods.map((period) => (
                  <span
                    key={`period-${period}`}
                    className="inline-flex items-center gap-2 rounded-full bg-dark-50 px-3 py-1 text-xs text-dark-700"
                  >
                    {period}
                    <button
                      type="button"
                      onClick={() => removeComparisonPeriod(period)}
                      className="text-dark-400 hover:text-dark-700"
                      aria-label={`Ukloni ${period}`}
                      disabled={!isComparisonMode}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {sameMonthComparison && comparisonYears.map((year) => (
                  <span
                    key={`period-year-${year}`}
                    className="inline-flex items-center gap-2 rounded-full bg-dark-50 px-3 py-1 text-xs text-dark-700"
                  >
                    {year}-{selectedMonth}
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
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              id="sameMonthComparison"
              type="checkbox"
              checked={sameMonthComparison}
              onChange={(e) => setSameMonthComparison(e.target.checked)}
              className="h-4 w-4 rounded border-borderSoft"
              disabled={!isComparisonMode}
            />
            <Label htmlFor="sameMonthComparison" className="text-sm">
              Isti mjesec kroz više godina
            </Label>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Load faktor</p>
                <p className="text-2xl font-semibold text-primary-600">
                  {reportData.loadFactor.overall !== null ? `${reportData.loadFactor.overall}%` : '-'}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Tačnost</p>
                <p className="text-2xl font-semibold text-primary-600">
                  {reportData.punctuality.overallOnTimeRate !== null ? `${reportData.punctuality.overallOnTimeRate}%` : '-'}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Prosj. kašnjenje</p>
                <p className="text-2xl font-semibold text-primary-600">
                  {reportData.punctuality.overallAvgDelayMinutes !== null ? `${reportData.punctuality.overallAvgDelayMinutes} min` : '-'}
                </p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Ukupno prtljaga</p>
                <p className="text-2xl font-semibold text-primary-600">{reportData.totals.totalBaggage}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Ukupno cargo</p>
                <p className="text-2xl font-semibold text-primary-600">{reportData.totals.totalCargo}</p>
              </div>
              <div className="bg-white rounded-2xl shadow-soft px-5 py-4">
                <p className="text-xs text-dark-500 mb-1">Ukupno pošte</p>
                <p className="text-2xl font-semibold text-primary-600">{reportData.totals.totalMail}</p>
              </div>
            </div>

            {/* Daily Trend Chart */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Dnevni trend</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.dailyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: '#9A9A9A' }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return formatDateDisplay(date);
                    }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #E2E2E4',
                      borderRadius: '12px',
                      fontSize: '12px'
                    }}
                    labelFormatter={(value) => {
                      const date = new Date(value);
                      return formatDateDisplay(date);
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

            <div className="space-y-4">
              <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Load faktor po danu</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={reportData.loadFactor.byDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                    <XAxis dataKey="dayNumber" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
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
                <h3 className="text-lg font-semibold text-dark-900 mb-4">Tačnost po danu</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={reportData.punctuality.byDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                    <XAxis dataKey="dayNumber" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
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

            {/* By Airline Chart */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Po aviokompanijama</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={reportData.byAirline.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                  <XAxis
                    dataKey="icaoCode"
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
                    labelFormatter={(value) => {
                      const airline = reportData.byAirline.find(a => a.icaoCode === value);
                      return airline?.airline || value;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="flights" fill="#3392C5" radius={[8, 8, 0, 0]} name="Letovi" />
                  <Bar dataKey="passengers" fill="#16A34A" radius={[8, 8, 0, 0]} name="Putnici" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top Routes */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Top 10 ruta</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Ruta
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
                    {reportData.topRoutes.map((route, idx) => (
                      <tr key={idx} className="border-b border-dark-100">
                        <td className="px-4 py-3 text-sm font-medium">{route.route}</td>
                        <td className="px-4 py-3 text-sm text-right">{route.flights}</td>
                        <td className="px-4 py-3 text-sm text-right">{route.passengers}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Daily Breakdown Table */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">
                Dnevni pregled ({reportData.dailyBreakdown.length} dana)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100 bg-dark-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Datum
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Dan
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
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.dailyBreakdown.map((day) => (
                      <tr key={day.date} className="border-b border-dark-100 hover:bg-dark-50">
                        <td className="px-4 py-3 text-sm">{day.date}</td>
                        <td className="px-4 py-3 text-sm">{day.dayOfWeek}</td>
                        <td className="px-4 py-3 text-sm text-right font-medium">{day.flights}</td>
                        <td className="px-4 py-3 text-sm text-right">{day.passengers}</td>
                        <td className="px-4 py-3 text-sm text-right">{day.arrivalFlights}</td>
                        <td className="px-4 py-3 text-sm text-right">{day.departureFlights}</td>
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
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Dolazaka
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                        Odlazaka
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
                        <td className="px-4 py-3 text-sm text-right">{airline.arrivalFlights}</td>
                        <td className="px-4 py-3 text-sm text-right">{airline.departureFlights}</td>
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
                <h3 className="text-lg font-semibold text-dark-900">Komparacija perioda</h3>
                <p className="text-sm text-dark-500">Uporedni prikaz po danima</p>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-dark-700 mb-2">Letovi</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={buildComparisonData('flights')}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
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
                      {multiReportData.periodsData.map((periodData) => (
                        <Line
                          key={`period-flights-${periodData.year}-${periodData.month}`}
                          type="monotone"
                          dataKey={`${periodData.year}-${String(periodData.month).padStart(2, '0')}`}
                          strokeWidth={2}
                          stroke={`hsl(${(periodData.year * 37 + periodData.month) % 360} 65% 45%)`}
                          name={`${periodData.year}-${String(periodData.month).padStart(2, '0')}`}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-700 mb-2">Putnici</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={buildComparisonData('passengers')}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
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
                      {multiReportData.periodsData.map((periodData) => (
                        <Line
                          key={`period-passengers-${periodData.year}-${periodData.month}`}
                          type="monotone"
                          dataKey={`${periodData.year}-${String(periodData.month).padStart(2, '0')}`}
                          strokeWidth={2}
                          stroke={`hsl(${(periodData.year * 37 + periodData.month) % 360} 65% 45%)`}
                          name={`${periodData.year}-${String(periodData.month).padStart(2, '0')}`}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-700 mb-2">Load faktor (%)</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={buildComparisonData('loadFactor')}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
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
                      {multiReportData.periodsData.map((periodData) => (
                        <Line
                          key={`period-load-${periodData.year}-${periodData.month}`}
                          type="monotone"
                          dataKey={`${periodData.year}-${String(periodData.month).padStart(2, '0')}`}
                          strokeWidth={2}
                          stroke={`hsl(${(periodData.year * 37 + periodData.month) % 360} 65% 45%)`}
                          name={`${periodData.year}-${String(periodData.month).padStart(2, '0')}`}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-700 mb-2">Tačnost (%)</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={buildComparisonData('onTimeRate')}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
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
                      {multiReportData.periodsData.map((periodData) => (
                        <Line
                          key={`period-ontime-${periodData.year}-${periodData.month}`}
                          type="monotone"
                          dataKey={`${periodData.year}-${String(periodData.month).padStart(2, '0')}`}
                          strokeWidth={2}
                          stroke={`hsl(${(periodData.year * 37 + periodData.month) % 360} 65% 45%)`}
                          name={`${periodData.year}-${String(periodData.month).padStart(2, '0')}`}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-sm font-semibold text-dark-700 mb-2">Prosj. kašnjenje (min)</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={buildComparisonData('avgDelay')}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
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
                      {multiReportData.periodsData.map((periodData) => (
                        <Line
                          key={`period-delay-${periodData.year}-${periodData.month}`}
                          type="monotone"
                          dataKey={`${periodData.year}-${String(periodData.month).padStart(2, '0')}`}
                          strokeWidth={2}
                          stroke={`hsl(${(periodData.year * 37 + periodData.month) % 360} 65% 45%)`}
                          name={`${periodData.year}-${String(periodData.month).padStart(2, '0')}`}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Sažetak po periodima</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100 bg-dark-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Period
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
                    </tr>
                  </thead>
                  <tbody>
                    {multiReportData.periodsData.map((periodData, index) => (
                      <tr key={`period-summary-${periodData.year}-${periodData.month}-${index}`} className="border-b border-dark-100 hover:bg-dark-50">
                        <td className="px-4 py-3 text-sm font-medium">
                          {periodData.year}-{String(periodData.month).padStart(2, '0')}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">{periodData.totals.flights}</td>
                        <td className="px-4 py-3 text-sm text-right">{periodData.totals.totalPassengers}</td>
                        <td className="px-4 py-3 text-sm text-right">{periodData.totals.arrivalFlights}</td>
                        <td className="px-4 py-3 text-sm text-right">{periodData.totals.departureFlights}</td>
                        <td className="px-4 py-3 text-sm text-right">
                          {periodData.loadFactor.overall !== null ? `${periodData.loadFactor.overall}%` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {periodData.punctuality.overallOnTimeRate !== null ? `${periodData.punctuality.overallOnTimeRate}%` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          {periodData.punctuality.overallAvgDelayMinutes !== null ? `${periodData.punctuality.overallAvgDelayMinutes} min` : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">{periodData.totals.totalBaggage}</td>
                        <td className="px-4 py-3 text-sm text-right">{periodData.totals.totalCargo}</td>
                        <td className="px-4 py-3 text-sm text-right">{periodData.totals.totalMail}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Zajedničke rute kroz periode</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100 bg-dark-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Ruta
                      </th>
                      {multiReportData.periodsData.map((periodData) => (
                        <th
                          key={`route-header-${periodData.year}-${periodData.month}`}
                          className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase"
                        >
                          {periodData.year}-{String(periodData.month).padStart(2, '0')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {multiReportData.comparisons.commonRoutes.map((route, index) => (
                      <tr key={`route-compare-${route.route}-${index}`} className="border-b border-dark-100 hover:bg-dark-50">
                        <td className="px-4 py-3 text-sm font-medium">{route.route}</td>
                        {route.perPeriod.map((stats) => (
                          <td key={`route-${route.route}-${stats.period}`} className="px-4 py-3 text-xs text-dark-700">
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
              <h3 className="text-lg font-semibold text-dark-900 mb-4">Zajedničke aviokompanije kroz periode</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100 bg-dark-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Aviokompanija
                      </th>
                      {multiReportData.periodsData.map((periodData) => (
                        <th
                          key={`airline-header-${periodData.year}-${periodData.month}`}
                          className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase"
                        >
                          {periodData.year}-{String(periodData.month).padStart(2, '0')}
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
                        {airline.perPeriod.map((stats) => (
                          <td key={`airline-${airline.icaoCode}-${stats.period}`} className="px-4 py-3 text-xs text-dark-700">
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
