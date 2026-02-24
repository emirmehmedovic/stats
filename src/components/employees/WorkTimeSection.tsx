'use client';

import { useEffect, useMemo, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Settings, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { showToast } from '@/components/ui/toast';
import { formatDateDisplay } from '@/lib/dates';
import { format } from 'date-fns';
import { bs } from 'date-fns/locale';
import Link from 'next/link';

type WorkDay = {
  id: string;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  expectedStartTime: string | null;
  expectedEndTime: string | null;
  totalHours: number | null;
  expectedHours: number | null;
  lateMinutes: number | null;
  earlyLeaveMinutes: number | null;
  overtimeMinutes: number | null;
  overtimeStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'INCOMPLETE' | 'ABSENT';
  notes: string | null;
  isManualEntry: boolean;
  events?: WorkDayEvent[];
};

type WorkDayEvent = {
  id: string;
  isCheckIn: boolean;
  isCheckOut: boolean;
  isInternal: boolean;
  event: {
    id: string;
    eventTime: string;
    eventId: number | null;
    place: {
      placeName: string;
      externalPlaceId: number;
    } | null;
  };
};

interface WorkTimeSectionProps {
  employeeId: string;
}

const WEEK_DAYS = ['Pon', 'Uto', 'Sri', 'Čet', 'Pet', 'Sub', 'Ned'];

const toApiDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDayKey = (value: string | Date) => {
  if (typeof value === 'string') {
    const isoMatch = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (isoMatch) return isoMatch[1];
    return toApiDate(new Date(value));
  }
  return toApiDate(value);
};

const getMonthBounds = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return { start, end };
};

const toNumeric = (value: unknown): number | null => {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

export function WorkTimeSection({ employeeId }: WorkTimeSectionProps) {
  const [workDays, setWorkDays] = useState<WorkDay[]>([]);
  const [statsDays, setStatsDays] = useState<WorkDay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [statsPeriod, setStatsPeriod] = useState<'week' | 'month' | 'all'>('month');
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  useEffect(() => {
    fetchCalendarData();
  }, [employeeId, currentMonth]);

  useEffect(() => {
    fetchStatsData();
  }, [employeeId, statsPeriod]);

  const fetchCalendarData = async () => {
    setIsLoading(true);
    try {
      const { start, end } = getMonthBounds(currentMonth);
      const params = new URLSearchParams({
        startDate: toApiDate(start),
        endDate: toApiDate(end),
        limit: '120',
      });

      const workDaysResponse = await fetch(`/api/employees/${employeeId}/work-days?${params.toString()}`);
      const workDaysData = await workDaysResponse.json();
      if (workDaysData.success) {
        const data: WorkDay[] = workDaysData.data;
        setWorkDays(data);
        if (data.length > 0 && !selectedDateKey) {
          setSelectedDateKey(getDayKey(data[0].date));
        }
      } else {
        showToast(workDaysData.error || 'Greška pri učitavanju evidencije', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch work time data:', error);
      showToast('Greška pri učitavanju podataka', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStatsData = async () => {
    setIsStatsLoading(true);
    try {
      const now = new Date();
      let startDate = new Date(now);

      if (statsPeriod === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (statsPeriod === 'month') {
        startDate.setDate(now.getDate() - 30);
      } else {
        startDate = new Date('2000-01-01');
      }

      const params = new URLSearchParams({
        startDate: toApiDate(startDate),
        endDate: toApiDate(now),
        limit: '5000',
      });

      const response = await fetch(`/api/employees/${employeeId}/work-days?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setStatsDays(data.data);
      } else {
        showToast(data.error || 'Greška pri učitavanju statistike', 'error');
      }
    } catch (error) {
      console.error('Failed to fetch stats data:', error);
      showToast('Greška pri učitavanju statistike', 'error');
    } finally {
      setIsStatsLoading(false);
    }
  };

  const changeMonth = (offset: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  };

  const workDayByDate = useMemo(() => {
    const entries = workDays.map((day) => [getDayKey(day.date), day] as const);
    return new Map(entries);
  }, [workDays]);

  const selectedDay = useMemo(() => {
    if (!selectedDateKey) return null;
    return workDayByDate.get(selectedDateKey) || null;
  }, [selectedDateKey, workDayByDate]);

  const calendarCells = useMemo(() => {
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const firstWeekDayIndex = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();

    const cells: Array<{ day: number | null; dateKey: string | null }> = [];

    for (let i = 0; i < firstWeekDayIndex; i += 1) {
      cells.push({ day: null, dateKey: null });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      cells.push({ day, dateKey: toApiDate(date) });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ day: null, dateKey: null });
    }

    return cells;
  }, [currentMonth]);

  const statsSummary = useMemo(() => {
    const completed = statsDays.filter(day => day.status === 'COMPLETED');
    const onTimeDays = completed.filter(day => getLateMinutes(day) <= 0).length;
    const totalLateMinutes = completed.reduce((sum, day) => sum + getLateMinutes(day), 0);
    const totalOvertimeMinutes = completed.reduce((sum, day) => sum + (toNumeric(day.overtimeMinutes) || 0), 0);
    const totalHours = completed.reduce((sum, day) => sum + (toNumeric(day.totalHours) || 0), 0);
    const punctualityRate = completed.length > 0
      ? Math.round((onTimeDays / completed.length) * 10000) / 100
      : 0;
    const averageLateMinutes = completed.length > 0
      ? Math.round((totalLateMinutes / completed.length) * 100) / 100
      : 0;

    return {
      completedDays: completed.length,
      onTimeDays,
      totalLateMinutes,
      totalOvertimeMinutes,
      totalHours: Math.round(totalHours * 100) / 100,
      punctualityRate,
      averageLateMinutes,
    };
  }, [statsDays]);

  const worstDays = useMemo(() => {
    return [...statsDays]
      .filter(day => getLateMinutes(day) > 0 || (day.status === 'INCOMPLETE' || day.status === 'ABSENT'))
      .sort((a, b) => {
        const aLate = getLateMinutes(a);
        const bLate = getLateMinutes(b);
        if (bLate !== aLate) return bLate - aLate;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      })
      .slice(0, 10);
  }, [statsDays]);

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('bs-BA', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatHours = (hours: number | null) => {
    const numeric = toNumeric(hours);
    if (numeric === null) return '-';
    return `${numeric.toFixed(2)}h`;
  };

  const formatMinutes = (minutes: number | null) => {
    const numeric = toNumeric(minutes);
    if (!numeric || numeric === 0) return '-';
    const rounded = Math.round(numeric);
    const hours = Math.floor(rounded / 60);
    const mins = rounded % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  };

  function getLateMinutes(day: WorkDay) {
    const stored = toNumeric(day.lateMinutes);
    if (stored && stored > 0) return Math.round(stored);

    if (!day.checkInTime || !day.expectedStartTime) return 0;
    const checkIn = new Date(day.checkInTime).getTime();
    const expectedStart = new Date(day.expectedStartTime).getTime();
    const diff = Math.round((checkIn - expectedStart) / 60000);
    return diff > 0 ? diff : 0;
  }

  const getStatusClass = (status: WorkDay['status']) => {
    const config = {
      IN_PROGRESS: 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 text-blue-900 shadow-soft hover:shadow-soft-lg',
      COMPLETED: 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-400 text-green-900 shadow-soft hover:shadow-soft-lg',
      INCOMPLETE: 'bg-gradient-to-br from-orange-50 to-amber-100 border-orange-400 text-orange-900 shadow-soft hover:shadow-soft-lg',
      ABSENT: 'bg-gradient-to-br from-red-50 to-red-100 border-red-400 text-red-900 shadow-soft hover:shadow-soft-lg',
    };

    return config[status];
  };

  const getStatusLabel = (status: WorkDay['status']) => {
    const labels = {
      IN_PROGRESS: 'U toku',
      COMPLETED: 'Završen',
      INCOMPLETE: 'Nepotpun',
      ABSENT: 'Odsutan',
    };
    return labels[status];
  };

  const getDayCellClass = (day: WorkDay) => {
    const late = getLateMinutes(day);
    if (day.status === 'COMPLETED' && late > 0) {
      return 'bg-orange-100 border-orange-300 text-orange-800';
    }
    return getStatusClass(day.status);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">Učitavam evidenciju...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-3xl shadow-soft overflow-visible relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 transition-all pointer-events-none rounded-3xl"></div>
        <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-all pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 transition-all pointer-events-none"></div>

        <div className="relative z-10 p-6 border-b border-slate-200 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-blue-100 rounded-2xl shadow-soft">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-dark-900">Kalendar evidencije radnog vremena</h3>
            </div>
            <p className="text-sm text-dark-500">Hover na dan prikazuje detalje radnog vremena.</p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="shadow-soft hover:shadow-soft-lg transition-all border-2 border-dark-100">
              <Link href={`/employees/${employeeId}/edit?section=work-time#work-time-settings`}>
                <Settings className="w-4 h-4 mr-2" />
                Podesi smjene
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={() => changeMonth(-1)} className="shadow-soft hover:shadow-soft-lg transition-all border-2 border-dark-100">
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-[180px] text-center font-bold text-dark-900 capitalize px-4 py-2 bg-dark-50 rounded-xl">
              {format(currentMonth, 'LLLL yyyy', { locale: bs })}
            </div>
            <Button variant="outline" size="sm" onClick={() => changeMonth(1)} className="shadow-soft hover:shadow-soft-lg transition-all border-2 border-dark-100">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {workDays.length === 0 ? (
          <div className="relative z-10 p-12 text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-3xl flex items-center justify-center mb-6 shadow-soft">
              <Calendar className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-dark-900 mb-2">Nema evidencije za ovaj mjesec</h3>
            <p className="text-dark-600">Odaberite drugi mjesec ili provjerite sinhronizaciju podataka.</p>
          </div>
        ) : (
          <div className="relative z-10 p-6">
            <div className="grid grid-cols-7 gap-2 mb-3">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="text-xs font-bold uppercase tracking-wide text-dark-500 px-3 py-2 text-center bg-dark-50 rounded-xl">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((cell, index) => {
                if (!cell.day || !cell.dateKey) {
                  return <div key={`empty-${index}`} className="h-24 rounded-xl bg-gradient-to-br from-dark-50/30 to-dark-100/20" />;
                }

                const dayData = workDayByDate.get(cell.dateKey);

                return (
                  <div
                    key={cell.dateKey}
                    className={`relative h-24 rounded-xl border-2 p-2.5 transition-all group/day cursor-pointer ${
                      dayData ? getDayCellClass(dayData) : 'bg-white border-dark-200 text-dark-700 hover:bg-gradient-to-br hover:from-primary-50/50 hover:to-blue-50/30 hover:border-primary-300 hover:shadow-soft'
                    } ${selectedDateKey === cell.dateKey ? 'ring-2 ring-primary-500 ring-offset-1' : ''}`}
                    onClick={() => setSelectedDateKey(cell.dateKey)}
                  >
                    <div className="flex items-start justify-between h-full">
                      <span className="text-sm font-bold">{cell.day}</span>
                      {dayData && <span className="w-2.5 h-2.5 rounded-full bg-current opacity-80 mt-0.5 shadow-sm" />}
                    </div>

                    {dayData && (
                      <div className="absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full z-20 w-64 bg-dark-900 text-white text-xs rounded-2xl p-4 opacity-0 invisible group-hover/day:opacity-100 group-hover/day:visible transition-all shadow-soft-xl pointer-events-none">
                        <div className="font-bold mb-3 text-sm border-b border-dark-700 pb-2">{formatDateDisplay(dayData.date)}</div>
                        <div className="space-y-2 text-dark-100">
                          <div className="flex justify-between"><span className="text-dark-400">Dolazak:</span> <span className="font-semibold">{formatTime(dayData.checkInTime)}</span></div>
                          <div className="flex justify-between"><span className="text-dark-400">Odlazak:</span> <span className="font-semibold">{formatTime(dayData.checkOutTime)}</span></div>
                          <div className="flex justify-between"><span className="text-dark-400">Ukupno:</span> <span className="font-semibold">{formatHours(dayData.totalHours)}</span></div>
                          <div className="flex justify-between"><span className="text-dark-400">Status:</span> <span className="font-semibold">{getStatusLabel(dayData.status)}</span></div>
                          <div className="flex justify-between"><span className="text-dark-400">Kašnjenje:</span> <span className="font-semibold text-orange-300">{formatMinutes(getLateMinutes(dayData))}</span></div>
                          <div className="flex justify-between"><span className="text-dark-400">Prekovremeni:</span> <span className="font-semibold text-violet-300">{formatMinutes(dayData.overtimeMinutes)}</span></div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-dark-200 bg-white overflow-hidden">
              <div className="px-4 py-3 bg-dark-50 border-b border-dark-200">
                <h4 className="font-bold text-dark-900">
                  {selectedDay ? `Kretanje i otkucavanja za ${formatDateDisplay(selectedDay.date)}` : 'Odaberite dan'}
                </h4>
              </div>
              <div className="p-4">
                {selectedDay ? (
                  selectedDay.events && selectedDay.events.length > 0 ? (
                    <div className="space-y-2">
                      {[...selectedDay.events]
                        .sort((a, b) => new Date(a.event.eventTime).getTime() - new Date(b.event.eventTime).getTime())
                        .map((workEvent) => (
                          <div key={workEvent.id} className="flex items-center justify-between rounded-xl border border-dark-100 px-3 py-2">
                            <div>
                              <p className="text-sm font-semibold text-dark-900">
                                {new Date(workEvent.event.eventTime).toLocaleTimeString('bs-BA', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </p>
                              <p className="text-xs text-dark-500">
                                {workEvent.event.place?.placeName || 'Nepoznata lokacija'}
                                {workEvent.event.place?.externalPlaceId ? ` (ID: ${workEvent.event.place.externalPlaceId})` : ''}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`inline-flex px-2 py-1 rounded-lg text-xs font-bold ${
                                workEvent.isCheckIn
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : workEvent.isCheckOut
                                    ? 'bg-rose-100 text-rose-700'
                                    : 'bg-blue-100 text-blue-700'
                              }`}>
                                {workEvent.isCheckIn ? 'Ulaz' : workEvent.isCheckOut ? 'Izlaz' : 'Kretanje'}
                              </span>
                              <p className="text-[11px] text-dark-500 mt-1">
                                Event: {workEvent.event.eventId ?? 'N/A'} {workEvent.isInternal ? '• Interni' : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p className="text-sm text-dark-500">Nema povezanih eventa za ovaj dan.</p>
                  )
                ) : (
                  <p className="text-sm text-dark-500">Kliknite na dan u kalendaru za prikaz događaja.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl shadow-soft overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-50/50 via-white/70 to-purple-100/50 opacity-70 group-hover:opacity-90 transition-all pointer-events-none rounded-3xl"></div>
        <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-violet-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-all pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 transition-all pointer-events-none"></div>

        <div className="relative z-10 p-6 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-violet-100 rounded-2xl shadow-soft">
                <Clock className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="text-lg font-bold text-dark-900">Statistika radnog vremena</h3>
            </div>
            <p className="text-sm text-dark-500">Pregled tačnosti, kašnjenja i prekovremenog po periodu.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setStatsPeriod('week')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                statsPeriod === 'week'
                  ? 'bg-primary-600 text-white shadow-soft'
                  : 'bg-dark-50 text-dark-700 hover:bg-dark-100 border border-dark-200'
              }`}
            >
              7 dana
            </button>
            <button
              onClick={() => setStatsPeriod('month')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                statsPeriod === 'month'
                  ? 'bg-primary-600 text-white shadow-soft'
                  : 'bg-dark-50 text-dark-700 hover:bg-dark-100 border border-dark-200'
              }`}
            >
              30 dana
            </button>
            <button
              onClick={() => setStatsPeriod('all')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                statsPeriod === 'all'
                  ? 'bg-primary-600 text-white shadow-soft'
                  : 'bg-dark-50 text-dark-700 hover:bg-dark-100 border border-dark-200'
              }`}
            >
              Sve
            </button>
          </div>
        </div>

        {isStatsLoading ? (
          <div className="relative z-10 p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
            <p className="text-dark-600 font-medium">Učitavam statistiku...</p>
          </div>
        ) : (
          <div className="relative z-10 p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group/card cursor-pointer flex flex-col justify-between h-[140px] relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 via-white/70 to-green-100/50 opacity-70 group-hover/card:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-emerald-200 rounded-full blur-2xl opacity-80 group-hover/card:opacity-100 group-hover/card:scale-110 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-green-100 rounded-full blur-3xl -mb-12 -ml-12 opacity-80 group-hover/card:opacity-100 group-hover/card:scale-110 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-emerald-100 rounded-xl">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-[10px] uppercase tracking-wide text-emerald-700 font-bold">Tačnost</p>
                  </div>
                  <p className="text-3xl font-bold text-emerald-800">{statsSummary.punctualityRate}%</p>
                  <p className="text-xs text-emerald-700 mt-1 font-medium">
                    {statsSummary.onTimeDays}/{statsSummary.completedDays} dana na vrijeme
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group/card cursor-pointer flex flex-col justify-between h-[140px] relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/60 via-white/70 to-amber-100/50 opacity-70 group-hover/card:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-orange-200 rounded-full blur-2xl opacity-80 group-hover/card:opacity-100 group-hover/card:scale-110 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-amber-100 rounded-full blur-3xl -mb-12 -ml-12 opacity-80 group-hover/card:opacity-100 group-hover/card:scale-110 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-orange-100 rounded-xl">
                      <Clock className="w-4 h-4 text-orange-600" />
                    </div>
                    <p className="text-[10px] uppercase tracking-wide text-orange-700 font-bold">Ukupno kašnjenje</p>
                  </div>
                  <p className="text-3xl font-bold text-orange-800">{statsSummary.totalLateMinutes} min</p>
                  <p className="text-xs text-orange-700 mt-1 font-medium">Prosjek: {statsSummary.averageLateMinutes} min/dan</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group/card cursor-pointer flex flex-col justify-between h-[140px] relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-50/60 via-white/70 to-purple-100/50 opacity-70 group-hover/card:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-violet-200 rounded-full blur-2xl opacity-80 group-hover/card:opacity-100 group-hover/card:scale-110 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-100 rounded-full blur-3xl -mb-12 -ml-12 opacity-80 group-hover/card:opacity-100 group-hover/card:scale-110 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-violet-100 rounded-xl">
                      <Clock className="w-4 h-4 text-violet-600" />
                    </div>
                    <p className="text-[10px] uppercase tracking-wide text-violet-700 font-bold">Prekovremeni</p>
                  </div>
                  <p className="text-3xl font-bold text-violet-800">{statsSummary.totalOvertimeMinutes} min</p>
                  <p className="text-xs text-violet-700 mt-1 font-medium">Ukupno u periodu</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group/card cursor-pointer flex flex-col justify-between h-[140px] relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/60 via-white/70 to-blue-100/50 opacity-70 group-hover/card:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-cyan-200 rounded-full blur-2xl opacity-80 group-hover/card:opacity-100 group-hover/card:scale-110 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-100 rounded-full blur-3xl -mb-12 -ml-12 opacity-80 group-hover/card:opacity-100 group-hover/card:scale-110 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-cyan-100 rounded-xl">
                      <Clock className="w-4 h-4 text-cyan-600" />
                    </div>
                    <p className="text-[10px] uppercase tracking-wide text-cyan-700 font-bold">Odrađeni sati</p>
                  </div>
                  <p className="text-3xl font-bold text-cyan-800">{statsSummary.totalHours}h</p>
                  <p className="text-xs text-cyan-700 mt-1 font-medium">Samo završeni dani</p>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group/card cursor-pointer flex flex-col justify-between h-[140px] relative overflow-hidden border-[6px] border-white">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 via-white/70 to-blue-100/50 opacity-70 group-hover/card:opacity-90 transition-all"></div>
                <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-indigo-200 rounded-full blur-2xl opacity-80 group-hover/card:opacity-100 group-hover/card:scale-110 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-100 rounded-full blur-3xl -mb-12 -ml-12 opacity-80 group-hover/card:opacity-100 group-hover/card:scale-110 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-indigo-100 rounded-xl">
                      <CheckCircle className="w-4 h-4 text-indigo-600" />
                    </div>
                    <p className="text-[10px] uppercase tracking-wide text-indigo-700 font-bold">Završeni dani</p>
                  </div>
                  <p className="text-3xl font-bold text-indigo-800">{statsSummary.completedDays}</p>
                  <p className="text-xs text-indigo-700 mt-1 font-medium">U odabranom periodu</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border-[6px] border-white shadow-soft overflow-hidden relative group/table">
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/30 via-white/70 to-orange-100/30 opacity-70 pointer-events-none"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-red-100 rounded-full blur-3xl opacity-30 pointer-events-none"></div>

              <div className="relative z-10 px-6 py-4 bg-gradient-to-r from-red-50/50 to-orange-50/30 border-b border-red-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-xl shadow-soft">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                  <h4 className="font-bold text-dark-900 text-base">Najproblematičniji dani</h4>
                </div>
              </div>
              <div className="relative z-10 overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-dark-50/80">
                    <tr>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-dark-600 uppercase tracking-wider">Datum</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-dark-600 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-dark-600 uppercase tracking-wider">Kašnjenje</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-dark-600 uppercase tracking-wider">Prekovremeni</th>
                      <th className="px-6 py-3 text-left text-[10px] font-bold text-dark-600 uppercase tracking-wider">Sati</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dark-100">
                    {worstDays.length > 0 ? (
                      worstDays.map((day) => (
                        <tr key={day.id} className="hover:bg-gradient-to-r hover:from-red-50/30 hover:to-orange-50/20 transition-all">
                          <td className="px-6 py-4 text-sm font-bold text-dark-900">{formatDateDisplay(day.date)}</td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                              day.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                              day.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                              day.status === 'INCOMPLETE' ? 'bg-orange-100 text-orange-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {getStatusLabel(day.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-orange-700">{formatMinutes(getLateMinutes(day))}</td>
                          <td className="px-6 py-4 text-sm font-bold text-violet-700">{formatMinutes(day.overtimeMinutes)}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-dark-700">{formatHours(day.totalHours)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center">
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-green-100 rounded-2xl">
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                            <p className="text-sm font-semibold text-green-700">Nema dana sa kašnjenjem ili problematičnim statusom.</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
