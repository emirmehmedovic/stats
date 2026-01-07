import { ParsedFlightRow } from './excel';
import { dateOnlyToUtc, getDateStringInTimeZone, makeDateInTimeZone, normalizeDateToTimeZone } from '@/lib/dates';

export interface CSVParseResult {
  success: boolean;
  data: ParsedFlightRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
  detectedDelimiter: string;
}

/**
 * Detect CSV delimiter
 */
function detectDelimiter(csvContent: string): string {
  const delimiters = [',', ';', '\t', '|'];
  const lines = csvContent.split('\n').slice(0, 5); // Check first 5 lines

  let maxCount = 0;
  let detectedDelimiter = ',';

  for (const delimiter of delimiters) {
    const counts = lines.map((line) => (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length);
    const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
    const isConsistent = counts.every((count) => Math.abs(count - avgCount) < 2);

    if (isConsistent && avgCount > maxCount) {
      maxCount = avgCount;
      detectedDelimiter = delimiter;
    }
  }

  return detectedDelimiter;
}

/**
 * Parse CSV line respecting quotes
 */
function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      // End of field
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  // Add last field
  result.push(current.trim());

  return result;
}

/**
 * Parse CSV file to flight data
 */
export async function parseCSVFile(
  fileBuffer: Buffer,
  customDelimiter?: string
): Promise<CSVParseResult> {
  const result: CSVParseResult = {
    success: false,
    data: [],
    totalRows: 0,
    validRows: 0,
    invalidRows: 0,
    errors: [],
    detectedDelimiter: ',',
  };

  try {
    // Convert buffer to string
    const csvContent = fileBuffer.toString('utf-8');

    // Detect delimiter
    const delimiter = customDelimiter || detectDelimiter(csvContent);
    result.detectedDelimiter = delimiter;

    // Split into lines
    const lines = csvContent.split(/\r?\n/).filter((line) => line.trim());

    if (lines.length < 2) {
      result.errors.push('CSV fajl mora imati header i najmanje jedan red podataka');
      return result;
    }

    // Parse header
    const headerLine = lines[0];
    const headers = parseCSVLine(headerLine, delimiter);

    // Create column mapping (case-insensitive)
    const headerMap = new Map<string, number>();
    headers.forEach((header, index) => {
      headerMap.set(header.toLowerCase(), index);
    });

    // Helper to get column value
    const getColumn = (row: string[], columnName: string): string | null => {
      const lowerName = columnName.toLowerCase();
      const index = headerMap.get(lowerName);
      if (index === undefined) return null;
      const value = row[index];
      return value && value.trim() ? value.trim() : null;
    };

    // Check if this is the new schedule format (Datum, Tip leta, IATA, Destinacija, Vrijeme, Avio kompanija, IATA kod aviokompanije)
    const isScheduleFormat = 
      headerMap.has('datum') && 
      headerMap.has('tip leta') && 
      headerMap.has('iata') && 
      headerMap.has('destinacija') &&
      headerMap.has('vrijeme') &&
      headerMap.has('avio kompanija') &&
      headerMap.has('iata kod aviokompanije');

    // If it's schedule format, use different parsing logic
    if (isScheduleFormat) {
      return parseScheduleFormatCSV(lines, delimiter, headerMap, result);
    }

    result.totalRows = lines.length - 1; // Exclude header

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1; // Excel-style numbering
      const line = lines[i];

      if (!line.trim()) continue;

      const rowData = parseCSVLine(line, delimiter);

      const parsedRow: ParsedFlightRow = {
        row: rowNumber,
        data: {
          date: null,
          airline: null,
          icaoCode: null,
          route: null,
          aircraftType: null,
          availableSeats: null,
          registration: null,
          operationTypeCode: null,
          mtow: null,
          arrivalFlightNumber: null,
          arrivalScheduledTime: null,
          arrivalActualTime: null,
          arrivalPassengers: null,
          arrivalInfants: null,
          arrivalBaggage: null,
          arrivalCargo: null,
          arrivalMail: null,
          departureFlightNumber: null,
          departureScheduledTime: null,
          departureActualTime: null,
          departurePassengers: null,
          departureInfants: null,
          departureBaggage: null,
          departureCargo: null,
          departureMail: null,
        },
        errors: [],
      };

      try {
        // Parse basic fields
        const dateStr = getColumn(rowData, 'datum');
        parsedRow.data.date = dateStr
          ? (/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateOnlyToUtc(dateStr) : new Date(dateStr))
          : null;
        if (!parsedRow.data.date || isNaN(parsedRow.data.date.getTime())) {
          parsedRow.errors.push('Datum je obavezan i mora biti validan');
        }

        parsedRow.data.airline = getColumn(rowData, 'kompanija');
        parsedRow.data.icaoCode = getColumn(rowData, 'icao kod');
        parsedRow.data.route = getColumn(rowData, 'ruta');

        if (!parsedRow.data.route) {
          parsedRow.errors.push('Ruta je obavezna');
        }

        parsedRow.data.aircraftType = getColumn(rowData, 'tip a/c');

        const seatsStr = getColumn(rowData, 'rasp. mjesta');
        parsedRow.data.availableSeats = seatsStr ? parseInt(seatsStr, 10) : null;

        parsedRow.data.registration = getColumn(rowData, 'reg');

        // Parse operation type
        const operationType = getColumn(rowData, 'tip oper');
        if (operationType) {
          const upperType = operationType.toUpperCase();
          if (upperType.includes('SCHED')) {
            parsedRow.data.operationTypeCode = 'SCHEDULED';
          } else if (upperType.includes('MEDEVAC')) {
            parsedRow.data.operationTypeCode = 'MEDEVAC';
          } else if (upperType.includes('CHARTER')) {
            parsedRow.data.operationTypeCode = 'CHARTER';
          } else {
            parsedRow.data.operationTypeCode = 'SCHEDULED';
          }
        }

        const mtowStr = getColumn(rowData, 'mtow(kg)');
        parsedRow.data.mtow = mtowStr ? parseInt(mtowStr, 10) : null;

        const dateForTimes = parsedRow.data.date
          ? getDateStringInTimeZone(parsedRow.data.date)
          : dateStr;

        // Arrival data
        parsedRow.data.arrivalFlightNumber = getColumn(rowData, 'br leta u dol');

        const arrSchTime = getColumn(rowData, 'pl vrijeme dol');
        parsedRow.data.arrivalScheduledTime = parseDateTimeWithDate(dateForTimes, arrSchTime);

        const arrActTime = getColumn(rowData, 'st vrijeme dol');
        parsedRow.data.arrivalActualTime = parseDateTimeWithDate(dateForTimes, arrActTime);

        const arrPax = getColumn(rowData, 'putnici u avionu');
        parsedRow.data.arrivalPassengers = arrPax ? parseInt(arrPax, 10) : null;

        const arrInf = getColumn(rowData, 'bebe u naručju');
        parsedRow.data.arrivalInfants = arrInf ? parseInt(arrInf, 10) : null;

        const arrBag = getColumn(rowData, 'prtljag dol (kg)');
        parsedRow.data.arrivalBaggage = arrBag ? parseInt(arrBag, 10) : null;

        const arrCargo = getColumn(rowData, 'cargo dol (kg)');
        parsedRow.data.arrivalCargo = arrCargo ? parseInt(arrCargo, 10) : null;

        const arrMail = getColumn(rowData, 'pošta dol (kg)');
        parsedRow.data.arrivalMail = arrMail ? parseInt(arrMail, 10) : null;

        // Departure data
        parsedRow.data.departureFlightNumber = getColumn(rowData, 'br leta u odl');

        const depSchTime = getColumn(rowData, 'pl vrijeme odl');
        parsedRow.data.departureScheduledTime = parseDateTimeWithDate(dateForTimes, depSchTime);

        const depActTime = getColumn(rowData, 'st vrijeme odl');
        parsedRow.data.departureActualTime = parseDateTimeWithDate(dateForTimes, depActTime);

        const depPax = getColumn(rowData, 'putnici u avionu.1');
        parsedRow.data.departurePassengers = depPax ? parseInt(depPax, 10) : null;

        const depInf = getColumn(rowData, 'bebe u naručju.1');
        parsedRow.data.departureInfants = depInf ? parseInt(depInf, 10) : null;

        const depBag = getColumn(rowData, 'prtljag odl (kg)');
        parsedRow.data.departureBaggage = depBag ? parseInt(depBag, 10) : null;

        const depCargo = getColumn(rowData, 'cargo odl (kg)');
        parsedRow.data.departureCargo = depCargo ? parseInt(depCargo, 10) : null;

        const depMail = getColumn(rowData, 'pošta odl (kg)');
        parsedRow.data.departureMail = depMail ? parseInt(depMail, 10) : null;

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
    }

    result.success = result.validRows > 0;

    if (result.invalidRows > 0) {
      result.errors.push(
        `${result.invalidRows} red(ova) ima greške u validaciji`
      );
    }

  } catch (error) {
    result.errors.push(
      `Greška pri čitanju CSV fajla: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
}

/**
 * Parse schedule format CSV (Arrival/Departure rows)
 * Format: Datum, Tip leta, IATA, Destinacija, Vrijeme, Avio kompanija, IATA kod aviokompanije
 */
function parseScheduleFormatCSV(
  lines: string[],
  delimiter: string,
  headerMap: Map<string, number>,
  result: CSVParseResult
): CSVParseResult {
  const getColumn = (row: string[], columnName: string): string | null => {
    const lowerName = columnName.toLowerCase();
    const index = headerMap.get(lowerName);
    if (index === undefined) return null;
    const value = row[index];
    return value && value.trim() ? value.trim() : null;
  };

  // Group rows by date, destination, and airline
  interface ScheduleRow {
    date: string;
    flightType: 'Arrival' | 'Departure';
    iata: string;
    destination: string;
    time: string;
    airline: string;
    airlineIata: string;
    rowNumber: number;
  }

  const scheduleRows: ScheduleRow[] = [];

  // Parse all rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const rowData = parseCSVLine(line, delimiter);
    const date = getColumn(rowData, 'datum');
    const flightType = getColumn(rowData, 'tip leta');
    const iata = getColumn(rowData, 'iata');
    const destination = getColumn(rowData, 'destinacija');
    const time = getColumn(rowData, 'vrijeme');
    const airline = getColumn(rowData, 'avio kompanija');
    const airlineIata = getColumn(rowData, 'iata kod aviokompanije');

    if (!date || !flightType || !iata || !destination || !time || !airline || !airlineIata) {
      result.errors.push(`Red ${i + 1}: Nedostaju obavezni podaci`);
      result.invalidRows++;
      continue;
    }

    scheduleRows.push({
      date,
      flightType: flightType as 'Arrival' | 'Departure',
      iata,
      destination,
      time,
      airline,
      airlineIata,
      rowNumber: i + 1,
    });
  }

  // Group by date, destination, and airline
  const flightGroups = new Map<string, { arrival?: ScheduleRow; departure?: ScheduleRow }>();

  for (const row of scheduleRows) {
    const key = `${row.date}|${row.destination}|${row.airline}|${row.airlineIata}`;
    
    if (!flightGroups.has(key)) {
      flightGroups.set(key, {});
    }

    const group = flightGroups.get(key)!;
    if (row.flightType === 'Arrival') {
      group.arrival = row;
    } else {
      group.departure = row;
    }
  }

  result.totalRows = flightGroups.size;

  // Create flight records from groups
  for (const [key, group] of flightGroups) {
    const [dateStr, destination, airline, airlineIata] = key.split('|');
    const arrival = group.arrival;
    const departure = group.departure;

    const parsedRow: ParsedFlightRow = {
      row: arrival?.rowNumber || departure?.rowNumber || 0,
      data: {
        date: null,
        airline: airline || null,
        icaoCode: airlineIata || null,
        route: destination || null,
        aircraftType: null, // Not in this format
        availableSeats: null, // Not in this format
        registration: null, // Not in this format
        operationTypeCode: 'SCHEDULED', // Default
        mtow: null, // Not in this format
        arrivalFlightNumber: null, // Not in this format
        arrivalScheduledTime: null,
        arrivalActualTime: null,
        arrivalPassengers: null, // Not in this format
        arrivalInfants: null, // Not in this format
        arrivalBaggage: null, // Not in this format
        arrivalCargo: null, // Not in this format
        arrivalMail: null, // Not in this format
        departureFlightNumber: null, // Not in this format
        departureScheduledTime: null,
        departureActualTime: null,
        departurePassengers: null, // Not in this format
        departureInfants: null, // Not in this format
        departureBaggage: null, // Not in this format
        departureCargo: null, // Not in this format
        departureMail: null, // Not in this format
      },
      errors: [],
    };

    try {
      // Parse date
      const date = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateOnlyToUtc(dateStr) : new Date(dateStr);
      if (isNaN(date.getTime())) {
        parsedRow.errors.push('Nevalidan datum');
      } else {
        parsedRow.data.date = date;
      }

      // Build route from IATA codes and destination
      // Format: IATA-Destinacija (e.g., "MLH-Basel")
      let routeParts: string[] = [];
      
      // Parse arrival time
      if (arrival) {
        const arrivalDateTime = combineDateAndTime(dateStr, arrival.time);
        if (arrivalDateTime) {
          parsedRow.data.arrivalScheduledTime = arrivalDateTime;
          parsedRow.data.arrivalActualTime = arrivalDateTime; // Assume on-time if no actual time
        }
        routeParts.push(`${arrival.iata}-${destination}`);
      }

      // Parse departure time
      if (departure) {
        const departureDateTime = combineDateAndTime(dateStr, departure.time);
        if (departureDateTime) {
          parsedRow.data.departureScheduledTime = departureDateTime;
          parsedRow.data.departureActualTime = departureDateTime; // Assume on-time if no actual time
        }
        if (!routeParts.length) {
          routeParts.push(`${departure.iata}-${destination}`);
        }
      }

      // Set route (use first available or combine both)
      if (routeParts.length > 0) {
        parsedRow.data.route = routeParts[0]; // Use arrival route if available, otherwise departure
      }

      // If we only have one direction, still create the flight
      if (!arrival && !departure) {
        parsedRow.errors.push('Nedostaju podaci za Arrival i Departure');
      }

      // Route validation
      if (!parsedRow.data.route) {
        parsedRow.errors.push('Ruta nije određena');
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
  }

  result.success = result.validRows > 0;

  if (result.invalidRows > 0) {
    result.errors.push(
      `${result.invalidRows} let(ova) ima greške u validaciji`
    );
  }

  return result;
}

/**
 * Combine date string (YYYY-MM-DD) with time string (HH:MM) to create Date object
 */
function combineDateAndTime(dateStr: string, timeStr: string): Date | null {
  const normalizedTime = timeStr.includes(':') ? timeStr : `${timeStr}:00`;
  const dateTime = makeDateInTimeZone(dateStr, normalizedTime);
  return dateTime && !isNaN(dateTime.getTime()) ? dateTime : null;
}

function parseDateTimeWithDate(
  dateStr: string | null | undefined,
  value: string | null
): Date | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const dateTimeMatch = trimmed.match(
    /^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}:\d{2})(?::(\d{2}))?$/
  );
  if (dateTimeMatch) {
    const datePart = dateTimeMatch[1];
    const timePart = dateTimeMatch[3]
      ? `${dateTimeMatch[2]}:${dateTimeMatch[3]}`
      : dateTimeMatch[2];
    return makeDateInTimeZone(datePart, timePart);
  }

  const timeMatch = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (timeMatch && dateStr) {
    return makeDateInTimeZone(dateStr, trimmed);
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return normalizeDateToTimeZone(parsed);
}
