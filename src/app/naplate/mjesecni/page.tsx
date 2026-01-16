'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { CalendarRange, Download, ChevronDown, Users, Euro, Wallet, TrendingUp, Plane, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showToast } from '@/components/ui/toast';
import { aggregateDailyReports, getCarrierMonthlyTotals } from '@/lib/naplate-aggregate';
import {
  carrierLabels,
  createEmptyDailyReport,
  getAirportTotalKm,
  getCarrierTotalEur,
  getGrandTotalKm,
  getServiceAmount,
  normalizeDailyReport,
  type CarrierKey,
  type DailyReport,
} from '@/lib/naplate-config';

const toDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDefaultRange = () => {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { from: toDateInput(from), to: toDateInput(to) };
};

export default function MjesecniIzvjestajiPage() {
  const defaultRange = getDefaultRange();
  const [rangeFrom, setRangeFrom] = useState(defaultRange.from);
  const [rangeTo, setRangeTo] = useState(defaultRange.to);
  const [report, setReport] = useState<DailyReport>(() => createEmptyDailyReport(defaultRange.from));
  const [dailyReports, setDailyReports] = useState<DailyReport[]>([]);
  const [carrierSelection, setCarrierSelection] = useState<string>('');
  const [expandedCarriers, setExpandedCarriers] = useState<Record<CarrierKey, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const carrierKeys = useMemo(
    () => (Array.isArray(report.carrierOrder) && report.carrierOrder.length
      ? report.carrierOrder
      : Object.keys(report.carriers || {})),
    [report.carrierOrder, report.carriers]
  );

  useEffect(() => {
    setCarrierSelection((prev) => (prev && carrierKeys.includes(prev) ? prev : carrierKeys[0] || ''));
    setExpandedCarriers((prev) => {
      const next = { ...prev };
      carrierKeys.forEach((carrier) => {
        if (next[carrier] === undefined) {
          next[carrier] = false;
        }
      });
      return next;
    });
  }, [carrierKeys]);

  useEffect(() => {
    void loadRange();
  }, []);

  const loadRange = async () => {
    if (!rangeFrom || !rangeTo) {
      showToast('Odaberite početni i krajnji datum', 'error');
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch(`/api/naplate/reports?type=DAILY&from=${rangeFrom}&to=${rangeTo}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || 'Greška pri učitavanju izvještaja');
      }
      const data = await response.json();
      const reports = Array.isArray(data?.reports) ? data.reports : [];
      const normalized = reports.map((item: any) => normalizeDailyReport(item.data)).filter(Boolean);
      setDailyReports(normalized);
      const aggregated = aggregateDailyReports(normalized, `${rangeFrom} - ${rangeTo}`);
      setReport(aggregated);
    } catch (error: any) {
      console.error('Error loading monthly range:', error);
      showToast(error?.message || 'Greška pri učitavanju izvještaja', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const totalEur = useMemo(() => (
    carrierKeys.reduce((sum, carrier) => sum + getCarrierTotalEur(report, carrier), 0)
  ), [report, carrierKeys]);
  const totalAirportKm = useMemo(() => getAirportTotalKm(report), [report]);
  const grandTotalKm = useMemo(() => getGrandTotalKm(report), [report]);
  const airportServicesTotal = useMemo(
    () => report.airportServices.reduce((sum, item) => sum + getServiceAmount(item), 0),
    [report.airportServices]
  );

  // Chart data
  const pieChartData = useMemo(() => {
    return carrierKeys.map((carrier) => {
      const totals = getCarrierMonthlyTotals(report, carrier as CarrierKey);
      return {
        name: report.carriers[carrier]?.label || carrierLabels[carrier] || carrier,
        value: totals.totalEur,
        carrier,
      };
    }).filter(item => item.value > 0);
  }, [report, carrierKeys]);

  const barChartData = useMemo(() => {
    return carrierKeys.map((carrier) => {
      const totals = getCarrierMonthlyTotals(report, carrier as CarrierKey);
      return {
        name: report.carriers[carrier]?.label || carrierLabels[carrier] || carrier,
        'Usluge (EUR)': totals.servicesEur,
        'Bookings (EUR)': totals.bookingsEur,
        'Airport KM': totals.airportRemunerationKm,
        'Provizija KM': totals.commissionKm,
      };
    });
  }, [report, carrierKeys]);

  const stackedBarData = useMemo(() => {
    return carrierKeys.map((carrier) => {
      const totals = getCarrierMonthlyTotals(report, carrier as CarrierKey);
      return {
        name: report.carriers[carrier]?.label || carrierLabels[carrier] || carrier,
        'Usluge': totals.servicesEur,
        'Bookings': totals.bookingsEur,
      };
    });
  }, [report, carrierKeys]);

  const dailyTrendData = useMemo(() => {
    return dailyReports.map((dayReport) => {
      const totalEurForDay = Object.keys(dayReport.carriers || {}).reduce((sum, carrier) => {
        const totals = getCarrierMonthlyTotals(dayReport, carrier as CarrierKey);
        return sum + totals.totalEur;
      }, 0);
      return {
        date: dayReport.date,
        'Ukupno EUR': totalEurForDay,
      };
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [dailyReports]);

  const COLORS = ['#9333ea', '#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

  const getCarrierBadgeClass = (carrier: string) => {
    if (carrier === 'wizz') return 'bg-purple-100 text-purple-700';
    if (carrier === 'ajet') return 'bg-blue-100 text-blue-700';
    if (carrier === 'pegasus') return 'bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-600';
  };
  const getBookingSummary = (carrier: CarrierKey) => {
    const totals = report.carriers[carrier]?.bookings?.transactions?.reduce(
      (acc, txn) => {
        acc.pax += Number(txn.pax || 0);
        acc.amountEur += Number(txn.amountEur || 0);
        acc.airportRemunerationKm += Number(txn.airportRemunerationKm || 0);
        acc.commissionKm += Number(txn.commissionKm || 0);
        return acc;
      },
      { pax: 0, amountEur: 0, airportRemunerationKm: 0, commissionKm: 0 }
    );
    return totals || { pax: 0, amountEur: 0, airportRemunerationKm: 0, commissionKm: 0 };
  };

  const exportMonthly = async (mode: 'sky-speed' | 'carrier-airport' | 'general') => {
    try {
      setIsExporting(true);
      const params = new URLSearchParams({
        from: rangeFrom,
        to: rangeTo,
        mode,
      });
      if (mode !== 'general') {
        if (!carrierSelection) {
          showToast('Odaberite aviokompaniju za eksport', 'error');
          return;
        }
        params.set('carrier', carrierSelection);
      }
      const response = await fetch(`/api/naplate/export-monthly?${params.toString()}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || 'Greška pri eksportu');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const filename = response.headers.get('Content-Disposition')?.split('filename=')?.[1]?.replace(/"/g, '') || 'mjesecni-izvjestaj.xlsx';
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Monthly export error:', error);
      showToast(error?.message || 'Greška pri eksportu', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft-lg p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-24 -mt-24"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-50 rounded-full blur-3xl -ml-16 -mb-16"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 shadow-soft">
              <CalendarRange className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-dark-900">Mjesečni naplatni izvještaj</h1>
              <p className="text-slate-600 mt-2">Pregled naplate po aviokompanijama i aerodromskim uslugama</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-soft">
              <Label className="text-xs text-slate-500">Od</Label>
              <Input
                type="date"
                value={rangeFrom}
                onChange={(e) => setRangeFrom(e.target.value)}
                className="border-none p-0 h-auto text-sm"
              />
            </div>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-soft">
              <Label className="text-xs text-slate-500">Do</Label>
              <Input
                type="date"
                value={rangeTo}
                onChange={(e) => setRangeTo(e.target.value)}
                className="border-none p-0 h-auto text-sm"
              />
            </div>
            <Button variant="outline" onClick={loadRange} disabled={isLoading}>
              {isLoading ? 'Učitavam...' : 'Učitaj'}
            </Button>
          </div>
        </div>
      </div>

      {/* Section Divider */}
      <div className="relative py-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-slate-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wide shadow-lg">
            Pregled Naplate
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer relative overflow-hidden border-[6px] border-white">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[2px] transition-all"></div>
            <div className="absolute top-0 right-0 -mt-2 -mr-2 w-24 h-24 bg-blue-200 rounded-full blur-2xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mb-12 -ml-12 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>

            <div className="relative z-10 space-y-5">
              <div className="flex justify-between items-start">
                <div className="p-3.5 rounded-2xl bg-blue-50 group-hover:scale-110 transition-transform">
                  <Download className="w-6 h-6 text-blue-600" />
                </div>
                <span className="px-3 py-1 bg-dark-50 rounded-full text-[10px] font-bold text-dark-500 uppercase tracking-wide">
                  XLSX
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-dark-900 mb-1">Eksport mjesečnih izvještaja</h2>
                <p className="text-sm text-dark-500">Preuzmi izvještaje u različitim formatima</p>
              </div>

              <div className="space-y-3">
                <div>
                  <Label className="text-[11px] uppercase tracking-wide text-slate-500 font-bold mb-2 block">Aviokompanija</Label>
                  <select
                    value={carrierSelection}
                    onChange={(event) => setCarrierSelection(event.target.value)}
                    className="w-full rounded-xl border-2 border-slate-200 px-3 py-2.5 text-sm bg-white font-medium text-dark-900 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                  >
                    {carrierKeys.map((carrier) => (
                      <option key={carrier} value={carrier}>
                        {report.carriers[carrier]?.label || carrierLabels[carrier] || carrier}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 hover:bg-blue-50 hover:border-blue-200 transition-all"
                    disabled={isExporting}
                    onClick={() => exportMonthly('sky-speed')}
                  >
                    <Download className="w-4 h-4" />
                    <span className="flex-1 text-left">Sky speed only</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 hover:bg-blue-50 hover:border-blue-200 transition-all"
                    disabled={isExporting}
                    onClick={() => exportMonthly('carrier-airport')}
                  >
                    <Download className="w-4 h-4" />
                    <span className="flex-1 text-left">Wizz + airport format</span>
                  </Button>
                  <Button
                    className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 transition-all"
                    disabled={isExporting}
                    onClick={() => exportMonthly('general')}
                  >
                    <Download className="w-4 h-4" />
                    <span className="flex-1 text-left">Generalni izvještaj</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-6 text-white shadow-soft-xl hover:shadow-2xl transition-all group relative overflow-hidden border-[6px] border-dark-800">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:opacity-10 group-hover:scale-110 transition-all"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12 group-hover:opacity-20 group-hover:scale-110 transition-all"></div>

            <div className="relative z-10 space-y-5">
              <div className="flex justify-between items-start">
                <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-white uppercase tracking-wide backdrop-blur-md">
                  TOTALI
                </span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-white mb-1">Ukupni promet</h2>
                <p className="text-sm text-dark-200">Sveukupni pregled naplate</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-2">
                    <Euro className="w-4 h-4 text-green-300" />
                    <span className="text-dark-200">Ukupno EUR</span>
                  </div>
                  <span className="font-bold text-white text-lg">{totalEur.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-300" />
                    <span className="text-dark-200">Airport Tuzla (KM)</span>
                  </div>
                  <span className="font-bold text-blue-200 text-lg">{totalAirportKm.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 hover:from-white/20 hover:to-white/10 transition-all">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-300" />
                    <span className="uppercase tracking-wide text-xs font-bold text-dark-300">Ukupno KM</span>
                  </div>
                  <span className="font-bold text-3xl text-white">{grandTotalKm.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-soft-lg p-7 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/60 via-white/70 to-slate-100/60 opacity-80"></div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-slate-200 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-60"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                <h2 className="text-lg font-bold text-slate-900">Promet po aviokompanijama</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-600">
                      <th className="py-3 text-left bg-slate-50 rounded-tl-xl">Aviokompanija</th>
                      <th className="py-3 text-right bg-slate-50">Usluge EUR</th>
                      <th className="py-3 text-right bg-slate-50">Booking EUR</th>
                      <th className="py-3 text-right bg-slate-50">Ukupno EUR</th>
                      <th className="py-3 text-right bg-slate-50">Airport remun. KM</th>
                      <th className="py-3 text-right bg-slate-50 rounded-tr-xl">Provizija KM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {carrierKeys.map((carrier) => {
                      const isExpanded = expandedCarriers[carrier as CarrierKey];
                      const totals = getCarrierMonthlyTotals(report, carrier as CarrierKey);
                      const bookingSummary = getBookingSummary(carrier as CarrierKey);
                      const services = report.carriers[carrier]?.services || [];
                      return (
                        <Fragment key={carrier}>
                          <tr
                            className="hover:bg-slate-50/70 transition-all duration-200 cursor-pointer group"
                            onClick={() =>
                              setExpandedCarriers((prev) => ({
                                ...prev,
                                [carrier]: !isExpanded,
                              }))
                            }
                          >
                            <td className="py-3 text-slate-700 font-semibold">
                              <div className="flex items-center gap-3">
                                <ChevronDown
                                  className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                />
                                <Plane className={`w-4 h-4 ${carrier === 'wizz' ? 'text-purple-600' : carrier === 'ajet' ? 'text-blue-600' : carrier === 'pegasus' ? 'text-amber-600' : 'text-slate-500'}`} />
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getCarrierBadgeClass(carrier)}`}>
                                  {report.carriers[carrier]?.label || carrierLabels[carrier] || carrier}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Euro className="w-3.5 h-3.5 text-slate-400" />
                                <span>{totals.servicesEur.toFixed(2)}</span>
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Euro className="w-3.5 h-3.5 text-slate-400" />
                                <span>{totals.bookingsEur.toFixed(2)}</span>
                              </div>
                            </td>
                            <td className="py-3 text-right font-semibold">
                              <div className="flex items-center justify-end gap-1.5">
                                <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                                <span>{totals.totalEur.toFixed(2)}</span>
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Wallet className="w-3.5 h-3.5 text-blue-400" />
                                <span>{totals.airportRemunerationKm.toFixed(2)}</span>
                              </div>
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Wallet className="w-3.5 h-3.5 text-amber-400" />
                                <span>{totals.commissionKm.toFixed(2)}</span>
                              </div>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="animate-in fade-in slide-in-from-top-2 duration-300">
                              <td colSpan={6} className="py-4">
                                <div className={`rounded-2xl border overflow-hidden shadow-lg relative ${
                                  carrier === 'wizz' ? 'border-purple-200 bg-gradient-to-br from-purple-50/80 via-white to-purple-50/50' :
                                  carrier === 'ajet' ? 'border-blue-200 bg-gradient-to-br from-blue-50/80 via-white to-blue-50/50' :
                                  carrier === 'pegasus' ? 'border-amber-200 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/50' :
                                  'border-slate-200 bg-gradient-to-br from-slate-50/80 via-white to-slate-50/50'
                                }`}>
                                  <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 -mr-12 -mt-12 ${
                                    carrier === 'wizz' ? 'bg-purple-400' :
                                    carrier === 'ajet' ? 'bg-blue-400' :
                                    carrier === 'pegasus' ? 'bg-amber-400' :
                                    'bg-slate-400'
                                  }`}></div>
                                  <div className={`absolute bottom-0 left-0 w-24 h-24 rounded-full blur-3xl opacity-20 -ml-8 -mb-8 ${
                                    carrier === 'wizz' ? 'bg-purple-300' :
                                    carrier === 'ajet' ? 'bg-blue-300' :
                                    carrier === 'pegasus' ? 'bg-amber-300' :
                                    'bg-slate-300'
                                  }`}></div>

                                  {/* Progress bar showing percentage of total */}
                                  <div className="px-5 pt-4 pb-3 relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold text-slate-600">Udio u ukupnom prometu</span>
                                      <span className="text-sm font-bold text-slate-800">
                                        {((totals.totalEur / totalEur) * 100).toFixed(1)}%
                                      </span>
                                    </div>
                                    <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full transition-all duration-500 ${
                                          carrier === 'wizz' ? 'bg-gradient-to-r from-purple-500 to-purple-600' :
                                          carrier === 'ajet' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                          carrier === 'pegasus' ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                                          'bg-gradient-to-r from-slate-500 to-slate-600'
                                        }`}
                                        style={{ width: `${(totals.totalEur / totalEur) * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>

                                  <div className="p-5 relative z-10">
                                    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
                                      <div>
                                        <div className="flex items-center gap-2 mb-4">
                                          <div className={`w-1 h-5 rounded-full ${
                                            carrier === 'wizz' ? 'bg-purple-600' :
                                            carrier === 'ajet' ? 'bg-blue-600' :
                                            carrier === 'pegasus' ? 'bg-amber-600' :
                                            'bg-slate-600'
                                          }`}></div>
                                          <Euro className="w-4 h-4 text-slate-500" />
                                          <p className="text-sm font-bold text-slate-800">Usluge</p>
                                        </div>
                                        <div className="space-y-2.5 text-sm">
                                          {services.map((service) => (
                                            <div key={service.id} className="flex items-center justify-between bg-white/60 rounded-xl px-3 py-2.5 border border-slate-100">
                                              <div className="flex items-center gap-2">
                                                <span className="text-slate-700 font-medium">{service.label}</span>
                                                <span className="px-2 py-0.5 bg-slate-100 rounded-md text-xs text-slate-500 font-semibold">
                                                  x{service.qty}
                                                </span>
                                              </div>
                                              <div className="flex items-center gap-1.5">
                                                <Euro className="w-3.5 h-3.5 text-slate-400" />
                                                <span className="font-semibold text-slate-800">{getServiceAmount(service).toFixed(2)}</span>
                                              </div>
                                            </div>
                                          ))}
                                          {services.length === 0 && (
                                            <div className="text-xs text-slate-500 bg-white/40 rounded-xl px-3 py-4 text-center border border-slate-100">
                                              Nema unesenih usluga.
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-4">
                                          <div className={`w-1 h-5 rounded-full ${
                                            carrier === 'wizz' ? 'bg-purple-600' :
                                            carrier === 'ajet' ? 'bg-blue-600' :
                                            carrier === 'pegasus' ? 'bg-amber-600' :
                                            'bg-slate-600'
                                          }`}></div>
                                          <Users className="w-4 h-4 text-slate-500" />
                                          <p className="text-sm font-bold text-slate-800">Bookings</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                          <div className="rounded-xl border border-slate-100 bg-white/70 p-3.5 shadow-sm">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                              <Users className="w-3.5 h-3.5 text-blue-500" />
                                              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">PAX</p>
                                            </div>
                                            <p className="text-lg font-bold text-slate-900">{bookingSummary.pax}</p>
                                          </div>
                                          <div className="rounded-xl border border-slate-100 bg-white/70 p-3.5 shadow-sm">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                              <Euro className="w-3.5 h-3.5 text-green-500" />
                                              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Iznos EUR</p>
                                            </div>
                                            <p className="text-lg font-bold text-slate-900">{bookingSummary.amountEur.toFixed(2)}</p>
                                          </div>
                                          <div className="rounded-xl border border-slate-100 bg-white/70 p-3.5 shadow-sm">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                              <Wallet className="w-3.5 h-3.5 text-blue-500" />
                                              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Airport KM</p>
                                            </div>
                                            <p className="text-lg font-bold text-slate-900">{bookingSummary.airportRemunerationKm.toFixed(2)}</p>
                                          </div>
                                          <div className="rounded-xl border border-slate-100 bg-white/70 p-3.5 shadow-sm">
                                            <div className="flex items-center gap-1.5 mb-1.5">
                                              <Wallet className="w-3.5 h-3.5 text-amber-500" />
                                              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-bold">Provizija KM</p>
                                            </div>
                                            <p className="text-lg font-bold text-slate-900">{bookingSummary.commissionKm.toFixed(2)}</p>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Airport Services Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-soft-lg p-7 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/70 to-indigo-100/50 opacity-70"></div>
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-40"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                <h2 className="text-lg font-bold text-slate-900">Aerodromske usluge</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-600">
                      <th className="py-3 text-left bg-slate-50 rounded-tl-xl">Usluga</th>
                      <th className="py-3 text-right bg-slate-50">Količina</th>
                      <th className="py-3 text-right bg-slate-50">Cijena (KM)</th>
                      <th className="py-3 text-right bg-slate-50 rounded-tr-xl">Ukupno (KM)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {report.airportServices.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 text-slate-700 font-medium">{item.label}</td>
                        <td className="py-3 text-right text-slate-600">
                          <span className="px-2 py-0.5 bg-slate-100 rounded-md text-xs font-semibold">
                            {item.qty || '-'}
                          </span>
                        </td>
                        <td className="py-3 text-right text-slate-600">
                          {item.price ? `${item.price.toFixed(2)}` : '-'}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Wallet className="w-3.5 h-3.5 text-blue-400" />
                            <span className="font-semibold text-slate-800">
                              {getServiceAmount(item).toFixed(2)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                    <tr className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 text-slate-700 font-medium">Korekcije / povrat</td>
                      <td className="py-3 text-right text-slate-600">-</td>
                      <td className="py-3 text-right text-slate-600">-</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-semibold text-slate-800">
                            {(report.adjustmentsAmount || 0).toFixed(2)}
                          </span>
                        </div>
                      </td>
                    </tr>
                    <tr className="border-t-2 border-slate-300 bg-slate-50/80">
                      <td colSpan={3} className="py-4 text-slate-900 font-bold text-base">
                        Ukupno aerodromske usluge
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="font-bold text-slate-900 text-lg">
                            {(airportServicesTotal + (report.adjustmentsAmount || 0)).toFixed(2)} KM
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="relative py-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t-2 border-slate-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wide shadow-lg">
            Analitika i Dijagrami
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Revenue Distribution */}
        <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-white/70 to-purple-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
          <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-purple-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-50 rounded-2xl">
                  <PieChartIcon className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-dark-900">Raspodjela prometa</h3>
                  <p className="text-sm text-dark-500">Po aviokompanijama (EUR)</p>
                </div>
              </div>
            </div>
            <div className="h-[320px] w-full">
              {pieChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => [`${value.toFixed(2)} EUR`, 'Promet']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-dark-400">Nema podataka</div>
              )}
            </div>
          </div>
        </div>

        {/* Stacked Bar Chart - Services vs Bookings */}
        <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/70 to-blue-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
          <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 rounded-2xl">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-dark-900">Usluge vs Bookings</h3>
                  <p className="text-sm text-dark-500">Struktura prihoda (EUR)</p>
                </div>
              </div>
            </div>
            <div className="h-[320px] w-full">
              {stackedBarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stackedBarData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => `${value.toFixed(2)} EUR`}
                    />
                    <Legend />
                    <Bar dataKey="Usluge" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="Bookings" stackId="a" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-dark-400">Nema podataka</div>
              )}
            </div>
          </div>
        </div>

        {/* Bar Chart - Carrier Comparison */}
        <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group lg:col-span-2">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
          <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-indigo-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 rounded-2xl">
                  <BarChart3 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-dark-900">Uporedba aviokompanija</h3>
                  <p className="text-sm text-dark-500">Sveobuhvatni pregled metrika</p>
                </div>
              </div>
            </div>
            <div className="h-[340px] w-full">
              {barChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 12 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 12 }}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => value.toFixed(2)}
                    />
                    <Legend />
                    <Bar dataKey="Usluge (EUR)" fill="#3b82f6" />
                    <Bar dataKey="Bookings (EUR)" fill="#8b5cf6" />
                    <Bar dataKey="Airport KM" fill="#10b981" />
                    <Bar dataKey="Provizija KM" fill="#f59e0b" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-dark-400">Nema podataka</div>
              )}
            </div>
          </div>
        </div>

        {/* Line Chart - Daily Trend */}
        <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group lg:col-span-2">
          <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-white/70 to-green-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
          <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-green-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-green-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-50 rounded-2xl">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-dark-900">Trend naplate po danima</h3>
                  <p className="text-sm text-dark-500">Dnevni promet u odabranom periodu</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-semibold">
                {dailyTrendData.length} dana
              </span>
            </div>
            <div className="h-[320px] w-full">
              {dailyTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyTrendData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 12 }}
                      tickFormatter={(date) => {
                        const d = new Date(date);
                        return `${d.getDate()}/${d.getMonth() + 1}`;
                      }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 12 }}
                      tickFormatter={(value) => `${value.toFixed(0)}`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                      formatter={(value: number) => [`${value.toFixed(2)} EUR`, 'Promet']}
                      labelFormatter={(date) => {
                        const d = new Date(date);
                        return d.toLocaleDateString('bs-BA');
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="Ukupno EUR"
                      stroke="#10b981"
                      strokeWidth={4}
                      dot={{ r: 5, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7, fill: '#059669', strokeWidth: 0 }}
                      fill="url(#colorRevenue)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-dark-400">
                  Nema podataka za odabrani period
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
