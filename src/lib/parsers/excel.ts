import * as XLSX from 'xlsx';
import { dateOnlyToUtc, normalizeDateToTimeZone } from '@/lib/dates';

export interface ParsedFlightRow {
  row: number;
  data: {
    date: Date | null;
    airline: string | null;
    icaoCode: string | null;
    route: string | null;
    aircraftType: string | null;
    availableSeats: number | null;
    registration: string | null;
    operationTypeCode: string | null; // SCHEDULED, CHARTER, MEDEVAC, etc.
    mtow: number | null;

    // Arrival
    arrivalFlightNumber: string | null;
    arrivalScheduledTime: Date | null;
    arrivalActualTime: Date | null;
    arrivalPassengers: number | null;
    arrivalInfants: number | null;
    arrivalBaggage: number | null;
    arrivalCargo: number | null;
    arrivalMail: number | null;

    // Departure
    departureFlightNumber: string | null;
    departureScheduledTime: Date | null;
    departureActualTime: Date | null;
    departurePassengers: number | null;
    departureInfants: number | null;
    departureBaggage: number | null;
    departureCargo: number | null;
    departureMail: number | null;
  };
  errors: string[];
}

export interface ExcelParseResult {
  success: boolean;
  data: ParsedFlightRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: string[];
}

/**
 * Parse Excel file to flight data
 * Expected columns (case-insensitive):
 * - Datum (Date)
 * - Kompanija (Airline name)
 * - ICAO kod
 * - Ruta (Route)
 * - Tip a/c (Aircraft type)
 * - Rasp. mjesta (Available seats)
 * - Reg (Registration)
 * - Tip OPER (Operation type)
 * - MTOW(kg)
 * - br leta u dol (Arrival flight number)
 * - pl vrijeme dol (Arrival scheduled time)
 * - st vrijeme dol (Arrival actual time)
 * - Putnici u avionu (Arrival passengers)
 * - Bebe u naručju (Arrival infants)
 * - prtljag dol (kg) (Arrival baggage)
 * - cargo dol (kg) (Arrival cargo)
 * - pošta dol (kg) (Arrival mail)
 * - br leta u odl (Departure flight number)
 * - pl vrijeme odl (Departure scheduled time)
 * - st vrijeme odl (Departure actual time)
 * - Putnici u avionu.1 (Departure passengers)
 * - Bebe u naručju.1 (Departure infants)
 * - prtljag odl (kg) (Departure baggage)
 * - cargo odl (kg) (Departure cargo)
 * - pošta odl (kg) (Departure mail)
 */
export async function parseExcelFile(
  fileBuffer: Buffer
): Promise<ExcelParseResult> {
  const result: ExcelParseResult = {
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

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      result.errors.push('Excel fajl ne sadrži sheet-ove');
      return result;
    }

    // Helper function to parse date from sheet name (e.g., "3.10.2025" or "03.10.2025")
    function parseDateFromSheetName(sheetName: string): Date | null {
      // Try formats like "3.10.2025", "03.10.2025", "3/10/2025"
      const datePattern = /(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/;
      const match = sheetName.match(datePattern);
      if (match) {
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; // JS months are 0-indexed
        const year = parseInt(match[3], 10);
        const date = new Date(Date.UTC(year, month, day));
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
      return null;
    }

    // Process all sheets
    const allParsedRows: ParsedFlightRow[] = [];
    let globalRowCounter = 0;

    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON
      const rawData: any[] = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
        dateNF: 'yyyy-mm-dd',
        defval: null, // Use null for empty cells
      });

      if (rawData.length === 0) {
        return; // Skip empty sheets
      }

      // Try to extract date from sheet name if not present in data
      const sheetDate = parseDateFromSheetName(sheetName);

      // Helper function to find column value by multiple possible names (case-insensitive)
      const findColumn = (possibleNames: string[], rowData: any): any => {
        // First, try direct matches
        for (const name of possibleNames) {
          if (rowData[name] !== undefined && rowData[name] !== null && rowData[name] !== '') {
            return rowData[name];
          }
        }
        
        // Then try case-insensitive matches
        for (const name of possibleNames) {
          const lowerName = name.toLowerCase().trim();
          for (const key in rowData) {
            const keyLower = String(key).toLowerCase().trim();
            // Exact match (case-insensitive)
            if (keyLower === lowerName) {
              if (rowData[key] !== undefined && rowData[key] !== null && rowData[key] !== '') {
                return rowData[key];
              }
            }
            // Partial match (contains)
            if (keyLower.includes(lowerName) || lowerName.includes(keyLower)) {
              if (rowData[key] !== undefined && rowData[key] !== null && rowData[key] !== '') {
                return rowData[key];
              }
            }
          }
        }
        
        return null;
      };

      // Get headers for debugging
      const headers = rawData.length > 0 ? Object.keys(rawData[0]) : [];
      if (headers.length === 0) {
        console.log(`Sheet "${sheetName}" is empty or has no data`);
        return; // Skip empty sheets
      }
      
      // Debug: log first row to see actual column names
      if (globalRowCounter === 0 && rawData.length > 0) {
        console.log('Available columns in Excel:', headers);
        console.log('First row sample:', JSON.stringify(rawData[0], null, 2));
      }

      // Parse each row in this sheet
      rawData.forEach((row, index) => {
        globalRowCounter++;
        const rowNumber = globalRowCounter; // Already includes header offset
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
        // Parse date - try from row data first, then from sheet name
        parsedRow.data.date = parseDate(findColumn(['Datum', 'datum', 'Date', 'date'], row)) || sheetDate;
        
        // If we still don't have a date, try to extract from arrival or departure times
        if (!parsedRow.data.date) {
          // Try to get date from arrival scheduled time or departure scheduled time
          const arrTime = findColumn(['pl vrijeme dol', 'Pl vrijeme dol', 'planirano vrijeme dol', 'Planirano vrijeme dol'], row);
          const depTime = findColumn(['pl vrijeme odl', 'Pl vrijeme odl', 'planirano vrijeme odl', 'Planirano vrijeme odl'], row);
          
          if (arrTime instanceof Date) {
            parsedRow.data.date = new Date(arrTime.getFullYear(), arrTime.getMonth(), arrTime.getDate());
          } else if (depTime instanceof Date) {
            parsedRow.data.date = new Date(depTime.getFullYear(), depTime.getMonth(), depTime.getDate());
          }
        }
        
        // Still warn if no date, but don't block import
        if (!parsedRow.data.date) {
          parsedRow.errors.push(`Upozorenje: Datum nije pronađen (Sheet: ${sheetName}, Row: ${index + 2}) - koristiće se datum iz imena sheet-a ili će red biti preskočen`);
        }

        // Parse airline
        parsedRow.data.airline = parseString(row['Kompanija'] || row['kompanija']);
        parsedRow.data.icaoCode = parseString(row['ICAO kod'] || row['icao kod']);

        // Parse route
        parsedRow.data.route = parseString(row['Ruta'] || row['ruta']);
        if (!parsedRow.data.route) {
          parsedRow.errors.push('Ruta je obavezna');
        }

        // Parse aircraft type
        parsedRow.data.aircraftType = parseString(row['Tip a/c'] || row['tip a/c']);
        parsedRow.data.availableSeats = parseNumber(row['Rasp. mjesta'] || row['rasp. mjesta']);
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
        }

        parsedRow.data.mtow = parseNumber(row['MTOW(kg)'] || row['mtow(kg)']);

        // Arrival data - try multiple column name variations
        parsedRow.data.arrivalFlightNumber = parseString(
          findColumn(['br leta u dol', 'Br leta u dol', 'broj leta u dol', 'Broj leta u dol'], row)
        );
        parsedRow.data.arrivalScheduledTime = parseDateTime(
          findColumn(['pl vrijeme dol', 'Pl vrijeme dol', 'planirano vrijeme dol', 'Planirano vrijeme dol'], row)
        );
        parsedRow.data.arrivalActualTime = parseDateTime(
          findColumn(['st vrijeme dol', 'St vrijeme dol', 'stvarno vrijeme dol', 'Stvarno vrijeme dol'], row)
        );
        parsedRow.data.arrivalPassengers = parseNumber(
          findColumn(['Putnici u avionu', 'putnici u avionu', 'Putnici u avionu (dol)', 'putnici u avionu (dol)', 'Putnici u avionu (dolazak)'], row)
        );
        parsedRow.data.arrivalInfants = parseNumber(
          findColumn(['Bebe u naručju', 'bebe u naručju', 'Bebe u naručju (dol)', 'bebe u naručju (dol)', 'Bebe u naručju (dolazak)'], row)
        );
        parsedRow.data.arrivalBaggage = parseNumber(
          findColumn(['prtljag dol (kg)', 'Prtljag dol (kg)', 'prtljag dolazak (kg)', 'Prtljag dolazak (kg)', 'prtljag dol(kg)', 'Prtljag dol(kg)'], row)
        );
        parsedRow.data.arrivalCargo = parseNumber(
          findColumn(['cargo dol (kg)', 'Cargo dol (kg)', 'cargo dolazak (kg)', 'Cargo dolazak (kg)', 'cargo dol(kg)', 'Cargo dol(kg)'], row)
        );
        parsedRow.data.arrivalMail = parseNumber(
          findColumn(['pošta dol (kg)', 'Pošta dol (kg)', 'pošta dolazak (kg)', 'Pošta dolazak (kg)', 'pošta dol(kg)', 'Pošta dol(kg)'], row)
        );

        // Departure data - try multiple column name variations
        parsedRow.data.departureFlightNumber = parseString(
          findColumn(['br leta u odl', 'Br leta u odl', 'broj leta u odl', 'Broj leta u odl'], row)
        );
        parsedRow.data.departureScheduledTime = parseDateTime(
          findColumn(['pl vrijeme odl', 'Pl vrijeme odl', 'planirano vrijeme odl', 'Planirano vrijeme odl'], row)
        );
        parsedRow.data.departureActualTime = parseDateTime(
          findColumn(['st vrijeme odl', 'St vrijeme odl', 'stvarno vrijeme odl', 'Stvarno vrijeme odl'], row)
        );
        parsedRow.data.departurePassengers = parseNumber(
          findColumn([
            'Putnici u avionu.1', 
            'putnici u avionu.1', 
            'Putnici u avionu (odl)', 
            'putnici u avionu (odl)',
            'Putnici u avionu (odlazak)',
            'Putnici u avionu 2',
            'Putnici u avionu (2)'
          ], row)
        );
        parsedRow.data.departureInfants = parseNumber(
          findColumn([
            'Bebe u naručju.1', 
            'bebe u naručju.1', 
            'Bebe u naručju (odl)', 
            'bebe u naručju (odl)',
            'Bebe u naručju (odlazak)',
            'Bebe u naručju 2',
            'Bebe u naručju (2)'
          ], row)
        );
        parsedRow.data.departureBaggage = parseNumber(
          findColumn([
            'prtljag odl (kg)', 
            'Prtljag odl (kg)', 
            'prtljag odlazak (kg)', 
            'Prtljag odlazak (kg)',
            'prtljag odl(kg)',
            'Prtljag odl(kg)'
          ], row)
        );
        parsedRow.data.departureCargo = parseNumber(
          findColumn([
            'cargo odl (kg)', 
            'Cargo odl (kg)', 
            'cargo odlazak (kg)', 
            'Cargo odlazak (kg)',
            'cargo odl(kg)',
            'Cargo odl(kg)'
          ], row)
        );
        parsedRow.data.departureMail = parseNumber(
          findColumn([
            'pošta odl (kg)', 
            'Pošta odl (kg)', 
            'pošta odlazak (kg)', 
            'Pošta odlazak (kg)',
            'pošta odl(kg)',
            'Pošta odl(kg)',
            'pošta dol (kg)' // Sometimes might be labeled incorrectly
          ], row)
        );

      } catch (error) {
        parsedRow.errors.push(
          `Greška pri parsiranju (Sheet: ${sheetName}, Row: ${index + 2}): ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      // Add row to results
      allParsedRows.push(parsedRow);

      if (parsedRow.errors.length === 0) {
        result.validRows++;
      } else {
        result.invalidRows++;
      }
      });
    });

    // Combine all parsed rows from all sheets
    result.data = allParsedRows;
    result.totalRows = globalRowCounter;

    if (result.totalRows === 0) {
      result.errors.push('Excel fajl ne sadrži podatke u nijednom sheet-u');
      return result;
    }

    result.success = result.validRows > 0;

    if (result.invalidRows > 0) {
      result.errors.push(
        `${result.invalidRows} red(ova) ima greške u validaciji (ukupno ${result.totalRows} redova u ${workbook.SheetNames.length} sheet-ova)`
      );
    } else {
      result.errors.push(
        `Uspješno parsirano ${result.totalRows} redova iz ${workbook.SheetNames.length} sheet-ova`
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

function parseNumber(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return isNaN(num) ? null : num;
}

function parseDate(value: any): Date | null {
  if (!value) return null;

  // If already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : normalizeDateToTimeZone(value);
  }

  // If it's an Excel serial date number (days since 1900-01-01)
  if (typeof value === 'number' && value > 0) {
    // Excel epoch starts on 1900-01-01, but Excel incorrectly treats 1900 as leap year
    // So we need to adjust by 1 day for dates after 1900-02-28
    const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
    const date = new Date(excelEpoch.getTime() + (value - 1) * 24 * 60 * 60 * 1000);
    return isNaN(date.getTime()) ? null : normalizeDateToTimeZone(date);
  }

  // Try to parse as string or date
  if (typeof value === 'string' && value.trim()) {
    // Try different date formats
    const dateStr = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const date = dateOnlyToUtc(dateStr);
      return isNaN(date.getTime()) ? null : date;
    }
    // Format: DD.MM.YYYY or DD/MM/YYYY
    const dateMatch = dateStr.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{4})/);
    if (dateMatch) {
      const day = parseInt(dateMatch[1], 10);
      const month = parseInt(dateMatch[2], 10) - 1; // JS months are 0-indexed
      const year = parseInt(dateMatch[3], 10);
      const date = new Date(Date.UTC(year, month, day));
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    // Try standard Date parsing
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  return null;
}

function parseDateTime(value: any): Date | null {
  if (!value) return null;

  // If already a Date object
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  // If it's an Excel serial datetime number (days.fraction since 1900-01-01)
  if (typeof value === 'number' && value > 0) {
    // Excel epoch starts on 1900-01-01
    const excelEpoch = new Date(1899, 11, 30); // December 30, 1899
    const days = Math.floor(value);
    const fraction = value - days;
    const date = new Date(excelEpoch.getTime() + (days - 1) * 24 * 60 * 60 * 1000 + fraction * 24 * 60 * 60 * 1000);
    return isNaN(date.getTime()) ? null : date;
  }

  // Try to parse as string (time format: HH:MM or HH:MM:SS)
  if (typeof value === 'string' && value.trim()) {
    const timeStr = value.trim();
    // Format: HH:MM or HH:MM:SS
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;
      // Create date for today with this time (will be combined with flight date later)
      const date = new Date();
      date.setHours(hours, minutes, seconds, 0);
      return normalizeDateToTimeZone(date);
    }
    // Try standard Date parsing
    const date = new Date(timeStr);
    if (!isNaN(date.getTime())) {
      return normalizeDateToTimeZone(date);
    }
  }

  return null;
}
