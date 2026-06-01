import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { TIME_ZONE_SARAJEVO } from '@/lib/dates';

// Validation schema za query parametre
const exportScheduleWebQuerySchema = z.object({
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

// Helper funkcija za formatiranje datuma u lokalnoj zoni
function formatDateLocal(date: Date): string {
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: TIME_ZONE_SARAJEVO }));
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper funkcija za formatiranje vremena u lokalnoj zoni
function formatTimeLocal(date: Date): string {
  const localDate = new Date(date.toLocaleString('en-US', { timeZone: TIME_ZONE_SARAJEVO }));
  const hours = String(localDate.getHours()).padStart(2, '0');
  const minutes = String(localDate.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Helper funkcija za dobijanje grada iz route-a
function getCityFromRoute(route: string, isArrival: boolean): string {
  const parts = route.split('-');
  if (parts.length !== 3) return '';

  const [first, middle, last] = parts;

  // Ako počinje sa TZL: TZL-XXX-TZL
  if (first === 'TZL' && last === 'TZL') {
    return middle; // XXX je destinacija
  }

  // Ako je TZL u sredini: XXX-TZL-XXX
  if (middle === 'TZL' && first === last) {
    return first; // XXX je destinacija
  }

  return '';
}

// GET /api/flights/export-schedule-web?year=2026&month=5
// Eksportuje letove za web u formatu:
// Datum,Tip leta,IATA,Destinacija,Vrijeme,Avio kompanija,IATA kod aviokompanije
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryParams = {
      year: searchParams.get('year'),
      month: searchParams.get('month'),
    };

    const validatedQuery = exportScheduleWebQuerySchema.parse(queryParams);
    const { year, month } = validatedQuery;

    // Kalkulacija početka i kraja mjeseca
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);
    endDate.setMilliseconds(-1);

    console.log('Export schedule web params:', { year, month, startDate, endDate });

    // Dohvati letove za dati mjesec
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
          },
        },
        arrivalAirport: {
          select: {
            iataCode: true,
            city: true,
          },
        },
        departureAirport: {
          select: {
            iataCode: true,
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

    // Transformiši letove u web CSV format
    const exportedFlights: any[] = [];

    for (const flight of flights) {
      const airlineCode = flight.airline.iataCode || '';
      const airlineName = flight.airline.name || '';

      // Arrival let
      if (flight.arrivalScheduledTime && flight.arrivalFlightNumber) {
        const arrivalDate = new Date(flight.arrivalScheduledTime);
        const datum = formatDateLocal(arrivalDate);
        const vrijeme = formatTimeLocal(arrivalDate);

        // Dohvati IATA kod i grad destinacije
        const iataCode = getCityFromRoute(flight.route, true);

        // Pokušaj dohvatiti grad iz arrivalAirport objekta ako postoji
        let destinacija = '';
        if (flight.arrivalAirport) {
          destinacija = flight.arrivalAirport.city || iataCode;
        } else {
          destinacija = iataCode;
        }

        exportedFlights.push({
          datum,
          tipLeta: 'Arrival',
          iata: iataCode,
          destinacija,
          vrijeme,
          avioKompanija: airlineName,
          iataKodAviokompanije: airlineCode,
        });
      }

      // Departure let
      if (flight.departureScheduledTime && flight.departureFlightNumber) {
        const departureDate = new Date(flight.departureScheduledTime);
        const datum = formatDateLocal(departureDate);
        const vrijeme = formatTimeLocal(departureDate);

        // Dohvati IATA kod i grad destinacije
        const iataCode = getCityFromRoute(flight.route, false);

        // Pokušaj dohvatiti grad iz departureAirport objekta ako postoji
        let destinacija = '';
        if (flight.departureAirport) {
          destinacija = flight.departureAirport.city || iataCode;
        } else {
          destinacija = iataCode;
        }

        exportedFlights.push({
          datum,
          tipLeta: 'Departure',
          iata: iataCode,
          destinacija,
          vrijeme,
          avioKompanija: airlineName,
          iataKodAviokompanije: airlineCode,
        });
      }
    }

    // Sortiraj po datumu i vremenu
    exportedFlights.sort((a, b) => {
      const dateCompare = a.datum.localeCompare(b.datum);
      if (dateCompare !== 0) return dateCompare;
      return a.vrijeme.localeCompare(b.vrijeme);
    });

    console.log(`Exported ${exportedFlights.length} flight records for web CSV`);

    // CSV format za web
    const csvHeader = 'Datum,Tip leta,IATA,Destinacija,Vrijeme,Avio kompanija,IATA kod aviokompanije\n';
    const csvRows = exportedFlights.map(flight =>
      `${flight.datum},${flight.tipLeta},${flight.iata},${flight.destinacija},${flight.vrijeme},${flight.avioKompanija},${flight.iataKodAviokompanije}`
    ).join('\n');

    const csvContent = csvHeader + csvRows;

    // Generiši naziv fajla
    const monthNames = [
      'januar', 'februar', 'mart', 'april', 'maj', 'juni',
      'juli', 'august', 'septembar', 'oktobar', 'novembar', 'decembar'
    ];
    const monthName = monthNames[month - 1];
    const fileName = `red-letenja-${monthName}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
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

    console.error('Greška pri eksportu web CSV rasporeda:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri eksportu web CSV rasporeda',
      },
      { status: 500 }
    );
  }
}
