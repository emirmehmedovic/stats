import { makeDateInTimeZone, TIME_ZONE_SARAJEVO } from '@/lib/dates';

// ---------------------------------------------------------
// TYPES
// ---------------------------------------------------------

export interface ScheduleChangeRow {
  row: number;
  carrier: string;           // W6
  flight: string;            // 4242
  leg: string;               // MSTTZL or TZLMST
  changeType: string;        // None, Cancel
  from: string;              // 6/3/2026
  to: string;                // 6/3/2026
  std: string;               // 7:10 PM (UTC)
  sta: string;               // 9:15 PM (UTC)
  acType: string;            // 32Q
  seatConf: string;          // 239
  onDays: string;            // __3____ (weekday pattern)
  season: string;            // S26
  affectedFlights: number;   // 1
}

export interface ExpandedFlight {
  date: Date;                        // Actual date of this flight
  carrier: string;                   // W6
  flightNumber: string;              // W6 4242
  origin: string;                    // MST or TZL
  destination: string;               // TZL or MST
  route: string;                     // MST-TZL

  // Departure data (if origin = TZL)
  departureFlightNumber: string | null;
  departureScheduledTime: Date | null;  // Local time

  // Arrival data (if destination = TZL)
  arrivalFlightNumber: string | null;
  arrivalScheduledTime: Date | null;    // Local time
  arrivalDate: Date | null;              // Arrival date (može biti različit od departure date)

  aircraftType: string;              // 32Q
  availableSeats: number;            // 239

  status: 'SCHEDULED' | 'CANCELLED';
  changeType: string;                // None, Cancel
  season: string;                    // S26

  // Metadata
  originalRule: ScheduleChangeRow;
}

export interface ScheduleChangesParseResult {
  success: boolean;
  rows: ScheduleChangeRow[];
  expandedFlights: ExpandedFlight[];
  totalRules: number;
  totalFlights: number;
  errors: string[];
  warnings: string[];
}

// ---------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------

/**
 * Parse string value, trim and return null if empty
 */
function parseString(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;
  const str = String(value).trim();
  return str === '' ? null : str;
}

/**
 * Parse date from M/D/YYYY format
 * Example: "6/3/2026" → Date
 */
function parseDate(value: string): Date | null {
  if (!value) return null;

  const trimmed = value.trim();

  // Match M/D/YYYY or MM/DD/YYYY format
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const month = parseInt(match[1], 10);
  const day = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  if (year < 2000 || year > 2100) return null;

  // Create date at midnight UTC
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Parse time from "H:MM AM/PM" format and combine with date
 * Example: "7:10 PM" → 19:10
 * Returns UTC time
 */
function parseTime(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr) return null;

  const trimmed = timeStr.trim();

  // Match H:MM AM/PM or HH:MM AM/PM
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();

  if (hours < 1 || hours > 12) return null;
  if (minutes < 0 || minutes > 59) return null;

  // Convert to 24-hour format
  if (period === 'PM' && hours !== 12) {
    hours += 12;
  } else if (period === 'AM' && hours === 12) {
    hours = 0;
  }

  return { hours, minutes };
}

/**
 * Combine date and time, treating time as UTC, then convert to local timezone
 * Example: date="2026-06-03", time="7:10 PM" UTC → local DateTime
 */
function combineDateTimeUTCToLocal(
  date: Date,
  timeStr: string
): Date | null {
  const time = parseTime(timeStr);
  if (!time) return null;

  // Create UTC date with time
  const utcDate = new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    time.hours,
    time.minutes,
    0,
    0
  ));

  // Convert UTC to local timezone (Europe/Sarajevo)
  // The UTC time represents the actual flight time, we just need to store it
  // The database will store it as-is, and we'll display it in local time in the UI
  return utcDate;
}

/**
 * Parse "On days" pattern to weekday numbers
 * Example: "1_3_5__" → [0, 2, 4] (Monday=0, Sunday=6)
 * Pattern: 1234567 where 1=Monday, 7=Sunday
 */
function parseOnDays(onDays: string): number[] {
  if (!onDays || onDays.length !== 7) return [];

  const weekdays: number[] = [];

  for (let i = 0; i < 7; i++) {
    const char = onDays[i];
    if (char !== '_') {
      // Convert: 1=Monday(0), 2=Tuesday(1), ..., 7=Sunday(6)
      const weekday = i === 6 ? 0 : i + 1;  // Sunday is 0 in JS, but 7 in pattern
      weekdays.push(weekday);
    }
  }

  return weekdays;
}

/**
 * Parse leg code to origin and destination
 * Example: "MSTTZL" → { origin: "MST", destination: "TZL" }
 */
function parseLeg(leg: string): { origin: string; destination: string } | null {
  if (!leg || leg.length !== 6) return null;

  return {
    origin: leg.substring(0, 3).toUpperCase(),
    destination: leg.substring(3, 6).toUpperCase(),
  };
}

/**
 * Check if a date falls on one of the allowed weekdays
 */
function isDateOnAllowedWeekday(date: Date, allowedWeekdays: number[]): boolean {
  const dayOfWeek = date.getUTCDay();
  return allowedWeekdays.includes(dayOfWeek);
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

// ---------------------------------------------------------
// EXPANSION LOGIC
// ---------------------------------------------------------

/**
 * Expand a single rule into concrete flights for all matching dates
 */
function expandRule(rule: ScheduleChangeRow): ExpandedFlight[] {
  const flights: ExpandedFlight[] = [];

  const startDate = parseDate(rule.from);
  const endDate = parseDate(rule.to);
  const allowedWeekdays = parseOnDays(rule.onDays);
  const legParts = parseLeg(rule.leg);

  if (!startDate || !endDate) {
    return flights;
  }

  if (!legParts) {
    return flights;
  }

  if (allowedWeekdays.length === 0) {
    return flights;
  }

  // Iterate through all dates in range
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (isDateOnAllowedWeekday(currentDate, allowedWeekdays)) {
      // Create flight for this date
      const departureTime = combineDateTimeUTCToLocal(currentDate, rule.std);
      const arrivalTime = combineDateTimeUTCToLocal(currentDate, rule.sta);

      const flightNumber = `${rule.carrier} ${rule.flight}`;
      const route = `${legParts.origin}-${legParts.destination}`;

      // Determine if this is departure from TZL or arrival to TZL
      const isDeparture = legParts.origin === 'TZL';
      const isArrival = legParts.destination === 'TZL';

      const flight: ExpandedFlight = {
        date: new Date(currentDate),
        carrier: rule.carrier,
        flightNumber: flightNumber,
        origin: legParts.origin,
        destination: legParts.destination,
        route: route,

        departureFlightNumber: isDeparture ? flightNumber : null,
        departureScheduledTime: isDeparture ? departureTime : null,

        arrivalFlightNumber: isArrival ? flightNumber : null,
        arrivalScheduledTime: isArrival ? arrivalTime : null,
        arrivalDate: isArrival ? new Date(currentDate) : null, // Arrival date (same as flight date initially)

        aircraftType: rule.acType,
        availableSeats: parseInt(rule.seatConf, 10) || 0,

        status: rule.changeType.toLowerCase() === 'cancel' ? 'CANCELLED' : 'SCHEDULED',
        changeType: rule.changeType,
        season: rule.season,

        originalRule: rule,
      };

      flights.push(flight);
    }

    currentDate = addDays(currentDate, 1);
  }

  return flights;
}

// ---------------------------------------------------------
// PARSING LOGIC
// ---------------------------------------------------------

/**
 * Parse tab-separated, pipe-separated, or space-separated schedule changes text
 */
function parseScheduleChangesText(text: string): ScheduleChangeRow[] {
  const rows: ScheduleChangeRow[] = [];
  const lines = text.split('\n');

  let headerIndex = -1;
  let isPipeSeparated = false;

  // Find header row
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (line.includes('carrier') && line.includes('flight') && line.includes('leg')) {
      headerIndex = i;
      // Check if pipe-separated
      isPipeSeparated = lines[i].includes('|');
      break;
    }
  }

  if (headerIndex === -1) {
    // No header found - try to parse as headerless format
    // This is for backward compatibility with old exports (9 columns)
    console.log('No header row found - trying headerless format');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines or season line
      if (!line || line.toLowerCase().startsWith('season:')) continue;

      // Parse pipe-separated format (old export format: 9 columns)
      if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim()).filter(p => p);

        // Old format: Carrier | Flight | Leg | Aircraft | Seats | DateFrom | DateTo | OnDays | Time
        if (parts.length === 9) {
          const leg = parts[2];
          const isArrival = leg.endsWith('TZL');
          const isDeparture = leg.startsWith('TZL');

          const row: ScheduleChangeRow = {
            row: i + 1,
            carrier: parts[0],
            flight: parts[1],
            leg: parts[2],
            changeType: 'None',
            from: parts[5],
            to: parts[6],
            std: isDeparture ? parts[8] : 'None',
            sta: isArrival ? parts[8] : 'None',
            acType: parts[3],
            seatConf: parts[4],
            onDays: parts[7],
            season: 'Unknown',
            affectedFlights: 0,
          };

          rows.push(row);
        }
      }
    }

    console.log('Parsed headerless format - rows:', rows.length);
    return rows;
  }

  console.log('Header found at line:', headerIndex, 'Pipe-separated:', isPipeSeparated);

  // Parse data rows (skip header and any lines before it)
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines
    if (!line) continue;

    // Skip lines that look like separators or headers
    if (line.startsWith('-') || line.startsWith('=') || line.startsWith('+')) continue;

    let parts: string[] = [];

    // Parse based on detected format
    if (isPipeSeparated) {
      // Split by pipe and trim
      parts = line.split('|').map(p => p.trim()).filter(p => p);
    } else {
      // Try to parse as tab-separated first
      parts = line.split('\t').map(p => p.trim());

      // Check if it's actually tab-separated (should have many parts)
      if (parts.length >= 13) {
        // Keep empty parts for tab-separated data
        // Don't filter out empty strings - they represent empty fields
      } else {
        // If we don't have enough parts, try whitespace splitting
        // Split by multiple spaces (2 or more)
        parts = line.split(/\s{2,}/).map(p => p.trim()).filter(p => p);
      }
    }

    // We expect 13 columns
    if (parts.length >= 13) {
      const row: ScheduleChangeRow = {
        row: i + 1,
        carrier: parseString(parts[0]) || '',
        flight: parseString(parts[1]) || '',
        leg: parseString(parts[2]) || '',
        changeType: parseString(parts[3]) || 'None',
        from: parseString(parts[4]) || '',
        to: parseString(parts[5]) || '',
        std: parseString(parts[6]) || '',
        sta: parseString(parts[7]) || '',
        acType: parseString(parts[8]) || '',
        seatConf: parseString(parts[9]) || '',
        onDays: parseString(parts[10]) || '',
        season: parseString(parts[11]) || '',
        affectedFlights: parseInt(parts[12], 10) || 0,
      };

      rows.push(row);
    } else if (parts.length > 0) {
      console.warn(`Line ${i + 1} has ${parts.length} parts, expected 13:`, parts);
    }
  }

  console.log('Parsed rows:', rows.length);
  return rows;
}

/**
 * Validate a single rule
 */
function validateRule(rule: ScheduleChangeRow): string[] {
  const errors: string[] = [];

  if (!rule.carrier) errors.push('Carrier is required');
  if (!rule.flight) errors.push('Flight number is required');
  if (!rule.leg || rule.leg.length !== 6) errors.push('Leg must be 6 characters (e.g., MSTTZL)');
  if (!rule.from) errors.push('From date is required');
  if (!rule.to) errors.push('To date is required');
  if (!rule.std) errors.push('STD is required');
  if (!rule.sta) errors.push('STA is required');
  if (!rule.acType) errors.push('Aircraft type is required');
  if (!rule.seatConf) errors.push('Seat configuration is required');
  if (!rule.onDays || rule.onDays.length !== 7) errors.push('On days must be 7 characters');
  if (!rule.season) errors.push('Season is required');

  // Date validation
  const fromDate = parseDate(rule.from);
  const toDate = parseDate(rule.to);

  if (!fromDate) errors.push(`Invalid From date: ${rule.from}`);
  if (!toDate) errors.push(`Invalid To date: ${rule.to}`);
  if (fromDate && toDate && fromDate > toDate) {
    errors.push('From date must be before or equal to To date');
  }

  // Time validation
  if (!parseTime(rule.std)) errors.push(`Invalid STD time: ${rule.std}`);
  if (!parseTime(rule.sta)) errors.push(`Invalid STA time: ${rule.sta}`);

  // On days validation
  const weekdays = parseOnDays(rule.onDays);
  if (weekdays.length === 0) {
    errors.push('On days must have at least one active day');
  }

  return errors;
}

// ---------------------------------------------------------
// PAIRING LOGIC - Combine departure and arrival into round trips
// ---------------------------------------------------------

/**
 * Pair departure (TZLXXX) and arrival (XXXTZL) flights into round trips
 *
 * Rules:
 * 1. Same day: departure today + arrival today = pair
 * 2. Overnight: departure today + arrival tomorrow = pair
 * 3. No duplicate flights to same destination on same day
 */
function pairFlights(flights: ExpandedFlight[]): ExpandedFlight[] {
  const paired: ExpandedFlight[] = [];
  const processed = new Set<number>();

  // Separate departures and arrivals
  const departures = flights
    .map((f, idx) => ({ flight: f, index: idx }))
    .filter(({ flight }) => flight.origin === 'TZL');

  const arrivals = flights
    .map((f, idx) => ({ flight: f, index: idx }))
    .filter(({ flight }) => flight.destination === 'TZL');

  // For each departure, find matching arrival
  for (const { flight: departure, index: depIdx } of departures) {
    if (processed.has(depIdx)) continue;

    const destination = departure.destination;
    const depDate = departure.date;
    const depDateStr = depDate.toISOString().split('T')[0];
    const nextDay = new Date(depDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);
    const nextDayStr = nextDay.toISOString().split('T')[0];

    // Find matching arrival (same day or next day)
    const matchingArrival = arrivals.find(({ flight: arrival, index: arrIdx }) => {
      if (processed.has(arrIdx)) return false;
      if (arrival.origin !== destination) return false;
      if (arrival.carrier !== departure.carrier) return false;

      const arrDateStr = arrival.date.toISOString().split('T')[0];

      // Same day or next day
      return arrDateStr === depDateStr || arrDateStr === nextDayStr;
    });

    if (matchingArrival) {
      // Create paired flight (round trip)
      const { flight: arrival, index: arrIdx } = matchingArrival;

      const pairedFlight: ExpandedFlight = {
        date: departure.date, // Main date is departure date
        carrier: departure.carrier,
        flightNumber: departure.flightNumber, // Primary flight number (departure)
        origin: 'TZL',
        destination: destination,
        route: `TZL-${destination}-TZL`, // Round trip format

        // Departure data
        departureFlightNumber: departure.flightNumber,
        departureScheduledTime: departure.departureScheduledTime,

        // Arrival data
        arrivalFlightNumber: arrival.flightNumber,
        arrivalScheduledTime: arrival.arrivalScheduledTime,
        arrivalDate: arrival.date,

        // Use departure aircraft as primary
        aircraftType: departure.aircraftType,
        availableSeats: departure.availableSeats,

        // Status: if either is cancelled, mark as cancelled
        status:
          departure.status === 'CANCELLED' || arrival.status === 'CANCELLED'
            ? 'CANCELLED'
            : 'SCHEDULED',
        changeType: departure.changeType !== 'None' ? departure.changeType : arrival.changeType,
        season: departure.season,

        originalRule: departure.originalRule,
      };

      paired.push(pairedFlight);
      processed.add(depIdx);
      processed.add(arrIdx);
    } else {
      // No matching arrival - departure only (ferry out)
      paired.push({
        ...departure,
        route: `TZL-${destination}`, // One-way
        arrivalDate: null,
      });
      processed.add(depIdx);
    }
  }

  // Add remaining unpaired arrivals (ferry in)
  for (const { flight: arrival, index: arrIdx } of arrivals) {
    if (processed.has(arrIdx)) continue;

    paired.push({
      ...arrival,
      route: `${arrival.origin}-TZL`, // One-way arrival
      arrivalDate: arrival.date,
    });
    processed.add(arrIdx);
  }

  return paired;
}

// ---------------------------------------------------------
// MAIN EXPORT
// ---------------------------------------------------------

/**
 * Parse Schedule Changes TZL text file
 */
export async function parseScheduleChangesFile(
  fileBuffer: Buffer
): Promise<ScheduleChangesParseResult> {
  const result: ScheduleChangesParseResult = {
    success: false,
    rows: [],
    expandedFlights: [],
    totalRules: 0,
    totalFlights: 0,
    errors: [],
    warnings: [],
  };

  try {
    // Convert buffer to text
    const text = fileBuffer.toString('utf-8');

    console.log('Schedule Changes Parser - Input text preview:');
    console.log('First 500 chars:', text.substring(0, 500));
    console.log('Has tabs:', text.includes('\t'));
    console.log('Line count:', text.split('\n').length);

    // Parse text into rules
    const rules = parseScheduleChangesText(text);

    console.log('Parsed rules:', rules.length);

    if (rules.length === 0) {
      result.errors.push('No valid schedule data found in file. Make sure the file contains the header row with "Carrier", "Flight", "Leg", etc.');
      console.error('No rules found. Text sample:', text.substring(0, 1000));
      return result;
    }

    result.rows = rules;
    result.totalRules = rules.length;

    // Expand each rule into flights
    let totalGenerated = 0;
    const allExpandedFlights: ExpandedFlight[] = [];

    for (const rule of rules) {
      // Validate rule
      const validationErrors = validateRule(rule);

      if (validationErrors.length > 0) {
        result.errors.push(
          `Row ${rule.row}: ${validationErrors.join(', ')}`
        );
        continue;
      }

      // Expand rule
      const flights = expandRule(rule);

      // Check if generated count matches affected flights
      if (flights.length !== rule.affectedFlights) {
        result.warnings.push(
          `Row ${rule.row}: Generated ${flights.length} flights but rule says ${rule.affectedFlights} affected flights`
        );
      }

      allExpandedFlights.push(...flights);
      totalGenerated += flights.length;
    }

    // Pair departures and arrivals into round trips
    console.log('Pairing flights... Total expanded:', allExpandedFlights.length);
    result.expandedFlights = pairFlights(allExpandedFlights);
    console.log('After pairing:', result.expandedFlights.length);

    result.totalFlights = result.expandedFlights.length;
    result.success = result.expandedFlights.length > 0;

    if (result.expandedFlights.length === 0) {
      result.errors.push('No flights were generated from the rules. Check date ranges and "On days" patterns.');
    }

  } catch (error) {
    result.errors.push(
      `Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }

  return result;
}
