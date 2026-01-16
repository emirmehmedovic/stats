import * as XLSX from 'xlsx';
import { createEmptyDailyReport, createServiceItem, type DailyReport, type CarrierKey, createBookingTransaction } from '@/lib/naplate-config';

type CodeMapping =
  | { type: 'fee'; carrier: CarrierKey; label: string; unit: string; price: number }
  | { type: 'booking'; carrier: CarrierKey }
  | { type: 'commission'; carrier: CarrierKey }
  | { type: 'extra'; key: 'airport_pvc' | 'airport_masks' | 'airport_internet' | 'airport_donation' | 'adjustments' };

const CODE_MAP: Record<string, CodeMapping> = {
  US1035: { type: 'fee', carrier: 'wizz', label: 'Airport Check in', unit: 'flight/pax', price: 40 },
  US1016: { type: 'fee', carrier: 'wizz', label: 'Torba do 20KG', unit: 'bag/flight', price: 70 },
  US1017: { type: 'fee', carrier: 'wizz', label: 'Torba do 32KG', unit: 'bag/flight', price: 120 },
  US1043: { type: 'fee', carrier: 'wizz', label: 'Kabinska Torba na check-in', unit: 'bag/flight', price: 55 },
  US1044: { type: 'fee', carrier: 'wizz', label: 'PRB', unit: 'flight/pax', price: 65 },
  US0004: { type: 'fee', carrier: 'wizz', label: 'Infant', unit: 'flight/pax', price: 31 },
  US1037: { type: 'fee', carrier: 'wizz', label: 'Missed Flight Fee', unit: 'flight/pax', price: 80 },
  US0006: { type: 'fee', carrier: 'wizz', label: 'Name change fee', unit: 'flight/pax', price: 60 },
  US1036: { type: 'fee', carrier: 'wizz', label: 'Doplata 1kg', unit: 'bag/flight', price: 13 },
  US0015: { type: 'booking', carrier: 'wizz' },
  US0016: { type: 'commission', carrier: 'wizz' },
  US0017: { type: 'booking', carrier: 'wizz' },
  US1053: { type: 'booking', carrier: 'pegasus' },
  US1054: { type: 'booking', carrier: 'ajet' },
  RB0001: { type: 'extra', key: 'airport_pvc' },
  RB0002: { type: 'extra', key: 'airport_masks' },
  US0038: { type: 'extra', key: 'airport_internet' },
  US1004: { type: 'extra', key: 'airport_internet' },
  US1005: { type: 'extra', key: 'adjustments' },
  '000022': { type: 'extra', key: 'airport_donation' },
  '000023': { type: 'extra', key: 'airport_donation' },
  '000024': { type: 'extra', key: 'airport_donation' },
};

const findDateString = (rows: Array<Array<unknown>>) => {
  for (const row of rows) {
    for (const cell of row) {
      if (typeof cell !== 'string') continue;
      const match = cell.match(/(\\d{2})\\.(\\d{2})\\.(\\d{4})/);
      if (match) {
        const [, dd, mm, yyyy] = match;
        return `${yyyy}-${mm}-${dd}`;
      }
    }
  }
  return null;
};

const asNumber = (value: unknown) => {
  const num = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
  return Number.isFinite(num) ? num : 0;
};

const findOrCreateService = (
  report: DailyReport,
  carrier: CarrierKey,
  code: string,
  mapping: { label: string; unit: string; price: number }
) => {
  const existing = report.carriers[carrier].services.find((item) => item.code === code);
  if (existing) {
    return existing;
  }
  const created = createServiceItem({
    label: mapping.label,
    code,
    unit: mapping.unit,
    price: mapping.price,
  });
  report.carriers[carrier].services.push(created);
  return created;
};

export function parseAccountingExport(buffer: Buffer): { report: DailyReport; warnings: string[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true }) as Array<Array<unknown>>;

  const detectedDate = findDateString(rows);
  const report = createEmptyDailyReport(detectedDate || new Date().toISOString().slice(0, 10));
  const warnings: string[] = [];
  const bookingTotals: Record<CarrierKey, { pax: number; amountEur: number; commissionKm: number; airportRemunerationKm: number }> = {
    wizz: { pax: 0, amountEur: 0, commissionKm: 0, airportRemunerationKm: 0 },
    pegasus: { pax: 0, amountEur: 0, commissionKm: 0, airportRemunerationKm: 0 },
    ajet: { pax: 0, amountEur: 0, commissionKm: 0, airportRemunerationKm: 0 },
  };

  rows.forEach((row) => {
    const rawCode = row[2];
    if (!rawCode || typeof rawCode !== 'string') {
      return;
    }

    const code = rawCode.split('-')[0].trim();
    const mapping = CODE_MAP[code];
    if (!mapping) {
      return;
    }

    const qty = asNumber(row[5]);
    const amount = asNumber(row[7]);

    if (mapping.type === 'fee') {
      const service = findOrCreateService(report, mapping.carrier, code, mapping);
      service.qty += qty || 0;
      return;
    }

    if (mapping.type === 'booking') {
      bookingTotals[mapping.carrier].pax += qty || 0;
      bookingTotals[mapping.carrier].amountEur += amount || 0;
      return;
    }

    if (mapping.type === 'commission') {
      bookingTotals[mapping.carrier].commissionKm += amount || 0;
      return;
    }

    if (mapping.type === 'extra') {
      if (mapping.key === 'adjustments') {
        report.adjustmentsAmount += amount || 0;
        return;
      }
      const airportService = report.airportServices.find((item) => item.id === mapping.key);
      if (!airportService) {
        return;
      }
      if (mapping.key === 'airport_internet') {
        airportService.qty += qty || 0;
        return;
      }
      if (mapping.key === 'airport_donation') {
        airportService.amountOverride = (airportService.amountOverride || 0) + (amount || 0);
        return;
      }
      airportService.qty += qty || 0;
    }
  });

  if (!detectedDate) {
    warnings.push('Datum nije pronađen u fajlu, korišten je današnji datum.');
  }

  (Object.keys(bookingTotals) as CarrierKey[]).forEach((carrier) => {
    const totals = bookingTotals[carrier];
    if (!totals.pax && !totals.amountEur && !totals.commissionKm && !totals.airportRemunerationKm) {
      return;
    }
    report.carriers[carrier].bookings.transactions.push(
      createBookingTransaction({
        pnr: '',
        pax: totals.pax || 0,
        amountEur: totals.amountEur || 0,
        commissionKm: totals.commissionKm || 0,
        airportRemunerationKm: totals.airportRemunerationKm || 0,
      })
    );
  });

  return { report, warnings };
}
