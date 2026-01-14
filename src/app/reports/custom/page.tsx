'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as XLSX from 'xlsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MainLayout } from '@/components/layout/MainLayout';
import { formatDateDisplay, getDateStringInTimeZone, getTodayDateString } from '@/lib/dates';
import { Activity, AlertCircle, Calendar as CalendarIcon, Clock, Plane, Package, TrendingDown, TrendingUp, Users, X } from 'lucide-react';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { format } from 'date-fns';
import { bs } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ChangeEvent, ChangeEventHandler } from 'react';

interface CustomReportData {
  filters: {
    dateFrom: string;
    dateTo: string;
    airlines: string[];
    routes: string[];
    operationType: string;
    groupBy: string;
  };
  totals: {
    flights: number;
    arrivalFlights: number;
    arrivalPassengers: number;
    arrivalBaggage: number;
    arrivalCargo: number;
    arrivalMail: number;
    departureFlights: number;
    departurePassengers: number;
    departureBaggage: number;
    departureCargo: number;
    departureMail: number;
    totalPassengers: number;
    totalBaggage: number;
    totalCargo: number;
    totalMail: number;
  };
  groupedData: Array<{
    label: string;
    displayLabel: string;
    flights: number;
    passengers: number;
    arrivalFlights: number;
    departureFlights: number;
  }>;
  flights: any[];
  totalFlightsCount: number;
}

interface CustomComparisonData {
  periodA: {
    dateFrom: string;
    dateTo: string;
    totals: {
      flights: number;
      arrivalFlights: number;
      departureFlights: number;
      arrivalPassengers: number;
      departurePassengers: number;
      arrivalBaggage: number;
      departureBaggage: number;
      arrivalCargo: number;
      departureCargo: number;
      arrivalMail: number;
      departureMail: number;
      totalPassengers: number;
      totalBaggage: number;
      totalCargo: number;
      totalMail: number;
    };
    summary: {
      loadFactor: number | null;
      onTimeRate: number | null;
      avgDelayMinutes: number | null;
      cancelledRate: number | null;
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
    dailyData: Array<{
      date: string;
      label: string;
      flights: number;
      passengers: number;
      loadFactor: number | null;
      onTimeRate: number | null;
      avgDelayMinutes: number | null;
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
        passengers: number;
        avgPassengers: number | null;
        loadFactor: number | null;
        avgDelayMinutes: number | null;
        onTimeRate: number | null;
      }>;
      leastDelayed: Array<{
        route: string;
        flights: number;
        passengers: number;
        avgPassengers: number | null;
        loadFactor: number | null;
        avgDelayMinutes: number | null;
        onTimeRate: number | null;
      }>;
      lowestAvgPassengers: Array<{
        route: string;
        flights: number;
        passengers: number;
        avgPassengers: number | null;
        loadFactor: number | null;
        avgDelayMinutes: number | null;
        onTimeRate: number | null;
      }>;
    };
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
  };
  periodB: {
    dateFrom: string;
    dateTo: string;
    totals: {
      flights: number;
      arrivalFlights: number;
      departureFlights: number;
      arrivalPassengers: number;
      departurePassengers: number;
      arrivalBaggage: number;
      departureBaggage: number;
      arrivalCargo: number;
      departureCargo: number;
      arrivalMail: number;
      departureMail: number;
      totalPassengers: number;
      totalBaggage: number;
      totalCargo: number;
      totalMail: number;
    };
    summary: {
      loadFactor: number | null;
      onTimeRate: number | null;
      avgDelayMinutes: number | null;
      cancelledRate: number | null;
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
    dailyData: Array<{
      date: string;
      label: string;
      flights: number;
      passengers: number;
      loadFactor: number | null;
      onTimeRate: number | null;
      avgDelayMinutes: number | null;
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
        passengers: number;
        avgPassengers: number | null;
        loadFactor: number | null;
        avgDelayMinutes: number | null;
        onTimeRate: number | null;
      }>;
      leastDelayed: Array<{
        route: string;
        flights: number;
        passengers: number;
        avgPassengers: number | null;
        loadFactor: number | null;
        avgDelayMinutes: number | null;
        onTimeRate: number | null;
      }>;
      lowestAvgPassengers: Array<{
        route: string;
        flights: number;
        passengers: number;
        avgPassengers: number | null;
        loadFactor: number | null;
        avgDelayMinutes: number | null;
        onTimeRate: number | null;
      }>;
    };
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
  };
  comparison: {
    flights: { current: number; previous: number; growth: number };
    passengers: { current: number; previous: number; growth: number };
    cargo: { current: number; previous: number; growth: number };
    loadFactor: { current: number | null; previous: number | null; growth: number };
    onTimeRate: { current: number | null; previous: number | null; growth: number };
    avgDelayMinutes: { current: number | null; previous: number | null; growth: number };
    cancelledRate: { current: number | null; previous: number | null; growth: number };
  };
}

type DatePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

function DatePickerField({ label, value, onChange }: DatePickerFieldProps) {
  const parseDateValue = (dateValue: string) => {
    const [year, month, day] = dateValue.split('-').map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
    const parsed = new Date(dateValue);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };
  const selectedDate = value ? parseDateValue(value) : undefined;
  const [month, setMonth] = useState<Date>(selectedDate || new Date());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (selectedDate) {
      setMonth(selectedDate);
    }
  }, [value]);

  const handleCalendarChange = (
    nextValue: string | number,
    event: ChangeEventHandler<HTMLSelectElement>
  ) => {
    const newEvent = {
      target: {
        value: String(nextValue),
      },
    } as ChangeEvent<HTMLSelectElement>;
    event(newEvent);
  };

  return (
    <div>
      <Label>{label}</Label>
      <Popover
        open={isOpen}
        onOpenChange={(open) => {
          setIsOpen(open);
          if (open && !selectedDate) {
            setMonth(new Date());
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'mt-1 w-full justify-start text-left font-normal rounded-xl border border-dark-100 bg-white px-3 py-2 text-sm',
              !selectedDate && 'text-dark-400'
            )}
            onClick={() => setIsOpen(true)}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-primary-600" />
            {selectedDate ? format(selectedDate, 'PPP', { locale: bs }) : <span>Odaberite datum</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
          <Calendar
            captionLayout="dropdown"
            fromYear={2018}
            toYear={new Date().getFullYear()}
            locale={bs}
            formatters={{
              formatMonthDropdown: (date) => format(date, 'MMMM', { locale: bs }),
              formatWeekdayName: (date) => format(date, 'EEE', { locale: bs }),
            }}
            components={{
              MonthCaption: ({ children }) => <>{children}</>,
              DropdownNav: (props) => (
                <div className="flex w-full items-center gap-2">
                  {props.children}
                </div>
              ),
              Dropdown: (props) => (
                <Select
                  onValueChange={(nextValue) => {
                    if (props.onChange) {
                      handleCalendarChange(nextValue, props.onChange);
                    }
                  }}
                  value={String(props.value)}
                >
                  <SelectTrigger className="first:flex-1 last:shrink-0 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-slate-200 shadow-xl">
                    {props.options?.map((option) => (
                      <SelectItem
                        disabled={option.disabled}
                        key={option.value}
                        value={String(option.value)}
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ),
            }}
            hideNavigation
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) return;
              onChange(getDateStringInTimeZone(date));
              setIsOpen(false);
            }}
            month={month}
            onMonthChange={setMonth}
            className="rounded-2xl bg-white p-5 text-base [--cell-size:3.75rem]"
            classNames={{
              months: 'flex gap-6 flex-col',
              month: 'flex flex-col w-full gap-6',
              weekdays: 'grid grid-cols-7 gap-3',
              weekday: 'text-center',
              week: 'grid grid-cols-7 gap-3 mt-3',
              outside: 'text-slate-300 opacity-60',
              day: 'group/day',
              day_button: 'rounded-full transition-all hover:bg-primary-50 hover:text-primary-800 hover:shadow-[0_6px_16px_rgba(59,130,246,0.25)] data-[selected-single=true]:bg-primary-600 data-[selected-single=true]:text-white data-[selected-single=true]:shadow-[0_10px_24px_rgba(59,130,246,0.35)] data-[selected-single=true]:hover:bg-primary-600',
              today: 'border-2 border-primary-300 text-primary-800 font-semibold',
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface Airline {
  id: string;
  name: string;
  icaoCode: string;
}

export default function CustomReportPage() {
  const [dateFrom, setDateFrom] = useState(getTodayDateString());
  const [dateTo, setDateTo] = useState(getTodayDateString());
  const [compareDateFrom, setCompareDateFrom] = useState(getTodayDateString());
  const [compareDateTo, setCompareDateTo] = useState(getTodayDateString());
  const [selectedAirlines, setSelectedAirlines] = useState<string[]>([]);
  const [airlineSelectValue, setAirlineSelectValue] = useState('');
  const [selectedRoutes, setSelectedRoutes] = useState<string[]>([]);
  const [routeSelectValue, setRouteSelectValue] = useState('');
  const [operationTypeId, setOperationTypeId] = useState('ALL');
  const [operationTypes, setOperationTypes] = useState<Array<{ id: string; name: string; code: string }>>([]);
  const [trendGranularity, setTrendGranularity] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [airlineOptions, setAirlineOptions] = useState<Airline[]>([]);
  const [routes, setRoutes] = useState<string[]>([]);
  const [routeOptions, setRouteOptions] = useState<string[]>([]);

  const [reportData, setReportData] = useState<CustomReportData | null>(null);
  const [comparisonData, setComparisonData] = useState<CustomComparisonData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch airlines for filter
  useEffect(() => {
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

    fetchAirlines();
  }, []);

  // Fetch operation types for filter
  useEffect(() => {
    const fetchOperationTypes = async () => {
      try {
        const response = await fetch('/api/operation-types?activeOnly=true');
        if (response.ok) {
          const result = await response.json();
          setOperationTypes(result.data);
        }
      } catch (err) {
        console.error('Error fetching operation types:', err);
      }
    };

    fetchOperationTypes();
  }, []);

  // Fetch routes for filter
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const response = await fetch('/api/routes?page=1&limit=100');
        if (!response.ok) return;
        const result = await response.json();
        setRoutes(result.data || []);
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
      console.error('Error searching airlines:', err);
    }
  }, [airlines]);

  const fetchRouteOptions = useCallback(async (search: string) => {
    const trimmed = search.trim();
    if (!trimmed) {
      setRouteOptions(routes);
      return;
    }
    try {
      const response = await fetch(`/api/routes?search=${encodeURIComponent(trimmed)}&page=1&limit=100`);
      if (!response.ok) return;
      const result = await response.json();
      setRouteOptions(result.data || []);
    } catch (err) {
      console.error('Error searching routes:', err);
    }
  }, [routes]);

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/reports/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateFrom,
          dateTo,
          airlines: selectedAirlines,
          routes: selectedRoutes,
          operationTypeId,
          groupBy: 'day',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri generisanju izvještaja');
      }

      const result = await response.json();
      setReportData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateComparison = async () => {
    setIsComparing(true);
    setError(null);

    try {
      const response = await fetch('/api/reports/custom/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          primary: {
            dateFrom,
            dateTo,
          },
          comparison: {
            dateFrom: compareDateFrom,
            dateTo: compareDateTo,
          },
          airlines: selectedAirlines,
          routes: selectedRoutes,
          operationTypeId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri generisanju usporedbe');
      }

      const result = await response.json();
      setComparisonData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsComparing(false);
    }
  };

  const handleExportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['CUSTOM IZVJEŠTAJ - Aerodrom Tuzla'],
      ['Period:', `${reportData.filters.dateFrom} - ${reportData.filters.dateTo}`],
      ['Grupe po:', reportData.filters.groupBy],
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
      ['Prtljag (kg):', reportData.totals.arrivalBaggage],
      ['Cargo (kg):', reportData.totals.arrivalCargo],
      ['Pošta (kg):', reportData.totals.arrivalMail],
      [],
      ['ODLAZAK'],
      ['Letova:', reportData.totals.departureFlights],
      ['Putnika:', reportData.totals.departurePassengers],
      ['Prtljag (kg):', reportData.totals.departureBaggage],
      ['Cargo (kg):', reportData.totals.departureCargo],
      ['Pošta (kg):', reportData.totals.departureMail],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summarySheet, 'Sažetak');

    // Grouped data sheet
    const groupedDataExport = reportData.groupedData.map(g => ({
      [reportData.filters.groupBy]: g.displayLabel,
      'Letovi': g.flights,
      'Putnici': g.passengers,
      'Dolazaka': g.arrivalFlights,
      'Odlazaka': g.departureFlights,
    }));

    const groupedSheet = XLSX.utils.json_to_sheet(groupedDataExport);
    XLSX.utils.book_append_sheet(wb, groupedSheet, 'Grupirani podaci');

    // Download
    XLSX.writeFile(wb, `Custom_izvjestaj_${formatDateDisplay(getTodayDateString())}.xlsx`);
  };

  const addAirline = (icaoCode: string) => {
    setSelectedAirlines((prev) => (prev.includes(icaoCode) ? prev : [...prev, icaoCode]));
  };

  const removeAirline = (icaoCode: string) => {
    setSelectedAirlines((prev) => prev.filter((code) => code !== icaoCode));
  };

  const addRoute = (route: string) => {
    setSelectedRoutes((prev) => (prev.includes(route) ? prev : [...prev, route]));
  };

  const removeRoute = (route: string) => {
    setSelectedRoutes((prev) => prev.filter((item) => item !== route));
  };

  const formatRange = (from: string, to: string) => `${formatDateDisplay(from)} - ${formatDateDisplay(to)}`;
  const formatGrowth = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  const formatMetric = (value: number | null, suffix = '', decimals = 1) => {
    if (value === null) return '-';
    return `${value.toFixed(decimals)}${suffix}`;
  };
  const trendGranularityLabel = {
    daily: 'Dnevno',
    weekly: 'Sedmično',
    monthly: 'Mjesečno',
  }[trendGranularity];

  const getIsoWeek = (date: Date) => {
    const dateCopy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const day = dateCopy.getUTCDay() || 7;
    dateCopy.setUTCDate(dateCopy.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(dateCopy.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil((((dateCopy.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return weekNumber;
  };

  const aggregateDailyToWeekly = (dailyData: CustomComparisonData['periodA']['dailyData']) => {
    const groupMap = new Map<string, {
      date: string;
      label: string;
      flights: number;
      passengers: number;
      loadFactorSum: number;
      loadFactorCount: number;
      onTimeSum: number;
      onTimeCount: number;
      delaySum: number;
      delayCount: number;
    }>();

    dailyData.forEach((item) => {
      const parsedDate = new Date(item.date);
      if (Number.isNaN(parsedDate.getTime())) return;
      const weekStart = new Date(parsedDate);
      const day = (weekStart.getDay() + 6) % 7;
      weekStart.setDate(weekStart.getDate() - day);
      weekStart.setHours(0, 0, 0, 0);
      const key = weekStart.toISOString().slice(0, 10);
      const label = `W${getIsoWeek(weekStart)} ${weekStart.toLocaleDateString('bs-BA', {
        day: '2-digit',
        month: '2-digit',
      })}`;

      const existing = groupMap.get(key) || {
        date: key,
        label,
        flights: 0,
        passengers: 0,
        loadFactorSum: 0,
        loadFactorCount: 0,
        onTimeSum: 0,
        onTimeCount: 0,
        delaySum: 0,
        delayCount: 0,
      };

      existing.flights += item.flights;
      existing.passengers += item.passengers;
      if (item.loadFactor !== null) {
        existing.loadFactorSum += item.loadFactor;
        existing.loadFactorCount += 1;
      }
      if (item.onTimeRate !== null) {
        existing.onTimeSum += item.onTimeRate;
        existing.onTimeCount += 1;
      }
      if (item.avgDelayMinutes !== null) {
        existing.delaySum += item.avgDelayMinutes;
        existing.delayCount += 1;
      }
      groupMap.set(key, existing);
    });

    return Array.from(groupMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, value]) => ({
        date: value.date,
        label: value.label,
        flights: value.flights,
        passengers: value.passengers,
        loadFactor: value.loadFactorCount > 0 ? value.loadFactorSum / value.loadFactorCount : null,
        onTimeRate: value.onTimeCount > 0 ? value.onTimeSum / value.onTimeCount : null,
        avgDelayMinutes: value.delayCount > 0 ? value.delaySum / value.delayCount : null,
      }));
  };

  const getFlightTrendData = (period: CustomComparisonData['periodA']) => {
    if (trendGranularity === 'daily') return period.dailyData;
    if (trendGranularity === 'weekly') return aggregateDailyToWeekly(period.dailyData);
    return period.monthlyBreakdown.map((month) => ({
      date: `${month.monthNumber}`,
      label: month.month,
      flights: month.flights,
      passengers: month.passengers,
    }));
  };

  const getLoadFactorTrendData = (period: CustomComparisonData['periodA']) => {
    if (trendGranularity === 'daily') return period.dailyData;
    if (trendGranularity === 'weekly') return aggregateDailyToWeekly(period.dailyData);
    return period.loadFactor.byMonth.map((month) => ({
      date: `${month.monthNumber}`,
      label: month.month,
      loadFactor: month.loadFactor,
    }));
  };

  const getPunctualityTrendData = (period: CustomComparisonData['periodA']) => {
    if (trendGranularity === 'daily') return period.dailyData;
    if (trendGranularity === 'weekly') return aggregateDailyToWeekly(period.dailyData);
    return period.punctuality.byMonth.map((month) => ({
      date: `${month.monthNumber}`,
      label: month.month,
      onTimeRate: month.onTimeRate,
      avgDelayMinutes: month.avgDelayMinutes,
    }));
  };

  const buildComparisonSeries = (
    periodA: CustomComparisonData['periodA'],
    periodB: CustomComparisonData['periodB'],
    metricKeys: Array<{ key: string; label: string }>
  ) => {
    const map = new Map<string, Record<string, string | number | null>>();
    const addSeries = (
      data: Array<Record<string, any>>,
      prefix: string,
      labelKey: string
    ) => {
      data.forEach((item) => {
        const label = item[labelKey] as string;
        const existing = map.get(label) || { label };
        metricKeys.forEach((metric) => {
          existing[`${prefix}_${metric.key}`] = item[metric.key] ?? null;
        });
        map.set(label, existing);
      });
    };

    addSeries(
      metricKeys.some((metric) => metric.key === 'flights' || metric.key === 'passengers')
        ? getFlightTrendData(periodA as CustomComparisonData['periodA'])
        : metricKeys.some((metric) => metric.key === 'loadFactor')
          ? getLoadFactorTrendData(periodA as CustomComparisonData['periodA'])
          : getPunctualityTrendData(periodA as CustomComparisonData['periodA']),
      'A',
      'label'
    );
    addSeries(
      metricKeys.some((metric) => metric.key === 'flights' || metric.key === 'passengers')
        ? getFlightTrendData(periodB as CustomComparisonData['periodB'])
        : metricKeys.some((metric) => metric.key === 'loadFactor')
          ? getLoadFactorTrendData(periodB as CustomComparisonData['periodB'])
          : getPunctualityTrendData(periodB as CustomComparisonData['periodB']),
      'B',
      'label'
    );

    return Array.from(map.values());
  };
  const renderPeriodInsights = (period: CustomComparisonData['periodA'], label: string) => {
    return (
      <section className="space-y-6">
        <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-slate-100">
                <Calendar className="w-5 h-5 text-slate-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-dark-900">{label}</h3>
                <p className="text-sm text-dark-500">{formatRange(period.dateFrom, period.dateTo)}</p>
              </div>
            </div>
            <div className="text-xs text-dark-500">
              Letova: {period.totals.flights.toLocaleString('bs-BA')} · Putnika: {period.totals.totalPassengers.toLocaleString('bs-BA')}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
            <h4 className="text-base font-semibold text-dark-900 mb-4">Status operacija</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs text-dark-500 mb-1">Operisano</p>
                <p className="text-lg font-semibold text-dark-900">{period.statusBreakdown.operatedLegs}</p>
                <p className="text-xs text-dark-500">{formatMetric(period.statusBreakdown.operatedRate, '%')}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs text-dark-500 mb-1">Otkazano</p>
                <p className="text-lg font-semibold text-dark-900">{period.statusBreakdown.cancelledLegs}</p>
                <p className="text-xs text-dark-500">{formatMetric(period.statusBreakdown.cancelledRate, '%')}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs text-dark-500 mb-1">Divertovano</p>
                <p className="text-lg font-semibold text-dark-900">{period.statusBreakdown.divertedLegs}</p>
                <p className="text-xs text-dark-500">{formatMetric(period.statusBreakdown.divertedRate, '%')}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs text-dark-500 mb-1">Ukupno legova</p>
                <p className="text-lg font-semibold text-dark-900">{period.statusBreakdown.totalLegs}</p>
                <p className="text-xs text-dark-500">Planiranih: {period.statusBreakdown.scheduledLegs}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
            <h4 className="text-base font-semibold text-dark-900 mb-4">Peak dani i sati</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs text-dark-500 mb-2">Najprometniji dani</p>
                <div className="space-y-2">
                  {period.peakDays.map((day) => (
                    <div key={day.date} className="flex items-center justify-between">
                      <span className="text-dark-700">{formatDateDisplay(day.date)}</span>
                      <span className="text-dark-500">{day.passengers.toLocaleString()} · {day.flights} let.</span>
                    </div>
                  ))}
                  {period.peakDays.length === 0 && (
                    <p className="text-xs text-dark-500">Nema podataka.</p>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="text-xs text-dark-500 mb-2">Najprometniji sati</p>
                <div className="space-y-2">
                  {period.peakHours.map((hour) => (
                    <div key={hour.hour} className="flex items-center justify-between">
                      <span className="text-dark-700">{String(hour.hour).padStart(2, '0')}:00</span>
                      <span className="text-dark-500">{hour.passengers.toLocaleString()} · {hour.flights} let.</span>
                    </div>
                  ))}
                  {period.peakHours.length === 0 && (
                    <p className="text-xs text-dark-500">Nema podataka.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
            <h4 className="text-base font-semibold text-dark-900 mb-4">Top rute po putnicima</h4>
            <div className="space-y-3 text-sm">
              {period.routes.topByPassengers.map((route) => (
                <div key={route.route} className="flex items-center justify-between">
                  <span className="text-dark-700">{route.route}</span>
                  <span className="text-dark-500">{route.passengers.toLocaleString()} · {route.flights} let.</span>
                </div>
              ))}
              {period.routes.topByPassengers.length === 0 && (
                <p className="text-xs text-dark-500">Nema podataka.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
            <h4 className="text-base font-semibold text-dark-900 mb-4">Top rute po load factoru</h4>
            <div className="space-y-3 text-sm">
              {period.routes.topByLoadFactor.map((route) => (
                <div key={route.route} className="flex items-center justify-between">
                  <span className="text-dark-700">{route.route}</span>
                  <span className="text-dark-500">
                    {formatMetric(route.loadFactor, '%')} · {route.flights} let.
                  </span>
                </div>
              ))}
              {period.routes.topByLoadFactor.length === 0 && (
                <p className="text-xs text-dark-500">Nema podataka.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
            <h4 className="text-base font-semibold text-dark-900 mb-4">Najveća kašnjenja</h4>
            <div className="space-y-3 text-sm">
              {period.routes.mostDelayed.map((route) => (
                <div key={route.route} className="flex items-center justify-between">
                  <span className="text-dark-700">{route.route}</span>
                  <span className="text-dark-500">
                    {formatMetric(route.avgDelayMinutes, ' min', 0)} · {route.flights} let.
                  </span>
                </div>
              ))}
              {period.routes.mostDelayed.length === 0 && (
                <p className="text-xs text-dark-500">Nema podataka.</p>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  };
  const comparisonCards = comparisonData
    ? [
        {
          title: 'Letovi',
          icon: Plane,
          current: comparisonData.comparison.flights.current,
          previous: comparisonData.comparison.flights.previous,
          growth: comparisonData.comparison.flights.growth,
          formatValue: (value: number | null) => (value === null ? '-' : value.toLocaleString('bs-BA')),
          surface: 'bg-gradient-to-br from-slate-50 via-white to-sky-50',
          iconBg: 'bg-slate-100',
          iconColor: 'text-slate-700',
          badge: 'Ukupno',
        },
        {
          title: 'Putnici',
          icon: Users,
          current: comparisonData.comparison.passengers.current,
          previous: comparisonData.comparison.passengers.previous,
          growth: comparisonData.comparison.passengers.growth,
          formatValue: (value: number | null) => (value === null ? '-' : value.toLocaleString('bs-BA')),
          surface: 'bg-gradient-to-br from-stone-50 via-white to-neutral-50',
          iconBg: 'bg-stone-100',
          iconColor: 'text-stone-700',
          badge: 'Ukupno',
        },
        {
          title: 'Cargo',
          icon: Package,
          current: comparisonData.comparison.cargo.current,
          previous: comparisonData.comparison.cargo.previous,
          growth: comparisonData.comparison.cargo.growth,
          formatValue: (value: number | null) => (value === null ? '-' : `${value.toLocaleString('bs-BA')} kg`),
          surface: 'bg-gradient-to-br from-zinc-50 via-white to-slate-50',
          iconBg: 'bg-zinc-100',
          iconColor: 'text-zinc-700',
          badge: 'Ukupno',
        },
        {
          title: 'Load factor',
          icon: TrendingUp,
          current: comparisonData.comparison.loadFactor.current,
          previous: comparisonData.comparison.loadFactor.previous,
          growth: comparisonData.comparison.loadFactor.growth,
          formatValue: (value: number | null) => formatMetric(value, '%'),
          surface: 'bg-gradient-to-br from-neutral-50 via-white to-stone-50',
          iconBg: 'bg-neutral-100',
          iconColor: 'text-neutral-700',
          badge: 'Prosjek',
        },
        {
          title: 'Tačnost',
          icon: Clock,
          current: comparisonData.comparison.onTimeRate.current,
          previous: comparisonData.comparison.onTimeRate.previous,
          growth: comparisonData.comparison.onTimeRate.growth,
          formatValue: (value: number | null) => formatMetric(value, '%'),
          surface: 'bg-gradient-to-br from-gray-50 via-white to-slate-50',
          iconBg: 'bg-gray-100',
          iconColor: 'text-gray-700',
          badge: 'On-time',
        },
        {
          title: 'Prosj. kašnjenje',
          icon: AlertCircle,
          current: comparisonData.comparison.avgDelayMinutes.current,
          previous: comparisonData.comparison.avgDelayMinutes.previous,
          growth: comparisonData.comparison.avgDelayMinutes.growth,
          formatValue: (value: number | null) => formatMetric(value, ' min', 0),
          surface: 'bg-gradient-to-br from-slate-50 via-white to-neutral-50',
          iconBg: 'bg-slate-100',
          iconColor: 'text-slate-700',
          badge: 'Prosjek',
        },
        {
          title: 'Otkazivanja',
          icon: AlertCircle,
          current: comparisonData.comparison.cancelledRate.current,
          previous: comparisonData.comparison.cancelledRate.previous,
          growth: comparisonData.comparison.cancelledRate.growth,
          formatValue: (value: number | null) => formatMetric(value, '%'),
          surface: 'bg-gradient-to-br from-stone-50 via-white to-zinc-50',
          iconBg: 'bg-stone-100',
          iconColor: 'text-stone-700',
          badge: 'Stopa',
        },
      ]
    : [];

  return (
    <MainLayout>
      <div className="p-8 space-y-6">
        {/* Filter Builder */}
        <div className="bg-gradient-to-br from-slate-50 via-white to-stone-50 rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Filteri</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            <div className="rounded-2xl border border-dark-100 bg-dark-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-dark-500 mb-3">Period A (bazni)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePickerField label="Datum od" value={dateFrom} onChange={setDateFrom} />
                <DatePickerField label="Datum do" value={dateTo} onChange={setDateTo} />
              </div>
            </div>
            <div className="rounded-2xl border border-dark-100 bg-white p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-dark-500 mb-3">Period B (uporedni)</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePickerField label="Datum od" value={compareDateFrom} onChange={setCompareDateFrom} />
                <DatePickerField label="Datum do" value={compareDateTo} onChange={setCompareDateTo} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Operation Type */}
            <div>
              <Label htmlFor="operationTypeId">Tip operacije</Label>
              <select
                id="operationTypeId"
                value={operationTypeId}
                onChange={(e) => setOperationTypeId(e.target.value)}
                className="w-full mt-1 flex h-10 rounded-xl border border-dark-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
              >
                <option value="ALL">Sve</option>
                {operationTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Airlines Multi-Select */}
          <div className="mb-4">
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
                  onClick={() => setSelectedAirlines([])}
                  className="px-3 py-1.5 rounded-xl text-xs bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Očisti sve
                </button>
              </div>
            )}
          </div>

          {/* Routes Multi-Select */}
          <div className="mb-4">
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
                  onClick={() => setSelectedRoutes([])}
                  className="px-3 py-1.5 rounded-xl text-xs bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Očisti sve rute
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleGenerateReport}
              disabled={isLoading}
              className="bg-primary-600 hover:bg-primary-600/90 text-white"
            >
              {isLoading ? 'Generiše se...' : 'Generiši izvještaj'}
            </Button>
            <Button
              onClick={handleGenerateComparison}
              disabled={isComparing}
              variant="outline"
            >
              {isComparing ? 'Uspoređujem...' : 'Uporedi periode'}
            </Button>
            {reportData && (
              <Button
                onClick={handleExportToExcel}
                variant="outline"
              >
                Exportuj u Excel
              </Button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {comparisonData && (
          <section className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-dark-900 to-dark-800 px-6 py-6 text-white shadow-soft-xl">
              <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-white/10 blur-3xl -mr-12 -mt-12"></div>
              <div className="absolute bottom-0 left-0 h-40 w-40 rounded-full bg-slate-500/20 blur-3xl -ml-10 -mb-10"></div>
              <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Usporedba perioda</h2>
                    <p className="text-sm text-dark-200">Odabrani filteri su isti za oba perioda</p>
                  </div>
                </div>
                <div className="text-xs text-dark-200 space-y-1">
                  <p>Period A: {formatRange(comparisonData.periodA.dateFrom, comparisonData.periodA.dateTo)}</p>
                  <p>Period B: {formatRange(comparisonData.periodB.dateFrom, comparisonData.periodB.dateTo)}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {comparisonCards.map((card) => {
                const Icon = card.icon;
                const isPositive = card.growth >= 0;
                return (
                  <div key={card.title} className={`${card.surface} rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white`}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide ${card.iconBg} ${card.iconColor}`}>
                          {card.badge}
                        </div>
                        <p className="text-sm text-dark-600 mt-3">{card.title}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-2xl font-bold text-dark-900">{card.formatValue(card.current)}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${isPositive ? 'bg-slate-100 text-slate-700' : 'bg-stone-100 text-stone-700'}`}>
                            {isPositive ? <TrendingUp className="w-3 h-3 inline-block mr-1" /> : <TrendingDown className="w-3 h-3 inline-block mr-1" />}
                            {formatGrowth(card.growth)}
                          </span>
                        </div>
                        <div className="mt-3 text-xs text-dark-500 space-y-1">
                          <p>A: {card.formatValue(card.current)}</p>
                          <p>B: {card.formatValue(card.previous)}</p>
                        </div>
                      </div>
                      <div className={`p-3 rounded-2xl ${card.iconBg}`}>
                        <Icon className={`w-5 h-5 ${card.iconColor}`} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {comparisonData && (
          <section className="space-y-6">
            <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-slate-100">
                    <Activity className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-dark-900">Trendovi perioda A i B</h3>
                    <p className="text-sm text-dark-500">Kombinovani prikaz za oba perioda</p>
                  </div>
                </div>
                <div className="text-xs text-dark-500 space-y-1 text-right">
                  <p>Period A: {formatRange(comparisonData.periodA.dateFrom, comparisonData.periodA.dateTo)}</p>
                  <p>Period B: {formatRange(comparisonData.periodB.dateFrom, comparisonData.periodB.dateTo)}</p>
                </div>
                <div className="flex items-center rounded-full bg-slate-100 p-1 border border-slate-200 w-fit">
                  {[
                    { value: 'daily', label: 'Dnevno' },
                    { value: 'weekly', label: 'Sedmično' },
                    { value: 'monthly', label: 'Mjesečno' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTrendGranularity(option.value as 'daily' | 'weekly' | 'monthly')}
                      className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                        trendGranularity === option.value
                          ? 'bg-white text-dark-900 shadow-sm'
                          : 'text-dark-600 hover:text-dark-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
                <h4 className="text-base font-semibold text-dark-900 mb-4">
                  Trend letova i putnika ({trendGranularityLabel.toLowerCase()})
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={buildComparisonSeries(
                      comparisonData.periodA,
                      comparisonData.periodB,
                      [
                        { key: 'flights', label: 'Letovi' },
                        { key: 'passengers', label: 'Putnici' },
                      ]
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E2E2E4',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="A_flights" stroke="#0f172a" strokeWidth={2} name="Period A · Letovi" />
                    <Line type="monotone" dataKey="B_flights" stroke="#60a5fa" strokeWidth={2} name="Period B · Letovi" />
                    <Line type="monotone" dataKey="A_passengers" stroke="#334155" strokeWidth={2} name="Period A · Putnici" />
                    <Line type="monotone" dataKey="B_passengers" stroke="#93c5fd" strokeWidth={2} name="Period B · Putnici" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
                <h4 className="text-base font-semibold text-dark-900 mb-4">
                  Load factor ({trendGranularityLabel.toLowerCase()})
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={buildComparisonSeries(
                      comparisonData.periodA,
                      comparisonData.periodB,
                      [{ key: 'loadFactor', label: 'Load factor' }]
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                    <Tooltip
                      formatter={(value: number) => [`${Number(value).toFixed(1)}%`, 'Load factor']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E2E2E4',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="A_loadFactor" stroke="#0f172a" strokeWidth={2} name="Period A · Load factor" />
                    <Line type="monotone" dataKey="B_loadFactor" stroke="#60a5fa" strokeWidth={2} name="Period B · Load factor" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
                <h4 className="text-base font-semibold text-dark-900 mb-4">
                  Tačnost ({trendGranularityLabel.toLowerCase()})
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={buildComparisonSeries(
                      comparisonData.periodA,
                      comparisonData.periodB,
                      [{ key: 'onTimeRate', label: 'On-time' }]
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                    <Tooltip
                      formatter={(value: number) => [`${Number(value).toFixed(1)}%`, 'On-time']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E2E2E4',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="A_onTimeRate" stroke="#0f172a" strokeWidth={2} name="Period A · On-time" />
                    <Line type="monotone" dataKey="B_onTimeRate" stroke="#60a5fa" strokeWidth={2} name="Period B · On-time" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-3xl shadow-soft px-6 py-5 border-[6px] border-white">
                <h4 className="text-base font-semibold text-dark-900 mb-4">
                  Prosječno kašnjenje ({trendGranularityLabel.toLowerCase()})
                </h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={buildComparisonSeries(
                      comparisonData.periodA,
                      comparisonData.periodB,
                      [{ key: 'avgDelayMinutes', label: 'Avg delay' }]
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9A9A9A' }} />
                    <Tooltip
                      formatter={(value: number) => [`${Number(value).toFixed(1)} min`, 'Kašnjenje']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E2E2E4',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="A_avgDelayMinutes" stroke="#0f172a" strokeWidth={2} name="Period A · Avg delay" />
                    <Line type="monotone" dataKey="B_avgDelayMinutes" stroke="#60a5fa" strokeWidth={2} name="Period B · Avg delay" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>
        )}

        {comparisonData && (
          <div className="space-y-10">
            {renderPeriodInsights(comparisonData.periodA, 'Period A')}
            {renderPeriodInsights(comparisonData.periodB, 'Period B')}
          </div>
        )}

        {/* Results */}
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

            {/* Chart */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">
                Vizualizacija (dan)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={reportData.groupedData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E2E4" />
                  <XAxis
                    dataKey="displayLabel"
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
                    name="Letovi"
                  />
                  <Line
                    type="monotone"
                    dataKey="passengers"
                    stroke="#16A34A"
                    strokeWidth={2}
                    name="Putnici"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Grouped Data Table */}
            <div className="bg-white rounded-2xl shadow-soft px-6 py-5">
              <h3 className="text-lg font-semibold text-dark-900 mb-4">
                Grupirani podaci ({reportData.groupedData.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-dark-100 bg-dark-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase">
                        Datum
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
                    {reportData.groupedData.map((item, idx) => (
                      <tr key={idx} className="border-b border-dark-100 hover:bg-dark-50">
                        <td className="px-4 py-3 text-sm font-medium">{item.displayLabel}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.flights}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.passengers}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.arrivalFlights}</td>
                        <td className="px-4 py-3 text-sm text-right">{item.departureFlights}</td>
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
