export const TIME_ZONE_SARAJEVO = 'Europe/Sarajevo';

const pad2 = (value: number) => String(value).padStart(2, '0');

const getTimeZoneParts = (date: Date, timeZone: string) => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value || '00';
  return {
    year: Number(part('year')),
    month: Number(part('month')),
    day: Number(part('day')),
    hour: Number(part('hour')),
    minute: Number(part('minute')),
    second: Number(part('second')),
  };
};

export const makeDateInTimeZone = (
  dateStr: string,
  timeStr: string,
  timeZone: string = TIME_ZONE_SARAJEVO
) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return null;

  const timeParts = timeStr.split(':').map((part) => Number(part));
  const hour = timeParts[0];
  const minute = timeParts[1];
  const second = timeParts[2] ?? 0;
  if (
    Number.isNaN(hour) ||
    Number.isNaN(minute) ||
    Number.isNaN(second)
  ) {
    return null;
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute, second, 0));
  const actual = getTimeZoneParts(utcDate, timeZone);
  const actualLocal = Date.UTC(
    actual.year,
    actual.month - 1,
    actual.day,
    actual.hour,
    actual.minute,
    actual.second
  );
  const desiredLocal = Date.UTC(year, month - 1, day, hour, minute, second);
  const diffMs = actualLocal - desiredLocal;
  return new Date(utcDate.getTime() - diffMs);
};

export const normalizeDateToTimeZone = (
  date: Date,
  timeZone: string = TIME_ZONE_SARAJEVO
) => {
  if (Number.isNaN(date.getTime())) return date;
  const dateStr = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
  const timeStr = `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(
    date.getSeconds()
  )}`;
  return makeDateInTimeZone(dateStr, timeStr, timeZone) || date;
};

export const parseDateTimeInput = (
  value: unknown,
  timeZone: string = TIME_ZONE_SARAJEVO
): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const localMatch = trimmed.match(
      /^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}:\d{2})(?::(\d{2}))?$/
    );
    if (localMatch) {
      const datePart = localMatch[1];
      const timePart = localMatch[3]
        ? `${localMatch[2]}:${localMatch[3]}`
        : localMatch[2];
      return makeDateInTimeZone(datePart, timePart, timeZone);
    }
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) return null;
    return parsed;
  }
  return null;
};

export const getDateStringInTimeZone = (
  date: Date,
  timeZone: string = TIME_ZONE_SARAJEVO
) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

export const getTodayDateString = () => getDateStringInTimeZone(new Date());

export const dateOnlyToUtc = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1));
};

export const formatDateString = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  return `${day}.${month}.${year}`;
};

export const formatDateStringWithDay = (dateStr: string) => {
  const weekday = new Intl.DateTimeFormat('bs-BA', {
    timeZone: TIME_ZONE_SARAJEVO,
    weekday: 'long',
  }).format(dateOnlyToUtc(dateStr));
  return `${formatDateString(dateStr)}, ${weekday}`;
};

export const formatDateDisplay = (value: Date | string | null | undefined) => {
  if (!value) return '';
  if (value instanceof Date) {
    return formatDateString(getDateStringInTimeZone(value));
  }
  const dateStr = value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return formatDateString(dateStr);
  }
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return dateStr;
  return formatDateString(getDateStringInTimeZone(parsed));
};

export const formatTimeDisplay = (value: Date | string | null | undefined) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('bs-BA', {
    timeZone: TIME_ZONE_SARAJEVO,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatDateTimeDisplay = (value: Date | string | null | undefined) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('bs-BA', {
    timeZone: TIME_ZONE_SARAJEVO,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

export const formatDateTimeLocalValue = (value: Date | string | null | undefined) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE_SARAJEVO,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const part = (type: string) => parts.find((p) => p.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
};

export const getWeekdayName = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('bs-BA', {
    timeZone: TIME_ZONE_SARAJEVO,
    weekday: 'long',
  }).format(date);
};

export const formatMonthYearDisplay = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('bs-BA', {
    timeZone: TIME_ZONE_SARAJEVO,
    month: 'long',
    year: 'numeric',
  }).format(date);
};

export const getPreviousDateString = (dateStr: string) => {
  const dateObj = dateOnlyToUtc(dateStr);
  dateObj.setUTCDate(dateObj.getUTCDate() - 1);
  return dateObj.toISOString().split('T')[0];
};

export const startOfDayUtc = (dateStr: string) => {
  const date = dateOnlyToUtc(dateStr);
  date.setUTCHours(0, 0, 0, 0);
  return date;
};

export const endOfDayUtc = (dateStr: string) => {
  const date = dateOnlyToUtc(dateStr);
  date.setUTCHours(23, 59, 59, 999);
  return date;
};

export const getDateStringDaysAgo = (days: number) => {
  const today = dateOnlyToUtc(getTodayDateString());
  today.setUTCDate(today.getUTCDate() - days);
  return today.toISOString().split('T')[0];
};

export const getMonthStartDateString = (dateStr: string = getTodayDateString()) => {
  const [year, month] = dateStr.split('-');
  if (!year || !month) return dateStr;
  return `${year}-${month}-01`;
};

export const getMonthEndDateString = (dateStr: string = getTodayDateString()) => {
  const [year, month] = dateStr.split('-').map(Number);
  if (!year || !month) return dateStr;
  const lastDay = new Date(Date.UTC(year, month, 0));
  return lastDay.toISOString().split('T')[0];
};

export const dateStringFromParts = (year: number, month: number, day: number) => {
  return new Date(Date.UTC(year, month - 1, day)).toISOString().split('T')[0];
};
