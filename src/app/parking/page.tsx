'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
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
  Banknote,
  CalendarDays,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import { format, subDays, addDays, isToday, isYesterday, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns';
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
  monthly: Array<{ month: number; total: number; count: number }>;
  weekly: Array<{ week: number; total: number; count: number }>;
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

  // Helper to check if a date has an entry - use useCallback to ensure fresh reference
  const getEntryForDate = useCallback((dateStr: string): ParkingRevenueEntry | undefined => {
    return allEntries.find((entry) => entry.date.split('T')[0] === dateStr);
  }, [allEntries]);

  const hasEntryForDate = useCallback((dateStr: string): boolean => {
    return !!getEntryForDate(dateStr);
  }, [getEntryForDate]);

  // Get the current form date as Date object
  const formDateObj = useMemo(() => new Date(formDate), [formDate]);

  // Fill form with entry data
  const fillFormWithEntry = useCallback((entry: ParkingRevenueEntry | undefined) => {
    if (entry) {
      setEditingEntry(entry);
      setFormAmount(entry.amount);
      setFormNotes(entry.notes || '');
    } else {
      setEditingEntry(null);
      setFormAmount('');
      setFormNotes('');
    }
  }, []);

  // Navigation functions for date selection
  const goToPreviousDay = useCallback(() => {
    const newDate = subDays(formDateObj, 1);
    const newDateStr = format(newDate, 'yyyy-MM-dd');
    setFormDate(newDateStr);
    const existingEntry = allEntries.find((entry) => entry.date.split('T')[0] === newDateStr);
    fillFormWithEntry(existingEntry);
  }, [formDateObj, allEntries, fillFormWithEntry]);

  const goToNextDay = useCallback(() => {
    const newDate = addDays(formDateObj, 1);
    if (newDate > new Date()) return;
    const newDateStr = format(newDate, 'yyyy-MM-dd');
    setFormDate(newDateStr);
    const existingEntry = allEntries.find((entry) => entry.date.split('T')[0] === newDateStr);
    fillFormWithEntry(existingEntry);
  }, [formDateObj, allEntries, fillFormWithEntry]);

  const selectDate = useCallback((date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    setFormDate(dateStr);
    const existingEntry = allEntries.find((entry) => entry.date.split('T')[0] === dateStr);
    fillFormWithEntry(existingEntry);
  }, [allEntries, fillFormWithEntry]);

  // Get date label
  const getDateLabel = (date: Date): string => {
    if (isToday(date)) return 'Danas';
    if (isYesterday(date)) return 'Jučer';
    return format(date, 'EEE', { locale: bs });
  };

  // Quick dates - last 7 days
  const quickDates = useMemo(() => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const entryForDate = allEntries.find((entry) => entry.date.split('T')[0] === dateStr);
      dates.push({
        date,
        dateStr,
        label: getDateLabel(date),
        dayNum: format(date, 'dd'),
        hasEntry: !!entryForDate,
        entryAmount: entryForDate ? parseFloat(entryForDate.amount) : 0,
      });
    }
    return dates;
  }, [allEntries]);

  // Chart data for last 7 days
  const last7DaysChartData = useMemo(() => {
    if (!stats?.last7Days) return [];
    return stats.last7Days.map((day) => ({
      label: format(new Date(day.date), 'EEE', { locale: bs }),
      fullDate: format(new Date(day.date), 'dd.MM', { locale: bs }),
      value: day.amount,
    }));
  }, [stats?.last7Days]);

  // Monthly chart data
  const monthlyChartData = useMemo(() => {
    if (!stats?.monthly) return [];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
    return stats.monthly.map((m) => ({
      label: monthNames[m.month - 1],
      value: m.total,
      count: m.count,
    }));
  }, [stats?.monthly]);

  // Calculate trend (comparing this week to last week)
  const weeklyTrend = useMemo(() => {
    if (!stats?.last7Days || stats.last7Days.length < 7) return null;
    const thisWeekTotal = stats.last7Days.slice(0, 3).reduce((sum, d) => sum + d.amount, 0);
    const lastWeekTotal = stats.last7Days.slice(4, 7).reduce((sum, d) => sum + d.amount, 0);
    if (lastWeekTotal === 0) return null;
    const change = ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100;
    return Math.round(change);
  }, [stats?.last7Days]);

  // Calendar data for current month
  const calendarData = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const entry = allEntries.find((e) => e.date.split('T')[0] === dateStr);
      return {
        date: day,
        dateStr,
        dayNum: format(day, 'd'),
        hasEntry: !!entry,
        amount: entry ? parseFloat(entry.amount) : 0,
        isFuture: day > now,
        isToday: isToday(day),
      };
    });
  }, [allEntries]);

  // Percentage of days filled this month
  const monthFillPercentage = useMemo(() => {
    const now = new Date();
    const daysPassedThisMonth = now.getDate();
    const daysWithEntryThisMonth = calendarData.filter((d) => d.hasEntry && !d.isFuture).length;
    return Math.round((daysWithEntryThisMonth / daysPassedThisMonth) * 100);
  }, [calendarData]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="p-4 lg:p-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
              <p className="text-dark-500">Učitavam podatke...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="p-4 lg:p-8 space-y-6 lg:space-y-8">
        {/* Hero Section */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Revenue Card */}
          <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-6 lg:p-8 text-white shadow-soft-xl relative overflow-hidden flex flex-col justify-between min-h-[340px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-dark-300 text-sm font-medium mb-1">Prihod od parkinga u {new Date().getFullYear()}</p>
                  <h3 className="text-3xl sm:text-4xl font-bold tracking-tight">
                    {stats ? formatCurrency(stats.summary.yearlyTotal) : '0,00 KM'}
                  </h3>
                  <p className="text-xs text-dark-300 mt-1">Ukupno od početka godine do danas</p>
                </div>
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <ParkingCircle className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4 text-sm">
                {[
                  { label: 'Ovaj mjesec', value: stats ? formatCurrency(stats.summary.thisMonthTotal) : '0 KM', accent: 'text-emerald-200' },
                  { label: 'Danas', value: stats?.summary.todayAmount !== null ? formatCurrency(stats?.summary.todayAmount || 0) : 'Nema unosa', accent: 'text-blue-200' },
                  { label: 'Prosječno dnevno', value: stats ? formatCurrency(stats.summary.dailyAverage) : '0 KM', accent: 'text-amber-200' },
                ].map((item) => (
                  <div key={item.label} className="p-3 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-[11px] uppercase tracking-wide text-dark-200 font-semibold">{item.label}</p>
                    <p className={`text-base sm:text-lg lg:text-xl font-bold ${item.accent}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 mt-auto">
              <p className="text-xs text-dark-300 mb-2">
                {stats?.summary.daysWithData || 0} dana sa unosima | {stats?.summary.missingDays || 0} dana bez unosa
              </p>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white text-dark-900 flex items-center justify-center font-bold shadow-soft">
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-dark-200">Evidencija dnevnog pazara</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="xl:col-span-2 space-y-4 lg:space-y-6">
            <div className="flex flex-wrap gap-4 lg:gap-6">
              {[
                {
                  title: 'Danas',
                  value: stats?.summary.todayAmount !== null ? formatCurrency(stats?.summary.todayAmount || 0) : '-',
                  icon: CalendarDays,
                  trend: stats?.summary.todayAmount !== null ? 'Uneseno' : 'Čeka unos',
                  color: stats?.summary.todayAmount !== null ? 'text-emerald-600' : 'text-amber-600',
                  bgColor: stats?.summary.todayAmount !== null ? 'bg-emerald-50' : 'bg-amber-50',
                  badge: format(new Date(), 'dd.MM.yyyy'),
                  size: 'sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.333%-1rem)]',
                },
                {
                  title: 'Ovaj mjesec',
                  value: stats ? formatCurrency(stats.summary.thisMonthTotal) : '0 KM',
                  icon: Calendar,
                  trend: `${monthFillPercentage}% dana popunjeno`,
                  color: 'text-blue-600',
                  bgColor: 'bg-blue-50',
                  badge: format(new Date(), 'MMMM', { locale: bs }),
                  size: 'sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.333%-1rem)]',
                },
                {
                  title: 'Prosječno dnevno',
                  value: stats ? formatCurrency(stats.summary.dailyAverage) : '0 KM',
                  icon: Target,
                  trend: weeklyTrend !== null ? `${weeklyTrend > 0 ? '+' : ''}${weeklyTrend}% od prošle sedmice` : 'Stabilno',
                  color: 'text-indigo-600',
                  bgColor: 'bg-indigo-50',
                  badge: 'Prosjek',
                  size: 'sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(33.333%-1rem)]',
                },
                {
                  title: 'Dana sa unosima',
                  value: `${stats?.summary.daysWithData || 0}`,
                  icon: Check,
                  trend: `od ${Math.ceil((new Date().getTime() - new Date(new Date().getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24))} dana`,
                  color: 'text-green-600',
                  bgColor: 'bg-green-50',
                  badge: 'Kompletnost',
                  size: 'sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-1rem)]',
                },
                {
                  title: 'Nedostaje unosa',
                  value: `${stats?.summary.missingDays || 0}`,
                  icon: AlertCircle,
                  trend: 'dana bez podataka',
                  color: 'text-red-600',
                  bgColor: 'bg-red-50',
                  badge: 'Praznine',
                  size: 'sm:basis-[calc(50%-0.5rem)] lg:basis-[calc(25%-1rem)]',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className={`bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer flex flex-col justify-between min-h-[140px] lg:h-[160px] relative overflow-hidden border-4 lg:border-[6px] border-white basis-full ${item.size} flex-grow`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[2px] transition-all"></div>
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-primary-200 rounded-full blur-2xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-100 rounded-full blur-3xl -mb-12 -ml-12 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>

                  <div className="flex justify-between items-start relative z-10">
                    <div className={`p-2.5 lg:p-3.5 rounded-xl lg:rounded-2xl ${item.bgColor} group-hover:scale-110 transition-transform`}>
                      <item.icon className={`w-5 h-5 lg:w-6 lg:h-6 ${item.color}`} />
                    </div>
                    <span className="px-2 lg:px-3 py-1 bg-dark-50 rounded-full text-[9px] lg:text-[10px] font-bold text-dark-500 uppercase tracking-wide">
                      {item.badge}
                    </span>
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-xl sm:text-2xl lg:text-3xl font-bold text-dark-900 mb-1">{item.value}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs lg:text-sm font-medium text-dark-500">{item.title}</span>
                      <span className="text-[10px] lg:text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full ml-auto">{item.trend}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Action Buttons */}
        <section className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              setShowAddForm(!showAddForm);
              setShowBulkForm(false);
              setEditingEntry(null);
              setFormDate(format(new Date(), 'yyyy-MM-dd'));
              setFormAmount('');
              setFormNotes('');
            }}
            className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white shadow-lg"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novi dnevni unos
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowBulkForm(!showBulkForm);
              setShowAddForm(false);
            }}
            className="border-2"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Zbirni unos
          </Button>
          <div className="flex-1"></div>
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
        </section>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
              <span className="sr-only">Zatvori</span>
              ✕
            </button>
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-soft relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white/70 to-emerald-100/50 opacity-70"></div>
            <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-emerald-200 rounded-full blur-3xl opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60"></div>

            <div className="relative z-10">
              <h2 className="text-lg font-bold text-dark-900 mb-6">Dnevni unos</h2>

              {/* Quick Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-dark-700 mb-3">Odaberite dan</label>
                <div className="flex flex-wrap gap-2 mb-4">
                  {quickDates.map((qd) => (
                    <button
                      key={qd.dateStr}
                      type="button"
                      onClick={() => selectDate(qd.date)}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-0.5 min-w-[70px] ${
                        formDate === qd.dateStr
                          ? 'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg scale-105'
                          : qd.hasEntry
                          ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-dark-50 text-dark-700 border-2 border-dark-100 hover:bg-dark-100'
                      }`}
                    >
                      <span className="text-lg font-bold">{qd.dayNum}</span>
                      <span className="text-xs opacity-80">{qd.label}</span>
                      {qd.hasEntry && formDate !== qd.dateStr && <Check className="w-3.5 h-3.5 mt-0.5" />}
                    </button>
                  ))}
                </div>

                {/* Date Navigator */}
                <div className="flex items-center gap-4 p-4 bg-dark-50 rounded-2xl border border-dark-100">
                  <button
                    type="button"
                    onClick={goToPreviousDay}
                    className="p-3 hover:bg-dark-100 rounded-xl transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-dark-600" />
                  </button>
                  <div className="flex-1 text-center">
                    <div className="text-xl font-bold text-dark-900 capitalize">
                      {format(formDateObj, 'EEEE', { locale: bs })}
                    </div>
                    <div className="text-sm text-dark-500">
                      {format(formDateObj, 'dd. MMMM yyyy', { locale: bs })}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={goToNextDay}
                    disabled={isToday(formDateObj)}
                    className={`p-3 rounded-xl transition-colors ${
                      isToday(formDateObj) ? 'opacity-30 cursor-not-allowed' : 'hover:bg-dark-100'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5 text-dark-600" />
                  </button>
                </div>

                {/* Status indicator */}
                {hasEntryForDate(formDate) ? (
                  <div className="mt-4 flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Unos za ovaj dan već postoji</span>
                    <span className="ml-auto text-emerald-600 font-bold">
                      {formatCurrency(getEntryForDate(formDate)?.amount || 0)}
                    </span>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Nema unosa za ovaj dan - novi unos</span>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Iznos (KM)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full px-4 py-3 text-lg border-2 border-dark-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      placeholder="0.00"
                      required
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Napomena (opcionalno)</label>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-dark-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                      placeholder="Npr. neradni dan, posebni događaj..."
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600">
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
          </div>
        )}

        {/* Bulk Form */}
        {showBulkForm && (
          <div className="bg-white rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-soft relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/70 to-blue-100/50 opacity-70"></div>
            <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50"></div>

            <div className="relative z-10">
              <h2 className="text-lg font-bold text-dark-900 mb-2">Zbirni unos od početka godine</h2>
              <p className="text-sm text-dark-500 mb-6">
                Unesite ukupan iznos od 1. januara do odabranog datuma. Sistem će automatski raspodijeliti iznos na sve dane.
              </p>
              <form onSubmit={handleBulkSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Zaključno sa datumom</label>
                    <input
                      type="date"
                      value={bulkEndDate}
                      onChange={(e) => setBulkEndDate(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-dark-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Ukupan iznos (KM)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={bulkAmount}
                      onChange={(e) => setBulkAmount(e.target.value)}
                      className="w-full px-4 py-3 text-lg border-2 border-dark-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-dark-700 mb-2">Napomena</label>
                    <input
                      type="text"
                      value={bulkNotes}
                      onChange={(e) => setBulkNotes(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-dark-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Opcionalno"
                    />
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600">
                    {isSubmitting ? 'Spremam...' : 'Izvrši zbirni unos'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowBulkForm(false)}>
                    Odustani
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Entries Table - moved here after forms */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-dark-50 rounded-xl">
                <Calendar className="w-5 h-5 text-dark-400" />
              </div>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="px-4 py-2.5 border-2 border-dark-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <Button variant="outline" size="sm" onClick={fetchData} className="p-2.5">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-2xl lg:rounded-3xl shadow-soft overflow-hidden">
            {entries.length === 0 ? (
              <div className="text-center py-16 text-dark-500">
                <ParkingCircle className="w-12 h-12 text-dark-300 mx-auto mb-4" />
                <p className="font-medium">Nema unosa za odabrani period</p>
                <p className="text-sm text-dark-400 mt-1">Odaberite drugi mjesec ili dodajte novi unos</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-50 border-b border-dark-100">
                    <tr>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-dark-500 uppercase tracking-wider">Datum</th>
                      <th className="px-4 lg:px-6 py-4 text-right text-xs font-bold text-dark-500 uppercase tracking-wider">Iznos</th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-dark-500 uppercase tracking-wider hidden md:table-cell">Napomena</th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-bold text-dark-500 uppercase tracking-wider hidden lg:table-cell">Unio</th>
                      <th className="px-4 lg:px-6 py-4 text-right text-xs font-bold text-dark-500 uppercase tracking-wider">Akcije</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100">
                    {entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-dark-50 transition-colors">
                        <td className="px-4 lg:px-6 py-4">
                          <div className="text-sm font-semibold text-dark-900">
                            {format(new Date(entry.date), 'dd.MM.yyyy', { locale: bs })}
                          </div>
                          <div className="text-xs text-dark-500 capitalize">
                            {format(new Date(entry.date), 'EEEE', { locale: bs })}
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-right">
                          <span className="text-lg font-bold text-dark-900">
                            {formatCurrency(entry.amount)}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-dark-500 hidden md:table-cell max-w-[200px] truncate">
                          {entry.notes || '-'}
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-dark-500 hidden lg:table-cell">
                          {entry.createdBy?.name || entry.createdBy?.email}
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleEdit(entry)}
                              className="p-2 text-dark-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-2 text-dark-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Charts Section */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
          {/* Last 7 Days Chart */}
          <div className="xl:col-span-2 bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-soft relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 via-white/70 to-emerald-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
            <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-emerald-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

            <div className="flex items-center justify-between mb-4 lg:mb-8 relative z-10">
              <div>
                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-dark-900">Prihod - posljednjih 7 dana</h3>
                <p className="text-xs lg:text-sm text-dark-500">Dnevni pregled prihoda od parkinga</p>
              </div>
              <span className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-medium bg-dark-50 text-dark-600">
                7d
              </span>
            </div>

            <div className="h-[200px] sm:h-[260px] w-full relative z-10">
              {last7DaysChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={last7DaysChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 12 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#475569', fontSize: 12 }}
                      tickFormatter={(value) => `${value} KM`}
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)' }}
                      itemStyle={{ color: '#fff' }}
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 2 }}
                      formatter={(value: number) => [formatCurrency(value), 'Prihod']}
                      labelFormatter={(label: string, payload: readonly unknown[]) => (payload[0] as { payload?: { fullDate?: string } })?.payload?.fullDate || label}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={3}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-dark-400">Nema dostupnih podataka</div>
              )}
            </div>
          </div>

          {/* Monthly Mini Calendar */}
          <div className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-6 shadow-soft relative z-10">
            <h3 className="text-sm sm:text-base lg:text-lg font-bold text-dark-900 mb-3 lg:mb-4">
              {format(new Date(), 'MMMM yyyy', { locale: bs })}
            </h3>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['P', 'U', 'S', 'Č', 'P', 'S', 'N'].map((day, i) => (
                <div key={i} className="text-center text-xs font-medium text-dark-400 py-1">{day}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before month starts */}
              {Array.from({ length: (startOfMonth(new Date()).getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} className="aspect-square"></div>
              ))}
              {calendarData.map((day) => (
                <button
                  key={day.dateStr}
                  onClick={() => {
                    if (!day.isFuture) {
                      selectDate(day.date);
                      setShowAddForm(true);
                      setShowBulkForm(false);
                    }
                  }}
                  disabled={day.isFuture}
                  className={`aspect-square rounded-lg text-xs font-medium flex items-center justify-center transition-all ${
                    day.isToday
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                      : day.hasEntry
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                      : day.isFuture
                      ? 'text-dark-300 cursor-not-allowed'
                      : 'bg-dark-50 text-dark-600 hover:bg-dark-100'
                  }`}
                  title={day.hasEntry ? formatCurrency(day.amount) : 'Nema unosa'}
                >
                  {day.dayNum}
                </button>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-100"></div>
                <span className="text-dark-500">Ima unos</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-dark-50"></div>
                <span className="text-dark-500">Nema unosa</span>
              </div>
            </div>
          </div>
        </section>

        {/* Monthly Bar Chart */}
        <section className="bg-white rounded-2xl lg:rounded-3xl p-4 lg:p-8 shadow-soft relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/70 to-blue-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
          <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

          <div className="flex items-center justify-between mb-4 lg:mb-8 relative z-10">
            <div>
              <h3 className="text-sm sm:text-base lg:text-lg font-bold text-dark-900">Mjesečni pregled {new Date().getFullYear()}</h3>
              <p className="text-xs lg:text-sm text-dark-500">Ukupni prihod po mjesecima</p>
            </div>
            <span className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-xs lg:text-sm font-medium bg-dark-50 text-dark-600">
              Godišnje
            </span>
          </div>

          <div className="h-[200px] sm:h-[280px] w-full relative z-10">
            {monthlyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#475569', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#475569', fontSize: 12 }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.25)' }}
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    formatter={(value: number, name: string, props: any) => [
                      formatCurrency(value),
                      `Prihod (${props.payload.count} dana)`
                    ]}
                  />
                  <Bar
                    dataKey="value"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-dark-400">Nema dostupnih podataka</div>
            )}
          </div>
        </section>
      </div>
    </MainLayout>
  );
}
