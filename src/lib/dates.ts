export const TIME_ZONE_SARAJEVO = 'Europe/Sarajevo';

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
