'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import * as XLSX from 'xlsx-js-style';
import { MainLayout } from '@/components/layout/MainLayout';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plane, Users, Building2, TrendingUp, Download, Calendar as CalendarIcon, PackageCheck, Package } from 'lucide-react';
import { formatDateDisplay, formatTimeDisplay, getDateStringInTimeZone, getTodayDateString } from '@/lib/dates';
import { format } from 'date-fns';
import { bs } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ChangeEvent, ChangeEventHandler } from 'react';

interface DailyReportData {
  mode: 'single';
  period: string;
  date: string;
  flights: any[];
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
  byAirline: Array<{
    airline: string;
    icaoCode: string;
    flights: number;
    passengers: number;
  }>;
  loadFactor: {
    overall: number | null;
    totalPassengers: number;
    totalSeats: number;
  };
  punctuality: {
    overallOnTimeRate: number | null;
    overallAvgDelayMinutes: number | null;
    totalDelaySamples: number;
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
}

interface MultiDailyReportData {
  mode: 'multi';
  periods: string[];
  periodsData: DailyReportData[];
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

type DailyReportPayload = DailyReportData | MultiDailyReportData;
type RangeDailyReportData = {
  mode: 'range';
  dateFrom: string;
  dateTo: string;
  daysData: DailyReportData[];
};

type DatePickerFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

function DatePickerField({ label, value, onChange, disabled }: DatePickerFieldProps) {
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
      <Label className="text-xs font-medium text-slate-600 mb-2 block">{label}</Label>
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
            disabled={disabled}
            className={cn(
              'w-full justify-start text-left font-normal rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 hover:border-primary-500 hover:bg-white',
              !selectedDate && 'text-slate-500'
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

export default function DailyReportPage() {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [rangeExportStart, setRangeExportStart] = useState(getTodayDateString());
  const [rangeExportEnd, setRangeExportEnd] = useState(getTodayDateString());
  const [comparisonStart, setComparisonStart] = useState(getTodayDateString());
  const [comparisonEnd, setComparisonEnd] = useState('');
  const [comparisonPeriods, setComparisonPeriods] = useState<string[]>([]);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const [comparisonType, setComparisonType] = useState<'days' | 'ranges'>('days');
  const [reportData, setReportData] = useState<DailyReportData | null>(null);
  const [multiReportData, setMultiReportData] = useState<MultiDailyReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRangeExporting, setIsRangeExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (comparisonType === 'days') {
      setComparisonEnd('');
    }
  }, [comparisonType]);

  const fetchReport = async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (isComparisonMode && comparisonPeriods.length < 2) {
        throw new Error('Odaberite najmanje dva perioda za komparaciju');
      }
      const query = isComparisonMode
        ? `/api/reports/daily?periods=${encodeURIComponent(comparisonPeriods.join(','))}`
        : `/api/reports/daily?date=${selectedDate}`;
      const response = await fetch(query);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri učitavanju izvještaja');
      }

      const result = await response.json();
      const payload = result.data as DailyReportPayload;
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

  const buildDailySheetRows = (data: DailyReportData) => {
    const headerRows = [
      ['DNEVNI IZVJESTAJ - Aerodrom Tuzla'],
      ['Datum:', formatDateDisplay(data.date)],
      [],
    ];

    const tableHeader = [
      'Datum',
      'Aviokompanija',
      'ICAO',
      'Ruta',
      'Avion',
      'Kapacitet mjesta',
      'MTOW (kg)',
      'Registracija',
      'Tip operacije',
      'Dolazak - Broj leta',
      'Planirano slijetanje',
      'Stvarno slijetanje',
      'Dolazak - Putnici',
      'Dolazak - Bebe',
      'Dolazak - Prtljag (kg)',
      'Dolazak - Cargo (kg)',
      'Dolazak - Poata (kg)',
      'Odlazak - Broj leta',
      'Planirano polijetanje',
      'Stvarno polijetanje',
      'Odlazak - Putnici',
      'Odlazak - Bebe',
      'Odlazak - Prtljag (kg)',
      'Odlazak - Cargo (kg)',
      'Odlazak - Poata (kg)',
    ];

    const dataRows = data.flights.map((flight) => [
      formatDateDisplay(flight.date),
      flight.airline?.name || '',
      flight.airline?.icaoCode || '',
      flight.route || '',
      flight.aircraftType?.model || '',
      flight.aircraftType?.seats ?? '',
      flight.aircraftType?.mtow ?? '',
      flight.registration || '',
      flight.operationType?.name || flight.operationType?.code || '',
      flight.arrivalFlightNumber || '',
      formatTimeDisplay(flight.arrivalScheduledTime),
      formatTimeDisplay(flight.arrivalActualTime),
      flight.arrivalPassengers || 0,
      flight.arrivalInfants || 0,
      flight.arrivalBaggage || 0,
      flight.arrivalCargo || 0,
      flight.arrivalMail || 0,
      flight.departureFlightNumber || '',
      formatTimeDisplay(flight.departureScheduledTime),
      formatTimeDisplay(flight.departureActualTime),
      flight.departurePassengers || 0,
      flight.departureInfants || 0,
      flight.departureBaggage || 0,
      flight.departureCargo || 0,
      flight.departureMail || 0,
    ]);

    const summaryRows = [
      [],
      ['SAZETAK'],
      ['Ukupno letova', data.totals.flights],
      ['Ukupno putnika', data.totals.totalPassengers],
      ['Ukupno prtljaga (kg)', data.totals.totalBaggage],
      ['Ukupno cargo (kg)', data.totals.totalCargo],
      ['Ukupno poata (kg)', data.totals.totalMail],
      [],
      ['DOLAZAK'],
      ['Letova', data.totals.arrivalFlights],
      ['Putnika', data.totals.arrivalPassengers],
      ['Bebe', data.totals.arrivalInfants],
      ['Prtljag (kg)', data.totals.arrivalBaggage],
      ['Cargo (kg)', data.totals.arrivalCargo],
      ['Poata (kg)', data.totals.arrivalMail],
      [],
      ['ODLAZAK'],
      ['Letova', data.totals.departureFlights],
      ['Putnika', data.totals.departurePassengers],
      ['Bebe', data.totals.departureInfants],
      ['Prtljag (kg)', data.totals.departureBaggage],
      ['Cargo (kg)', data.totals.departureCargo],
      ['Poata (kg)', data.totals.departureMail],
    ];

    return [...headerRows, tableHeader, ...dataRows, ...summaryRows];
  };

  const getColumnWidths = (rows: (string | number)[][], min = 8, max = 32) => {
    const widths: number[] = [];
    rows.forEach((row) => {
      row.forEach((value, colIndex) => {
        const cellText = value === null || value === undefined ? '' : String(value);
        widths[colIndex] = Math.max(widths[colIndex] || min, Math.min(max, cellText.length + 2));
      });
    });
    return widths;
  };

  const applySheetFormatting = (
    sheet: XLSX.WorkSheet,
    headerRowIndex: number,
    totalColumns: number,
    totalRows: number,
    summaryRowIndexes: number[],
    dataRowStart: number,
    dataRowEnd: number,
    summarySections: Array<{
      headerRow: number;
      startRow: number;
      endRow: number;
      headerFill: string;
      headerText: string;
      labelFill: string;
    }>
  ) => {
    const lastCol = XLSX.utils.encode_col(totalColumns - 1);
    sheet['!merges'] = sheet['!merges'] || [];
    sheet['!merges'].push({
      s: { r: 0, c: 0 },
      e: { r: 0, c: totalColumns - 1 },
    });
    summaryRowIndexes.forEach((row) => {
      sheet['!merges']?.push({
        s: { r: row, c: 0 },
        e: { r: row, c: totalColumns - 1 },
      });
    });

    sheet['!autofilter'] = {
      ref: `A${headerRowIndex}:${lastCol}${totalRows}`,
    };

    const headerRow = headerRowIndex - 1;
    for (let c = 0; c < totalColumns; c += 1) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRow, c });
      const cell = sheet[cellRef];
      if (cell) {
        cell.s = {
          font: { bold: true, color: { rgb: 'FFFFFF' } },
          fill: { patternType: 'solid', fgColor: { rgb: '1E3A8A' } },
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: 'CBD5E1' } },
            bottom: { style: 'thin', color: { rgb: 'CBD5E1' } },
            left: { style: 'thin', color: { rgb: 'CBD5E1' } },
            right: { style: 'thin', color: { rgb: 'CBD5E1' } },
          },
        };
      }
    }

    for (let r = dataRowStart; r <= dataRowEnd; r += 1) {
      const isStriped = (r - dataRowStart) % 2 === 1;
      const rowFill = isStriped ? { patternType: 'solid', fgColor: { rgb: 'F8FAFC' } } : undefined;
      for (let c = 0; c < totalColumns; c += 1) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        const cell = sheet[cellRef];
        if (!cell) continue;
        cell.s = {
          font: { color: { rgb: '1F2937' } },
          fill: rowFill,
          alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
          border: {
            top: { style: 'thin', color: { rgb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
            left: { style: 'thin', color: { rgb: 'E2E8F0' } },
            right: { style: 'thin', color: { rgb: 'E2E8F0' } },
          },
        };
      }
    }

    summaryRowIndexes.forEach((row) => {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: 0 });
      const cell = sheet[cellRef];
      if (cell) {
        cell.s = {
          font: { bold: true, color: { rgb: '0F172A' } },
          fill: { patternType: 'solid', fgColor: { rgb: 'FFE7BA' } },
          alignment: { horizontal: 'left', vertical: 'center' },
        };
      }
    });

    const titleCell = sheet['A1'];
    if (titleCell) {
      titleCell.s = {
        font: { bold: true, sz: 15, color: { rgb: '0F172A' } },
        fill: { patternType: 'solid', fgColor: { rgb: 'DBEAFE' } },
        alignment: { horizontal: 'center', vertical: 'center' },
      };
    }

    summarySections.forEach((section) => {
      for (let c = 0; c < totalColumns; c += 1) {
        const headerCellRef = XLSX.utils.encode_cell({ r: section.headerRow, c });
        const headerCell = sheet[headerCellRef];
        if (headerCell) {
          headerCell.s = {
            font: { bold: true, color: { rgb: section.headerText } },
            fill: { patternType: 'solid', fgColor: { rgb: section.headerFill } },
            alignment: { horizontal: 'left', vertical: 'center' },
          };
        }
      }

      for (let r = section.startRow; r <= section.endRow; r += 1) {
        const labelCellRef = XLSX.utils.encode_cell({ r, c: 0 });
        const labelCell = sheet[labelCellRef];
        if (!labelCell) continue;
        labelCell.s = {
          font: { bold: true, color: { rgb: '0F172A' } },
          fill: { patternType: 'solid', fgColor: { rgb: section.labelFill } },
          alignment: { horizontal: 'left', vertical: 'center' },
        };
      }
    });
  };

  const buildDailySheet = (data: DailyReportData) => {
    const rows = buildDailySheetRows(data);
    const sheet = XLSX.utils.aoa_to_sheet(rows);
    const columnWidths = getColumnWidths(rows, 8, 36);
    sheet['!cols'] = columnWidths.map((wch) => ({ wch }));
    const headerRowIndex = 4;
    const headerRowZero = headerRowIndex - 1;
    const dataStartRowZero = headerRowZero + 1;
    const dataEndRowZero = dataStartRowZero + data.flights.length - 1;
    const summaryStartRowZero = dataEndRowZero + 2;
    const summaryHeaderRows = [
      summaryStartRowZero,
      summaryStartRowZero + 7,
      summaryStartRowZero + 15,
    ];
    const summarySections = [
      {
        headerRow: summaryStartRowZero,
        startRow: summaryStartRowZero + 1,
        endRow: summaryStartRowZero + 5,
        headerFill: 'F59E0B',
        headerText: '0F172A',
        labelFill: 'FEF3C7',
      },
      {
        headerRow: summaryStartRowZero + 7,
        startRow: summaryStartRowZero + 8,
        endRow: summaryStartRowZero + 13,
        headerFill: '16A34A',
        headerText: 'FFFFFF',
        labelFill: 'DCFCE7',
      },
      {
        headerRow: summaryStartRowZero + 15,
        startRow: summaryStartRowZero + 16,
        endRow: summaryStartRowZero + 21,
        headerFill: 'DC2626',
        headerText: 'FFFFFF',
        labelFill: 'FEE2E2',
      },
    ];
    const totalRows = Math.max(headerRowIndex, dataEndRowZero + 1);
    applySheetFormatting(
      sheet,
      headerRowIndex,
      25,
      totalRows,
      summaryHeaderRows,
      dataStartRowZero,
      dataEndRowZero,
      summarySections
    );
    return sheet;
  };

  const handleExportToExcel = () => {
    if (!reportData || reportData.mode !== 'single') return;

    const wb = XLSX.utils.book_new();
    const dailySheet = buildDailySheet(reportData);
    XLSX.utils.book_append_sheet(wb, dailySheet, formatDateDisplay(reportData.date));
    XLSX.writeFile(wb, `Dnevni_izvjestaj_${formatDateDisplay(reportData.date)}.xlsx`);
  };

  const handleExportRangeToExcel = async () => {
    setIsRangeExporting(true);
    setError(null);
    try {
      if (!rangeExportStart || !rangeExportEnd) {
        throw new Error('Datum od i do su obavezni');
      }
      if (rangeExportStart > rangeExportEnd) {
        throw new Error('Datum od mora biti prije datuma do');
      }

      const response = await fetch(
        `/api/reports/daily?dateFrom=${rangeExportStart}&dateTo=${rangeExportEnd}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Greška pri učitavanju izvještaja');
      }

      const result = await response.json();
      const payload = result.data as RangeDailyReportData;
      if (payload.mode !== 'range' || !payload.daysData.length) {
        throw new Error('Nema podataka za odabrani period');
      }

      const wb = XLSX.utils.book_new();
      payload.daysData.forEach((dayReport) => {
        const sheetName = formatDateDisplay(dayReport.date) || dayReport.date;
        const sheet = buildDailySheet(dayReport);
        XLSX.utils.book_append_sheet(wb, sheet, sheetName.slice(0, 31));
      });

      XLSX.writeFile(
        wb,
        `Dnevni_izvjestaji_${formatDateDisplay(rangeExportStart)}_${formatDateDisplay(rangeExportEnd)}.xlsx`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nepoznata greška');
    } finally {
      setIsRangeExporting(false);
    }
  };

  const addComparisonPeriod = () => {
    if (!comparisonStart) return;
    if (comparisonType === 'ranges' && !comparisonEnd) {
      setError('Za raspon odaberite datum "do"');
      return;
    }
    const period =
      comparisonType === 'ranges' && comparisonEnd
        ? `${comparisonStart}..${comparisonEnd}`
        : comparisonStart;
    setComparisonPeriods((prev) => (prev.includes(period) ? prev : [...prev, period]));
  };

  const removeComparisonPeriod = (period: string) => {
    setComparisonPeriods((prev) => prev.filter((item) => item !== period));
  };

  const resetFilters = () => {
    setSelectedDate(getTodayDateString());
    setComparisonStart(getTodayDateString());
    setComparisonEnd('');
    setComparisonPeriods([]);
    setIsComparisonMode(false);
    setComparisonType('days');
  };

  const reportDateLabel = reportData ? formatDateDisplay(reportData.date) : '';

  return (
    <MainLayout>
      <div className="p-8 space-y-8">
        {/* Header with Date Picker */}
        <div className="bg-gradient-to-br from-dark-900 to-dark-800 rounded-3xl p-8 text-white shadow-soft-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary-500 opacity-10 rounded-full blur-3xl -ml-12 -mb-12"></div>

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                  <CalendarIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Dnevni izvještaj</h1>
                  <p className="text-sm text-dark-300">Detaljni pregled prometa po danu</p>
                </div>
              </div>

              <div className="max-w-xs">
                <DatePickerField
                  label="Izaberite datum"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  disabled={isComparisonMode}
                />
              </div>
            </div>

            <div className="flex flex-col items-start gap-3">
              <div className="flex items-center gap-2 text-sm text-dark-200">
                <input
                  id="comparisonMode"
                  type="checkbox"
                  checked={isComparisonMode}
                  onChange={(e) => setIsComparisonMode(e.target.checked)}
                  className="h-4 w-4 rounded border-white/30"
                />
                <Label htmlFor="comparisonMode" className="text-dark-200 text-sm">
                  Uporedi periode
                </Label>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={fetchReport}
                  disabled={isLoading}
                  className="bg-white text-dark-900 hover:bg-white/90 font-semibold shadow-soft"
                >
                  {isLoading ? 'Učitavam...' : 'Prikaži izvještaj'}
                </Button>
                {reportData && (
                  <Button
                    onClick={handleExportToExcel}
                    className="bg-primary-600 hover:bg-primary-500 text-white font-semibold"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportuj
                  </Button>
                )}
                <Button
                  onClick={resetFilters}
                  className="bg-white/10 hover:bg-white/20 text-white font-semibold"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        {isComparisonMode && (
          <div className="bg-white rounded-3xl p-6 shadow-soft">
            <h3 className="text-lg font-semibold text-dark-900 mb-4">Komparacija dana/perioda</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <input
                  id="compareDays"
                  type="radio"
                  name="comparisonType"
                  checked={comparisonType === 'days'}
                  onChange={() => setComparisonType('days')}
                  className="h-4 w-4 rounded border-borderSoft"
                />
                <Label htmlFor="compareDays" className="text-sm">
                  Pojedinačni dani
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="compareRanges"
                  type="radio"
                  name="comparisonType"
                  checked={comparisonType === 'ranges'}
                  onChange={() => setComparisonType('ranges')}
                  className="h-4 w-4 rounded border-borderSoft"
                />
                <Label htmlFor="compareRanges" className="text-sm">
                  Periodi (od-do)
                </Label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <DatePickerField
                label="Datum od"
                value={comparisonStart}
                onChange={setComparisonStart}
              />
              <DatePickerField
                label={`Datum do ${comparisonType === 'ranges' ? '(obavezno)' : '(opciono)'}`}
                value={comparisonEnd}
                onChange={setComparisonEnd}
                disabled={comparisonType === 'days'}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={addComparisonPeriod}
                >
                  Dodaj period
                </Button>
                <div className="flex flex-wrap gap-2">
                  {comparisonPeriods.length === 0 && (
                    <span className="text-xs text-dark-500">Nema odabranih perioda</span>
                  )}
                  {comparisonPeriods.map((period) => (
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
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl p-6 shadow-soft">
          <h3 className="text-lg font-semibold text-dark-900 mb-4">Generisanje izvještaja za period</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <DatePickerField
              label="Datum od"
              value={rangeExportStart}
              onChange={setRangeExportStart}
            />
            <DatePickerField
              label="Datum do"
              value={rangeExportEnd}
              onChange={setRangeExportEnd}
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={handleExportRangeToExcel}
                disabled={isRangeExporting}
                className="bg-primary-600 hover:bg-primary-500 text-white font-semibold"
              >
                <Download className="w-4 h-4 mr-2" />
                {isRangeExporting ? 'Generišem...' : 'Exportuj period'}
              </Button>
            </div>
          </div>
          <p className="text-xs text-dark-500 mt-3">
            Za svaki dan u periodu biće kreiran zaseban sheet sa operacijama i sažetkom.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-3xl p-6 shadow-soft">
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Report Data */}
        {reportData && (
          <>
            {/* Summary Cards */}
            <div className="flex flex-wrap gap-6">
              {[
                {
                  title: 'Ukupno letova',
                  value: reportData.totals.flights,
                  icon: Plane,
                  color: 'text-blue-600',
                  bgColor: 'bg-blue-50',
                  badge: reportDateLabel,
                  size: 'md:basis-1/4',
                },
                {
                  title: 'Ukupno putnika',
                  value: reportData.totals.totalPassengers.toLocaleString('bs-BA'),
                  icon: Users,
                  color: 'text-blue-600',
                  bgColor: 'bg-blue-50',
                  badge: 'Dolazak + odlazak',
                  size: 'md:basis-1/4',
                },
                {
                  title: 'Dolazaka',
                  value: reportData.totals.arrivalFlights,
                  icon: Plane,
                  color: 'text-indigo-600',
                  bgColor: 'bg-indigo-50',
                  badge: `${reportData.totals.arrivalPassengers} putnika`,
                  size: 'md:basis-1/6',
                },
                {
                  title: 'Odlazaka',
                  value: reportData.totals.departureFlights,
                  icon: Plane,
                  color: 'text-orange-600',
                  bgColor: 'bg-orange-50',
                  badge: `${reportData.totals.departurePassengers} putnika`,
                  size: 'md:basis-1/6',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className={`bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-all group cursor-pointer flex flex-col justify-between h-[160px] relative overflow-hidden border-[6px] border-white basis-full ${item.size} flex-grow`}
                  style={{ minWidth: '200px' }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/60 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[2px] transition-all"></div>
                  <div className="absolute top-0 right-0 -mt-2 -mr-2 w-16 h-16 bg-primary-200 rounded-full blur-2xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-100 rounded-full blur-3xl -mb-12 -ml-12 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all"></div>

                  <div className="flex justify-between items-start relative z-10">
                    <div className={`p-3.5 rounded-2xl ${item.bgColor} group-hover:scale-110 transition-transform`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <span className="px-3 py-1 bg-dark-50 rounded-full text-[10px] font-bold text-dark-500 uppercase tracking-wide">
                      {item.badge}
                    </span>
                  </div>
                  <div className="relative z-10">
                    <h4 className="text-3xl font-bold text-dark-900 mb-1">{item.value}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-dark-500">{item.title}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Load faktor',
                  value: reportData.loadFactor.overall !== null ? `${reportData.loadFactor.overall}%` : '-',
                  icon: TrendingUp,
                  color: 'text-sky-600',
                },
                {
                  title: 'Tačnost',
                  value: reportData.punctuality.overallOnTimeRate !== null ? `${reportData.punctuality.overallOnTimeRate}%` : '-',
                  icon: TrendingUp,
                  color: 'text-green-600',
                },
                {
                  title: 'Prosj. kašnjenje',
                  value: reportData.punctuality.overallAvgDelayMinutes !== null ? `${reportData.punctuality.overallAvgDelayMinutes} min` : '-',
                  icon: TrendingUp,
                  color: 'text-orange-600',
                },
                {
                  title: 'Uzorci kašnjenja',
                  value: reportData.punctuality.totalDelaySamples,
                  icon: TrendingUp,
                  color: 'text-red-600',
                },
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-3xl p-6 shadow-soft hover:shadow-soft-lg transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center ${item.color}`}>
                      <item.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm text-dark-500">{item.title}</p>
                      <p className="text-2xl font-bold text-dark-900">{item.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Totals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Arrival Totals */}
              <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-white/70 to-indigo-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-indigo-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-indigo-100 rounded-2xl">
                      <Plane className="w-6 h-6 text-indigo-600 transform -rotate-45" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-dark-900">Dolazak</h3>
                      <p className="text-sm text-dark-500">Ukupan promet dolaznih letova</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: 'Putnici', value: reportData.totals.arrivalPassengers, icon: Users },
                      { label: 'Bebe', value: reportData.totals.arrivalInfants, icon: Users },
                      { label: 'Prtljag (kg)', value: reportData.totals.arrivalBaggage.toLocaleString('bs-BA'), icon: PackageCheck },
                      { label: 'Cargo (kg)', value: reportData.totals.arrivalCargo.toLocaleString('bs-BA'), icon: Package },
                      { label: 'Pošta (kg)', value: reportData.totals.arrivalMail.toLocaleString('bs-BA'), icon: Package },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-3 rounded-2xl bg-white/60 border border-indigo-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-indigo-50">
                            <item.icon className="w-4 h-4 text-indigo-600" />
                          </div>
                          <span className="text-sm font-medium text-dark-700">{item.label}</span>
                        </div>
                        <span className="text-lg font-bold text-dark-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Departure Totals */}
              <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 via-white/70 to-orange-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
                <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-orange-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-orange-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-orange-100 rounded-2xl">
                      <Plane className="w-6 h-6 text-orange-600 transform rotate-45" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-dark-900">Odlazak</h3>
                      <p className="text-sm text-dark-500">Ukupan promet odlaznih letova</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {[
                      { label: 'Putnici', value: reportData.totals.departurePassengers, icon: Users },
                      { label: 'Bebe', value: reportData.totals.departureInfants, icon: Users },
                      { label: 'Prtljag (kg)', value: reportData.totals.departureBaggage.toLocaleString('bs-BA'), icon: PackageCheck },
                      { label: 'Cargo (kg)', value: reportData.totals.departureCargo.toLocaleString('bs-BA'), icon: Package },
                      { label: 'Pošta (kg)', value: reportData.totals.departureMail.toLocaleString('bs-BA'), icon: Package },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center justify-between p-3 rounded-2xl bg-white/60 border border-orange-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-orange-50">
                            <item.icon className="w-4 h-4 text-orange-600" />
                          </div>
                          <span className="text-sm font-medium text-dark-700">{item.label}</span>
                        </div>
                        <span className="text-lg font-bold text-dark-900">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* By Airline */}
            <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 via-white/70 to-primary-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-primary-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-primary-100 rounded-2xl">
                    <Building2 className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-dark-900">Po aviokompanijama</h3>
                    <p className="text-sm text-dark-500">Pregled prometa po aviokompanijama</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {reportData.byAirline.map((airline) => (
                    <div
                      key={airline.icaoCode}
                      className="flex items-center gap-3 p-4 rounded-2xl bg-dark-50 border border-dark-100 hover:border-primary-200 hover:bg-primary-50 transition-all"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-700 font-bold flex items-center justify-center text-sm">
                        {airline.icaoCode}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-dark-900">{airline.airline}</p>
                        <p className="text-xs text-dark-500 uppercase tracking-wide">{airline.icaoCode}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-dark-900">{airline.flights}</p>
                        <p className="text-xs text-dark-500">letova</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-xl font-bold text-primary-600">{airline.passengers.toLocaleString('bs-BA')}</p>
                        <p className="text-xs text-dark-500">putnika</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Flights List */}
            <div className="bg-white rounded-3xl p-8 shadow-soft relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white/70 to-blue-100/50 opacity-70 group-hover:opacity-90 group-hover:blur-[1.5px] transition-all"></div>
              <div className="absolute top-0 right-0 -mt-6 -mr-10 w-40 h-40 bg-blue-200 rounded-full blur-3xl opacity-50 group-hover:opacity-80 group-hover:scale-110 transition-all"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-100 rounded-full blur-3xl -mb-10 -ml-8 opacity-60 group-hover:opacity-90 group-hover:scale-110 transition-all"></div>

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-2xl">
                      <Plane className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-dark-900">Lista letova</h3>
                      <p className="text-sm text-dark-500">{reportData.flights.length} letova za odabrani datum</p>
                    </div>
                  </div>
                  <span className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-50 text-blue-600">
                    {reportData.flights.length} letova
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b-2 border-dark-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-dark-600 uppercase tracking-wide">
                          Aviokompanija
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-dark-600 uppercase tracking-wide">
                          Ruta
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-dark-600 uppercase tracking-wide">
                          Avion
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-dark-600 uppercase tracking-wide">
                          Dolazak
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-dark-600 uppercase tracking-wide">
                          PAX ARR
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-dark-600 uppercase tracking-wide">
                          Odlazak
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-dark-600 uppercase tracking-wide">
                          PAX DEP
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.flights.map((flight, index) => (
                        <tr
                          key={flight.id}
                          className={`border-b border-dark-100 hover:bg-blue-50 transition-colors ${index % 2 === 0 ? 'bg-white/50' : 'bg-dark-50/30'}`}
                        >
                          <td className="px-4 py-4 text-sm font-medium text-dark-900">{flight.airline.name}</td>
                          <td className="px-4 py-4 text-sm font-semibold text-primary-600">{flight.route}</td>
                          <td className="px-4 py-4 text-sm text-dark-700">{flight.aircraftType.model}</td>
                          <td className="px-4 py-4 text-sm font-mono text-dark-600">{flight.arrivalFlightNumber || '-'}</td>
                          <td className="px-4 py-4 text-sm text-right font-bold text-indigo-600">
                            {flight.arrivalPassengers || 0}
                          </td>
                          <td className="px-4 py-4 text-sm font-mono text-dark-600">{flight.departureFlightNumber || '-'}</td>
                          <td className="px-4 py-4 text-sm text-right font-bold text-orange-600">
                            {flight.departurePassengers || 0}
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

        {multiReportData && (
          <>
            <div className="bg-white rounded-3xl p-6 shadow-soft">
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
                      <tr key={`period-summary-${periodData.period}-${index}`} className="border-b border-dark-100 hover:bg-dark-50">
                        <td className="px-4 py-3 text-sm font-medium">{periodData.period}</td>
                        <td className="px-4 py-3 text-sm text-right">{periodData.totals.flights}</td>
                        <td className="px-4 py-3 text-sm text-right">{periodData.totals.totalPassengers}</td>
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

            <div className="bg-white rounded-3xl p-6 shadow-soft">
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
                          key={`route-header-${periodData.period}`}
                          className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase"
                        >
                          {periodData.period}
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

            <div className="bg-white rounded-3xl p-6 shadow-soft">
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
                          key={`airline-header-${periodData.period}`}
                          className="px-4 py-2 text-left text-xs font-semibold text-dark-500 uppercase"
                        >
                          {periodData.period}
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
