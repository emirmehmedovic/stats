import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseScheduleExcelFile } from '@/lib/parsers/schedule-excel';
import { parseScheduleCSVFile } from '@/lib/parsers/schedule-csv';
import { getClientIp, rateLimit } from '@/lib/rate-limit';

export const config = {
  api: {
    bodyParser: false,
  },
};

interface ImportResult {
  success: boolean;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errors: Array<{
    row: number;
    errors: string[];
  }>;
  message: string;
}

/**
 * POST /api/flights/import-schedule - Import SCHEDULE ONLY (minimal data)
 *
 * This endpoint imports only the flight schedule:
 * - Date, airline, route (required)
 * - Aircraft type, registration (optional)
 * - Flight numbers and scheduled times (optional)
 *
 * Does NOT import:
 * - Actual times
 * - Passengers, infants
 * - Baggage, cargo, mail
 *
 * These can be filled in later via Daily Operations page.
 */
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rate = rateLimit(`import:schedule:${ip}`, { windowMs: 60_000, max: 5 });
    if (!rate.ok) {
      return NextResponse.json(
        { success: false, error: 'Previše zahtjeva. Pokušajte ponovo kasnije.' },
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
          error: 'File is required',
        },
        { status: 400 }
      );
    }

    // Check file type
    const fileName = file.name.toLowerCase();
    const isExcel = fileName.endsWith('.xlsx') || fileName.endsWith('.xls');
    const isCSV = fileName.endsWith('.csv');

    if (!isExcel && !isCSV) {
      return NextResponse.json(
        {
          success: false,
          error: 'Nepodržan tip fajla. Molimo uploadujte .xlsx, .xls ili .csv fajl',
        },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse file based on type
    console.log(`Parsing schedule ${isExcel ? 'Excel' : 'CSV'} file: ${file.name}`);
    const parseResult = isExcel
      ? await parseScheduleExcelFile(buffer)
      : await parseScheduleCSVFile(buffer);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Greška pri parsiranju fajla',
          details: parseResult.errors,
        },
        { status: 400 }
      );
    }

    // If dry run, just return preview
    if (dryRun) {
      return NextResponse.json({
        success: true,
        preview: true,
        data: parseResult.data.slice(0, 10), // First 10 rows
        stats: {
          totalRows: parseResult.totalRows,
          validRows: parseResult.validRows,
          invalidRows: parseResult.invalidRows,
        },
        errors: parseResult.errors,
      });
    }

    // Import valid rows
    const result: ImportResult = {
      success: false,
      totalRows: parseResult.totalRows,
      importedRows: 0,
      skippedRows: 0,
      errors: [],
      message: '',
    };

    // Process each valid row
    for (const row of parseResult.data) {
      if (row.errors.length > 0) {
        result.skippedRows++;
        result.errors.push({
          row: row.row,
          errors: row.errors,
        });
        continue;
      }

      try {
        // Find or create airline
        let airline = await prisma.airline.findFirst({
          where: {
            OR: [
              { name: { equals: row.data.airline || '', mode: 'insensitive' } },
              { icaoCode: { equals: row.data.icaoCode || '', mode: 'insensitive' } },
              { iataCode: { equals: row.data.icaoCode || '', mode: 'insensitive' } },
            ],
          },
        });

        if (!airline && row.data.airline) {
          // Create new airline
          const code = row.data.icaoCode || row.data.airline.substring(0, 3).toUpperCase();
          const isIataFormat = code.length <= 3;

          airline = await prisma.airline.create({
            data: {
              name: row.data.airline,
              icaoCode: isIataFormat ? code : code,
              iataCode: isIataFormat ? code : null,
              country: null,
            },
          });
        }

        if (!airline) {
          result.errors.push({
            row: row.row,
            errors: ['Aviokompanija nije pronađena'],
          });
          result.skippedRows++;
          continue;
        }

        // Find or create aircraft type (optional)
        let aircraftType = null;
        if (row.data.aircraftType) {
          aircraftType = await prisma.aircraftType.findFirst({
            where: {
              model: { equals: row.data.aircraftType, mode: 'insensitive' },
            },
          });

          if (!aircraftType) {
            // Create new aircraft type
            aircraftType = await prisma.aircraftType.create({
              data: {
                model: row.data.aircraftType,
                seats: 180, // Default
                mtow: 70000, // Default
              },
            });
          }
        }

        // If no aircraft type provided, use or create UNKNOWN
        if (!aircraftType) {
          aircraftType = await prisma.aircraftType.findFirst({
            where: { model: { equals: 'UNKNOWN', mode: 'insensitive' } },
          });

          if (!aircraftType) {
            aircraftType = await prisma.aircraftType.create({
              data: {
                model: 'UNKNOWN',
                seats: 180,
                mtow: 70000,
              },
            });
          }
        }

        // Find operation type
        const operationTypeCode = row.data.operationTypeCode || 'SCHEDULED';
        const operationType = await prisma.operationType.findUnique({
          where: { code: operationTypeCode },
        });

        if (!operationType) {
          result.errors.push({
            row: row.row,
            errors: [`Tip operacije "${operationTypeCode}" nije pronađen`],
          });
          result.skippedRows++;
          continue;
        }

        // Create flight with SCHEDULE data only
        await prisma.flight.create({
          data: {
            date: row.data.date!,
            airline: { connect: { id: airline.id } },
            aircraftType: { connect: { id: aircraftType.id } },
            operationType: { connect: { id: operationType.id } },
            registration: row.data.registration || 'N/A', // Default value for schedule import
            route: row.data.route!,

            // Scheduled times only
            arrivalFlightNumber: row.data.arrivalFlightNumber,
            arrivalScheduledTime: row.data.arrivalScheduledTime,
            departureFlightNumber: row.data.departureFlightNumber,
            departureScheduledTime: row.data.departureScheduledTime,

            // All other fields remain NULL (to be filled in Daily Operations)
            arrivalActualTime: null,
            arrivalPassengers: null,
            arrivalInfants: null,
            arrivalBaggage: null,
            arrivalCargo: null,
            arrivalMail: null,
            departureActualTime: null,
            departurePassengers: null,
            departureInfants: null,
            departureBaggage: null,
            departureCargo: null,
            departureMail: null,
            availableSeats: null,

            dataSource: 'IMPORT_SCHEDULE',
            importedFile: file.name,
          },
        });

        result.importedRows++;
      } catch (error) {
        console.error(`Error importing row ${row.row}:`, error);
        result.errors.push({
          row: row.row,
          errors: [
            error instanceof Error ? error.message : 'Unknown error during import',
          ],
        });
        result.skippedRows++;
      }
    }

    result.success = result.importedRows > 0;
    result.message = `Uspješno importovano ${result.importedRows} od ${result.totalRows} letova (samo raspored)`;

    if (result.skippedRows > 0) {
      result.message += `. ${result.skippedRows} redova preskočeno zbog grešaka.`;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Schedule import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri importu rasporeda',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
