import * as XLSX from 'xlsx';
import { dateOnlyToUtc, normalizeDateToTimeZone } from '@/lib/dates';

export interface ParsedScheduleRow {
  row: number;
  data: {
    date: Date | null;
    airline: string | null;
    icaoCode: string | null;
    route: string | null;
    aircraftType: string | null;
    registration: string | null;
    operationTypeCode: string | null;

    // Samo planirana vremena (ne actual time, passengers, cargo, etc.)
    arrivalFlightNumber: string | null;
    arrivalScheduledTime: Date | null;
    departureFlightNumber: string | null;
    departureScheduledTime: Date | null;
  };
  errors: string[];
}

export interface ScheduleParseResult {
  success: boolean;
  data: ParsedScheduleRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
}

/**
 * Parse Excel file to SCHEDULE data only (minimal import)
 * Expected columns (case-insensitive):
 *
 * OBAVEZNE KOLONE:
 * - Datum (Date)
 * - Kompanija (Airline name)
 * - Ruta (Route)
 *
 * OPCIONE KOLONE:
 * - ICAO kod
 * - Tip a/c (Aircraft type)
 * - Reg (Registration)
 * - Tip OPER (Operation type: SCHEDULED, CHARTER, MEDEVAC)
 * - br leta u dol (Arrival flight number)
 * - pl vrijeme dol (Arrival scheduled time)
 * - br leta u odl (Departure flight number)
 * - pl vrijeme odl (Departure scheduled time)
 *
 * NOTE: This parser does NOT import:
 * - Actual times
 * - Passengers
 * - Baggage, cargo, mail
 * - Available seats, MTOW
 *
 * These fields can be filled in later via Daily Operations page.
 */
export async function parseScheduleExcelFile(
  fileBuffer: Buffer
): Promise<ScheduleParseResult> {
  const result: ScheduleParseResult = {
    success: false,
    data: [],
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    errors: [],
  };

  try {
    // Read workbook
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      result.errors.push('Excel fajl ne sadrži sheet-ove');
      return result;
    }

    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, {
      raw: false,
      dateNF: 'yyyy-mm-dd',
    });

    if (rawData.length === 0) {
      result.errors.push('Excel fajl ne sadrži podatke');
      return result;
    }

    result.totalRows = rawData.length;

    // Parse each row
    rawData.forEach((row, index) => {
      const rowNumber = index + 2; // +2 because Excel is 1-indexed and row 1 is header
      const parsedRow: ParsedScheduleRow = {
        row: rowNumber,
        data: {
          date: null,
          airline: null,
          icaoCode: null,
          route: null,
          aircraftType: null,
          registration: null,
          operationTypeCode: null,
          arrivalFlightNumber: null,
          arrivalScheduledTime: null,
          departureFlightNumber: null,
          departureScheduledTime: null,
        },
        errors: [],
      };

      try {
        // Parse date (REQUIRED)
        parsedRow.data.date = parseDate(row['Datum'] || row['datum']);
        if (!parsedRow.data.date) {
          parsedRow.errors.push('Datum je obavezan');
        }

        // Parse airline (REQUIRED)
        parsedRow.data.airline = parseString(row['Kompanija'] || row['kompanija']);
        if (!parsedRow.data.airline) {
          parsedRow.errors.push('Kompanija je obavezna');
        }

        parsedRow.data.icaoCode = parseString(row['ICAO kod'] || row['icao kod']);

        // Parse route (REQUIRED)
        parsedRow.data.route = parseString(row['Ruta'] || row['ruta']);
        if (!parsedRow.data.route) {
          parsedRow.errors.push('Ruta je obavezna');
        }

        // Optional fields
        parsedRow.data.aircraftType = parseString(row['Tip a/c'] || row['tip a/c']);
        parsedRow.data.registration = parseString(row['Reg'] || row['reg']);

        // Parse operation type
        const operationType = parseString(row['Tip OPER'] || row['tip oper']);
        if (operationType) {
          const upperType = operationType.toUpperCase();
          if (upperType.includes('SCHED')) {
            parsedRow.data.operationTypeCode = 'SCHEDULED';
          } else if (upperType.includes('MEDEVAC')) {
            parsedRow.data.operationTypeCode = 'MEDEVAC';
          } else if (upperType.includes('CHARTER')) {
            parsedRow.data.operationTypeCode = 'CHARTER';
          } else {
            parsedRow.data.operationTypeCode = 'SCHEDULED'; // Default
          }
        } else {
          parsedRow.data.operationTypeCode = 'SCHEDULED'; // Default
        }

        // Scheduled times only (NOT actual times)
        parsedRow.data.arrivalFlightNumber = parseString(
          row['br leta u dol'] || row['broj leta dolazak']
        );
        parsedRow.data.arrivalScheduledTime = parseDateTime(
          row['pl vrijeme dol'] || row['planirano vrijeme dolazak']
        );

        parsedRow.data.departureFlightNumber = parseString(
          row['br leta u odl'] || row['broj leta odlazak']
        );
        parsedRow.data.departureScheduledTime = parseDateTime(
          row['pl vrijeme odl'] || row['planirano vrijeme odlazak']
        );

      } catch (error) {
        parsedRow.errors.push(
          `Greška pri parsiranju: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Add row to results
      result.data.push(parsedRow);

      if (parsedRow.errors.length === 0) {
        result.validRows++;
      } else {
        result.invalidRows++;
      }
    });

    result.success = result.validRows > 0;

    if (result.invalidRows > 0) {
      result.errors.push(
        `${result.invalidRows} red(ova) ima greške u validaciji`
      );
    }

  } catch (error) {
    result.errors.push(
      `Greška pri čitanju Excel fajla: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
}

// Helper functions
function parseString(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;
  return String(value).trim();
}

function parseDate(value: any): Date | null {
  if (!value) return null;

  // If already a Date object
  if (value instanceof Date) return value;

  const stringValue = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(stringValue)) {
    const date = dateOnlyToUtc(stringValue);
    return isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(stringValue);
  return isNaN(date.getTime()) ? null : date;
}

function parseDateTime(value: any): Date | null {
  if (!value) return null;

  // If already a Date object
  if (value instanceof Date) return normalizeDateToTimeZone(value);

  // Try to parse as string
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : normalizeDateToTimeZone(date);
}
