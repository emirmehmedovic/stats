import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from '@react-pdf/renderer';

// Register Roboto font for special characters (čćžđš)
// Using Roboto as it's well-supported and includes Latin Extended characters
Font.register({
  family: 'Roboto',
  fonts: [
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
      fontWeight: 300,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf',
      fontWeight: 400,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf',
      fontWeight: 500,
    },
    {
      src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: '#ffffff',
    fontFamily: 'Roboto',
  },
  header: {
    backgroundColor: '#1e3a8a',
    padding: 12,
    marginBottom: 15,
    borderRadius: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: 'Roboto',
  },
  subtitle: {
    fontSize: 9,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Roboto',
    opacity: 0.8,
  },
  weekHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e3a8a',
    borderBottom: '2 solid #1e3a8a',
    borderRadius: 4,
  },
  dayHeaderCell: {
    width: '14.28%',
    padding: 5,
    borderRight: '1 solid #374151',
  },
  dayHeaderCellLast: {
    borderRight: 'none',
  },
  dayHeaderText: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textTransform: 'uppercase',
    fontFamily: 'Roboto',
  },
  weekRow: {
    flexDirection: 'row',
    minHeight: 70,
    borderLeft: '1 solid #d1d5db',
    borderRight: '1 solid #d1d5db',
  },
  dayCell: {
    width: '14.28%',
    borderRight: '1 solid #d1d5db',
    borderBottom: '1 solid #d1d5db',
    padding: 4,
    backgroundColor: '#ffffff',
  },
  dayCellLast: {
    borderRight: 'none',
  },
  dateHeader: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 3,
    textAlign: 'center',
    paddingVertical: 2,
    paddingHorizontal: 2,
    fontFamily: 'Roboto',
    backgroundColor: '#f9fafb',
    borderRadius: 3,
  },
  // Compact table for flights
  flightTable: {
    border: '1 solid #d1d5db',
    marginTop: 2,
    borderRadius: 3,
    overflow: 'hidden',
  },
  flightTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderBottom: '1 solid #9ca3af',
  },
  flightTableRow: {
    flexDirection: 'row',
    borderBottom: '0.5 solid #e5e7eb',
  },
  flightTableRowLast: {
    borderBottom: 'none',
  },
  flightTableCell: {
    padding: 2,
    borderRight: '0.5 solid #e5e7eb',
  },
  flightTableCellLast: {
    borderRight: 'none',
  },
  destinationCell: {
    width: '40%',
  },
  timeCell: {
    width: '30%',
  },
  headerCellText: {
    fontSize: 5,
    fontWeight: 'bold',
    color: '#6b7280',
    textAlign: 'center',
    textTransform: 'uppercase',
    fontFamily: 'Roboto',
  },
  cellText: {
    fontSize: 6,
    color: '#374151',
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  cellTextBold: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#1e3a8a',
    textAlign: 'center',
    fontFamily: 'Roboto',
  },
  emptyCell: {
    fontSize: 6,
    color: '#d1d5db',
    textAlign: 'center',
    paddingTop: 6,
    fontFamily: 'Roboto',
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 20,
    right: 20,
    textAlign: 'center',
    fontSize: 7,
    color: '#6b7280',
    borderTop: '2 solid #1e3a8a',
    paddingTop: 6,
    fontFamily: 'Roboto',
  },
  // Legend styles
  legendSection: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    border: '1 solid #d1d5db',
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e3a8a',
    marginBottom: 8,
    fontFamily: 'Roboto',
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    width: '22%',
    marginBottom: 4,
  },
  legendCode: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#1e3a8a',
    fontFamily: 'Roboto',
  },
  legendDestination: {
    fontSize: 6,
    color: '#6b7280',
    fontFamily: 'Roboto',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1 solid #d1d5db',
    gap: 20,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 6,
    color: '#6b7280',
    marginBottom: 2,
    fontFamily: 'Roboto',
  },
  statValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e3a8a',
    fontFamily: 'Roboto',
  },
});

interface FlightData {
  id: string;
  date: Date;
  route: string;
  airline: {
    id: string;
    name: string;
    icaoCode: string;
    iataCode: string | null;
    logoUrl?: string | null;
  };
  arrivalFlightNumber: string | null;
  arrivalScheduledTime: Date | null;
  arrivalStatus: string | null;
  departureFlightNumber: string | null;
  departureScheduledTime: Date | null;
  departureStatus: string | null;
}

interface DaySchedule {
  date: Date;
  dayName: string;
  flights: FlightData[];
}

interface MonthlySchedulePDFProps {
  month: number;
  year: number;
  schedule: DaySchedule[];
}

// Format time to HH:MM
function formatTime(date: Date | null): string {
  if (!date) return '-';
  return new Date(date).toLocaleTimeString('hr-BA', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Sarajevo',
    hour12: false,
  });
}

// Format date as DD.MM.YYYY
function formatDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// Get day name in Bosnian (short)
function getDayName(date: Date): string {
  const days = [
    'NEDJELJA',
    'PONEDJELJAK',
    'UTORAK',
    'SRIJEDA',
    'ČETVRTAK',
    'PETAK',
    'SUBOTA',
  ];
  return days[date.getDay()];
}

// Get destination from route (TZL-BER-TZL -> BER, AYT-TZL-AYT -> AYT)
function getDestination(route: string): string {
  const parts = route.split('-');

  // Handle 3-part routes (round trips)
  if (parts.length === 3) {
    // If TZL is in the middle (AYT-TZL-AYT -> AYT)
    if (parts[1] === 'TZL') {
      return parts[0]; // or parts[2], they should be the same
    }
    // If TZL is at start and end (TZL-BER-TZL -> BER)
    if (parts[0] === 'TZL' && parts[2] === 'TZL') {
      return parts[1];
    }
  }

  // Handle 2-part routes
  if (parts.length === 2) {
    return parts[0] === 'TZL' ? parts[1] : parts[0]; // TZL-BER or BER-TZL
  }

  return route;
}

// Group days into weeks (7 days per row)
function groupIntoWeeks(schedule: DaySchedule[]): DaySchedule[][] {
  const weeks: DaySchedule[][] = [];
  let currentWeek: DaySchedule[] = [];

  // Start from Monday of first week
  const firstDate = schedule[0]?.date;
  if (!firstDate) return weeks;

  // Fill empty days before first day of month
  const firstDayOfWeek = firstDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToAdd = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Monday = 0

  for (let i = 0; i < daysToAdd; i++) {
    const emptyDate = new Date(firstDate);
    emptyDate.setDate(firstDate.getDate() - (daysToAdd - i));
    currentWeek.push({
      date: emptyDate,
      dayName: getDayName(emptyDate),
      flights: [],
    });
  }

  // Add actual days
  for (const day of schedule) {
    currentWeek.push(day);

    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  // Fill remaining days in last week
  if (currentWeek.length > 0) {
    const lastDate = currentWeek[currentWeek.length - 1].date;
    while (currentWeek.length < 7) {
      const nextDate = new Date(lastDate);
      nextDate.setDate(lastDate.getDate() + (currentWeek.length - currentWeek.findIndex(d => d.date === lastDate)));
      currentWeek.push({
        date: nextDate,
        dayName: getDayName(nextDate),
        flights: [],
      });
    }
    weeks.push(currentWeek);
  }

  return weeks;
}

// Get unique destinations from schedule
interface DestinationInfo {
  iata: string;
  name: string;
  count: number;
}

function getDestinationsFromSchedule(schedule: DaySchedule[]): DestinationInfo[] {
  const destinationMap = new Map<string, number>();

  schedule.forEach(day => {
    day.flights.forEach(flight => {
      const dest = getDestination(flight.route);
      destinationMap.set(dest, (destinationMap.get(dest) || 0) + 1);
    });
  });

  // Convert to array and sort by IATA code
  return Array.from(destinationMap.entries())
    .map(([iata, count]) => ({
      iata,
      name: getDestinationName(iata),
      count,
    }))
    .sort((a, b) => a.iata.localeCompare(b.iata));
}

// Map IATA codes to full destination names
function getDestinationName(iata: string): string {
  const destinations: Record<string, string> = {
    BER: 'Berlin, Njemačka',
    BTS: 'Bratislava, Slovačka',
    BVA: 'Paris Beauvais, Francuska',
    CGN: 'Cologne, Njemačka',
    DTM: 'Dortmund, Njemačka',
    FMM: 'Memmingen, Njemačka',
    GOT: 'Gotheborg, Švedska',
    HAM: 'Hamburg, Njemačka',
    HHN: 'Frankfurt Hahn, Njemačka',
    LCA: 'Larnaca, Kipar',
    MLH: 'Basel Mulhouse, Francuska',
    MMX: 'Malmö, Švedska',
    MST: 'Maastricht, Holandija',
    SAW: 'Istanbul Sabiha Gökçen, Turska',
  };
  return destinations[iata] || iata;
}

// Calculate statistics
interface FlightStats {
  totalOperations: number; // Round trips (both departure and arrival)
  totalFlights: number; // Individual flights (departure OR arrival)
}

function calculateStats(schedule: DaySchedule[]): FlightStats {
  let totalOperations = 0;
  let totalFlights = 0;

  schedule.forEach(day => {
    day.flights.forEach(flight => {
      const hasDeparture = !!flight.departureFlightNumber;
      const hasArrival = !!flight.arrivalFlightNumber;

      if (hasDeparture && hasArrival) {
        // Round trip = 1 operation
        totalOperations++;
      } else if (hasDeparture || hasArrival) {
        // One-way = 1 flight
        totalFlights++;
      }
    });
  });

  return { totalOperations, totalFlights };
}

// Flight row component (one row in compact table: LOGO + IATA | DEP | ARR)
const FlightTableRow: React.FC<{ flight: FlightData; isLast: boolean }> = ({
  flight,
  isLast,
}) => {
  const destination = getDestination(flight.route);
  const departureTime = formatTime(flight.departureScheduledTime);
  const arrivalTime = formatTime(flight.arrivalScheduledTime);

  return (
    <View style={isLast ? [styles.flightTableRow, styles.flightTableRowLast] : styles.flightTableRow}>
      {/* Destination IATA with logo */}
      <View style={[styles.flightTableCell, styles.destinationCell]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, justifyContent: 'center' }}>
          {flight.airline.logoUrl && (
            <Image
              src={flight.airline.logoUrl}
              style={{ width: 8, height: 8, objectFit: 'contain' }}
            />
          )}
          <Text style={styles.cellTextBold}>{destination}</Text>
        </View>
      </View>

      {/* Departure time */}
      <View style={[styles.flightTableCell, styles.timeCell]}>
        <Text style={styles.cellText}>{departureTime}</Text>
      </View>

      {/* Arrival time */}
      <View style={[styles.flightTableCell, styles.timeCell, styles.flightTableCellLast]}>
        <Text style={styles.cellText}>{arrivalTime}</Text>
      </View>
    </View>
  );
};

// Day cell component (one column in table)
const DayCell: React.FC<{ daySchedule: DaySchedule; isLast: boolean; isCurrentMonth: boolean }> = ({
  daySchedule,
  isLast,
  isCurrentMonth,
}) => {
  return (
    <View style={isLast ? [styles.dayCell, styles.dayCellLast] : styles.dayCell}>
      {/* Date header (only if current month) */}
      {isCurrentMonth && (
        <Text style={styles.dateHeader}>{formatDate(daySchedule.date)}</Text>
      )}

      {/* Flights table */}
      {daySchedule.flights.length > 0 ? (
        <View style={styles.flightTable}>
          {/* Table header */}
          <View style={styles.flightTableHeader}>
            <View style={[styles.flightTableCell, styles.destinationCell]}>
              <Text style={styles.headerCellText}>Destinacija</Text>
            </View>
            <View style={[styles.flightTableCell, styles.timeCell]}>
              <Text style={styles.headerCellText}>Polazak</Text>
            </View>
            <View style={[styles.flightTableCell, styles.timeCell, styles.flightTableCellLast]}>
              <Text style={styles.headerCellText}>Dolazak</Text>
            </View>
          </View>

          {/* Flight rows */}
          {daySchedule.flights.map((flight, index) => (
            <FlightTableRow
              key={flight.id}
              flight={flight}
              isLast={index === daySchedule.flights.length - 1}
            />
          ))}
        </View>
      ) : isCurrentMonth ? (
        <Text style={styles.emptyCell}>-</Text>
      ) : null}
    </View>
  );
};

// Week row component (7 days in a row)
const WeekRow: React.FC<{
  week: DaySchedule[];
  currentMonth: number;
  shouldBreak?: boolean;
}> = ({ week, currentMonth, shouldBreak = false }) => {
  return (
    <View style={styles.weekRow} wrap={!shouldBreak} break={shouldBreak}>
      {week.map((day, index) => (
        <DayCell
          key={index}
          daySchedule={day}
          isLast={index === 6}
          isCurrentMonth={day.date.getMonth() + 1 === currentMonth}
        />
      ))}
    </View>
  );
};

// Legend component
const Legend: React.FC<{ schedule: DaySchedule[] }> = ({ schedule }) => {
  const destinations = getDestinationsFromSchedule(schedule);
  const stats = calculateStats(schedule);

  return (
    <View style={styles.legendSection} wrap={false}>
      <Text style={styles.legendTitle}>Legenda destinacija</Text>

      {/* Destinations grid */}
      <View style={styles.legendGrid}>
        {destinations.map((dest, index) => (
          <View key={index} style={styles.legendItem}>
            <Text style={styles.legendCode}>{dest.iata}</Text>
            <Text style={styles.legendDestination}>{dest.name}</Text>
          </View>
        ))}
      </View>

      {/* Statistics */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Ukupno operacija (round trip)</Text>
          <Text style={styles.statValue}>{stats.totalOperations}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Ukupno letova (one-way)</Text>
          <Text style={styles.statValue}>{stats.totalFlights}</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Ukupno destinacija</Text>
          <Text style={styles.statValue}>{destinations.length}</Text>
        </View>
      </View>
    </View>
  );
};

// Main PDF Document
export const MonthlySchedulePDF: React.FC<MonthlySchedulePDFProps> = ({
  month,
  year,
  schedule,
}) => {
  const monthNames = [
    'JANUAR',
    'FEBRUAR',
    'MART',
    'APRIL',
    'MAJ',
    'JUNI',
    'JULI',
    'AUGUST',
    'SEPTEMBAR',
    'OKTOBAR',
    'NOVEMBAR',
    'DECEMBAR',
  ];

  const dayHeaders = [
    'PONEDJELJAK',
    'UTORAK',
    'SRIJEDA',
    'ČETVRTAK',
    'PETAK',
    'SUBOTA',
    'NEDJELJA',
  ];

  const monthName = monthNames[month - 1];
  const documentTitle = `RED LETENJA ZA PERIOD: ${monthName} ${year}. GODINE`;

  // Group days into weeks
  const weeks = groupIntoWeeks(schedule);

  // Split weeks into pages (max 3 weeks per page to prevent overflow)
  const weeksPerPage = 3;
  const pages: DaySchedule[][][] = [];
  for (let i = 0; i < weeks.length; i += weeksPerPage) {
    pages.push(weeks.slice(i, i + weeksPerPage));
  }

  return (
    <Document title={documentTitle}>
      {pages.map((pageWeeks, pageIndex) => (
        <Page key={pageIndex} size="A4" orientation="landscape" style={styles.page}>
          {/* Header (only on first page) */}
          {pageIndex === 0 && (
            <View style={styles.header}>
              <Text style={styles.title}>{documentTitle}</Text>
              <Text style={styles.subtitle}>Međunarodni aerodrom Tuzla</Text>
            </View>
          )}

          {/* Week headers */}
          <View style={styles.weekHeader}>
            {dayHeaders.map((dayName, index) => (
              <View
                key={index}
                style={
                  index === 6
                    ? [styles.dayHeaderCell, styles.dayHeaderCellLast]
                    : styles.dayHeaderCell
                }
              >
                <Text style={styles.dayHeaderText}>{dayName}</Text>
              </View>
            ))}
          </View>

          {/* Weeks */}
          {pageWeeks.map((week, weekIndex) => (
            <WeekRow key={weekIndex} week={week} currentMonth={month} />
          ))}

          {/* Legend (only on last page) */}
          {pageIndex === pages.length - 1 && <Legend schedule={schedule} />}

          {/* Footer */}
          <Text style={styles.footer}>
            Međunarodni aerodrom Tuzla | Stranica {pageIndex + 1} od {pages.length}
          </Text>
        </Page>
      ))}
    </Document>
  );
};
