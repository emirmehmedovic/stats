'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as XLSX from 'xlsx';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { Calendar, TrendingUp, TrendingDown, Plane, Users, Package, Clock, AlertCircle, CheckCircle, XCircle, BarChart3, PieChart, Activity } from 'lucide-react';

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
    delayPercentiles: {
      p50: number | null;
      p90: number | null;
      p95: number | null;
    };
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
    loadFactor: {
      current: number | null;
      previous: number | null;
      growth: number;
    };
    onTimeRate: {
      current: number | null;
      previous: number | null;
      growth: number;
    };
    avgDelayMinutes: {
      current: number | null;
      previous: number | null;
      growth: number;
    };
    cancelledRate: {
      current: number | null;
      previous: number | null;
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
  statusBreakdown: {
    totalLegs: number;
    operatedLegs: number;
    cancelledLegs: number;
    divertedLegs: number;
    scheduledLegs: number;
    operatedRate: number | null;
    cancelledRate: number | null;
    divertedRate: number | null;
  };
  peakDays: Array<{
    date: string;
    passengers: number;
    flights: number;
  }>;
  peakHours: Array<{
    hour: number;
    passengers: number;
    flights: number;
  }>;
  delayCodesTop: Array<{
    code: string;
    description: string;
    totalMinutes: number;
    occurrences: number;
  }>;
  operationTypeBreakdown: Array<{
    code: string;
    name: string;
    flights: number;
    passengers: number;
  }>;
  trafficSplit: {
    domesticPassengers: number;
    internationalPassengers: number;
    domesticFlights: number;
    internationalFlights: number;
    domesticRate: number | null;
    internationalRate: number | null;
  };
  concentration: {
    topRoutesShare: number | null;
    topAirlinesShare: number | null;
    topRoutes: Array<{
      route: string;
      passengers: number;
    }>;
    topAirlines: Array<{
      airline: string;
      passengers: number;
    }>;
  };
  volatility: {
    passengersStdDev: number | null;
    flightsStdDev: number | null;
  };
  topMonths: {
    byLoadFactor: Array<{
      month: string;
      monthNumber: number;
      loadFactor: number | null;
    }>;
    byOnTimeRate: Array<{
      month: string;
      monthNumber: number;
      onTimeRate: number | null;
    }>;
  };
  seasonalityTrends: {
    quarters: Array<{
      label: string;
      flights: number;
      passengers: number;
      avgFlightsPerMonth: number;
      avgPassengersPerMonth: number;
    }>;
    seasons: Array<{
      label: string;
      flights: number;
      passengers: number;
      avgFlightsPerMonth: number;
      avgPassengersPerMonth: number;
    }>;
  };
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
  const [scheduledOnly, setScheduledOnly] = useState(false);
  const [reportData, setReportData] = useState<YearlyReportData | null>(null);
  const [multiReportData, setMultiReportData] = useState<MultiYearReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sortedYearsData = multiReportData
    ? [...multiReportData.yearsData].sort((a, b) => a.year - b.year)
    : [];

  const calcGrowth = (current: number | null, previous: number | null) => {
    if (current === null || previous === null || previous === 0) return null;
    return ((current - previous) / previous) * 100;
  };

  const formatGrowth = (value: number | null) => {
    if (value === null) return '-';
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const formatDelta = (current: number | null, previous: number | null, suffix = '') => {
    if (current === null || previous === null) return '-';
    const diff = current - previous;
    const sign = diff >= 0 ? '+' : '';
    return `${sign}${diff.toFixed(1)}${suffix}`;
  };

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isComparisonMode && comparisonYears.length < 2) {
        throw new Error('Odaberite najmanje dvije godine za komparaciju');
      }
      const baseQuery = isComparisonMode
        ? `/api/reports/yearly?years=${encodeURIComponent(comparisonYears.join(','))}`
        : `/api/reports/yearly?year=${selectedYear}`;
      const query = scheduledOnly ? `${baseQuery}&operationType=SCHEDULED` : baseQuery;
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
      ['KONCENTRACIJA PROMETA'],
      ['Udio top 3 rute (%):', reportData.concentration.topRoutesShare ?? '-'],
      ['Udio top 3 aviokompanije (%):', reportData.concentration.topAirlinesShare ?? '-'],
      [],
      ['VOLATILNOST PO MJESECIMA'],
      ['Std dev putnika:', reportData.volatility.passengersStdDev ?? '-'],
      ['Std dev letova:', reportData.volatility.flightsStdDev ?? '-'],
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

    const statusData = [
      ['Ukupno legova', reportData.statusBreakdown.totalLegs],
      ['Operirani letovi', reportData.statusBreakdown.operatedLegs],
      ['Otkazani letovi', reportData.statusBreakdown.cancelledLegs],
      ['Preusmjereni letovi', reportData.statusBreakdown.divertedLegs],
      ['Planirani letovi', reportData.statusBreakdown.scheduledLegs],
      ['Stopa operiranih (%)', reportData.statusBreakdown.operatedRate ?? '-'],
      ['Stopa otkazanih (%)', reportData.statusBreakdown.cancelledRate ?? '-'],
      ['Stopa preusmjerenih (%)', reportData.statusBreakdown.divertedRate ?? '-'],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(statusData), 'Operativni status');

    const trafficData = [
      ['Domaći putnici', reportData.trafficSplit.domesticPassengers],
      ['Međunarodni putnici', reportData.trafficSplit.internationalPassengers],
      ['Domaći letovi', reportData.trafficSplit.domesticFlights],
      ['Međunarodni letovi', reportData.trafficSplit.internationalFlights],
      ['Udio domaćih (%)', reportData.trafficSplit.domesticRate ?? '-'],
      ['Udio međunarodnih (%)', reportData.trafficSplit.internationalRate ?? '-'],
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(trafficData), 'Struktura saobraćaja');

    const operationTypeData = reportData.operationTypeBreakdown.map((item) => ({
      'Tip operacije': item.name,
      'Kod': item.code,
      'Letovi': item.flights,
      'Putnici': item.passengers,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(operationTypeData), 'Tipovi operacija');

    const delayCodesData = reportData.delayCodesTop.map((item) => ({
      'Kod': item.code,
      'Opis': item.description,
      'Ukupno minuta': item.totalMinutes,
      'Pojava': item.occurrences,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(delayCodesData), 'Delay kodovi');

    const peakDaysData = reportData.peakDays.map((item) => ({
      'Datum': item.date,
      'Putnici': item.passengers,
      'Letovi': item.flights,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(peakDaysData), 'Peak dani');

    const peakHoursData = reportData.peakHours.map((item) => ({
      'Sat': `${String(item.hour).padStart(2, '0')}:00`,
      'Putnici': item.passengers,
      'Letovi': item.flights,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(peakHoursData), 'Peak sati');

    const concentrationRoutes = reportData.concentration.topRoutes.map((item) => ({
      'Ruta': item.route,
      'Putnici': item.passengers,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(concentrationRoutes), 'Top rute');

    const concentrationAirlines = reportData.concentration.topAirlines.map((item) => ({
      'Aviokompanija': item.airline,
      'Putnici': item.passengers,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(concentrationAirlines), 'Top aviokompanije');

    const topLoadMonths = reportData.topMonths.byLoadFactor.map((item) => ({
      'Mjesec': item.month,
      'Load faktor (%)': item.loadFactor ?? '-',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topLoadMonths), 'Top LF mjeseci');

    const topOnTimeMonths = reportData.topMonths.byOnTimeRate.map((item) => ({
      'Mjesec': item.month,
      'Tačnost (%)': item.onTimeRate ?? '-',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topOnTimeMonths), 'Top tacnost');

    const quarterTrends = reportData.seasonalityTrends.quarters.map((item) => ({
      'Period': item.label,
      'Letovi': item.flights,
      'Putnici': item.passengers,
      'Prosj. letova/mj': item.avgFlightsPerMonth,
      'Prosj. putnika/mj': item.avgPassengersPerMonth,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(quarterTrends), 'Trendovi kvartali');

    const seasonTrends = reportData.seasonalityTrends.seasons.map((item) => ({
      'Period': item.label,
      'Letovi': item.flights,
      'Putnici': item.passengers,
      'Prosj. letova/mj': item.avgFlightsPerMonth,
      'Prosj. putnika/mj': item.avgPassengersPerMonth,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(seasonTrends), 'Trendovi sezone');

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
    const suffix = scheduledOnly ? '_redovni' : '';
    XLSX.writeFile(wb, `Godisnji_izvjestaj_${reportData.year}${suffix}.xlsx`);
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
    setScheduledOnly(false);
  };

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
  const buildComparisonData = (
    metric: 'flights' | 'passengers' | 'loadFactor' | 'onTimeRate' | 'avgDelay'
  ) =>
    multiReportData
      ? monthLabels.map((label, index) => {
          const monthNumber = index + 1;
          const row: Record<string, string | number | null> = { month: label };
          sortedYearsData.forEach((yearData) => {
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
      <div className="p-8 space-y-8">
        {/* Year Picker */}
        <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white/70 to-primary-100/50 opacity-70"></div>
          <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-primary-200 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary-50 rounded-2xl">
                <Calendar className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-dark-900">Godišnji izvještaj</h2>
                <p className="text-sm text-dark-500">Odaberite period i filtere za analizu</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-end">
            <div>
              <Label htmlFor="year" className="text-sm font-semibold text-dark-700 mb-2 block">Izaberite godinu</Label>
              <select
                id="year"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="h-11 w-full rounded-xl border border-dark-200 bg-white px-4 text-sm font-medium text-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all shadow-sm"
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
              <Label htmlFor="comparisonYears" className="text-sm font-semibold text-dark-700 mb-2 block">Komparacija godina (dodaj)</Label>
              <div className="flex items-center gap-2">
                <select
                  id="comparisonYears"
                  value={comparisonYearSelect}
                  onChange={(e) => setComparisonYearSelect(e.target.value)}
                  className="h-11 w-full rounded-xl border border-dark-200 bg-white px-4 text-sm font-medium text-dark-900 focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent transition-all shadow-sm"
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
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-dark-50 border border-dark-100">
                <input
                  id="comparisonMode"
                  type="checkbox"
                  checked={isComparisonMode}
                  onChange={(e) => setIsComparisonMode(e.target.checked)}
                  className="h-4 w-4 rounded border-dark-300 text-primary-600 focus:ring-2 focus:ring-primary-500"
                />
                <Label htmlFor="comparisonMode" className="text-sm font-medium text-dark-700 cursor-pointer">
                  Uporedi više godina
                </Label>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={fetchReport}
                  disabled={isLoading}
                  className="bg-gradient-to-br from-dark-900 to-dark-800 hover:from-dark-800 hover:to-dark-700 text-white font-semibold rounded-xl px-6 shadow-soft-xl transition-all"
                >
                  {isLoading ? 'Učitavam...' : 'Prikaži izvještaj'}
                </Button>
                <Button
                  type="button"
                  variant={scheduledOnly ? 'default' : 'outline'}
                  onClick={() => setScheduledOnly((prev) => !prev)}
                  disabled={isLoading}
                  className="rounded-xl font-medium"
                >
                  Redovni saobraćaj
                </Button>
                {reportData && (
                  <Button
                    onClick={handleExportToExcel}
                    variant="outline"
                    className="rounded-xl font-medium"
                  >
                    Exportuj u Excel
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetFilters}
                  className="rounded-xl font-medium"
                >
                  Reset filtere
                </Button>
              </div>
            </div>
          </div>
          
          {comparisonYears.length > 0 && (
            <div className="mt-6 pt-6 border-t border-dark-100">
              <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide mb-3">Odabrane godine</p>
              <div className="flex flex-wrap items-center gap-2">
                {comparisonYears.map((year) => (
                  <span
                    key={`selected-${year}`}
                    className="inline-flex items-center gap-2 rounded-full bg-primary-50 border border-primary-200 px-4 py-2 text-sm font-medium text-primary-700"
                  >
                    {year}
                    <button
                      type="button"
                      onClick={() => removeComparisonYear(year)}
                      className="text-primary-400 hover:text-primary-700 transition-colors"
                      aria-label={`Ukloni ${year}`}
                      disabled={!isComparisonMode}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
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

        {/* Report Data */}
        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group hover:shadow-soft-lg transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white/70 to-blue-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-200 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <Plane className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide mb-2">Ukupno letova</p>
                  <p className="text-3xl font-bold text-dark-900">{reportData.totals.flights}</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group hover:shadow-soft-lg transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-primary-200 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 bg-primary-50 rounded-xl">
                      <Users className="w-5 h-5 text-primary-600" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide mb-2">Ukupno putnika</p>
                  <p className="text-3xl font-bold text-dark-900">{reportData.totals.totalPassengers.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group hover:shadow-soft-lg transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/60 via-white/70 to-slate-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-slate-200 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-slate-600" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide mb-2">Dolazaka</p>
                  <p className="text-3xl font-bold text-dark-900">{reportData.totals.arrivalFlights.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group hover:shadow-soft-lg transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/60 via-white/70 to-amber-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-amber-200 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 bg-amber-50 rounded-xl">
                      <TrendingDown className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide mb-2">Odlazaka</p>
                  <p className="text-3xl font-bold text-dark-900">{reportData.totals.departureFlights.toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group hover:shadow-soft-lg transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-indigo-200 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 bg-indigo-50 rounded-xl">
                      <Activity className="w-5 h-5 text-indigo-600" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide mb-2">Load faktor</p>
                  <p className="text-3xl font-bold text-dark-900">
                    {reportData.loadFactor.overall !== null ? `${reportData.loadFactor.overall}%` : '-'}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group hover:shadow-soft-lg transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-50/60 via-white/70 to-sky-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-sky-200 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <div className="p-2.5 bg-sky-50 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-sky-600" />
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide mb-2">Tačnost</p>
                  <p className="text-3xl font-bold text-dark-900">
                    {reportData.punctuality.overallOnTimeRate !== null ? `${reportData.punctuality.overallOnTimeRate}%` : '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
              <div className="bg-white rounded-3xl shadow-soft p-6 border border-dark-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Users className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Prosj. putnika po letu</p>
                </div>
                <p className="text-2xl font-bold text-dark-900">
                  {reportData.totals.flights > 0
                    ? (reportData.totals.totalPassengers / reportData.totals.flights).toFixed(1)
                    : '-'}
                </p>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-6 border border-dark-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Package className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Ukupno prtljaga (kg)</p>
                </div>
                <p className="text-2xl font-bold text-dark-900">{reportData.totals.totalBaggage.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-6 border border-dark-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <Package className="w-4 h-4 text-orange-600" />
                  </div>
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Ukupno cargo (kg)</p>
                </div>
                <p className="text-2xl font-bold text-dark-900">{reportData.totals.totalCargo.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-6 border border-dark-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-pink-50 rounded-lg">
                    <Package className="w-4 h-4 text-pink-600" />
                  </div>
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Ukupno pošte (kg)</p>
                </div>
                <p className="text-2xl font-bold text-dark-900">{reportData.totals.totalMail.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-6 border border-dark-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <Clock className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Prosj. kašnjenje</p>
                </div>
                <p className="text-2xl font-bold text-dark-900">
                  {reportData.punctuality.overallAvgDelayMinutes !== null
                    ? `${reportData.punctuality.overallAvgDelayMinutes} min`
                    : '-'}
                </p>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-6 border border-dark-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-slate-600" />
                  </div>
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Uzorci kašnjenja</p>
                </div>
                <p className="text-2xl font-bold text-dark-900">
                  {reportData.punctuality.totalDelaySamples.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-3xl shadow-soft p-6 border border-dark-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-red-50 rounded-lg">
                    <XCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Otkazani letovi</p>
                </div>
                <p className="text-2xl font-bold text-dark-900">
                  {reportData.statusBreakdown.cancelledLegs}
                </p>
                <p className="text-xs text-dark-500 mt-2">
                  Stopa: {reportData.statusBreakdown.cancelledRate !== null
                    ? `${reportData.statusBreakdown.cancelledRate}%`
                    : '-'}
                </p>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-6 border border-dark-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-orange-50 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  </div>
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Preusmjereni letovi</p>
                </div>
                <p className="text-2xl font-bold text-dark-900">
                  {reportData.statusBreakdown.divertedLegs}
                </p>
                <p className="text-xs text-dark-500 mt-2">
                  Stopa: {reportData.statusBreakdown.divertedRate !== null
                    ? `${reportData.statusBreakdown.divertedRate}%`
                    : '-'}
                </p>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-6 border border-dark-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-sky-50 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-sky-600" />
                  </div>
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Operirani letovi</p>
                </div>
                <p className="text-2xl font-bold text-dark-900">
                  {reportData.statusBreakdown.operatedLegs}
                </p>
                <p className="text-xs text-dark-500 mt-2">
                  Stopa: {reportData.statusBreakdown.operatedRate !== null
                    ? `${reportData.statusBreakdown.operatedRate}%`
                    : '-'}
                </p>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-6 border border-dark-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">P95 kašnjenje</p>
                </div>
                <p className="text-2xl font-bold text-dark-900">
                  {reportData.punctuality.delayPercentiles.p95 !== null
                    ? `${reportData.punctuality.delayPercentiles.p95} min`
                    : '-'}
                </p>
                <p className="text-xs text-dark-500 mt-2">
                  P90: {reportData.punctuality.delayPercentiles.p90 !== null
                    ? `${reportData.punctuality.delayPercentiles.p90} min`
                    : '-'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white/70 to-slate-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-slate-200 rounded-full blur-3xl opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <PieChart className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-dark-900">Koncentracija prometa</h3>
                      <p className="text-sm text-dark-500">Distribucija po rutama i aviokompanijama</p>
                    </div>
                  </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border-2 border-slate-100 bg-white p-6 hover:border-slate-200 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-bold text-dark-500 uppercase tracking-wide">Udio top 3 rute</p>
                      <div className="p-1.5 bg-slate-50 rounded-lg">
                        <TrendingUp className="w-3.5 h-3.5 text-slate-600" />
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-slate-700 mb-4">
                      {reportData.concentration.topRoutesShare !== null
                        ? `${reportData.concentration.topRoutesShare}%`
                        : '-'}
                    </p>
                    <div className="w-full bg-slate-100 rounded-full h-2 mb-4">
                      <div 
                        className="bg-gradient-to-r from-slate-400 to-slate-600 h-2 rounded-full transition-all"
                        style={{ width: `${reportData.concentration.topRoutesShare ?? 0}%` }}
                      ></div>
                    </div>
                    <div className="space-y-2.5">
                      {reportData.concentration.topRoutes.map((route, idx) => (
                        <div key={route.route} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-all">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">{idx + 1}</span>
                            <span className="text-sm font-semibold text-dark-700">{route.route}</span>
                          </div>
                          <span className="text-sm font-bold text-slate-600">{route.passengers.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border-2 border-blue-100 bg-white p-6 hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs font-bold text-dark-500 uppercase tracking-wide">Udio top 3 aviokompanije</p>
                      <div className="p-1.5 bg-blue-50 rounded-lg">
                        <Plane className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-4xl font-bold text-blue-700 mb-4">
                      {reportData.concentration.topAirlinesShare !== null
                        ? `${reportData.concentration.topAirlinesShare}%`
                        : '-'}
                    </p>
                    <div className="w-full bg-blue-100 rounded-full h-2 mb-4">
                      <div 
                        className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${reportData.concentration.topAirlinesShare ?? 0}%` }}
                      ></div>
                    </div>
                    <div className="space-y-2.5">
                      {reportData.concentration.topAirlines.map((airline, idx) => (
                        <div key={airline.airline} className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-all">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-200 text-blue-700 text-xs font-bold">{idx + 1}</span>
                            <span className="text-sm font-semibold text-dark-700">{airline.airline}</span>
                          </div>
                          <span className="text-sm font-bold text-blue-600">{airline.passengers.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-indigo-200 rounded-full blur-3xl opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-indigo-50 rounded-xl">
                      <Activity className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-lg font-bold text-dark-900">Volatilnost i top mjeseci</h3>
                  </div>
                <div className="grid gap-4">
                  <div className="rounded-xl border border-dark-100 bg-dark-50 px-4 py-3">
                    <p className="text-xs text-dark-500 mb-1">Volatilnost po mjesecima</p>
                    <div className="flex items-center justify-between text-sm text-dark-700">
                      <span>Std dev putnika</span>
                      <span>{reportData.volatility.passengersStdDev ?? '-'}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm text-dark-700">
                      <span>Std dev letova</span>
                      <span>{reportData.volatility.flightsStdDev ?? '-'}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-dark-100 bg-dark-50 px-4 py-3">
                    <p className="text-xs text-dark-500 mb-2">Top 5 mjeseci</p>
                    <div className="grid gap-2 md:grid-cols-2 text-xs text-dark-600">
                      <div>
                        <p className="text-xs font-semibold text-dark-700 mb-1">Load faktor</p>
                        {reportData.topMonths.byLoadFactor.map((item) => (
                          <div key={`lf-${item.monthNumber}`} className="flex items-center justify-between">
                            <span>{item.month}</span>
                            <span>{item.loadFactor !== null ? `${item.loadFactor}%` : '-'}</span>
                          </div>
                        ))}
                        {reportData.topMonths.byLoadFactor.length === 0 && (
                          <p className="text-xs text-dark-500">Nema podataka.</p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-dark-700 mb-1">Tačnost</p>
                        {reportData.topMonths.byOnTimeRate.map((item) => (
                          <div key={`ot-${item.monthNumber}`} className="flex items-center justify-between">
                            <span>{item.month}</span>
                            <span>{item.onTimeRate !== null ? `${item.onTimeRate}%` : '-'}</span>
                          </div>
                        ))}
                        {reportData.topMonths.byOnTimeRate.length === 0 && (
                          <p className="text-xs text-dark-500">Nema podataka.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/50 via-white/70 to-cyan-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-cyan-200 rounded-full blur-3xl opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-cyan-50 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-dark-900">Sezonski trendovi</h3>
                    <p className="text-sm text-dark-500">Analiza po kvartalima i sezonama</p>
                  </div>
                </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border-2 border-indigo-100 bg-white p-6 hover:border-indigo-200 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-dark-500 uppercase tracking-wide">Kvartali</p>
                    <div className="p-1.5 bg-indigo-50 rounded-lg">
                      <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {reportData.seasonalityTrends.quarters.map((item, idx) => {
                      const maxPassengers = Math.max(...reportData.seasonalityTrends.quarters.map(q => q.passengers));
                      const percentage = (item.passengers / maxPassengers) * 100;
                      return (
                        <div key={item.label} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold">Q{idx + 1}</span>
                              <span className="text-sm font-semibold text-dark-700">{item.label}</span>
                            </div>
                            <span className="text-sm font-bold text-indigo-600">{item.passengers.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-indigo-50 rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-indigo-400 to-indigo-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-dark-500">
                            <span>{item.flights} letova</span>
                            <span>Prosj: {item.avgPassengersPerMonth.toLocaleString()}/mj</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="rounded-2xl border-2 border-teal-100 bg-white p-6 hover:border-teal-200 hover:shadow-md transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs font-bold text-dark-500 uppercase tracking-wide">Sezone</p>
                    <div className="p-1.5 bg-teal-50 rounded-lg">
                      <Activity className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                  </div>
                  <div className="space-y-3">
                    {reportData.seasonalityTrends.seasons.map((item) => {
                      const maxPassengers = Math.max(...reportData.seasonalityTrends.seasons.map(s => s.passengers));
                      const percentage = (item.passengers / maxPassengers) * 100;
                      const seasonIcons: Record<string, string> = {
                        'Proljeće': '🌸',
                        'Ljeto': '☀️',
                        'Jesen': '🍂',
                        'Zima': '❄️'
                      };
                      const seasonName = item.label.split(' ')[0];
                      return (
                        <div key={item.label} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{seasonIcons[seasonName] || '📅'}</span>
                              <span className="text-sm font-semibold text-dark-700">{item.label}</span>
                            </div>
                            <span className="text-sm font-bold text-teal-600">{item.passengers.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-teal-50 rounded-full h-1.5">
                            <div 
                              className="bg-gradient-to-r from-teal-400 to-teal-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-dark-500">
                            <span>{item.flights} letova</span>
                            <span>Prosj: {item.avgPassengersPerMonth.toLocaleString()}/mj</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white/70 to-slate-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-slate-200 rounded-full blur-3xl opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <Plane className="w-5 h-5 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-bold text-dark-900">Struktura saobraćaja</h3>
                  </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-dark-100 bg-dark-50 px-4 py-3">
                    <p className="text-xs text-dark-500 mb-1">Domaći</p>
                    <p className="text-xl font-semibold text-dark-900">
                      {reportData.trafficSplit.domesticPassengers.toLocaleString()}
                    </p>
                    <p className="text-xs text-dark-500 mt-1">
                      {reportData.trafficSplit.domesticRate !== null
                        ? `${reportData.trafficSplit.domesticRate}%`
                        : '-'}
                      {' '}· Letovi: {reportData.trafficSplit.domesticFlights}
                    </p>
                  </div>
                  <div className="rounded-xl border border-dark-100 bg-dark-50 px-4 py-3">
                    <p className="text-xs text-dark-500 mb-1">Međunarodni</p>
                    <p className="text-xl font-semibold text-dark-900">
                      {reportData.trafficSplit.internationalPassengers.toLocaleString()}
                    </p>
                    <p className="text-xs text-dark-500 mt-1">
                      {reportData.trafficSplit.internationalRate !== null
                        ? `${reportData.trafficSplit.internationalRate}%`
                        : '-'}
                      {' '}· Letovi: {reportData.trafficSplit.internationalFlights}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-dark-400 mt-3">
                  Izračunato na osnovu države dolaznog i odlaznog aerodroma.
                </p>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-white/70 to-purple-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-purple-200 rounded-full blur-3xl opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-purple-50 rounded-xl">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-dark-900">Tipovi operacija</h3>
                  </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-dark-100 bg-dark-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                          Tip
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                          Letovi
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                          Putnici
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.operationTypeBreakdown.slice(0, 8).map((item) => (
                        <tr key={item.code} className="border-b border-dark-100">
                          <td className="px-3 py-2 text-sm text-dark-700">
                            {item.name} ({item.code})
                          </td>
                          <td className="px-3 py-2 text-sm text-right">{item.flights}</td>
                          <td className="px-3 py-2 text-sm text-right">
                            {item.passengers.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {reportData.operationTypeBreakdown.length === 0 && (
                        <tr>
                          <td className="px-3 py-3 text-sm text-dark-500" colSpan={3}>
                            Nema dostupnih podataka.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl shadow-soft p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-red-50 rounded-xl">
                    <Clock className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-dark-900">Top delay kodovi</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-dark-100 bg-dark-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                          Kod
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                          Opis
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                          Min
                        </th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-dark-500 uppercase">
                          Pojava
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.delayCodesTop.map((item) => (
                        <tr key={item.code} className="border-b border-dark-100">
                          <td className="px-3 py-2 text-sm font-semibold text-dark-900">{item.code}</td>
                          <td className="px-3 py-2 text-sm text-dark-700">{item.description}</td>
                          <td className="px-3 py-2 text-sm text-right">{item.totalMinutes}</td>
                          <td className="px-3 py-2 text-sm text-right">{item.occurrences}</td>
                        </tr>
                      ))}
                      {reportData.delayCodesTop.length === 0 && (
                        <tr>
                          <td className="px-3 py-3 text-sm text-dark-500" colSpan={4}>
                            Nema dostupnih podataka.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-bold text-dark-900">Peak periodi</h3>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-xl border border-dark-100 bg-dark-50 px-4 py-3">
                    <p className="text-xs text-dark-500 mb-2">Najprometniji dani</p>
                    <div className="space-y-2">
                      {reportData.peakDays.map((day) => (
                        <div key={day.date} className="flex items-center justify-between text-sm">
                          <span className="text-dark-700">{day.date}</span>
                          <span className="text-dark-500">
                            {day.passengers.toLocaleString()} · {day.flights} let.
                          </span>
                        </div>
                      ))}
                      {reportData.peakDays.length === 0 && (
                        <p className="text-xs text-dark-500">Nema podataka.</p>
                      )}
                    </div>
                  </div>
                  <div className="rounded-xl border border-dark-100 bg-dark-50 px-4 py-3">
                    <p className="text-xs text-dark-500 mb-2">Najprometniji sati</p>
                    <div className="space-y-2">
                      {reportData.peakHours.map((hour) => (
                        <div key={hour.hour} className="flex items-center justify-between text-sm">
                          <span className="text-dark-700">{String(hour.hour).padStart(2, '0')}:00</span>
                          <span className="text-dark-500">
                            {hour.passengers.toLocaleString()} · {hour.flights} let.
                          </span>
                        </div>
                      ))}
                      {reportData.peakHours.length === 0 && (
                        <p className="text-xs text-dark-500">Nema podataka.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* YoY Comparison */}
            {reportData.hasPreviousYearData && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group hover:shadow-soft-lg transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white/70 to-blue-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-blue-200 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-all"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Plane className="w-4 h-4 text-blue-600" />
                      </div>
                      <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Rast letova (YoY)</p>
                    </div>
                    <p className={`text-3xl font-bold ${reportData.yoyComparison.flights.growth >= 0 ? 'text-cyan-600' : 'text-red-600'}`}>
                      {reportData.yoyComparison.flights.growth >= 0 ? '+' : ''}{reportData.yoyComparison.flights.growth.toFixed(1)}%
                    </p>
                    <p className="text-xs text-dark-500 mt-3">
                      {reportData.year - 1}: {reportData.yoyComparison.flights.previous} | {reportData.year}: {reportData.yoyComparison.flights.current}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group hover:shadow-soft-lg transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-primary-200 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-all"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-primary-50 rounded-lg">
                        <Users className="w-4 h-4 text-primary-600" />
                      </div>
                      <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Rast putnika (YoY)</p>
                    </div>
                    <p className={`text-3xl font-bold ${reportData.yoyComparison.passengers.growth >= 0 ? 'text-cyan-600' : 'text-red-600'}`}>
                      {reportData.yoyComparison.passengers.growth >= 0 ? '+' : ''}{reportData.yoyComparison.passengers.growth.toFixed(1)}%
                    </p>
                    <p className="text-xs text-dark-500 mt-3">
                      {reportData.year - 1}: {reportData.yoyComparison.passengers.previous.toLocaleString()} | {reportData.year}: {reportData.yoyComparison.passengers.current.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="bg-white rounded-3xl shadow-soft p-6 relative overflow-hidden group hover:shadow-soft-lg transition-all">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 via-white/70 to-orange-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-orange-200 rounded-full blur-2xl opacity-60 group-hover:opacity-80 transition-all"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <Package className="w-4 h-4 text-orange-600" />
                      </div>
                      <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Rast carga (YoY)</p>
                    </div>
                    <p className={`text-3xl font-bold ${reportData.yoyComparison.cargo.growth >= 0 ? 'text-cyan-600' : 'text-red-600'}`}>
                      {reportData.yoyComparison.cargo.growth >= 0 ? '+' : ''}{reportData.yoyComparison.cargo.growth.toFixed(1)}%
                    </p>
                    <p className="text-xs text-dark-500 mt-3">
                      {reportData.year - 1}: {reportData.yoyComparison.cargo.previous.toLocaleString()} kg | {reportData.year}: {reportData.yoyComparison.cargo.current.toLocaleString()} kg
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Monthly Trend Chart */}
            <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-primary-200 rounded-full blur-3xl opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-primary-50 rounded-xl">
                    <Activity className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-dark-900">Mjesečni trend</h3>
                    <p className="text-sm text-dark-500">Letovi i putnici kroz godinu</p>
                  </div>
                </div>
              <ResponsiveContainer width="100%" height={400}>
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
            </div>

            {/* Seasonal Analysis Chart */}
            <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/70 to-blue-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-blue-50 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-dark-900">Sezonska analiza (kvartali)</h3>
                    <p className="text-sm text-dark-500">Distribucija prometa po kvartalima</p>
                  </div>
                </div>
              <ResponsiveContainer width="100%" height={350}>
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
            </div>

            {/* Load Factor & Punctuality */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-indigo-200 rounded-full blur-3xl opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-indigo-50 rounded-xl">
                      <Activity className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-dark-900">Load faktor kroz godinu</h3>
                      <p className="text-sm text-dark-500">Prosječna popunjenost po mjesecima</p>
                    </div>
                  </div>
                <ResponsiveContainer width="100%" height={350}>
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
              </div>
              <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-white/70 to-green-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-green-200 rounded-full blur-3xl opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-green-50 rounded-xl">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-dark-900">Tačnost kroz godinu</h3>
                      <p className="text-sm text-dark-500">On-time performance i prosječno kašnjenje</p>
                    </div>
                  </div>
                <ResponsiveContainer width="100%" height={350}>
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
            </div>

            {/* Monthly Breakdown Table */}
            <div className="bg-white rounded-3xl shadow-soft p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-primary-50 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-dark-900">Mjesečni pregled</h3>
              </div>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl shadow-soft p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-slate-50 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-bold text-dark-900">Najuspješnije rute (putnici)</h3>
                </div>
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
              <div className="bg-white rounded-3xl shadow-soft p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-indigo-50 rounded-xl">
                    <Activity className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h3 className="text-lg font-bold text-dark-900">Najuspješnije rute (load faktor)</h3>
                </div>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl shadow-soft p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-red-50 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-dark-900">Najproblematičnije rute</h3>
                </div>
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
              <div className="bg-white rounded-3xl shadow-soft p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-sky-50 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-sky-600" />
                  </div>
                  <h3 className="text-lg font-bold text-dark-900">Rute s najmanje kašnjenja</h3>
                </div>
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

            <div className="bg-white rounded-3xl shadow-soft p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-amber-50 rounded-xl">
                  <TrendingDown className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-dark-900">Rute s najmanje putnika (prosjek)</h3>
              </div>
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
            <div className="bg-white rounded-3xl shadow-soft p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <Plane className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-dark-900">Po aviokompanijama</h3>
              </div>
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

            {reportData.hasPreviousYearData && (
              <div className="bg-white rounded-3xl shadow-soft p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-primary-50 rounded-xl">
                    <TrendingUp className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-bold text-dark-900">
                    Najznačajnije promjene (u odnosu na {reportData.year - 1})
                  </h3>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-dark-100 bg-dark-50 px-4 py-3">
                    <p className="text-xs text-dark-500 mb-1">Putnici</p>
                    <p className="text-sm font-semibold text-dark-900">
                      {formatGrowth(reportData.yoyComparison.passengers.growth)} (
                      {reportData.yoyComparison.passengers.current.toLocaleString()} vs{' '}
                      {reportData.yoyComparison.passengers.previous.toLocaleString()})
                    </p>
                  </div>
                  <div className="rounded-xl border border-dark-100 bg-dark-50 px-4 py-3">
                    <p className="text-xs text-dark-500 mb-1">Letovi</p>
                    <p className="text-sm font-semibold text-dark-900">
                      {formatGrowth(reportData.yoyComparison.flights.growth)} (
                      {reportData.yoyComparison.flights.current.toLocaleString()} vs{' '}
                      {reportData.yoyComparison.flights.previous.toLocaleString()})
                    </p>
                  </div>
                  <div className="rounded-xl border border-dark-100 bg-dark-50 px-4 py-3">
                    <p className="text-xs text-dark-500 mb-1">Load faktor</p>
                    <p className="text-sm font-semibold text-dark-900">
                      {formatDelta(
                        reportData.yoyComparison.loadFactor.current,
                        reportData.yoyComparison.loadFactor.previous,
                        ' pp'
                      )}{' '}
                      (
                      {reportData.yoyComparison.loadFactor.current !== null
                        ? `${reportData.yoyComparison.loadFactor.current}%`
                        : '-'}
                      )
                    </p>
                  </div>
                  <div className="rounded-xl border border-dark-100 bg-dark-50 px-4 py-3">
                    <p className="text-xs text-dark-500 mb-1">Tačnost</p>
                    <p className="text-sm font-semibold text-dark-900">
                      {formatDelta(
                        reportData.yoyComparison.onTimeRate.current,
                        reportData.yoyComparison.onTimeRate.previous,
                        ' pp'
                      )}{' '}
                      (
                      {reportData.yoyComparison.onTimeRate.current !== null
                        ? `${reportData.yoyComparison.onTimeRate.current}%`
                        : '-'}
                      )
                    </p>
                  </div>
                  <div className="rounded-xl border border-dark-100 bg-dark-50 px-4 py-3">
                    <p className="text-xs text-dark-500 mb-1">Prosj. kašnjenje</p>
                    <p className="text-sm font-semibold text-dark-900">
                      {formatDelta(
                        reportData.yoyComparison.avgDelayMinutes.current,
                        reportData.yoyComparison.avgDelayMinutes.previous,
                        ' min'
                      )}{' '}
                      (
                      {reportData.yoyComparison.avgDelayMinutes.current !== null
                        ? `${reportData.yoyComparison.avgDelayMinutes.current} min`
                        : '-'}
                      )
                    </p>
                  </div>
                  <div className="rounded-xl border border-dark-100 bg-dark-50 px-4 py-3">
                    <p className="text-xs text-dark-500 mb-1">Otkazani letovi</p>
                    <p className="text-sm font-semibold text-dark-900">
                      {formatDelta(
                        reportData.yoyComparison.cancelledRate.current,
                        reportData.yoyComparison.cancelledRate.previous,
                        ' pp'
                      )}{' '}
                      (
                      {reportData.yoyComparison.cancelledRate.current !== null
                        ? `${reportData.yoyComparison.cancelledRate.current}%`
                        : '-'}
                      )
                    </p>
                  </div>
                  <div className="rounded-xl border border-dark-100 bg-dark-50 px-4 py-3">
                    <p className="text-xs text-dark-500 mb-1">Top mjesec load faktora</p>
                    <p className="text-sm font-semibold text-dark-900">
                      {reportData.topMonths.byLoadFactor[0]
                        ? `${reportData.topMonths.byLoadFactor[0].month} · ${reportData.topMonths.byLoadFactor[0].loadFactor ?? '-'}%`
                        : '-'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-dark-100 bg-dark-50 px-4 py-3">
                    <p className="text-xs text-dark-500 mb-1">Top mjesec tačnosti</p>
                    <p className="text-sm font-semibold text-dark-900">
                      {reportData.topMonths.byOnTimeRate[0]
                        ? `${reportData.topMonths.byOnTimeRate[0].month} · ${reportData.topMonths.byOnTimeRate[0].onTimeRate ?? '-'}%`
                        : '-'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-dark-100 bg-dark-50 px-4 py-3">
                    <p className="text-xs text-dark-500 mb-1">Najjača ruta</p>
                    <p className="text-sm font-semibold text-dark-900">
                      {reportData.concentration.topRoutes[0]
                        ? `${reportData.concentration.topRoutes[0].route} · ${reportData.concentration.topRoutes[0].passengers.toLocaleString()}`
                        : '-'}
                    </p>
                  </div>
                  <div className="rounded-xl border border-dark-100 bg-dark-50 px-4 py-3">
                    <p className="text-xs text-dark-500 mb-1">Najjača aviokompanija</p>
                    <p className="text-sm font-semibold text-dark-900">
                      {reportData.concentration.topAirlines[0]
                        ? `${reportData.concentration.topAirlines[0].airline} · ${reportData.concentration.topAirlines[0].passengers.toLocaleString()}`
                        : '-'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {multiReportData && (
          <>
            {/* Section Divider */}
            <div className="relative py-8">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t-2 border-dark-200"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-dark-50 px-6 py-2 rounded-full border-2 border-dark-200">
                  <span className="text-sm font-bold text-dark-700 uppercase tracking-wide">Komparacija više godina</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {sortedYearsData.map((yearData, index) => {
                const prev = index > 0 ? sortedYearsData[index - 1] : null;
                const flightsGrowth = calcGrowth(
                  yearData.totals.flights,
                  prev?.totals.flights ?? null
                );
                const passengersGrowth = calcGrowth(
                  yearData.totals.totalPassengers,
                  prev?.totals.totalPassengers ?? null
                );
                const loadGrowth = calcGrowth(
                  yearData.loadFactor.overall,
                  prev?.loadFactor.overall ?? null
                );
                const onTimeGrowth = calcGrowth(
                  yearData.punctuality.overallOnTimeRate,
                  prev?.punctuality.overallOnTimeRate ?? null
                );

                return (
                  <div key={`kpi-${yearData.year}`} className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden group hover:shadow-soft-lg transition-all">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white/70 to-blue-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                    <div className="absolute top-0 right-0 -mt-2 -mr-2 w-20 h-20 bg-blue-200 rounded-full blur-3xl opacity-60 group-hover:opacity-80 transition-all"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-blue-50 rounded-xl">
                            <Calendar className="w-5 h-5 text-blue-600" />
                          </div>
                          <h3 className="text-xl font-bold text-dark-900">{yearData.year}</h3>
                        </div>
                        <span className="text-xs font-semibold text-dark-500 uppercase tracking-wide px-3 py-1 bg-dark-50 rounded-full">
                          {prev ? `vs ${prev.year}` : 'bazna'}
                        </span>
                      </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-white/50 border border-dark-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Plane className="w-3.5 h-3.5 text-blue-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Letovi</p>
                        </div>
                        <p className="text-2xl font-bold text-dark-900">
                          {yearData.totals.flights.toLocaleString()}
                        </p>
                        <p className={`text-xs font-semibold mt-1 ${flightsGrowth !== null && flightsGrowth >= 0 ? 'text-cyan-600' : 'text-rose-600'}`}>
                          {formatGrowth(flightsGrowth)}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/50 border border-dark-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-3.5 h-3.5 text-primary-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Putnici</p>
                        </div>
                        <p className="text-2xl font-bold text-dark-900">
                          {yearData.totals.totalPassengers.toLocaleString()}
                        </p>
                        <p className={`text-xs font-semibold mt-1 ${passengersGrowth !== null && passengersGrowth >= 0 ? 'text-cyan-600' : 'text-rose-600'}`}>
                          {formatGrowth(passengersGrowth)}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/50 border border-dark-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity className="w-3.5 h-3.5 text-indigo-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Load faktor</p>
                        </div>
                        <p className="text-2xl font-bold text-dark-900">
                          {yearData.loadFactor.overall !== null ? `${yearData.loadFactor.overall}%` : '-'}
                        </p>
                        <p className={`text-xs font-semibold mt-1 ${loadGrowth !== null && loadGrowth >= 0 ? 'text-cyan-600' : 'text-rose-600'}`}>
                          {formatGrowth(loadGrowth)}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/50 border border-dark-100">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Tačnost</p>
                        </div>
                        <p className="text-2xl font-bold text-dark-900">
                          {yearData.punctuality.overallOnTimeRate !== null ? `${yearData.punctuality.overallOnTimeRate}%` : '-'}
                        </p>
                        <p className={`text-xs font-semibold mt-1 ${onTimeGrowth !== null && onTimeGrowth >= 0 ? 'text-cyan-600' : 'text-rose-600'}`}>
                          {formatGrowth(onTimeGrowth)}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/50 border border-dark-100">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Prosj. kašnjenje</p>
                        </div>
                        <p className="text-2xl font-bold text-dark-900">
                          {yearData.punctuality.overallAvgDelayMinutes !== null
                            ? `${yearData.punctuality.overallAvgDelayMinutes} min`
                            : '-'}
                        </p>
                        <p className="text-xs text-dark-500 mt-1">
                          P95: {yearData.punctuality.delayPercentiles.p95 !== null
                            ? `${yearData.punctuality.delayPercentiles.p95} min`
                            : '-'}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-white/50 border border-dark-100">
                        <div className="flex items-center gap-2 mb-2">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Otkazani</p>
                        </div>
                        <p className="text-2xl font-bold text-dark-900">
                          {yearData.statusBreakdown.cancelledLegs}
                        </p>
                        <p className="text-xs text-dark-500 mt-1">
                          Stopa: {yearData.statusBreakdown.cancelledRate !== null
                            ? `${yearData.statusBreakdown.cancelledRate}%`
                            : '-'}
                        </p>
                      </div>
                    </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-6">
              {sortedYearsData.map((yearData) => (
                <div key={`extras-${yearData.year}`} className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
                  <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-indigo-200 rounded-full blur-3xl opacity-50"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-2.5 bg-indigo-50 rounded-xl">
                        <BarChart3 className="w-5 h-5 text-indigo-600" />
                      </div>
                      <h3 className="text-lg font-bold text-dark-900">
                        Dodatne metrike · {yearData.year}
                      </h3>
                    </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="rounded-2xl border-2 border-slate-100 bg-white p-6 hover:border-slate-200 hover:shadow-md transition-all">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-slate-50 rounded-lg">
                            <PieChart className="w-4 h-4 text-slate-600" />
                          </div>
                          <p className="text-sm font-bold text-dark-700">Koncentracija prometa</p>
                        </div>
                      </div>
                      <div className="space-y-5">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-dark-500 uppercase tracking-wide">Udio top 3 rute</p>
                            <div className="p-1.5 bg-slate-50 rounded-lg">
                              <TrendingUp className="w-3 h-3 text-slate-600" />
                            </div>
                          </div>
                          <p className="text-3xl font-bold text-slate-700 mb-3">
                            {yearData.concentration.topRoutesShare !== null
                              ? `${yearData.concentration.topRoutesShare}%`
                              : '-'}
                          </p>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 mb-4">
                            <div 
                              className="bg-gradient-to-r from-slate-400 to-slate-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${yearData.concentration.topRoutesShare ?? 0}%` }}
                            ></div>
                          </div>
                          <div className="space-y-2">
                            {yearData.concentration.topRoutes.map((route, idx) => (
                              <div key={`${yearData.year}-route-${route.route}`} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-all">
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">{idx + 1}</span>
                                  <span className="text-sm font-semibold text-dark-700">{route.route}</span>
                                </div>
                                <span className="text-sm font-bold text-slate-600">{route.passengers.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="pt-4 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-dark-500 uppercase tracking-wide">Udio top 3 aviokompanije</p>
                            <div className="p-1.5 bg-blue-50 rounded-lg">
                              <Plane className="w-3 h-3 text-blue-600" />
                            </div>
                          </div>
                          <p className="text-3xl font-bold text-blue-700 mb-3">
                            {yearData.concentration.topAirlinesShare !== null
                              ? `${yearData.concentration.topAirlinesShare}%`
                              : '-'}
                          </p>
                          <div className="w-full bg-blue-100 rounded-full h-1.5 mb-4">
                            <div 
                              className="bg-gradient-to-r from-blue-400 to-blue-600 h-1.5 rounded-full transition-all"
                              style={{ width: `${yearData.concentration.topAirlinesShare ?? 0}%` }}
                            ></div>
                          </div>
                          <div className="space-y-2">
                            {yearData.concentration.topAirlines.map((airline, idx) => (
                              <div key={`${yearData.year}-airline-${airline.airline}`} className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-all">
                                <div className="flex items-center gap-2">
                                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-200 text-blue-700 text-xs font-bold">{idx + 1}</span>
                                  <span className="text-sm font-semibold text-dark-700">{airline.airline}</span>
                                </div>
                                <span className="text-sm font-bold text-blue-600">{airline.passengers.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border-2 border-slate-100 bg-white p-6 hover:border-slate-200 hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <Activity className="w-4 h-4 text-slate-600" />
                        </div>
                        <p className="text-sm font-bold text-dark-700">Volatilnost i top mjeseci</p>
                      </div>
                      <div className="space-y-5">
                        <div className="p-4 rounded-xl bg-slate-50/50 border border-slate-200">
                          <p className="text-xs font-bold text-dark-500 uppercase tracking-wide mb-3">Volatilnost po mjesecima</p>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Users className="w-3.5 h-3.5 text-slate-600" />
                                <span className="text-sm font-medium text-dark-700">Std dev putnika</span>
                              </div>
                              <span className="text-lg font-bold text-slate-700">{yearData.volatility.passengersStdDev ?? '-'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Plane className="w-3.5 h-3.5 text-slate-600" />
                                <span className="text-sm font-medium text-dark-700">Std dev letova</span>
                              </div>
                              <span className="text-lg font-bold text-slate-700">{yearData.volatility.flightsStdDev ?? '-'}</span>
                            </div>
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-1.5 bg-blue-50 rounded-lg">
                                <Activity className="w-3 h-3 text-blue-600" />
                              </div>
                              <p className="text-xs font-bold text-dark-500 uppercase tracking-wide">Top load faktor</p>
                            </div>
                            <div className="space-y-2">
                              {yearData.topMonths.byLoadFactor.map((item, idx) => (
                                <div key={`${yearData.year}-lf-${item.monthNumber}`} className="flex items-center justify-between p-2 rounded-lg bg-blue-50/50 hover:bg-blue-50 transition-all">
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-200 text-blue-700 text-xs font-bold">{idx + 1}</span>
                                    <span className="text-sm font-medium text-dark-700">{item.month}</span>
                                  </div>
                                  <span className="text-sm font-bold text-blue-600">{item.loadFactor !== null ? `${item.loadFactor}%` : '-'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-1.5 bg-slate-50 rounded-lg">
                                <CheckCircle className="w-3 h-3 text-slate-600" />
                              </div>
                              <p className="text-xs font-bold text-dark-500 uppercase tracking-wide">Top tačnost</p>
                            </div>
                            <div className="space-y-2">
                              {yearData.topMonths.byOnTimeRate.map((item, idx) => (
                                <div key={`${yearData.year}-ot-${item.monthNumber}`} className="flex items-center justify-between p-2 rounded-lg bg-slate-50/50 hover:bg-slate-50 transition-all">
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-xs font-bold">{idx + 1}</span>
                                    <span className="text-sm font-medium text-dark-700">{item.month}</span>
                                  </div>
                                  <span className="text-sm font-bold text-slate-600">{item.onTimeRate !== null ? `${item.onTimeRate}%` : '-'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 rounded-2xl border-2 border-slate-100 bg-white p-6 hover:border-slate-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-2 mb-5">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <BarChart3 className="w-4 h-4 text-slate-600" />
                      </div>
                      <p className="text-sm font-bold text-dark-700">Sezonski trendovi</p>
                    </div>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 bg-blue-50 rounded-lg">
                            <BarChart3 className="w-3 h-3 text-blue-600" />
                          </div>
                          <p className="text-xs font-bold text-dark-500 uppercase tracking-wide">Kvartali</p>
                        </div>
                        <div className="space-y-3">
                          {yearData.seasonalityTrends.quarters.map((item, idx) => {
                            const maxPassengers = Math.max(...yearData.seasonalityTrends.quarters.map(q => q.passengers));
                            const percentage = (item.passengers / maxPassengers) * 100;
                            return (
                              <div key={`${yearData.year}-q-${item.label}`} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-100 text-blue-700 text-xs font-bold">Q{idx + 1}</span>
                                    <span className="text-sm font-semibold text-dark-700">{item.label}</span>
                                  </div>
                                  <span className="text-sm font-bold text-blue-600">{item.passengers.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-blue-50 rounded-full h-1.5">
                                  <div 
                                    className="bg-gradient-to-r from-blue-400 to-blue-600 h-1.5 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-dark-500">
                                  <span>{item.flights} letova</span>
                                  <span>Prosj: {item.avgPassengersPerMonth.toLocaleString()}/mj</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <div className="p-1.5 bg-slate-50 rounded-lg">
                            <Activity className="w-3 h-3 text-slate-600" />
                          </div>
                          <p className="text-xs font-bold text-dark-500 uppercase tracking-wide">Sezone</p>
                        </div>
                        <div className="space-y-3">
                          {yearData.seasonalityTrends.seasons.map((item) => {
                            const maxPassengers = Math.max(...yearData.seasonalityTrends.seasons.map(s => s.passengers));
                            const percentage = (item.passengers / maxPassengers) * 100;
                            const seasonIcons: Record<string, string> = {
                              'Proljeće': '🌸',
                              'Ljeto': '☀️',
                              'Jesen': '🍂',
                              'Zima': '❄️'
                            };
                            const seasonName = item.label.split(' ')[0];
                            return (
                              <div key={`${yearData.year}-s-${item.label}`} className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{seasonIcons[seasonName] || '📅'}</span>
                                    <span className="text-sm font-semibold text-dark-700">{item.label}</span>
                                  </div>
                                  <span className="text-sm font-bold text-slate-600">{item.passengers.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-slate-50 rounded-full h-1.5">
                                  <div 
                                    className="bg-gradient-to-r from-slate-400 to-slate-600 h-1.5 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-dark-500">
                                  <span>{item.flights} letova</span>
                                  <span>Prosj: {item.avgPassengersPerMonth.toLocaleString()}/mj</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 transition-all"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-primary-200 rounded-full blur-3xl opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-primary-50 rounded-xl">
                    <BarChart3 className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-dark-900">Komparacija godina</h3>
                    <p className="text-sm text-dark-500">Uporedni prikaz po mjesecima (svi grafici)</p>
                  </div>
                </div>
              <div className="space-y-8">
                <div>
                  <p className="text-sm font-bold text-dark-700 mb-4">Letovi</p>
                  <ResponsiveContainer width="100%" height={380}>
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
                      {sortedYearsData.map((yearData) => (
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
                  <p className="text-sm font-bold text-dark-700 mb-4">Putnici</p>
                  <ResponsiveContainer width="100%" height={380}>
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
                      {sortedYearsData.map((yearData) => (
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
                  <p className="text-sm font-bold text-dark-700 mb-4">Load faktor (%)</p>
                  <ResponsiveContainer width="100%" height={380}>
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
                      {sortedYearsData.map((yearData) => (
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
                  <p className="text-sm font-bold text-dark-700 mb-4">Tačnost (%)</p>
                  <ResponsiveContainer width="100%" height={380}>
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
                      {sortedYearsData.map((yearData) => (
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
                  <p className="text-sm font-bold text-dark-700 mb-4">Prosječno kašnjenje (min)</p>
                  <ResponsiveContainer width="100%" height={380}>
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
                      {sortedYearsData.map((yearData) => (
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
            </div>

            <div className="bg-white rounded-3xl shadow-soft p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-blue-50 rounded-xl">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-dark-900">Sažetak po godinama</h3>
              </div>
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
                    {sortedYearsData.map((yearData, index) => (
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

            <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 via-white/70 to-slate-100/50 opacity-70"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-slate-200 rounded-full blur-3xl opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-50 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-dark-900">Zajedničke rute kroz godine</h3>
                      <p className="text-sm text-dark-500">Komparativna analiza po rutama</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-slate-50 text-slate-700 text-xs font-semibold rounded-full">
                    {multiReportData.comparisons.commonRoutes.length} ruta
                  </span>
                </div>
              <div className="space-y-4">
                {multiReportData.comparisons.commonRoutes.map((route, index) => {
                  const orderedStats = [...route.perYear].sort((a, b) => a.year - b.year);
                  return (
                    <div
                      key={`route-compare-${route.route}-${index}`}
                      className="rounded-2xl border-2 border-dark-100 bg-white p-5 hover:border-slate-200 hover:shadow-md transition-all"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-50 rounded-lg">
                            <Plane className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="text-base font-bold text-dark-900">{route.route}</p>
                            <p className="text-xs text-dark-500">
                              Ukupno putnika: <span className="font-semibold text-dark-700">{route.totalPassengers.toLocaleString()}</span>
                            </p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-dark-50 text-dark-600 text-xs font-semibold rounded-full border border-dark-200">
                          Zajednička ruta
                        </span>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                        {orderedStats.map((stats, statsIndex) => {
                          const prev = statsIndex > 0 ? orderedStats[statsIndex - 1] : null;
                          const growth = calcGrowth(stats.passengers, prev?.passengers ?? null);
                          return (
                            <div
                              key={`route-${route.route}-${stats.year}`}
                              className="rounded-xl border border-dark-100 bg-gradient-to-br from-dark-50/50 to-white p-4 hover:shadow-sm transition-all"
                            >
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-dark-700 px-2 py-1 bg-blue-50 rounded-md">{stats.year}</span>
                                <span
                                  className={`text-xs font-bold px-2 py-1 rounded-md ${
                                    growth !== null && growth >= 0
                                      ? 'text-cyan-700 bg-cyan-50'
                                      : growth !== null
                                      ? 'text-rose-700 bg-rose-50'
                                      : 'text-dark-500 bg-dark-50'
                                  }`}
                                >
                                  {formatGrowth(growth)}
                                </span>
                              </div>
                              <div className="text-2xl font-bold text-dark-900 mb-3">
                                {stats.passengers.toLocaleString()}
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-dark-500">Letovi</span>
                                  <span className="font-semibold text-dark-700">{stats.flights}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-dark-500">Load faktor</span>
                                  <span className="font-semibold text-dark-700">{stats.loadFactor !== null ? `${stats.loadFactor}%` : '-'}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-dark-500">Tačnost</span>
                                  <span className="font-semibold text-dark-700">{stats.onTimeRate !== null ? `${stats.onTimeRate}%` : '-'}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-dark-500">Kašnjenje</span>
                                  <span className="font-semibold text-dark-700">{stats.avgDelayMinutes !== null ? `${stats.avgDelayMinutes} min` : '-'}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/70 to-blue-100/50 opacity-70"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <Plane className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-dark-900">Zajedničke aviokompanije kroz godine</h3>
                      <p className="text-sm text-dark-500">Komparativna analiza po aviokompanijama</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                    {multiReportData.comparisons.commonAirlines.length} aviokompanija
                  </span>
                </div>
              <div className="space-y-4">
                {multiReportData.comparisons.commonAirlines.map((airline, index) => (
                  <div key={`airline-compare-${airline.icaoCode}-${index}`} className="rounded-2xl border-2 border-dark-100 bg-white p-5 hover:border-blue-200 hover:shadow-md transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Plane className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-base font-bold text-dark-900">{airline.airline}</p>
                        <p className="text-xs text-dark-500">
                          ICAO: <span className="font-mono font-semibold text-dark-700">{airline.icaoCode}</span> · Ukupno putnika: <span className="font-semibold text-dark-700">{airline.totalPassengers.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                      {airline.perYear.map((stats, statsIndex) => {
                        const prev = statsIndex > 0 ? airline.perYear[statsIndex - 1] : null;
                        const growth = calcGrowth(stats.passengers, prev?.passengers ?? null);
                        return (
                          <div key={`airline-${airline.icaoCode}-${stats.year}`} className="rounded-xl border border-dark-100 bg-gradient-to-br from-dark-50/50 to-white p-4 hover:shadow-sm transition-all">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-dark-700 px-2 py-1 bg-blue-50 rounded-md">{stats.year}</span>
                              <span
                                className={`text-xs font-bold px-2 py-1 rounded-md ${
                                  growth !== null && growth >= 0
                                    ? 'text-cyan-700 bg-cyan-50'
                                    : growth !== null
                                    ? 'text-rose-700 bg-rose-50'
                                    : 'text-dark-500 bg-dark-50'
                                }`}
                              >
                                {formatGrowth(growth)}
                              </span>
                            </div>
                            <div className="text-2xl font-bold text-dark-900 mb-3">
                              {stats.passengers.toLocaleString()}
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-dark-500">Letovi</span>
                                <span className="font-semibold text-dark-700">{stats.flights}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-dark-500">Load faktor</span>
                                <span className="font-semibold text-dark-700">{stats.loadFactor !== null ? `${stats.loadFactor}%` : '-'}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-dark-500">Tačnost</span>
                                <span className="font-semibold text-dark-700">{stats.onTimeRate !== null ? `${stats.onTimeRate}%` : '-'}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-dark-500">Kašnjenje</span>
                                <span className="font-semibold text-dark-700">{stats.avgDelayMinutes !== null ? `${stats.avgDelayMinutes} min` : '-'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              </div>
            </div>

            {sortedYearsData.length >= 2 && (
              <div className="bg-white rounded-3xl shadow-soft p-8 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-white/70 to-purple-100/50 opacity-70"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-purple-200 rounded-full blur-3xl opacity-50"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-purple-50 rounded-xl">
                      <TrendingUp className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-dark-900">
                        Najznačajnije promjene (posljednje dvije godine)
                      </h3>
                      <p className="text-sm text-dark-500">Year-over-year komparacija ključnih metrika</p>
                    </div>
                  </div>
                {(() => {
                  const latest = sortedYearsData[sortedYearsData.length - 1];
                  const prev = sortedYearsData[sortedYearsData.length - 2];
                  const flightsGrowth = calcGrowth(latest.totals.flights, prev.totals.flights);
                  const passengersGrowth = calcGrowth(
                    latest.totals.totalPassengers,
                    prev.totals.totalPassengers
                  );
                  const loadDelta = formatDelta(
                    latest.loadFactor.overall,
                    prev.loadFactor.overall,
                    ' pp'
                  );
                  const onTimeDelta = formatDelta(
                    latest.punctuality.overallOnTimeRate,
                    prev.punctuality.overallOnTimeRate,
                    ' pp'
                  );
                  const avgDelayDelta = formatDelta(
                    latest.punctuality.overallAvgDelayMinutes,
                    prev.punctuality.overallAvgDelayMinutes,
                    ' min'
                  );
                  const cancelDelta = formatDelta(
                    latest.statusBreakdown.cancelledRate,
                    prev.statusBreakdown.cancelledRate,
                    ' pp'
                  );
                  const topRoutesDelta = formatDelta(
                    latest.concentration.topRoutesShare,
                    prev.concentration.topRoutesShare,
                    ' pp'
                  );
                  const topAirlinesDelta = formatDelta(
                    latest.concentration.topAirlinesShare,
                    prev.concentration.topAirlinesShare,
                    ' pp'
                  );
                  const passengersStdDelta = formatDelta(
                    latest.volatility.passengersStdDev,
                    prev.volatility.passengersStdDev,
                    ''
                  );
                  const flightsStdDelta = formatDelta(
                    latest.volatility.flightsStdDev,
                    prev.volatility.flightsStdDev,
                    ''
                  );
                  const latestTopLoad = latest.topMonths.byLoadFactor[0] ?? null;
                  const prevTopLoad = prev.topMonths.byLoadFactor[0] ?? null;
                  const latestTopOnTime = latest.topMonths.byOnTimeRate[0] ?? null;
                  const prevTopOnTime = prev.topMonths.byOnTimeRate[0] ?? null;
                  const topLoadDelta = formatDelta(
                    latestTopLoad?.loadFactor ?? null,
                    prevTopLoad?.loadFactor ?? null,
                    ' pp'
                  );
                  const topOnTimeDelta = formatDelta(
                    latestTopOnTime?.onTimeRate ?? null,
                    prevTopOnTime?.onTimeRate ?? null,
                    ' pp'
                  );

                  return (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <div className="rounded-xl border border-dark-100 bg-white/80 p-4 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <Users className="w-4 h-4 text-primary-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Putnici</p>
                        </div>
                        <p className={`text-2xl font-bold mb-2 ${
                          passengersGrowth !== null && passengersGrowth >= 0 ? 'text-cyan-600' : 'text-rose-600'
                        }`}>
                          {formatGrowth(passengersGrowth)}
                        </p>
                        <p className="text-xs text-dark-500">
                          {latest.totals.totalPassengers.toLocaleString()} vs {prev.totals.totalPassengers.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl border border-dark-100 bg-white/80 p-4 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <Plane className="w-4 h-4 text-blue-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Letovi</p>
                        </div>
                        <p className={`text-2xl font-bold mb-2 ${
                          flightsGrowth !== null && flightsGrowth >= 0 ? 'text-cyan-600' : 'text-rose-600'
                        }`}>
                          {formatGrowth(flightsGrowth)}
                        </p>
                        <p className="text-xs text-dark-500">
                          {latest.totals.flights.toLocaleString()} vs {prev.totals.flights.toLocaleString()}
                        </p>
                      </div>
                      <div className="rounded-xl border border-dark-100 bg-white/80 p-4 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="w-4 h-4 text-indigo-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Load faktor</p>
                        </div>
                        <p className="text-2xl font-bold mb-2 text-dark-900">
                          {loadDelta}
                        </p>
                        <p className="text-xs text-dark-500">
                          {latest.loadFactor.overall !== null ? `${latest.loadFactor.overall}%` : '-'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-dark-100 bg-white/80 p-4 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Tačnost</p>
                        </div>
                        <p className="text-2xl font-bold mb-2 text-dark-900">
                          {onTimeDelta}
                        </p>
                        <p className="text-xs text-dark-500">
                          {latest.punctuality.overallOnTimeRate !== null ? `${latest.punctuality.overallOnTimeRate}%` : '-'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-dark-100 bg-white/80 p-4 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Prosj. kašnjenje</p>
                        </div>
                        <p className="text-2xl font-bold mb-2 text-dark-900">
                          {avgDelayDelta}
                        </p>
                        <p className="text-xs text-dark-500">
                          {latest.punctuality.overallAvgDelayMinutes !== null ? `${latest.punctuality.overallAvgDelayMinutes} min` : '-'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-dark-100 bg-white/80 p-4 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <XCircle className="w-4 h-4 text-red-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Otkazani letovi</p>
                        </div>
                        <p className="text-2xl font-bold mb-2 text-dark-900">
                          {cancelDelta}
                        </p>
                        <p className="text-xs text-dark-500">
                          {latest.statusBreakdown.cancelledRate !== null ? `${latest.statusBreakdown.cancelledRate}%` : '-'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-dark-100 bg-white/80 p-4 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <PieChart className="w-4 h-4 text-purple-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Konc. top rute</p>
                        </div>
                        <p className="text-2xl font-bold mb-2 text-dark-900">
                          {topRoutesDelta}
                        </p>
                        <p className="text-xs text-dark-500">
                          {latest.concentration.topRoutesShare !== null ? `${latest.concentration.topRoutesShare}%` : '-'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-dark-100 bg-white/80 p-4 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <PieChart className="w-4 h-4 text-pink-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Konc. top airline</p>
                        </div>
                        <p className="text-2xl font-bold mb-2 text-dark-900">
                          {topAirlinesDelta}
                        </p>
                        <p className="text-xs text-dark-500">
                          {latest.concentration.topAirlinesShare !== null ? `${latest.concentration.topAirlinesShare}%` : '-'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-dark-100 bg-white/80 p-4 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="w-4 h-4 text-orange-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Volatilnost putnika</p>
                        </div>
                        <p className="text-2xl font-bold mb-2 text-dark-900">
                          {passengersStdDelta}
                        </p>
                        <p className="text-xs text-dark-500">
                          {latest.volatility.passengersStdDev ?? '-'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-dark-100 bg-white/80 p-4 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <Activity className="w-4 h-4 text-cyan-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Volatilnost letova</p>
                        </div>
                        <p className="text-2xl font-bold mb-2 text-dark-900">
                          {flightsStdDelta}
                        </p>
                        <p className="text-xs text-dark-500">
                          {latest.volatility.flightsStdDev ?? '-'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-dark-100 bg-white/80 p-4 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <TrendingUp className="w-4 h-4 text-indigo-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Top mjesec LF</p>
                        </div>
                        <p className="text-2xl font-bold mb-2 text-dark-900">
                          {topLoadDelta}
                        </p>
                        <p className="text-xs text-dark-500">
                          {latestTopLoad ? `${latestTopLoad.month} · ${latestTopLoad.loadFactor ?? '-'}%` : '-'}
                        </p>
                      </div>
                      <div className="rounded-xl border border-dark-100 bg-white/80 p-4 hover:shadow-sm transition-all">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="text-xs font-semibold text-dark-500 uppercase tracking-wide">Top mjesec tačnosti</p>
                        </div>
                        <p className="text-2xl font-bold mb-2 text-dark-900">
                          {topOnTimeDelta}
                        </p>
                        <p className="text-xs text-dark-500">
                          {latestTopOnTime ? `${latestTopOnTime.month} · ${latestTopOnTime.onTimeRate ?? '-'}%` : '-'}
                        </p>
                      </div>
                    </div>
                  );
                })()}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}
