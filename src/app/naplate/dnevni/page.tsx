'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { Calendar, FileText, Upload, Save, RefreshCcw, Plane, TrendingUp, Building2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showConfirmToast, showToast } from '@/components/ui/toast';
import { getTodayDateString } from '@/lib/dates';
import {
  carrierLabels,
  createCarrierKey,
  createEmptyCarrierReport,
  createEmptyDailyReport,
  createServiceItem,
  getCarrierFeeTotal,
  getCarrierTotalEur,
  getAirportTotalKm,
  getGrandTotalKm,
  getServiceAmount,
  normalizeDailyReport,
  createBookingTransaction,
  getBookingTotals,
  type CarrierKey,
  type DailyReport,
  type ServiceItem,
} from '@/lib/naplate-config';
const donationServiceId = 'airport_donation';
const pnrPattern = /^[A-Z0-9]{6}$/;
const normalizePnr = (value: string) => value.trim().toUpperCase();
const emptyBookingDraft = {
  open: false,
  pnr: '',
  pax: 1,
  amountEur: 0,
  airportRemunerationKm: 0,
  commissionKm: 0,
};

export default function DnevniIzvjestajiPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [report, setReport] = useState<DailyReport>(() => createEmptyDailyReport(getTodayDateString()));
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [editingCarriers, setEditingCarriers] = useState<Record<CarrierKey, boolean>>({});
  const [expandedCarriers, setExpandedCarriers] = useState<Record<CarrierKey, boolean>>({});
  const [isEditingAirport, setIsEditingAirport] = useState(false);
  const [bookingDrafts, setBookingDrafts] = useState<Record<CarrierKey, {
    open: boolean;
    pnr: string;
    pax: number;
    amountEur: number;
    airportRemunerationKm: number;
    commissionKm: number;
  }>>({});
  const [donationDraft, setDonationDraft] = useState<{ open: boolean; amount: string }>({
    open: false,
    amount: '',
  });
  const [newCarrierName, setNewCarrierName] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const carrierKeys = useMemo(
    () => (Array.isArray(report.carrierOrder) && report.carrierOrder.length
      ? report.carrierOrder
      : Object.keys(report.carriers || {})),
    [report.carrierOrder, report.carriers]
  );

  useEffect(() => {
    setEditingCarriers((prev) => {
      const next = { ...prev };
      carrierKeys.forEach((carrier) => {
        if (next[carrier] === undefined) {
          next[carrier] = false;
        }
      });
      return next;
    });
    setExpandedCarriers((prev) => {
      const next = { ...prev };
      carrierKeys.forEach((carrier) => {
        if (next[carrier] === undefined) {
          next[carrier] = carrier === 'wizz';
        }
      });
      return next;
    });
    setBookingDrafts((prev) => {
      const next = { ...prev };
      carrierKeys.forEach((carrier) => {
        if (!next[carrier]) {
          next[carrier] = { ...emptyBookingDraft };
        }
      });
      return next;
    });
  }, [carrierKeys]);

  useEffect(() => {
    setReport(createEmptyDailyReport(selectedDate));
    setImportWarnings([]);
    void loadReport(selectedDate);
  }, [selectedDate]);

  const loadReport = async (date: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/naplate/reports?type=DAILY&date=${date}`);
      if (!response.ok) {
        return;
      }
      const data = await response.json();
      if (data?.report?.data) {
        setReport(normalizeDailyReport(data.report.data));
      }
    } catch (error) {
      console.error('Error loading report:', error);
      showToast('Greška pri učitavanju izvještaja', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const saveReport = async () => {
    try {
      setIsSaving(true);
      const response = await fetch('/api/naplate/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'DAILY',
          date: selectedDate,
          data: report,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || 'Greška pri čuvanju');
      }
      showToast('Dnevni izvještaj je sačuvan', 'success');
    } catch (error: any) {
      console.error('Error saving report:', error);
      showToast(error?.message || 'Greška pri čuvanju izvještaja', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const exportReport = async () => {
    try {
      setIsExporting(true);
      const response = await fetch(`/api/naplate/export?date=${selectedDate}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data?.error || 'Greška pri eksportu');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Dnevni-izvjestaj-${selectedDate}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      showToast('Eksport je spreman', 'success');
    } catch (error: any) {
      console.error('Export error:', error);
      showToast(error?.message || 'Greška pri eksportu', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (file: File) => {
    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/naplate/import', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Greška pri importu');
      }
      if (data?.report) {
        setReport(normalizeDailyReport(data.report));
        if (data.report.date && data.report.date !== selectedDate) {
          setSelectedDate(data.report.date);
        }
      }
      setImportWarnings(data?.warnings || []);
      showToast('Fajl je uspješno učitan', 'success');
    } catch (error: any) {
      console.error('Import error:', error);
      showToast(error?.message || 'Greška pri učitavanju fajla', 'error');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const updateService = (carrier: CarrierKey, id: string, updates: Partial<ServiceItem>) => {
    setReport((prev) => ({
      ...prev,
      carriers: {
        ...prev.carriers,
        [carrier]: {
          ...prev.carriers[carrier],
          services: prev.carriers[carrier].services.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        },
      },
    }));
  };

  const updateAirportService = (id: string, updates: Partial<ServiceItem>) => {
    setReport((prev) => ({
      ...prev,
      airportServices: prev.airportServices.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    }));
  };

  const incrementAirportServiceQty = (id: string) => {
    setReport((prev) => ({
      ...prev,
      airportServices: prev.airportServices.map((item) =>
        item.id === id ? { ...item, qty: item.qty + 1 } : item
      ),
    }));
  };

  const decrementAirportServiceQty = (id: string) => {
    setReport((prev) => ({
      ...prev,
      airportServices: prev.airportServices.map((item) =>
        item.id === id ? { ...item, qty: Math.max(0, item.qty - 1) } : item
      ),
    }));
  };

  const incrementServiceQty = (carrier: CarrierKey, id: string) => {
    setReport((prev) => ({
      ...prev,
      carriers: {
        ...prev.carriers,
        [carrier]: {
          ...prev.carriers[carrier],
          services: prev.carriers[carrier].services.map((item) =>
            item.id === id ? { ...item, qty: item.qty + 1 } : item
          ),
        },
      },
    }));
  };

  const decrementServiceQty = (carrier: CarrierKey, id: string) => {
    setReport((prev) => ({
      ...prev,
      carriers: {
        ...prev.carriers,
        [carrier]: {
          ...prev.carriers[carrier],
          services: prev.carriers[carrier].services.map((item) =>
            item.id === id ? { ...item, qty: Math.max(0, item.qty - 1) } : item
          ),
        },
      },
    }));
  };

  const addService = (carrier: CarrierKey) => {
    setReport((prev) => ({
      ...prev,
      carriers: {
        ...prev.carriers,
        [carrier]: {
          ...prev.carriers[carrier],
          services: [...prev.carriers[carrier].services, createServiceItem()],
        },
      },
    }));
  };

  const removeService = (carrier: CarrierKey, id: string) => {
    setReport((prev) => ({
      ...prev,
      carriers: {
        ...prev.carriers,
        [carrier]: {
          ...prev.carriers[carrier],
          services: prev.carriers[carrier].services.filter((item) => item.id !== id),
        },
      },
    }));
  };

  const toggleEdit = (carrier: CarrierKey) => {
    setEditingCarriers((prev) => ({ ...prev, [carrier]: !prev[carrier] }));
  };

  const addBookingTransaction = (carrier: CarrierKey) => {
    setReport((prev) => ({
      ...prev,
      carriers: {
        ...prev.carriers,
        [carrier]: {
          ...prev.carriers[carrier],
          bookings: {
            transactions: [...prev.carriers[carrier].bookings.transactions, createBookingTransaction()],
          },
        },
      },
    }));
  };

  const updateBookingTransaction = (carrier: CarrierKey, id: string, updates: Partial<ReturnType<typeof createBookingTransaction>>) => {
    setReport((prev) => ({
      ...prev,
      carriers: {
        ...prev.carriers,
        [carrier]: {
          ...prev.carriers[carrier],
          bookings: {
            transactions: prev.carriers[carrier].bookings.transactions.map((txn) =>
              txn.id === id ? { ...txn, ...updates } : txn
            ),
          },
        },
      },
    }));
  };

  const removeBookingTransaction = (carrier: CarrierKey, id: string) => {
    setReport((prev) => ({
      ...prev,
      carriers: {
        ...prev.carriers,
        [carrier]: {
          ...prev.carriers[carrier],
          bookings: {
            transactions: prev.carriers[carrier].bookings.transactions.filter((txn) => txn.id !== id),
          },
        },
      },
    }));
  };

  const openBookingDraft = (carrier: CarrierKey) => {
    setBookingDrafts((prev) => ({
      ...prev,
      [carrier]: { ...prev[carrier], open: true },
    }));
  };

  const closeBookingDraft = (carrier: CarrierKey) => {
    setBookingDrafts((prev) => ({
      ...prev,
      [carrier]: { ...emptyBookingDraft },
    }));
  };

  const updateBookingDraft = (
    carrier: CarrierKey,
    updates: Partial<{
      pnr: string;
      pax: number;
      amountEur: number;
      airportRemunerationKm: number;
      commissionKm: number;
      open: boolean;
    }>
  ) => {
    setBookingDrafts((prev) => ({
      ...prev,
      [carrier]: { ...prev[carrier], ...updates },
    }));
  };

  const saveBookingDraft = (carrier: CarrierKey) => {
    const draft = bookingDrafts[carrier] || emptyBookingDraft;
    const normalizedPnr = normalizePnr(draft.pnr);
    if (!normalizedPnr) {
      showToast('PNR je obavezan', 'error');
      return;
    }
    if (!pnrPattern.test(normalizedPnr)) {
      showToast('PNR mora imati 6 slova/brojeva', 'error');
      return;
    }
    const transaction = createBookingTransaction({
      pnr: normalizedPnr,
      pax: draft.pax || 0,
      amountEur: draft.amountEur || 0,
      airportRemunerationKm: draft.airportRemunerationKm || 0,
      commissionKm: draft.commissionKm || 0,
    });
    setReport((prev) => ({
      ...prev,
      carriers: {
        ...prev.carriers,
        [carrier]: {
          ...prev.carriers[carrier],
          bookings: {
            transactions: [...prev.carriers[carrier].bookings.transactions, transaction],
          },
        },
      },
    }));
    closeBookingDraft(carrier);
    showToast('Booking dodat', 'success');
  };

  const saveDonationAmount = () => {
    const amount = Number(donationDraft.amount);
    if (!amount || amount <= 0) {
      showToast('Unesite ispravan iznos', 'error');
      return;
    }
    setReport((prev) => ({
      ...prev,
      airportServices: prev.airportServices.map((item) =>
        item.id === donationServiceId
          ? { ...item, amountOverride: Number((item.amountOverride || 0) + amount) }
          : item
      ),
    }));
    setDonationDraft({ open: false, amount: '' });
    showToast('Iznos dodat', 'success');
  };

  const totalAirportKm = useMemo(() => getAirportTotalKm(report), [report]);
  const totalEur = useMemo(() => (
    carrierKeys.reduce((sum, carrier) => sum + getCarrierTotalEur(report, carrier), 0)
  ), [report, carrierKeys]);
  const grandTotalKm = useMemo(() => getGrandTotalKm(report), [report]);
  const airportServicesTotal = useMemo(
    () => report.airportServices.reduce((sum, item) => sum + getServiceAmount(item), 0),
    [report.airportServices]
  );

  const addCarrier = () => {
    const label = newCarrierName.trim();
    if (!label) {
      showToast('Unesite naziv aviokompanije', 'error');
      return;
    }
    const key = createCarrierKey(label, carrierKeys);
    if (report.carriers[key]) {
      showToast('Aviokompanija već postoji', 'error');
      return;
    }
    setReport((prev) => ({
      ...prev,
      carrierOrder: [...(prev.carrierOrder || carrierKeys), key],
      carriers: {
        ...prev.carriers,
        [key]: createEmptyCarrierReport(label),
      },
    }));
    setEditingCarriers((prev) => ({ ...prev, [key]: false }));
    setExpandedCarriers((prev) => ({ ...prev, [key]: false }));
    setBookingDrafts((prev) => ({
      ...prev,
      [key]: { ...emptyBookingDraft },
    }));
    setNewCarrierName('');
    showToast('Aviokompanija dodana', 'success');
  };

  return (
    <div className="p-8 space-y-8">
      {/* Header - Dashboard style */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-soft-lg p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-24 -mt-24"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-50 rounded-full blur-3xl -ml-16 -mb-16"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 shadow-soft">
              <FileText className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-dark-900">Dnevni naplatni izvještaj</h1>
              <p className="text-slate-600 mt-2">Unos prodaje i dodatnih usluga po danu</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-soft">
              <Calendar className="w-4 h-4 text-blue-600" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-none p-0 h-auto text-sm"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => loadReport(selectedDate)}
              disabled={isLoading}
            >
              <RefreshCcw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Učitavam...' : 'Učitaj'}
            </Button>
            <Button onClick={saveReport} disabled={isSaving}>
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Čuvam...' : 'Sačuvaj'}
            </Button>
            <Button variant="outline" onClick={exportReport} disabled={isExporting}>
              <FileText className="w-4 h-4 mr-2" />
              {isExporting ? 'Eksportujem...' : 'Eksport XLSX'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[400px_1fr] gap-8">
        <div className="space-y-6">
          {/* Import Card - Dashboard style */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-soft-lg p-7 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="absolute bottom-0 left-0 w-28 h-28 bg-indigo-50 rounded-full blur-3xl -ml-10 -mb-10"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 shadow-soft">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Import podataka</h2>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Računovodstvo</p>
                </div>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Učitaj Excel izvještaj i automatski popuni polja za naplate.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    void handleImport(file);
                  }
                }}
              />
              <Button
                variant="outline"
                className="w-full mt-4 h-12 font-semibold"
                disabled={isImporting}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className={`w-5 h-5 mr-2 ${isImporting ? 'animate-bounce' : ''}`} />
                {isImporting ? 'Učitavam...' : 'Učitaj XLSX fajl'}
              </Button>
              {importWarnings.length > 0 && (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 space-y-2 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                    <span className="font-bold uppercase tracking-wide">Upozorenja</span>
                  </div>
                  {importWarnings.map((warning, index) => (
                    <div key={index} className="pl-3 border-l-2 border-amber-400">{warning}</div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Airlines Card - Dashboard style */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-soft-lg p-7 space-y-4 relative overflow-hidden">
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -ml-10 -mb-10"></div>
            <div className="absolute top-0 right-0 w-28 h-28 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 shadow-soft">
                  <Plane className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Aviokompanije</h2>
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Upravljanje</p>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Dodaj novu aviokompaniju</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder="Naziv aviokompanije"
                    value={newCarrierName}
                    onChange={(e) => setNewCarrierName(e.target.value)}
                    className="h-12"
                  />
                  <Button onClick={addCarrier} className="w-full h-12 font-semibold">
                    <Plane className="w-4 h-4 mr-2" />
                    Dodaj aviokompaniju
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Card - Dashboard style */}
          <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl border border-dark-700 shadow-soft-xl p-7 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Finansijski sažetak</h2>
                  <p className="text-xs text-dark-300 uppercase tracking-wide">Pregled</p>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {carrierKeys.map((carrier, idx) => (
                  <div key={carrier} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary-400"></div>
                      <span className="text-dark-200 font-medium">{report.carriers[carrier]?.label || carrierLabels[carrier] || carrier}</span>
                    </div>
                    <span className="font-bold text-white">{getCarrierTotalEur(report, carrier).toFixed(2)} EUR</span>
                  </div>
                ))}

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/10 border border-white/10 mt-4">
                  <span className="font-bold text-dark-200 uppercase tracking-wide text-xs">Ukupno EUR</span>
                  <span className="font-bold text-2xl text-white">{totalEur.toFixed(2)}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
                  <span className="text-dark-200 font-medium">Airport Tuzla (KM)</span>
                  <span className="font-bold text-blue-200">{totalAirportKm.toFixed(2)} KM</span>
                </div>

                <div className="flex items-center justify-between p-4 rounded-2xl bg-white/10 border border-white/10">
                  <span className="font-bold text-dark-200 uppercase tracking-wide text-xs">Ukupno KM</span>
                  <span className="font-bold text-2xl text-white">{grandTotalKm.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-white/10 rounded-2xl border border-white/10 backdrop-blur-sm">
                <Label className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <span className="w-1 h-4 bg-primary-400 rounded-full"></span>
                  Kurs EUR → KM
                </Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={report.fxRateEurToKm}
                  onChange={(e) => setReport((prev) => ({ ...prev, fxRateEurToKm: Number(e.target.value) || 0 }))}
                  className="h-12 bg-white/10 border border-white/20 text-white font-bold text-lg text-center rounded-2xl"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Airport Tuzla Section - Dashboard style */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-soft-lg p-8 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-50 rounded-full blur-3xl -ml-16 -mb-16"></div>

            <div className="relative z-10">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 shadow-soft">
                    <Building2 className="w-7 h-7 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-dark-900">Airport Tuzla</h2>
                    <p className="text-sm text-slate-600 uppercase tracking-wider font-semibold">Aerodromske usluge (KM)</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setIsEditingAirport((prev) => !prev)}
                  className={`h-11 px-5 font-semibold border transition-all ${
                    isEditingAirport
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  {isEditingAirport ? '✓ Završi uređivanje' : '✎ Uredi'}
                </Button>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
                <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group flex flex-col justify-between h-[160px] relative overflow-hidden border-[6px] border-white cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[2px] transition-all"></div>
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-primary-200 rounded-full blur-2xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-100 rounded-full blur-3xl -mb-12 -ml-12 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>

                  <div className="flex justify-between items-start relative z-10">
                    <div className="p-3.5 rounded-2xl bg-blue-50 group-hover:scale-110 transition-transform">
                      <Building2 className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="px-3 py-1 bg-dark-50 rounded-full text-[10px] font-bold text-dark-500 uppercase tracking-wide">
                      Aerodrom
                    </span>
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-3xl font-bold text-dark-900 mb-1">{airportServicesTotal.toFixed(2)}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-dark-500">Dodatni servisi</span>
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full ml-auto">KM</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group flex flex-col justify-between h-[160px] relative overflow-hidden border-[6px] border-white cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[2px] transition-all"></div>
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-primary-200 rounded-full blur-2xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-100 rounded-full blur-3xl -mb-12 -ml-12 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>

                  <div className="flex justify-between items-start relative z-10">
                    <div className="p-3.5 rounded-2xl bg-blue-50 group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <span className="px-3 py-1 bg-dark-50 rounded-full text-[10px] font-bold text-dark-500 uppercase tracking-wide">
                      Korekcije
                    </span>
                  </div>
                  <div className="relative z-10">
                    {isEditingAirport ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={report.adjustmentsAmount}
                        onChange={(e) => setReport((prev) => ({ ...prev, adjustmentsAmount: Number(e.target.value) || 0 }))}
                        className="h-12 bg-white border border-slate-200 text-dark-900 font-semibold text-2xl rounded-2xl mb-2"
                      />
                    ) : (
                      <h4 className="text-3xl font-bold text-dark-900 mb-1">{report.adjustmentsAmount.toFixed(2)}</h4>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-dark-500">Korekcije / povrat</span>
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full ml-auto">KM</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Services Table */}
              <div className="bg-white rounded-3xl p-6 shadow-soft relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-32 h-32 bg-blue-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-28 h-28 bg-indigo-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

                <div className="relative z-10 flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                  <h3 className="text-lg font-bold text-dark-900">Detaljni pregled usluga</h3>
                </div>

                <div className="relative z-10 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="py-4 px-3 text-left text-xs uppercase tracking-wider font-semibold text-slate-600 bg-blue-50 rounded-tl-xl">Usluga</th>
                        <th className="py-4 px-3 text-right text-xs uppercase tracking-wider font-semibold text-slate-600 bg-blue-50">Cijena (KM)</th>
                        <th className="py-4 px-3 text-right text-xs uppercase tracking-wider font-semibold text-slate-600 bg-blue-50">Količina</th>
                        <th className="py-4 px-3 text-right text-xs uppercase tracking-wider font-semibold text-slate-600 bg-blue-50">Iznos</th>
                        <th className="py-4 px-3 text-right text-xs uppercase tracking-wider font-semibold text-slate-600 bg-blue-50 rounded-tr-xl">Akcija</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {report.airportServices.map((item, idx) => {
                      const amount = getServiceAmount(item);
                      const isDonation = item.price === 0;
                      return (
                        <Fragment key={item.id}>
                          <tr className="hover:bg-blue-50/50 transition-colors group/row">
                            <td className="py-4 px-3">
                              {isEditingAirport ? (
                                <Input
                                  value={item.label}
                                  onChange={(e) => updateAirportService(item.id, { label: e.target.value })}
                                  className="h-11 border border-slate-200 rounded-xl font-medium"
                                />
                              ) : (
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center font-bold text-blue-600 text-xs">
                                    {idx + 1}
                                  </div>
                                  <span className="text-slate-800 font-semibold">{item.label}</span>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-3 text-right">
                              {isEditingAirport ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.price}
                                  onChange={(e) => updateAirportService(item.id, { price: Number(e.target.value) || 0 })}
                                  className="h-11 text-right border border-slate-200 rounded-xl font-semibold"
                                />
                              ) : (
                                <span className="text-slate-600 font-medium">{item.price ? item.price.toFixed(2) : '-'}</span>
                              )}
                            </td>
                            <td className="py-4 px-3 text-right">
                              {isEditingAirport ? (
                                <Input
                                  type="number"
                                  step="1"
                                  min="0"
                                  value={item.qty}
                                  onChange={(e) => updateAirportService(item.id, { qty: Number(e.target.value) || 0 })}
                                  className="h-11 text-right border border-slate-200 rounded-xl font-semibold"
                                  disabled={isDonation}
                                />
                              ) : (
                                <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-bold text-base">
                                  {item.qty}
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-3 text-right">
                              {isEditingAirport && isDonation ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={item.amountOverride || 0}
                                  onChange={(e) => updateAirportService(item.id, { amountOverride: Number(e.target.value) || 0 })}
                                  className="h-11 text-right border border-slate-200 rounded-xl font-semibold"
                                />
                              ) : (
                                <span className="text-slate-900 font-bold text-base">{amount.toFixed(2)} KM</span>
                              )}
                            </td>
                            <td className="py-4 px-3 text-right">
                              {isEditingAirport ? (
                                <span className="text-slate-400 text-xs">Edit mode</span>
                              ) : isDonation ? (
                                <Button
                                  variant="outline"
                                  onClick={() => setDonationDraft({ open: true, amount: '' })}
                                  className="h-10 px-4 text-xs font-semibold border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                                >
                                  + Dodaj iznos
                                </Button>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={(event) =>
                                      showConfirmToast(
                                        'Dodati 1 komad?',
                                        () => incrementAirportServiceQty(item.id),
                                        'Potvrdi',
                                        event.currentTarget
                                      )
                                    }
                                    className="h-10 px-4 text-xs font-semibold border border-blue-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                                  >
                                    + Dodaj
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={(event) =>
                                      showConfirmToast(
                                        'Ukloniti 1 komad?',
                                        () => decrementAirportServiceQty(item.id),
                                        'Potvrdi',
                                        event.currentTarget
                                      )
                                    }
                                    className="h-10 px-4 text-xs font-semibold border border-slate-200 hover:border-rose-300 hover:bg-rose-50 transition-all"
                                    disabled={item.qty <= 0}
                                  >
                                    - Ukloni
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                          {item.id === donationServiceId && donationDraft.open && (
                            <tr className="bg-blue-50/60">
                              <td colSpan={5} className="py-5 px-6">
                                <div className="bg-white rounded-2xl p-5 border border-blue-200 shadow-soft">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Dodaj iznos donacije</span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-3">
                                    <Input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      placeholder="Unesite iznos (KM)"
                                      value={donationDraft.amount}
                                      onChange={(e) => setDonationDraft({ open: true, amount: e.target.value })}
                                      className="max-w-xs h-12 border border-blue-200 rounded-xl font-semibold text-lg"
                                    />
                                    <Button
                                      onClick={saveDonationAmount}
                                      className="h-12 px-6 font-semibold"
                                    >
                                      ✓ Sačuvaj
                                    </Button>
                                    <Button
                                      variant="outline"
                                      onClick={() => setDonationDraft({ open: false, amount: '' })}
                                      className="h-12 px-6 border border-slate-200 hover:border-blue-200 hover:bg-blue-50 font-semibold"
                                    >
                                      ✕ Otkaži
                                    </Button>
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

          {/* Carriers - Wizz first, then others - Redesigned */}
          {[...carrierKeys].sort((a, b) => {
            if (a === 'wizz') return -1;
            if (b === 'wizz') return 1;
            return 0;
          }).map((carrier) => {
            const bookingDraft = bookingDrafts[carrier] || emptyBookingDraft;
            const isWizz = carrier === 'wizz';
            const isAjet = carrier === 'ajet';
            const isPegasus = carrier === 'pegasus';
            const isExpanded = isWizz || expandedCarriers[carrier];
            return (
            <div key={carrier} className="rounded-3xl border-2 border-slate-200 shadow-soft-xl p-8 space-y-6 relative overflow-hidden group hover:shadow-2xl transition-all bg-gradient-to-br from-slate-50 via-white to-slate-100">
              <div className="absolute inset-0 bg-gradient-to-br opacity-60 group-hover:opacity-80 transition-all from-slate-100/40 via-white/50 to-slate-200/30"></div>
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all bg-slate-200"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-3xl opacity-25 group-hover:opacity-40 group-hover:scale-110 transition-all bg-slate-300"></div>

              <div className="relative z-10">
                {/* Carrier Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                  <div
                    className={`flex items-center gap-4 ${!isWizz ? 'cursor-pointer' : ''}`}
                    onClick={() => {
                      if (!isWizz) {
                        setExpandedCarriers((prev) => ({ ...prev, [carrier]: !isExpanded }));
                      }
                    }}
                    role={!isWizz ? 'button' : undefined}
                    tabIndex={!isWizz ? 0 : undefined}
                    onKeyDown={(event) => {
                      if (!isWizz && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault();
                        setExpandedCarriers((prev) => ({ ...prev, [carrier]: !isExpanded }));
                      }
                    }}
                  >
                    <div className="p-4 rounded-2xl shadow-soft bg-gradient-to-br from-slate-700 to-slate-900">
                      <Plane className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold text-slate-900">
                        {report.carriers[carrier]?.label || carrierLabels[carrier] || carrier}
                      </h2>
                      <p className="text-sm text-slate-600 uppercase tracking-wider font-semibold mt-1">
                        {editingCarriers[carrier] ? '✎ Edit mode aktiviran' : 'Aviokompanija'}
                      </p>
                    </div>
                    {!isWizz && (
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-slate-100 text-[11px] font-bold uppercase tracking-wide text-slate-600">
                          {isExpanded ? 'Otvoreno' : 'Sakriveno'}
                        </span>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {!isWizz && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          setExpandedCarriers((prev) => ({ ...prev, [carrier]: !isExpanded }))
                        }
                        className="h-12 px-6 font-semibold border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50"
                      >
                        {isExpanded ? '− Sakrij' : '+ Prikaži'}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!isExpanded && !isWizz) {
                          setExpandedCarriers((prev) => ({ ...prev, [carrier]: true }));
                        }
                        toggleEdit(carrier);
                      }}
                      className={`h-12 px-6 font-semibold border-2 transition-all ${
                        editingCarriers[carrier]
                          ? 'bg-slate-800 text-white border-slate-800 hover:bg-slate-900'
                          : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                      }`}
                    >
                      {editingCarriers[carrier] ? '✓ Završi uređivanje' : '✎ Uredi'}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <>
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                  <div className="rounded-2xl p-6 border-2 shadow-soft-lg relative overflow-hidden group/card hover:scale-[1.02] transition-all bg-gradient-to-br from-slate-700 to-slate-900 border-slate-600">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                      <p className="text-xs uppercase tracking-wider font-bold mb-2 text-slate-200">Usluge ukupno</p>
                      <p className="text-3xl font-bold text-white">
                        {getCarrierFeeTotal(report, carrier).toFixed(2)} <span className="text-xl text-slate-200">EUR</span>
                      </p>
                      <div className="mt-3 h-1 w-16 bg-white/40 rounded-full"></div>
                    </div>
                  </div>
                  <div className="rounded-2xl p-6 border-2 shadow-soft-lg relative overflow-hidden group/card hover:scale-[1.02] transition-all bg-gradient-to-br from-slate-600 to-slate-800 border-slate-500">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                      <p className="text-xs uppercase tracking-wider font-bold mb-2 text-slate-200">Booking iznos</p>
                      <p className="text-3xl font-bold text-white">
                        {getBookingTotals(report, carrier).amountEur.toFixed(2)} <span className="text-xl text-slate-200">EUR</span>
                      </p>
                      <div className="mt-3 h-1 w-16 bg-white/40 rounded-full"></div>
                    </div>
                  </div>
                  <div className="rounded-2xl p-6 border-2 shadow-soft-lg relative overflow-hidden group/card hover:scale-[1.02] transition-all bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl"></div>
                    <div className="relative z-10">
                      <p className="text-xs uppercase tracking-wider font-bold mb-2 text-slate-200">Ukupno</p>
                      <p className="text-3xl font-bold text-white">
                        {getCarrierTotalEur(report, carrier).toFixed(2)} <span className="text-xl text-slate-200">EUR</span>
                      </p>
                      <div className="mt-3 h-1 w-16 bg-white/40 rounded-full"></div>
                    </div>
                  </div>
                </div>

              {/* Services Table */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 p-6 shadow-soft mb-6 border-slate-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-1 h-6 rounded-full bg-gradient-to-b from-slate-500 to-slate-700"></div>
                  <h3 className="text-lg font-bold text-slate-900">Detaljni pregled usluga</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-200">
                        <th className="py-4 px-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700 rounded-tl-xl bg-slate-50">Usluga</th>
                        <th className="py-4 px-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700 bg-slate-50">Šifra</th>
                        <th className="py-4 px-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700 bg-slate-50">Jedinica</th>
                        <th className="py-4 px-3 text-right text-xs uppercase tracking-wider font-bold text-slate-700 bg-slate-50">Cijena</th>
                        <th className="py-4 px-3 text-right text-xs uppercase tracking-wider font-bold text-slate-700 bg-slate-50">Količina</th>
                        <th className="py-4 px-3 text-right text-xs uppercase tracking-wider font-bold text-slate-700 bg-slate-50">Iznos</th>
                        <th className="py-4 px-3 text-right text-xs uppercase tracking-wider font-bold text-slate-700 rounded-tr-xl bg-slate-50">Akcija</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {report.carriers[carrier].services.map((item, idx) => {
                      const amount = getServiceAmount(item);
                      return (
                        <tr key={item.id} className="transition-colors group/row hover:bg-slate-50/60">
                          <td className="py-4 px-3">
                            {editingCarriers[carrier] ? (
                              <Input
                                value={item.label}
                                onChange={(e) => updateService(carrier, item.id, { label: e.target.value })}
                                className="h-11 border-2 rounded-xl font-medium border-slate-200"
                              />
                            ) : (
                              <span className="text-slate-800 font-semibold">{item.label}</span>
                            )}
                          </td>
                          <td className="py-4 px-3">
                            {editingCarriers[carrier] ? (
                              <Input
                                value={item.code}
                                onChange={(e) => updateService(carrier, item.id, { code: e.target.value })}
                                className="h-11 border-2 rounded-xl border-slate-200"
                              />
                            ) : (
                              <span className="text-slate-600 font-mono text-xs">{item.code}</span>
                            )}
                          </td>
                          <td className="py-4 px-3">
                            {editingCarriers[carrier] ? (
                              <Input
                                value={item.unit}
                                onChange={(e) => updateService(carrier, item.id, { unit: e.target.value })}
                                className="h-11 border-2 rounded-xl border-slate-200"
                              />
                            ) : (
                              <span className="text-slate-600 text-xs">{item.unit}</span>
                            )}
                          </td>
                          <td className="py-4 px-3 text-right">
                            {editingCarriers[carrier] ? (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.price}
                                onChange={(e) => updateService(carrier, item.id, { price: Number(e.target.value) || 0 })}
                                className="h-11 text-right border-2 rounded-xl font-semibold border-slate-200"
                              />
                            ) : (
                              <span className="text-slate-600 font-medium">{item.price ? item.price.toFixed(2) : '-'}</span>
                            )}
                          </td>
                          <td className="py-4 px-3 text-right">
                            {editingCarriers[carrier] ? (
                              <Input
                                type="number"
                                step="1"
                                min="0"
                                value={item.qty}
                                onChange={(e) => updateService(carrier, item.id, { qty: Number(e.target.value) || 0 })}
                                className="h-11 text-right border-2 rounded-xl font-semibold border-slate-200"
                              />
                            ) : (
                              <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg font-bold text-base bg-slate-100 text-slate-700">
                                {item.qty}
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-3 text-right">
                            {editingCarriers[carrier] ? (
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.price ? amount : item.amountOverride || 0}
                                onChange={(e) => {
                                  const nextAmount = Number(e.target.value) || 0;
                                  if (item.price) {
                                    updateService(carrier, item.id, { qty: Number((nextAmount / item.price).toFixed(2)) });
                                  } else {
                                    updateService(carrier, item.id, { amountOverride: nextAmount });
                                  }
                                }}
                                className="h-11 text-right border-2 rounded-xl font-semibold border-slate-200"
                              />
                            ) : (
                              <span className="text-slate-900 font-bold text-base">{amount.toFixed(2)} EUR</span>
                            )}
                          </td>
                          <td className="py-4 px-3 text-right">
                            {editingCarriers[carrier] ? (
                              <button
                                onClick={(event) =>
                                  showConfirmToast(
                                    'Potvrdi brisanje usluge?',
                                    () => removeService(carrier, item.id),
                                    'Potvrdi',
                                    event.currentTarget
                                  )
                                }
                                className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-lg hover:bg-rose-50 transition-all"
                              >
                                ✕ Ukloni
                              </button>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={(event) =>
                                    showConfirmToast(
                                      'Dodati 1 komad?',
                                      () => incrementServiceQty(carrier, item.id),
                                      'Potvrdi',
                                      event.currentTarget
                                    )
                                  }
                                  className="h-10 px-4 text-xs font-semibold border-2 transition-all bg-slate-50 border-slate-300 hover:bg-slate-100 hover:border-slate-400"
                                >
                                  + Dodaj
                                </Button>
                                <Button
                                  variant="outline"
                                  onClick={(event) =>
                                    showConfirmToast(
                                      'Ukloniti 1 komad?',
                                      () => decrementServiceQty(carrier, item.id),
                                      'Potvrdi',
                                      event.currentTarget
                                    )
                                  }
                                  className="h-10 px-4 text-xs font-semibold bg-rose-50 border-2 border-rose-300 hover:bg-rose-100 hover:border-rose-400 transition-all"
                                  disabled={item.qty <= 0}
                                >
                                  - Ukloni
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {editingCarriers[carrier] && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => addService(carrier)}
                    className="font-semibold border-2 transition-all border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                  >
                    + Dodaj uslugu
                  </Button>
                </div>
              )}
            </div>

            {/* Bookings Section */}
              <div className="bg-white rounded-3xl border-2 p-6 shadow-soft border-slate-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-50/70 via-white/80 to-slate-100/60 opacity-70"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-28 h-28 bg-slate-200 rounded-full blur-3xl opacity-50"></div>
                <div className="relative z-10 flex items-center gap-3 mb-6">
                  <div className="w-1 h-6 rounded-full bg-gradient-to-b from-slate-500 to-slate-700"></div>
                  <h3 className="text-lg font-bold text-slate-900">Booking transakcije</h3>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide ${
                    isWizz
                      ? 'bg-purple-100 text-purple-700'
                      : isAjet
                        ? 'bg-blue-100 text-blue-700'
                        : isPegasus
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                  }`}>
                    {report.carriers[carrier]?.label || carrierLabels[carrier] || carrier}
                  </span>
                </div>

                {/* Booking Stats */}
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4 mb-5">
                  <div className="rounded-2xl p-5 border-2 shadow-soft bg-white/80 border-slate-200">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Bookings (PAX)</p>
                    <p className="text-2xl font-bold text-slate-900">{getBookingTotals(report, carrier).pax}</p>
                  </div>
                  <div className="rounded-2xl p-5 border-2 shadow-soft bg-white/80 border-slate-200">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Bookings iznos</p>
                    <p className="text-2xl font-bold text-slate-900">{getBookingTotals(report, carrier).amountEur.toFixed(2)} <span className="text-base font-semibold text-slate-600">EUR</span></p>
                  </div>
                  <div className="rounded-2xl p-5 border-2 shadow-soft bg-white/80 border-slate-200">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Airport remun.</p>
                    <p className="text-2xl font-bold text-slate-900">{getBookingTotals(report, carrier).airportRemunerationKm.toFixed(2)} <span className="text-base font-semibold text-slate-600">KM</span></p>
                  </div>
                  <div className="rounded-2xl p-5 border-2 shadow-soft bg-white/80 border-slate-200">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Provizija</p>
                    <p className="text-2xl font-bold text-slate-900">{getBookingTotals(report, carrier).commissionKm.toFixed(2)} <span className="text-base font-semibold text-slate-600">KM</span></p>
                  </div>
                </div>

                {/* Booking Actions & Table */}
                <div className="relative z-10 rounded-2xl border-2 p-5 shadow-soft border-slate-200 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-base font-bold text-slate-800">Detalji transakcija</p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => openBookingDraft(carrier)}
                        className="font-semibold border-2 transition-all hover:scale-105 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                      >
                        + Dodaj booking
                      </Button>
                      {!editingCarriers[carrier] && (
                        <Button
                          variant="outline"
                          onClick={() => toggleEdit(carrier)}
                          className="font-semibold border-2 transition-all hover:scale-105 border-slate-300 hover:bg-slate-50 hover:border-slate-400"
                        >
                          ✎ Uredi
                        </Button>
                      )}
                    </div>
                  </div>

                  {bookingDraft.open && (
                    <div className="mb-5 rounded-2xl border-2 p-5 shadow-soft bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 rounded-full animate-pulse bg-slate-500"></div>
                        <span className="text-sm font-bold text-slate-700 uppercase tracking-wide">Nova booking transakcija</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">PNR</Label>
                          <Input
                            placeholder="PNR kod"
                            value={bookingDraft.pnr}
                            onChange={(e) => updateBookingDraft(carrier, { pnr: e.target.value.toUpperCase() })}
                            className="h-12 border-2 rounded-xl font-semibold border-slate-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">PAX</Label>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            value={bookingDraft.pax}
                            onChange={(e) => updateBookingDraft(carrier, { pax: Number(e.target.value) || 0 })}
                            className="h-12 border-2 rounded-xl font-semibold border-slate-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">Iznos (EUR)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={bookingDraft.amountEur}
                            onChange={(e) => updateBookingDraft(carrier, { amountEur: Number(e.target.value) || 0 })}
                            className="h-12 border-2 rounded-xl font-semibold border-slate-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">Airport (KM)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={bookingDraft.airportRemunerationKm}
                            onChange={(e) =>
                              updateBookingDraft(carrier, { airportRemunerationKm: Number(e.target.value) || 0 })
                            }
                            className="h-12 border-2 rounded-xl font-semibold border-slate-300"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">Provizija (KM)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={bookingDraft.commissionKm}
                            onChange={(e) => updateBookingDraft(carrier, { commissionKm: Number(e.target.value) || 0 })}
                            className="h-12 border-2 rounded-xl font-semibold border-slate-300"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-5">
                        <Button
                          onClick={() => saveBookingDraft(carrier)}
                          className="h-12 px-6 font-semibold shadow-soft hover:shadow-soft-lg transition-all bg-gradient-to-r from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950"
                        >
                          ✓ Sačuvaj booking
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => closeBookingDraft(carrier)}
                          className="h-12 px-6 border-2 border-slate-300 hover:bg-slate-50 font-semibold"
                        >
                          ✕ Otkaži
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b-2 border-slate-200">
                          <th className="py-4 px-3 text-left text-xs uppercase tracking-wider font-bold text-slate-700 rounded-tl-xl bg-slate-50">PNR</th>
                          <th className="py-4 px-3 text-right text-xs uppercase tracking-wider font-bold text-slate-700 bg-slate-50">PAX</th>
                          <th className="py-4 px-3 text-right text-xs uppercase tracking-wider font-bold text-slate-700 bg-slate-50">Iznos (EUR)</th>
                          <th className="py-4 px-3 text-right text-xs uppercase tracking-wider font-bold text-slate-700 bg-slate-50">Airport (KM)</th>
                          <th className="py-4 px-3 text-right text-xs uppercase tracking-wider font-bold text-slate-700 bg-slate-50">Provizija (KM)</th>
                          <th className="py-4 px-3 text-right text-xs uppercase tracking-wider font-bold text-slate-700 rounded-tr-xl bg-slate-50">Akcija</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {report.carriers[carrier].bookings.transactions.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center">
                              <div className="flex flex-col items-center gap-2">
                                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-slate-100">
                                  <FileText className="w-6 h-6 text-slate-600" />
                                </div>
                                <p className="text-slate-600 font-medium">Nema unesenih transakcija</p>
                                <p className="text-xs text-slate-500">Dodajte booking koristeći dugme iznad</p>
                              </div>
                            </td>
                          </tr>
                        )}
                        {report.carriers[carrier].bookings.transactions.map((txn, idx) => (
                          <tr key={txn.id} className="transition-colors group/row hover:bg-slate-50/60">
                            <td className="py-4 px-3">
                              {editingCarriers[carrier] ? (
                                <Input
                                  value={txn.pnr}
                                  onChange={(e) => updateBookingTransaction(carrier, txn.id, { pnr: e.target.value })}
                                  className="h-11 border-2 rounded-xl font-semibold border-slate-200"
                                />
                              ) : (
                                <span className="text-slate-800 font-bold font-mono">{txn.pnr || '-'}</span>
                              )}
                            </td>
                            <td className="py-4 px-3 text-right">
                              {editingCarriers[carrier] ? (
                                <Input
                                  type="number"
                                  min="0"
                                  value={txn.pax}
                                  onChange={(e) => updateBookingTransaction(carrier, txn.id, { pax: Number(e.target.value) || 0 })}
                                  className="h-11 text-right border-2 rounded-xl font-semibold border-slate-200"
                                />
                              ) : (
                                <span className="inline-flex items-center justify-center px-3 py-1 rounded-lg font-bold bg-slate-100 text-slate-700">{txn.pax}</span>
                              )}
                            </td>
                            <td className="py-4 px-3 text-right">
                              {editingCarriers[carrier] ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={txn.amountEur}
                                  onChange={(e) => updateBookingTransaction(carrier, txn.id, { amountEur: Number(e.target.value) || 0 })}
                                  className="h-11 text-right border-2 rounded-xl font-semibold border-slate-200"
                                />
                              ) : (
                                <span className="font-bold text-slate-900">{txn.amountEur.toFixed(2)}</span>
                              )}
                            </td>
                            <td className="py-4 px-3 text-right">
                              {editingCarriers[carrier] ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={txn.airportRemunerationKm}
                                  onChange={(e) => updateBookingTransaction(carrier, txn.id, { airportRemunerationKm: Number(e.target.value) || 0 })}
                                  className="h-11 text-right border-2 rounded-xl font-semibold border-slate-200"
                                />
                              ) : (
                                <span className="font-bold text-slate-900">{txn.airportRemunerationKm.toFixed(2)}</span>
                              )}
                            </td>
                            <td className="py-4 px-3 text-right">
                              {editingCarriers[carrier] ? (
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={txn.commissionKm}
                                  onChange={(e) => updateBookingTransaction(carrier, txn.id, { commissionKm: Number(e.target.value) || 0 })}
                                  className="h-11 text-right border-2 rounded-xl font-semibold border-slate-200"
                                />
                              ) : (
                                <span className="font-bold text-slate-900">{txn.commissionKm.toFixed(2)}</span>
                              )}
                            </td>
                            <td className="py-4 px-3 text-right">
                              {editingCarriers[carrier] ? (
                                <button
                                  onClick={(event) =>
                                    showConfirmToast(
                                      'Potvrdi brisanje booking transakcije?',
                                      () => removeBookingTransaction(carrier, txn.id),
                                      'Potvrdi',
                                      event.currentTarget
                                    )
                                  }
                                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-3 py-2 rounded-lg hover:bg-rose-50 transition-all"
                                >
                                  ✕ Ukloni
                                </button>
                              ) : (
                                <span className="text-slate-400 text-xs">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
                  </>
                )}
            </div>
          </div>
          );
          })}
        </div>
      </div>
    </div>
    </div>
  );
}
