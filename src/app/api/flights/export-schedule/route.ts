import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { TIME_ZONE_SARAJEVO } from '@/lib/dates';

// Validation schema za query parametre
const exportScheduleQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
  format: z.enum(['json', 'csv']).default('json'),
});

// Helper funkcija za parsiranje route-a i ekstrakciju IATA koda destinacije
// Route format: TZL-BER-TZL (departure u BER, arrival iz BER)
//               SAW-TZL-SAW (arrival iz SAW, departure u SAW)
function parseRouteForDestination(route: string, isArrival: boolean): string | null {
  const parts = route.split('-');
  if (parts.length !== 3) return null;

  const [first, middle, last] = parts;

  // Ako počinje sa TZL: TZL-XXX-TZL
  if (first === 'TZL' && last === 'TZL') {
    return middle; // XXX je destinacija (za arrival i departure)
  }

  // Ako je TZL u sredini: XXX-TZL-XXX
  if (middle === 'TZL' && first === last) {
    return first; // XXX je destinacija (za arrival i departure)
  }

  return null;
}

// Helper funkcija za formatiranje datuma i vremena u lokalnoj zoni
function formatDateTimeLocal(date: Date): string {
  // Konvertuj UTC datum u lokalno vrijeme koristeći timezone offset
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: TIME_ZONE_SARAJEVO }));

  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

// GET /api/flights/export-schedule?year=2026&month=6&format=csv
// Eksportuje planirane letove (SCHEDULED status) za određeni mjesec
// u formatu kompatibilnom sa flight-management sistemom
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      year: searchParams.get('year'),
      month: searchParams.get('month'),
      format: searchParams.get('format') || 'json',
    };

    const validatedQuery = exportScheduleQuerySchema.parse(queryParams);
    const { year, month, format } = validatedQuery;

    // Kalkulacija početka i kraja mjeseca
    const startDate = new Date(year, month - 1, 1); // month - 1 jer je 0-indexed
    const endDate = new Date(year, month, 1); // Prvi dan narednog mjeseca
    endDate.setMilliseconds(-1); // Zadnji milisekunda prethodnog mjeseca

    console.log('Export schedule params:', { year, month, startDate, endDate });

    // Dohvati letove za dati mjesec (bez obzira na status - prilagodićemo kasnije)
    const flights = await prisma.flight.findMany({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
      include: {
        airline: {
          select: {
            name: true,
            iataCode: true,
            icaoCode: true,
          },
        },
        arrivalAirport: {
          select: {
            iataCode: true,
            name: true,
            city: true,
          },
        },
        departureAirport: {
          select: {
            iataCode: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { arrivalScheduledTime: 'asc' },
        { departureScheduledTime: 'asc' },
      ],
    });

    console.log(`Found ${flights.length} flights for ${month}/${year}`);

    // Debug: pogledaj prvi let
    if (flights.length > 0) {
      const firstFlight = flights[0];
      console.log('First flight sample:', {
        id: firstFlight.id,
        route: firstFlight.route,
        arrivalFlightNumber: firstFlight.arrivalFlightNumber,
        arrivalScheduledTime: firstFlight.arrivalScheduledTime,
        arrivalAirportId: firstFlight.arrivalAirportId,
        arrivalAirport: firstFlight.arrivalAirport,
        departureFlightNumber: firstFlight.departureFlightNumber,
        departureScheduledTime: firstFlight.departureScheduledTime,
        departureAirportId: firstFlight.departureAirportId,
        departureAirport: firstFlight.departureAirport,
      });
    }

    // Transformiši letove u format flight-management sistema
    // Svaki let može biti razdvojen u arrival i departure
    const exportedFlights: any[] = [];

    for (const flight of flights) {
      const airlineCode = flight.airline.iataCode || flight.airline.icaoCode || '';

      // Arrival let - eksportuj ako ima scheduled vrijeme
      if (flight.arrivalScheduledTime && flight.arrivalFlightNumber) {
        // Konvertuj UTC vrijeme u lokalno vrijeme (Europe/Sarajevo)
        const formattedDateTime = formatDateTimeLocal(new Date(flight.arrivalScheduledTime));
        // Normalizacija broja leta: ukloni razmake (W6 284 -> W6284)
        const normalizedFlightNumber = flight.arrivalFlightNumber.replace(/\s+/g, '');

        // Dohvati IATA kod destinacije iz route-a
        const destinationIata = parseRouteForDestination(flight.route, true);

        if (destinationIata) {
          exportedFlights.push({
            airline_code: airlineCode,
            flight_number: normalizedFlightNumber,
            departure_time: '', // Prazan za arrival
            arrival_time: formattedDateTime,
            destination_code: destinationIata,
            is_departure: false,
            remarks: '',
            status: 'SCHEDULED',
            // Extra fields za JSON format
            route: flight.route,
          });
        }
      }

      // Departure let - eksportuj ako ima scheduled vrijeme
      if (flight.departureScheduledTime && flight.departureFlightNumber) {
        // Konvertuj UTC vrijeme u lokalno vrijeme (Europe/Sarajevo)
        const formattedDateTime = formatDateTimeLocal(new Date(flight.departureScheduledTime));
        // Normalizacija broja leta: ukloni razmake (W6 284 -> W6284)
        const normalizedFlightNumber = flight.departureFlightNumber.replace(/\s+/g, '');

        // Dohvati IATA kod destinacije iz route-a
        const destinationIata = parseRouteForDestination(flight.route, false);

        if (destinationIata) {
          exportedFlights.push({
            airline_code: airlineCode,
            flight_number: normalizedFlightNumber,
            departure_time: formattedDateTime,
            arrival_time: '', // Prazan za departure
            destination_code: destinationIata,
            is_departure: true,
            remarks: '',
            status: 'SCHEDULED',
            // Extra fields za JSON format
            route: flight.route,
          });
        }
      }
    }

    console.log(`Exported ${exportedFlights.length} flight records`);

    // Vraćanje u željenom formatu
    if (format === 'csv') {
      // CSV format kompatibilan sa flight-management sistemom (stari format template)
      const csvHeader = 'airline_code,flight_number,departure_time,arrival_time,destination_code,is_departure,remarks,status\n';
      const csvRows = exportedFlights.map(flight =>
        `${flight.airline_code},${flight.flight_number},${flight.departure_time},${flight.arrival_time},${flight.destination_code},${flight.is_departure},${flight.remarks},${flight.status}`
      ).join('\n');

      const csvContent = csvHeader + csvRows;

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="schedule-export-${year}-${month.toString().padStart(2, '0')}.csv"`,
        },
      });
    } else {
      // JSON format
      return NextResponse.json({
        success: true,
        data: {
          year,
          month,
          totalFlights: exportedFlights.length,
          flights: exportedFlights,
        },
        message: `Eksportovano ${exportedFlights.length} letova za ${month}/${year}`,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Greška u validaciji parametara',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('Greška pri eksportu rasporeda:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri eksportu rasporeda',
      },
      { status: 500 }
    );
  }
}
