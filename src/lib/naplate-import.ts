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

function parseOperationalExport(rows: Array<Array<unknown>>, fallbackDate?: string): { report: DailyReport; warnings: string[] } | null {
  const detectedDate = findDateString(rows);
  const dateToUse = detectedDate || fallbackDate || new Date().toISOString().slice(0, 10);
  const report = createEmptyDailyReport(dateToUse);
  const warnings: string[] = [];

  console.log('[Parser] Starting operational export parse, total rows:', rows.length);

  // Check if this is the operational format by looking for the header row
  const hasOperationalFormat = rows.some(row => {
    const text = row.map(c => c ? String(c) : '').join(' ');
    return text.match(/OTHER\s+WIZZ\s+AIR\s+SERVICES/i) || text.match(/OTHER\s+PEGASUS\s+SERVICES/i);
  });

  if (!hasOperationalFormat) {
    console.log('[Parser] Operational format not detected');
    return null;
  }

  console.log('[Parser] Operational format detected!');

  // Parse services (rows 4-36 approx)
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowText = row.map(cell => cell ? String(cell).trim() : '').join(' ');

    // Skip header rows and total rows
    if (rowText.match(/Fee types|ALL AMOUNTS|^Total|Airport remunerations.*dodatni/i)) {
      continue;
    }

    // Parse Wizz Air services (columns 1-7)
    if (row[1] && typeof row[1] === 'string' && row[1].trim() && !rowText.match(/BOOKINGS/i) && i > 2 && i < 37) {
      const label = String(row[1]).trim();

      // Skip Total and summary rows
      if (label.match(/^Total/i) || label.match(/Airport remunerations/i)) {
        continue;
      }

      const code = row[2] ? String(row[2]).trim() : '';
      const unit = row[3] ? String(row[3]).trim() : 'kom';
      const price = asNumber(row[4]);
      const qty = asNumber(row[5]);
      const amount = asNumber(row[6]);

      if (label && label !== 'EUR' && (qty > 0 || amount > 0)) {
        console.log(`[Parser] Adding Wizz service:`, { label, code, unit, price, qty, amount });

        // Find existing service
        let service;

        if (label === 'Other' || label === 'Ostalo') {
          // For "Other" services, match by label AND price to avoid merging different items
          service = report.carriers.wizz.services.find(s =>
            (s.label === label || s.label === 'Ostalo' || s.label === 'Other') && s.price === price
          );
        } else {
          // For labeled services, prioritize label match, then code
          service = report.carriers.wizz.services.find(s => s.label === label);

          // If not found by label and code exists, try by code (but only if it's a unique code)
          if (!service && code && code !== 'BAGEXC') {
            service = report.carriers.wizz.services.find(s => s.code === code);
          }
        }

        if (service) {
          // Update existing service
          service.qty += qty;
          console.log(`[Parser] Updated existing Wizz service:`, service);
        } else {
          // Add new service
          report.carriers.wizz.services.push(
            createServiceItem({ label, code, unit, price, qty })
          );
        }
      }
    }

    // Parse Pegasus services (columns 9-15)
    if (i > 2 && i < 37) {
      const rawLabel = row[9] && typeof row[9] === 'string' ? String(row[9]).trim() : '';
      const code = row[10] ? String(row[10]).trim() : '';
      const unit = row[11] ? String(row[11]).trim() : 'kom';
      const price = asNumber(row[12]);
      const qty = asNumber(row[13]);
      const amount = asNumber(row[14]);

      // Skip if no data
      if (qty === 0 && amount === 0) {
        continue;
      }

      // Use "Other" if no label provided
      const label = rawLabel && rawLabel !== 'EUR' ? rawLabel : 'Other';

      // Skip Total and summary rows
      if (label.match(/^Total/i) || label.match(/Airport remunerations/i)) {
        continue;
      }

      console.log(`[Parser] Adding Pegasus service:`, { label, code, unit, price, qty, amount });

      // Find existing service
      let service;

      if (label === 'Other') {
        // For "Other" services, match by label AND price to avoid merging different items
        service = report.carriers.pegasus.services.find(s =>
          s.label === label && s.price === price
        );
      } else {
        // For labeled services, prioritize label match, then code
        service = report.carriers.pegasus.services.find(s => s.label === label);

        // If not found by label and code exists, try by code (but only if it's a unique code)
        if (!service && code && code !== 'BAGEXC') {
          service = report.carriers.pegasus.services.find(s => s.code === code);
        }
      }

      if (service) {
        // Update existing service
        service.qty += qty;
        console.log(`[Parser] Updated existing Pegasus service:`, service);
      } else {
        // Add new service
        report.carriers.pegasus.services.push(
          createServiceItem({ label, code, unit, price, qty })
        );
      }
    }

    // Parse Ajet services (columns 17-23)
    if (i > 2 && i < 37) {
      const rawLabel = row[17] && typeof row[17] === 'string' ? String(row[17]).trim() : '';
      const code = row[18] ? String(row[18]).trim() : '';
      const unit = row[19] ? String(row[19]).trim() : 'kom';
      const price = asNumber(row[20]);
      const qty = asNumber(row[21]);
      const amount = asNumber(row[22]);

      // Skip if no data
      if (qty === 0 && amount === 0) {
        continue;
      }

      // Use "Other" if no label provided
      const label = rawLabel && rawLabel !== 'EUR' ? rawLabel : 'Other';

      // Skip Total and summary rows
      if (label.match(/^Total/i) || label.match(/Airport remunerations/i)) {
        continue;
      }

      console.log(`[Parser] Adding Ajet service:`, { label, code, unit, price, qty, amount });

      // Find existing service
      let service;

      if (label === 'Other') {
        // For "Other" services, match by label AND price to avoid merging different items
        service = report.carriers.ajet.services.find(s =>
          s.label === label && s.price === price
        );
      } else {
        // For labeled services, prioritize label match, then code
        service = report.carriers.ajet.services.find(s => s.label === label);

        // If not found by label and code exists, try by code (but only if it's a unique code)
        if (!service && code && code !== 'BAGEXC') {
          service = report.carriers.ajet.services.find(s => s.code === code);
        }
      }

      if (service) {
        // Update existing service
        service.qty += qty;
        console.log(`[Parser] Updated existing Ajet service:`, service);
      } else {
        // Add new service
        report.carriers.ajet.services.push(
          createServiceItem({ label, code, unit, price, qty })
        );
      }
    }

    // Parse Wizz Air bookings (rows 42-46 approx, columns 1 and 3)
    if (i >= 40 && i <= 60 && row[1] && typeof row[1] === 'number' && row[3]) {
      const amountEur = asNumber(row[1]);
      const pax = asNumber(row[3]);

      if (amountEur > 0 && pax > 0) {
        console.log(`[Parser] Adding Wizz booking:`, { amountEur, pax });
        report.carriers.wizz.bookings.transactions.push(
          createBookingTransaction({
            pnr: '',
            pax,
            amountEur,
            airportRemunerationKm: 0,
            commissionKm: 0,
          })
        );
      }
    }

    // Parse Pegasus bookings (rows 42-46 approx, columns 9 and 11)
    if (i >= 40 && i <= 60 && row[9] && typeof row[9] === 'number' && row[11]) {
      const amountEur = asNumber(row[9]);
      const pax = asNumber(row[11]);

      if (amountEur > 0 && pax > 0) {
        console.log(`[Parser] Adding Pegasus booking:`, { amountEur, pax });
        report.carriers.pegasus.bookings.transactions.push(
          createBookingTransaction({
            pnr: '',
            pax,
            amountEur,
            airportRemunerationKm: 0,
            commissionKm: 0,
          })
        );
      }
    }

    // Parse Ajet bookings (rows 42-46 approx, columns 17 and 19)
    if (i >= 40 && i <= 60 && row[17] && typeof row[17] === 'number' && row[19]) {
      const amountEur = asNumber(row[17]);
      const pax = asNumber(row[19]);

      if (amountEur > 0 && pax > 0) {
        console.log(`[Parser] Adding Ajet booking:`, { amountEur, pax });
        report.carriers.ajet.bookings.transactions.push(
          createBookingTransaction({
            pnr: '',
            pax,
            amountEur,
            airportRemunerationKm: 0,
            commissionKm: 0,
          })
        );
      }
    }

    // Parse Airport remuneration for bookings (row 60)
    if (rowText.match(/Airport remuneration.*Provizija/i)) {
      // Wizz Air (column 4)
      if (row[4]) {
        const airportRemuneration = asNumber(row[4]);
        if (airportRemuneration > 0) {
          console.log(`[Parser] Adding airport remuneration to Wizz bookings:`, airportRemuneration);
          // Add to all Wizz bookings
          report.carriers.wizz.bookings.transactions.forEach(txn => {
            if (!txn.airportRemunerationKm) {
              txn.airportRemunerationKm = airportRemuneration / report.carriers.wizz.bookings.transactions.length;
            }
          });
        }
      }

      // Pegasus (column 12)
      if (row[12]) {
        const airportRemuneration = asNumber(row[12]);
        if (airportRemuneration > 0) {
          console.log(`[Parser] Adding airport remuneration to Pegasus bookings:`, airportRemuneration);
          // Add to all Pegasus bookings
          report.carriers.pegasus.bookings.transactions.forEach(txn => {
            if (!txn.airportRemunerationKm) {
              txn.airportRemunerationKm = airportRemuneration / report.carriers.pegasus.bookings.transactions.length;
            }
          });
        }
      }

      // Ajet (column 20)
      if (row[20]) {
        const airportRemuneration = asNumber(row[20]);
        if (airportRemuneration > 0) {
          console.log(`[Parser] Adding airport remuneration to Ajet bookings:`, airportRemuneration);
          // Add to all Ajet bookings
          report.carriers.ajet.bookings.transactions.forEach(txn => {
            if (!txn.airportRemunerationKm) {
              txn.airportRemunerationKm = airportRemuneration / report.carriers.ajet.bookings.transactions.length;
            }
          });
        }
      }
    }

    // Parse Airport services
    // PVC ZIP vrecice (row 62)
    if (rowText.match(/PVC\s+ZIP\s+vrecice/i)) {
      const qty = asNumber(row[3]) || 0;
      const amount = asNumber(row[4]) || 0;
      const service = report.airportServices.find(s => s.id === 'airport_pvc');
      if (service) {
        console.log('[Parser] Adding airport PVC:', { qty, amount });
        service.qty = qty;
        if (amount > 0) {
          service.amountOverride = amount;
        }
      }
    }

    // Higijenske Maske (row 63)
    if (rowText.match(/Higijenske\s+Maske/i)) {
      const qty = asNumber(row[3]) || 0;
      const amount = asNumber(row[4]) || 0;
      const service = report.airportServices.find(s => s.id === 'airport_masks');
      if (service) {
        console.log('[Parser] Adding airport masks:', { qty, amount });
        service.qty = qty;
        if (amount > 0) {
          service.amountOverride = amount;
        }
      }
    }

    // Internet kodovi (row 64)
    if (rowText.match(/Internet\s+kodovi/i)) {
      const qty = asNumber(row[3]) || 0;
      const amount = asNumber(row[4]) || 0;
      const service = report.airportServices.find(s => s.id === 'airport_internet');
      if (service) {
        console.log('[Parser] Adding airport internet:', { qty, amount });
        service.qty = qty;
        if (amount > 0) {
          service.amountOverride = amount;
        }
      }
    }

    // Dječija nedelja (row 65)
    if (rowText.match(/Dječija\s+nedelja/i)) {
      const amount = asNumber(row[4]) || 0;
      const service = report.airportServices.find(s => s.id === 'airport_donation');
      if (service && amount > 0) {
        console.log('[Parser] Adding airport donation:', { amount });
        service.amountOverride = (service.amountOverride || 0) + amount;
      }
    }

    // Dodatni Aerodromski servis (row 66)
    if (rowText.match(/Dodatni\s+Aerodromski\s+servis/i)) {
      const qty = asNumber(row[3]) || 0;
      const amount = asNumber(row[4]) || 0;
      const service = report.airportServices.find(s => s.label.match(/Dodatni servis/i));
      if (service) {
        console.log('[Parser] Adding additional airport service:', { qty, amount });
        service.qty = qty;
        if (amount > 0) {
          service.amountOverride = amount;
        }
      }
    }

    // Parse Airport remunerations from row 37 (only if not already set from row 66)
    if (rowText.match(/Airport remunerations.*dodatni aerodromski servis/i) && row[5]) {
      const amount = asNumber(row[5]);
      if (amount > 0) {
        console.log('[Parser] Found airport remunerations for Wizz from row 37:', amount);
        const service = report.airportServices.find(s => s.label.match(/Dodatni servis/i));
        // Only add if not already set from detailed rows below
        if (service && service.qty === 0 && (!service.amountOverride || service.amountOverride === 0)) {
          console.log('[Parser] Setting airport remunerations:', amount);
          service.amountOverride = amount;
        }
      }
    }
  }

  console.log('[Parser] Operational format detected, services found:', {
    wizz: report.carriers.wizz.services.length,
    pegasus: report.carriers.pegasus.services.length,
    ajet: report.carriers.ajet.services.length,
    wizzBookings: report.carriers.wizz.bookings.transactions.length,
    airportServices: report.airportServices.filter(s => s.qty > 0 || (s.amountOverride && s.amountOverride > 0)).length
  });

  if (!detectedDate) {
    warnings.push(fallbackDate
      ? 'Datum nije pronađen u fajlu, korišten je odabrani datum.'
      : 'Datum nije pronađen u fajlu, korišten je današnji datum.');
  }

  return { report, warnings };
}

export function parseAccountingExport(buffer: Buffer, fallbackDate?: string): { report: DailyReport; warnings: string[] } {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true }) as Array<Array<unknown>>;

  // Try operational format first
  const operationalResult = parseOperationalExport(rows, fallbackDate);
  if (operationalResult) {
    return operationalResult;
  }

  // Fall back to accounting format
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
