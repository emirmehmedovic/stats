import { dateOnlyToUtc, getDateStringInTimeZone } from '@/lib/dates';

export const PAST_FLIGHT_DELETE_ERROR =
  'Letove od jučer i starije nije moguće obrisati. Brisanje je dozvoljeno samo za današnje i buduće letove.';

// Flight.date stores a calendar date at UTC midnight, not a departure timestamp.
// Determine today's calendar date in the airport's timezone, regardless of server timezone.
export const getFlightDeletionCutoff = (now: Date = new Date()) =>
  dateOnlyToUtc(getDateStringInTimeZone(now));

export const canDeleteFlightDate = (date: Date | string, now: Date = new Date()) =>
  new Date(date).getTime() >= getFlightDeletionCutoff(now).getTime();
