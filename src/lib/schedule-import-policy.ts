import { dateOnlyToUtc, getDateStringInTimeZone } from '@/lib/dates';

// Flight.date is a calendar date stored at UTC midnight. The airport's local
// calendar determines tomorrow, independently of the server timezone and DST.
export const getScheduleImportStartDate = (now: Date = new Date()) => {
  const tomorrow = dateOnlyToUtc(getDateStringInTimeZone(now));
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  return tomorrow;
};

export const canImportScheduleDate = (date: Date, now: Date = new Date()) =>
  date.getTime() >= getScheduleImportStartDate(now).getTime();
