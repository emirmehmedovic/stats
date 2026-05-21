import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseScheduleChangesFile, ExpandedFlight } from '@/lib/parsers/schedule-changes';
import { getClientIp, rateLimit } from '@/lib/rate-limit';
import { FlightStatus } from '@prisma/client';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ImportStats {
  created: number;
  updated: number;
  cancelled: number;
  skipped: number;
}

interface PreviewData {
  success: boolean;
  preview: boolean;
  data: Array<ExpandedFlight & { action: 'CREATE' | 'UPDATE' | 'CANCEL' | 'SKIP' }>;
  stats: {
    totalRules: number;
    totalFlights: number;
    toCreate: number;
    toUpdate: number;
    toCancel: number;
  };
  errors: string[];
  warnings: string[];
}

interface ImportResult {
  success: boolean;
  totalFlights: number;
  created: number;
  updated: number;
  cancelled: number;
  skipped: number;
  errors: Array<{
    flight: string;
    date: string;
    errors: string[];
  }>;
  message: string;
}

/**
 * Find existing flight by matching strategy:
 * - Same date (departure date)
 * - Same route (TZL-XXX-TZL format or TZL-XXX or XXX-TZL)
 * - Same departure or arrival flight number
 * - NOT a manual entry (dataSource != 'MANUAL')
 */
async function findExistingFlight(flight: ExpandedFlight) {
  // Build OR conditions for route matching
  // route can be: TZL-BER-TZL, TZL-BER, or BER-TZL
  const routeConditions = [{ route: flight.route }];

  // Also match if old format exists (before pairing was implemented)
  if (flight.route.includes('-TZL')) {
    // Round trip format: TZL-BER-TZL
    // Also match: TZL-BER or BER-TZL
    const destination = flight.route.split('-')[1];
    routeConditions.push({ route: `TZL-${destination}` });
    routeConditions.push({ route: `${destination}-TZL` });
  }

  return await prisma.flight.findFirst({
    where: {
      date: flight.date,
      OR: routeConditions,
      AND: [
        {
          OR: [
            { arrivalFlightNumber: flight.arrivalFlightNumber },
            { departureFlightNumber: flight.departureFlightNumber },
          ],
        },
      ],
      dataSource: { not: 'MANUAL' },
    },
  });
}

/**
 * Find or create airline by ICAO/IATA code
 */
async function findOrCreateAirline(carrier: string) {
  // Try to find existing
  let airline = await prisma.airline.findFirst({
    where: {
      OR: [
        { icaoCode: { equals: carrier, mode: 'insensitive' } },
        { iataCode: { equals: carrier, mode: 'insensitive' } },
      ],
    },
  });

  // Create if not found
  if (!airline) {
    airline = await prisma.airline.create({
      data: {
        name: carrier,
        icaoCode: carrier.length > 2 ? carrier : `${carrier}X`, // Ensure 3+ chars for ICAO
        iataCode: carrier.length === 2 ? carrier : null,
        country: null,
      },
    });
  }

  return airline;
}

/**
 * Find or create aircraft type
 */
async function findOrCreateAircraftType(model: string, seats: number) {
  let aircraftType = await prisma.aircraftType.findFirst({
    where: {
      model: { equals: model, mode: 'insensitive' },
    },
  });

  if (!aircraftType) {
    aircraftType = await prisma.aircraftType.create({
      data: {
        model: model,
        seats: seats || 180, // Use provided seats or default
        mtow: 70000, // Default
      },
    });
  }

  return aircraftType;
}

/**
 * Build flight data for Prisma create/update
 */
async function buildFlightData(flight: ExpandedFlight, fileName: string) {
  const airline = await findOrCreateAirline(flight.carrier);
  const aircraftType = await findOrCreateAircraftType(
    flight.aircraftType,
    flight.availableSeats
  );

  // Find SCHEDULED operation type
  const operationType = await prisma.operationType.findFirst({
    where: { code: 'SCHEDULED' },
  });

  if (!operationType) {
    throw new Error('SCHEDULED operation type not found in database');
  }

  const isCancelled = flight.status === 'CANCELLED';

  return {
    date: flight.date,
    airline: { connect: { id: airline.id } },
    aircraftType: { connect: { id: aircraftType.id } },
    operationType: { connect: { id: operationType.id } },
    registration: 'TBA', // To Be Assigned - will be filled later
    route: flight.route,
    availableSeats: flight.availableSeats || null,

    // Arrival data (if round trip or arrival only)
    arrivalFlightNumber: flight.arrivalFlightNumber,
    arrivalScheduledTime: flight.arrivalScheduledTime,
    arrivalStatus: flight.arrivalFlightNumber
      ? (isCancelled ? FlightStatus.CANCELLED : FlightStatus.SCHEDULED)
      : FlightStatus.SCHEDULED,
    arrivalCancelReason: isCancelled && flight.arrivalFlightNumber
      ? `Schedule change: ${flight.changeType}`
      : null,

    // Departure data (if round trip or departure only)
    departureFlightNumber: flight.departureFlightNumber,
    departureScheduledTime: flight.departureScheduledTime,
    departureStatus: flight.departureFlightNumber
      ? (isCancelled ? FlightStatus.CANCELLED : FlightStatus.SCHEDULED)
      : FlightStatus.SCHEDULED,
    departureCancelReason: isCancelled && flight.departureFlightNumber
      ? `Schedule change: ${flight.changeType}`
      : null,

    // Metadata
    dataSource: 'IMPORT_SCHEDULE_CHANGES',
    importedFile: `${fileName} (${flight.season})`,
  };
}

/**
 * UPSERT a single flight (update if exists, create if not)
 */
async function upsertFlight(
  flight: ExpandedFlight,
  fileName: string,
  stats: ImportStats
): Promise<{ success: boolean; error?: string }> {
  try {
    const existing = await findExistingFlight(flight);
    const flightData = await buildFlightData(flight, fileName);

    if (existing) {
      // UPDATE existing flight
      await prisma.flight.update({
        where: { id: existing.id },
        data: flightData,
      });

      if (flight.status === 'CANCELLED') {
        stats.cancelled++;
      } else {
        stats.updated++;
      }
    } else {
      // CREATE new flight
      await prisma.flight.create({
        data: flightData,
      });

      stats.created++;
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * POST /api/flights/import-schedule-changes
 *
 * Import Schedule Changes TZL format
 * - Parses email text format with flight rules
 * - Expands rules into concrete flights
 * - UPSERTs flights (updates existing, creates new)
 * - Handles cancellations
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = rateLimit(`import:schedule-changes:${ip}`, {
      windowMs: 60_000,
      max: 5,
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

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const dryRun = formData.get('dryRun') === 'true';

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fajl je obavezan',
        },
        { status: 400 }
      );
    }

    // Check file type (.txt)
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.txt')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nepodržan tip fajla. Molimo uploadujte .txt fajl',
        },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fajl je prevelik. Maksimalna veličina je 10MB',
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    console.log(`Parsing Schedule Changes file: ${file.name}`);
    const parseResult = await parseScheduleChangesFile(buffer);

    console.log('Parse result:', {
      success: parseResult.success,
      totalRules: parseResult.totalRules,
      totalFlights: parseResult.totalFlights,
      errors: parseResult.errors,
      warnings: parseResult.warnings,
    });

    if (!parseResult.success) {
      console.error('Parse failed:', parseResult.errors);
      return NextResponse.json(
        {
          success: false,
          error: 'Greška pri parsiranju fajla',
          details: parseResult.errors,
          warnings: parseResult.warnings,
        },
        { status: 400 }
      );
    }

    // ---------- DRY RUN (Preview) ----------
    if (dryRun) {
      const previewStats = {
        toCreate: 0,
        toUpdate: 0,
        toCancel: 0,
      };

      // Check first 10 flights to determine action
      const preview = await Promise.all(
        parseResult.expandedFlights.slice(0, 10).map(async (flight) => {
          const existing = await findExistingFlight(flight);
          let action: 'CREATE' | 'UPDATE' | 'CANCEL' | 'SKIP' = 'CREATE';

          if (existing) {
            if (flight.status === 'CANCELLED') {
              action = 'CANCEL';
            } else {
              action = 'UPDATE';
            }
          } else if (flight.status === 'CANCELLED') {
            // New flight that's already cancelled - still create it
            action = 'CREATE';
          }

          return { ...flight, action };
        })
      );

      // Calculate stats for ALL flights (not just preview)
      for (const flight of parseResult.expandedFlights) {
        const existing = await findExistingFlight(flight);

        if (existing) {
          if (flight.status === 'CANCELLED') {
            previewStats.toCancel++;
          } else {
            previewStats.toUpdate++;
          }
        } else {
          previewStats.toCreate++;
        }
      }

      const previewData: PreviewData = {
        success: true,
        preview: true,
        data: preview,
        stats: {
          totalRules: parseResult.totalRules,
          totalFlights: parseResult.totalFlights,
          toCreate: previewStats.toCreate,
          toUpdate: previewStats.toUpdate,
          toCancel: previewStats.toCancel,
        },
        errors: parseResult.errors,
        warnings: parseResult.warnings,
      };

      return NextResponse.json(previewData);
    }

    // ---------- ACTUAL IMPORT ----------
    const stats: ImportStats = {
      created: 0,
      updated: 0,
      cancelled: 0,
      skipped: 0,
    };

    const errors: Array<{ flight: string; date: string; errors: string[] }> = [];
    const totalFlights = parseResult.expandedFlights.length;

    // Process all flights with progress logging
    for (let i = 0; i < parseResult.expandedFlights.length; i++) {
      const flight = parseResult.expandedFlights[i];
      const result = await upsertFlight(flight, file.name, stats);

      if (!result.success) {
        stats.skipped++;
        errors.push({
          flight: flight.flightNumber,
          date: flight.date.toISOString().split('T')[0],
          errors: [result.error || 'Unknown error'],
        });
      }

      // Log progress every 10 flights
      if ((i + 1) % 10 === 0 || i === totalFlights - 1) {
        const processed = i + 1;
        const percentage = Math.round((processed / totalFlights) * 100);
        console.log(`Import progress: ${processed}/${totalFlights} (${percentage}%)`);
      }
    }

    const totalProcessed = stats.created + stats.updated + stats.cancelled + stats.skipped;
    const importResult: ImportResult = {
      success: totalProcessed > stats.skipped,
      totalFlights: parseResult.totalFlights,
      created: stats.created,
      updated: stats.updated,
      cancelled: stats.cancelled,
      skipped: stats.skipped,
      errors: errors,
      message: buildImportMessage(stats, parseResult.totalFlights),
    };

    return NextResponse.json(importResult);
  } catch (error) {
    console.error('Schedule changes import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri importu Schedule Changes',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function buildImportMessage(stats: ImportStats, total: number): string {
  const parts: string[] = [];

  if (stats.created > 0) {
    parts.push(`${stats.created} kreirano`);
  }
  if (stats.updated > 0) {
    parts.push(`${stats.updated} ažurirano`);
  }
  if (stats.cancelled > 0) {
    parts.push(`${stats.cancelled} otkazano`);
  }
  if (stats.skipped > 0) {
    parts.push(`${stats.skipped} preskočeno`);
  }

  const message = `Import završen: ${parts.join(', ')} od ukupno ${total} letova`;
  return message;
}
