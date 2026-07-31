'use client';

import { useState, useEffect, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  ParkingCircle,
  Plus,
  Calendar,
  TrendingUp,
  Download,
  RefreshCw,
  Edit2,
  Trash2,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Check,
  AlertCircle,
} from 'lucide-react';
import { format, subDays, addDays, isToday, isYesterday, isSameDay } from 'date-fns';
import { bs } from 'date-fns/locale';

interface ParkingRevenueEntry {
  id: string;
  date: string;
  amount: string;
  notes: string | null;
  createdBy: { name: string | null; email: string };
  updatedBy: { name: string | null; email: string } | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  year: number;
  summary: {
    yearlyTotal: number;
    thisMonthTotal: number;
    todayAmount: number | null;
    dailyAverage: number;
    daysWithData: number;
    missingDays: number;
  };
  last7Days: { date: string; amount: number }[];
}

export default function ParkingPage() {
  const [entries, setEntries] = useState<ParkingRevenueEntry[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ParkingRevenueEntry | null>(null);

  // Form states
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formAmount, setFormAmount] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // All entries for checking if date has entry
  const [allEntries, setAllEntries] = useState<ParkingRevenueEntry[]>([]);

  // Bulk form states
  const [bulkEndDate, setBulkEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');

  // Filter states
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const [entriesRes, statsRes, allEntriesRes] = await Promise.all([
        fetch(`/api/parking-revenue?month=${filterMonth}&limit=50`),
        fetch('/api/parking-revenue/stats'),
        fetch(`/api/parking-revenue?year=${currentYear}&limit=400`),
      ]);

      if (entriesRes.ok) {
        const data = await entriesRes.json();
        setEntries(data.data || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.data);
      }

      if (allEntriesRes.ok) {
        const data = await allEntriesRes.json();
        setAllEntries(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterMonth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const url = editingEntry
        ? `/api/parking-revenue/${editingEntry.id}`
        : '/api/parking-revenue';
      const method = editingEntry ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formDate,
          amount: parseFloat(formAmount),
          notes: formNotes || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Greška pri spremanju');
      }

      setShowAddForm(false);
      setEditingEntry(null);
      setFormDate(format(new Date(), 'yyyy-MM-dd'));
      setFormAmount('');
      setFormNotes('');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri spremanju');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/parking-revenue/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cumulativeAmount: parseFloat(bulkAmount),
          endDate: bulkEndDate,
          notes: bulkNotes || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Greška pri bulk unosu');
      }

      setShowBulkForm(false);
      setBulkAmount('');
      setBulkNotes('');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri bulk unosu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovaj unos?')) return;

    try {
      const response = await fetch(`/api/parking-revenue/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Greška pri brisanju');
      }

      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Greška pri brisanju');
    }
  };

  const handleEdit = (entry: ParkingRevenueEntry) => {
    setEditingEntry(entry);
    setFormDate(entry.date.split('T')[0]);
    setFormAmount(entry.amount);
    setFormNotes(entry.notes || '');
    setShowAddForm(true);
    setShowBulkForm(false);
  };

  const handleExport = (type: string) => {
    window.open(`/api/parking-revenue/export?type=${type}&format=csv`, '_blank');
  };

  const formatCurrency = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return num.toLocaleString('bs-BA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' KM';
  };

  // Helper to check if a date has an entry
  const getEntryForDate = (dateStr: string): ParkingRevenueEntry | undefined => {
    return allEntries.find((entry) => entry.date.split('T')[0] === dateStr);
  };

  const hasEntryForDate = (dateStr: string): boolean => {
    return !!getEntryForDate(dateStr);
  };

  // Get the current form date as Date object
  const formDateObj = useMemo(() => new Date(formDate), [formDate]);

  // Navigation functions for date selection
  const goToPreviousDay = () => {
    const newDate = subDays(formDateObj, 1);
    setFormDate(format(newDate, 'yyyy-MM-dd'));
    // Check if entry exists and pre-fill form
    const existingEntry = getEntryForDate(format(newDate, 'yyyy-MM-dd'));
    if (existingEntry) {
      setEditingEntry(existingEntry);
      setFormAmount(existingEntry.amount);
      setFormNotes(existingEntry.notes || '');
    } else {
      setEditingEntry(null);
      setFormAmount('');
      setFormNotes('');
    }
  };

  const goToNextDay = () => {
    const newDate = addDays(formDateObj, 1);
    if (newDate > new Date()) return; // Can't go to future
    setFormDate(format(newDate, 'yyyy-MM-dd'));
    const existingEntry = getEntryForDate(format(newDate, 'yyyy-MM-dd'));
    if (existingEntry) {
      setEditingEntry(existingEntry);
      setFormAmount(existingEntry.amount);
      setFormNotes(existingEntry.notes || '');
    } else {
      setEditingEntry(null);
      setFormAmount('');
      setFormNotes('');
    }
  };

  const selectDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setFormDate(dateStr);
    const existingEntry = getEntryForDate(dateStr);
    if (existingEntry) {
      setEditingEntry(existingEntry);
      setFormAmount(existingEntry.amount);
      setFormNotes(existingEntry.notes || '');
    } else {
      setEditingEntry(null);
      setFormAmount('');
      setFormNotes('');
    }
  };

  // Get date label
  const getDateLabel = (date: Date): string => {
    if (isToday(date)) return 'Danas';
    if (isYesterday(date)) return 'Jučer';
    return format(date, 'EEEE', { locale: bs });
  };

  // Quick dates - last 7 days
  const quickDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = subDays(new Date(), i);
      dates.push({
        date,
        dateStr: format(date, 'yyyy-MM-dd'),
        label: getDateLabel(date),
        hasEntry: hasEntryForDate(format(date, 'yyyy-MM-dd')),
      });
    }
    return dates;
  }, [allEntries]);

  return (
    <MainLayout>
      <div className="p-4 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <ParkingCircle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Naplata Parkinga</h1>
              <p className="text-sm text-slate-500">Evidencija dnevnog pazara</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowBulkForm(!showBulkForm);
                setShowAddForm(false);
              }}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Zbirni unos
            </Button>
            <Button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setShowBulkForm(false);
                setEditingEntry(null);
                setFormDate(format(new Date(), 'yyyy-MM-dd'));
                setFormAmount('');
                setFormNotes('');
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Novi unos
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-sm text-slate-500 mb-1">Danas</div>
              <div className="text-2xl font-bold text-slate-900">
                {stats.summary.todayAmount !== null ? formatCurrency(stats.summary.todayAmount) : '-'}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-sm text-slate-500 mb-1">Ovaj mjesec</div>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(stats.summary.thisMonthTotal)}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-sm text-slate-500 mb-1">Ove godine</div>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(stats.summary.yearlyTotal)}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="text-sm text-slate-500 mb-1">Prosječno dnevno</div>
              <div className="text-2xl font-bold text-slate-900">
                {formatCurrency(stats.summary.dailyAverage)}
              </div>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
            <button onClick={() => setError(null)} className="ml-2 underline">Zatvori</button>
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Dnevni unos
            </h2>

            {/* Quick Date Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">Odaberite dan</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {quickDates.map((qd) => (
                  <button
                    key={qd.dateStr}
                    type="button"
                    onClick={() => selectDate(qd.date)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                      formDate === qd.dateStr
                        ? 'bg-blue-600 text-white'
                        : qd.hasEntry
                        ? 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {qd.hasEntry && formDate !== qd.dateStr && <Check className="w-3.5 h-3.5" />}
                    <span>{qd.label}</span>
                    <span className="text-xs opacity-70">({format(qd.date, 'dd.MM', { locale: bs })})</span>
                  </button>
                ))}
              </div>

              {/* Date Navigator */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <button
                  type="button"
                  onClick={goToPreviousDay}
                  className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <div className="flex-1 text-center">
                  <div className="text-lg font-semibold text-slate-900">
                    {format(formDateObj, 'EEEE', { locale: bs })}
                  </div>
                  <div className="text-sm text-slate-500">
                    {format(formDateObj, 'dd. MMMM yyyy', { locale: bs })}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={goToNextDay}
                  disabled={isToday(formDateObj)}
                  className={`p-2 rounded-lg transition-colors ${
                    isToday(formDateObj) ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-200'
                  }`}
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
              </div>

              {/* Status indicator */}
              {hasEntryForDate(formDate) ? (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <Check className="w-4 h-4" />
                  <span>Unos za ovaj dan već postoji - izmjena podataka</span>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>Nema unosa za ovaj dan - novi unos</span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Iznos (KM)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-lg"
                    placeholder="0.00"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Napomena (opcionalno)</label>
                  <input
                    type="text"
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Npr. neradni dan, posebni događaj..."
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting} className="flex-1 md:flex-none">
                  {isSubmitting ? 'Spremam...' : editingEntry ? 'Spremi izmjene' : 'Spremi unos'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingEntry(null);
                  }}
                >
                  Zatvori
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Bulk Form */}
        {showBulkForm && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Zbirni unos od početka godine</h2>
            <p className="text-sm text-slate-500 mb-4">
              Unesite ukupan iznos od 1. januara do odabranog datuma. Sistem će automatski raspodijeliti iznos na sve dane.
            </p>
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Zaključno sa datumom</label>
                  <input
                    type="date"
                    value={bulkEndDate}
                    onChange={(e) => setBulkEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ukupan iznos (KM)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bulkAmount}
                    onChange={(e) => setBulkAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Napomena</label>
                  <input
                    type="text"
                    value={bulkNotes}
                    onChange={(e) => setBulkNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Opcionalno"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Spremam...' : 'Izvrši zbirni unos'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowBulkForm(false)}>
                  Odustani
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Filters and Export */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-slate-400" />
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('weekly')}>
              <Download className="w-4 h-4 mr-1" />
              Sedmični
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('monthly')}>
              <Download className="w-4 h-4 mr-1" />
              Mjesečni
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('yearly')}>
              <Download className="w-4 h-4 mr-1" />
              Godišnji
            </Button>
          </div>
        </div>

        {/* Entries Table */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              Nema unosa za odabrani period
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Datum</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Iznos</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 hidden md:table-cell">Napomena</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700 hidden lg:table-cell">Unio</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">Akcije</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {format(new Date(entry.date), 'dd.MM.yyyy', { locale: bs })}
                      <span className="text-slate-400 ml-1">
                        ({format(new Date(entry.date), 'EEEE', { locale: bs })})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900">
                      {formatCurrency(entry.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 hidden md:table-cell">
                      {entry.notes || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500 hidden lg:table-cell">
                      {entry.createdBy?.name || entry.createdBy?.email}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => handleEdit(entry)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Last 7 Days Chart */}
        {stats && stats.last7Days && (
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-semibold text-slate-900">Posljednjih 7 dana</h2>
            </div>
            <div className="flex items-end justify-between gap-2 h-32">
              {stats.last7Days.map((day, index) => {
                const maxAmount = Math.max(...stats.last7Days.map((d) => d.amount));
                const height = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex justify-center mb-1">
                      <div
                        className="w-8 bg-blue-500 rounded-t"
                        style={{ height: `${Math.max(height, 4)}%` }}
                        title={`${formatCurrency(day.amount)}`}
                      />
                    </div>
                    <div className="text-xs text-slate-500">
                      {format(new Date(day.date), 'EEE', { locale: bs })}
                    </div>
                    <div className="text-xs font-medium text-slate-700">
                      {day.amount > 0 ? formatCurrency(day.amount) : '-'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
