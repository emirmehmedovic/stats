import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { renderToStream } from '@react-pdf/renderer';
import { MonthlySchedulePDF } from '@/components/reports/MonthlySchedulePDF';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

interface DaySchedule {
  date: Date;
  dayName: string;
  flights: any[];
}

// Get day name in Bosnian
function getDayName(date: Date): string {
  const days = [
    'Nedjelja',
    'Ponedjeljak',
    'Utorak',
    'Srijeda',
    'Četvrtak',
    'Petak',
    'Subota',
  ];
  return days[date.getDay()];
}

// Get all days in month
function getDaysInMonth(month: number, year: number): Date[] {
  const days: Date[] = [];
  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    days.push(new Date(year, month - 1, day));
  }

  return days;
}

/**
 * GET /api/reports/monthly-schedule?month=6&year=2026
 *
 * Generate monthly schedule PDF
 * - Grouped by day
 * - Landscape orientation
 * - One table per day
 */
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = rateLimit(`reports:monthly-schedule:${ip}`, {
      windowMs: 60_000,
      max: 10,
    });

    if (!rate.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Previše zahtjeva. Pokušajte ponovo kasnije.',
        },
        { status: 429 }
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const monthParam = searchParams.get('month');
    const yearParam = searchParams.get('year');

    if (!monthParam || !yearParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Mjesec i godina su obavezni parametri',
        },
        { status: 400 }
      );
    }

    const month = parseInt(monthParam, 10);
    const year = parseInt(yearParam, 10);

    // Validate month and year
    if (
      isNaN(month) ||
      isNaN(year) ||
      month < 1 ||
      month > 12 ||
      year < 2000 ||
      year > 2100
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nevažeći mjesec ili godina',
        },
        { status: 400 }
      );
    }

    console.log(`Generating monthly schedule PDF: ${month}/${year}`);

    // Get start and end of month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    console.log(`Date range: ${startDate.toISOString()} - ${endDate.toISOString()}`);

    // Fetch all flights for the month
    const flights = await prisma.flight.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
        // Only include non-cancelled flights or show all?
        // For now, include all flights but they'll be marked as cancelled in PDF
      },
      include: {
        airline: {
          select: {
            id: true,
            name: true,
            icaoCode: true,
            iataCode: true,
            logoUrl: true,
          },
        },
      },
      orderBy: [
        { date: 'asc' },
        { departureScheduledTime: 'asc' },
      ],
    });

    console.log(`Found ${flights.length} flights for ${month}/${year}`);

    // Convert airline logos to base64 for PDF compatibility
    const logoCache = new Map<string, string>();

    for (const flight of flights) {
      if (flight.airline.logoUrl && !logoCache.has(flight.airline.id)) {
        try {
          const logoPath = flight.airline.logoUrl;

          // Handle local file paths
          if (logoPath.startsWith('/')) {
            // Local file - read from public directory
            const publicPath = path.join(process.cwd(), 'public', logoPath);

            if (fs.existsSync(publicPath)) {
              const buffer = fs.readFileSync(publicPath);
              const base64 = buffer.toString('base64');

              // Determine content type from file extension
              const ext = path.extname(logoPath).toLowerCase();
              const contentType =
                ext === '.png'
                  ? 'image/png'
                  : ext === '.jpg' || ext === '.jpeg'
                  ? 'image/jpeg'
                  : ext === '.svg'
                  ? 'image/svg+xml'
                  : 'image/png';

              const dataUrl = `data:${contentType};base64,${base64}`;
              logoCache.set(flight.airline.id, dataUrl);
            } else {
              console.warn(`Logo file not found: ${publicPath}`);
            }
          } else if (logoPath.startsWith('http')) {
            // External URL - fetch it
            const response = await fetch(logoPath, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; TZL-Stats/1.0)',
              },
            });

            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const base64 = buffer.toString('base64');
              const contentType = response.headers.get('content-type') || 'image/png';
              const dataUrl = `data:${contentType};base64,${base64}`;
              logoCache.set(flight.airline.id, dataUrl);
            }
          }
        } catch (error) {
          console.error(`Failed to load logo for ${flight.airline.name}:`, error);
        }
      }
    }

    // Replace logoUrl with base64 data URLs
    const flightsWithLogos = flights.map(flight => ({
      ...flight,
      airline: {
        ...flight.airline,
        logoUrl: logoCache.get(flight.airline.id) || flight.airline.logoUrl,
      },
    }));

    console.log(`Converted ${logoCache.size} airline logos to base64`);

    // Group flights by day
    const days = getDaysInMonth(month, year);
    const schedule: DaySchedule[] = days.map((date) => {
      const dayFlights = flightsWithLogos.filter((flight) => {
        const flightDate = new Date(flight.date);
        return (
          flightDate.getDate() === date.getDate() &&
          flightDate.getMonth() === date.getMonth() &&
          flightDate.getFullYear() === date.getFullYear()
        );
      });

      return {
        date,
        dayName: getDayName(date),
        flights: dayFlights,
      };
    });

    console.log(`Grouped into ${schedule.length} days`);

    // Generate PDF
    const pdfDocument = MonthlySchedulePDF({
      month,
      year,
      schedule,
    }) as any;

    const stream = await renderToStream(pdfDocument);

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    console.log(`PDF generated successfully (${buffer.length} bytes)`);

    // Set response headers
    const monthNames = [
      'januar',
      'februar',
      'mart',
      'april',
      'maj',
      'juni',
      'juli',
      'august',
      'septembar',
      'oktobar',
      'novembar',
      'decembar',
    ];
    const fileName = `raspored-${monthNames[month - 1]}-${year}.pdf`;

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Monthly schedule PDF generation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri generiranju PDF-a',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
