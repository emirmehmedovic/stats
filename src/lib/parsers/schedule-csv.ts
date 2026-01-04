import Papa from 'papaparse';
import { dateOnlyToUtc } from '@/lib/dates';

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
 * Parse CSV file to SCHEDULE data
 *
 * Expected CSV format:
 * Datum,Tip leta,IATA,Destinacija,Vrijeme,Avio kompanija,IATA kod aviokompanije
 *
 * Example:
 * 2025-11-01,Arrival,MLH,Basel,11:40,Wizz Air,W6
 * 2025-11-01,Departure,MLH,Basel,12:15,Wizz Air,W6
 *
 * This parser groups Arrival and Departure rows by date+airline+destination
 * to create a single Flight record.
 */
export async function parseScheduleCSVFile(
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
    const csvText = fileBuffer.toString('utf-8');

    // Parse CSV
    const parseResult = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (parseResult.errors.length > 0) {
      result.errors.push(
        ...parseResult.errors.map((e) => `CSV parsing error: ${e.message}`)
      );
    }

    const rawData = parseResult.data as any[];

    if (rawData.length === 0) {
      result.errors.push('CSV fajl ne sadrži podatke');
      return result;
    }

    // Group rows by date + airline + destination
    // Because each CSV row is ONE direction (arrival OR departure)
    // We need to combine them into single Flight records
    const flightGroups = new Map<string, any>();

    rawData.forEach((row, index) => {
      const rowNumber = index + 2; // +2 for header and 1-indexed

      const datum = parseString(row['Datum']);
      const tipLeta = parseString(row['Tip leta']);
      const iataCode = parseString(row['IATA']);
      const destinacija = parseString(row['Destinacija']);
      const vrijeme = parseString(row['Vrijeme']);
      const avioKompanija = parseString(row['Avio kompanija']);
      const iataKodAviokompanije = parseString(row['IATA kod aviokompanije']);

      if (!datum || !avioKompanija || !destinacija) {
        // Skip invalid rows
        return;
      }

      // Create unique key for grouping
      const groupKey = `${datum}_${avioKompanija}_${destinacija}`;

      if (!flightGroups.has(groupKey)) {
        flightGroups.set(groupKey, {
          date: datum,
          airline: avioKompanija,
          icaoCode: iataKodAviokompanije,
          destination: destinacija,
          iataCode: iataCode,
          arrivalTime: null,
          departureTime: null,
          rows: [],
        });
      }

      const group = flightGroups.get(groupKey);

      if (tipLeta?.toLowerCase().includes('arrival')) {
        group.arrivalTime = vrijeme;
      } else if (tipLeta?.toLowerCase().includes('departure')) {
        group.departureTime = vrijeme;
      }

      group.rows.push(rowNumber);
    });

    // Convert groups to ParsedScheduleRow format
    let rowCounter = 0;
    flightGroups.forEach((group) => {
      rowCounter++;
      const parsedRow: ParsedScheduleRow = {
        row: rowCounter,
        data: {
          date: null,
          airline: null,
          icaoCode: null,
          route: null,
          aircraftType: null,
          registration: null,
          operationTypeCode: 'SCHEDULED', // Default
          arrivalFlightNumber: null,
          arrivalScheduledTime: null,
          departureFlightNumber: null,
          departureScheduledTime: null,
        },
        errors: [],
      };

      try {
        // Parse date
        parsedRow.data.date = parseDate(group.date);
        if (!parsedRow.data.date) {
          parsedRow.errors.push('Datum je obavezan');
        }

        // Airline
        parsedRow.data.airline = group.airline;
        if (!parsedRow.data.airline) {
          parsedRow.errors.push('Avio kompanija je obavezna');
        }

        // IATA code as icaoCode (will be used for lookup/creation)
        parsedRow.data.icaoCode = group.icaoCode;

        // Route: IATA-Destination (e.g., "MLH-Basel")
        parsedRow.data.route = group.iataCode
          ? `${group.iataCode}-${group.destination}`
          : group.destination;

        if (!parsedRow.data.route) {
          parsedRow.errors.push('Destinacija je obavezna');
        }

        // Parse times
        if (group.arrivalTime) {
          parsedRow.data.arrivalScheduledTime = parseTime(
            group.date,
            group.arrivalTime
          );
        }

        if (group.departureTime) {
          parsedRow.data.departureScheduledTime = parseTime(
            group.date,
            group.departureTime
          );
        }
      } catch (error) {
        parsedRow.errors.push(
          `Greška pri parsiranju: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      result.data.push(parsedRow);

      if (parsedRow.errors.length === 0) {
        result.validRows++;
      } else {
        result.invalidRows++;
      }
    });

    result.totalRows = flightGroups.size;
    result.success = result.validRows > 0;

    if (result.invalidRows > 0) {
      result.errors.push(`${result.invalidRows} let(ova) ima greške u validaciji`);
    }
  } catch (error) {
    result.errors.push(
      `Greška pri čitanju CSV fajla: ${error instanceof Error ? error.message : 'Unknown error'}`
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

function parseTime(dateStr: string, timeStr: string): Date | null {
  if (!dateStr || !timeStr) return null;

  try {
    // Combine date and time: "2025-11-01" + "11:40" -> "2025-11-01T11:40:00"
    const dateTimeStr = `${dateStr}T${timeStr}:00`;
    const dateTime = new Date(dateTimeStr);

    return isNaN(dateTime.getTime()) ? null : dateTime;
  } catch {
    return null;
  }
}
