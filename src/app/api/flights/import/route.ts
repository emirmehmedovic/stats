import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseExcelFile } from '@/lib/parsers/excel';
import { parseCSVFile } from '@/lib/parsers/csv';
import { promises as fs } from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false, // Disable body parsing, we'll handle it ourselves
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

// POST /api/flights/import - Import flights from Excel or CSV
export async function POST(request: NextRequest) {
  try {
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

    // Parse file
    console.log(`Parsing ${isExcel ? 'Excel' : 'CSV'} file: ${file.name}`);

    const parseResult = isExcel
      ? await parseExcelFile(buffer)
      : await parseCSVFile(buffer);

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
      // Only skip if there are critical errors (missing required fields)
      const criticalErrors = row.errors.filter((error: string) => 
        error.includes('Datum je obavezan') || 
        error.includes('Ruta je obavezna') ||
        error.includes('Aviokompanija')
      );
      
      if (criticalErrors.length > 0) {
        result.skippedRows++;
        result.errors.push({
          row: row.row,
          errors: row.errors,
        });
        continue;
      }
      
      // Warn but don't skip for non-critical errors
      if (row.errors.length > 0) {
        console.warn(`Row ${row.row} has warnings:`, row.errors);
      }

      try {
        // Find or create airline
        let airline = await prisma.airline.findFirst({
          where: {
            OR: [
              { name: { equals: row.data.airline || '', mode: 'insensitive' } },
              { icaoCode: { equals: row.data.icaoCode || '', mode: 'insensitive' } },
              { iataCode: { equals: row.data.icaoCode || '', mode: 'insensitive' } }, // Also search by IATA code
            ],
          },
        });

        if (!airline && row.data.airline) {
          // Create new airline if not found
          // If icaoCode looks like IATA (2-3 chars), use it as both IATA and ICAO
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

        // Find or create aircraft type (required field, so create default if missing)
        let aircraftType = null;
        if (row.data.aircraftType) {
          aircraftType = await prisma.aircraftType.findFirst({
            where: {
              model: { equals: row.data.aircraftType, mode: 'insensitive' },
            },
          });

          if (!aircraftType) {
            // Create new aircraft type if model is provided
            aircraftType = await prisma.aircraftType.create({
              data: {
                model: row.data.aircraftType,
                seats: row.data.availableSeats || 180,
                mtow: row.data.mtow || 70000,
              },
            });
          }
        }

        // If no aircraft type, create or use default "UNKNOWN" type
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

        // Find operation type by code
        const operationTypeCode = row.data.operationTypeCode || 'SCHEDULED';
        const operationType = await prisma.operationType.findUnique({
          where: { code: operationTypeCode },
        });

        if (!operationType) {
          result.errors.push({
            row: row.row,
            errors: [`Tip operacije sa kodom "${operationTypeCode}" nije pronađen`],
          });
          result.skippedRows++;
          continue;
        }

        // Create flight
        await prisma.flight.create({
          data: {
            date: row.data.date!,
            airline: { connect: { id: airline.id } },
            aircraftType: { connect: { id: aircraftType.id } },
            operationType: { connect: { id: operationType.id } },
            registration: row.data.registration || 'N/A', // Default if not provided
            route: row.data.route || 'N/A',
            availableSeats: row.data.availableSeats,
            arrivalFlightNumber: row.data.arrivalFlightNumber,
            arrivalScheduledTime: row.data.arrivalScheduledTime,
            arrivalActualTime: row.data.arrivalActualTime,
            arrivalPassengers: row.data.arrivalPassengers,
            arrivalInfants: row.data.arrivalInfants,
            arrivalBaggage: row.data.arrivalBaggage,
            arrivalCargo: row.data.arrivalCargo,
            arrivalMail: row.data.arrivalMail,
            departureFlightNumber: row.data.departureFlightNumber,
            departureScheduledTime: row.data.departureScheduledTime,
            departureActualTime: row.data.departureActualTime,
            departurePassengers: row.data.departurePassengers,
            departureInfants: row.data.departureInfants,
            departureBaggage: row.data.departureBaggage,
            departureCargo: row.data.departureCargo,
            departureMail: row.data.departureMail,
            dataSource: 'IMPORT_' + (isExcel ? 'EXCEL' : 'CSV'),
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
    result.message = `Uspješno importovano ${result.importedRows} od ${result.totalRows} letova`;

    if (result.skippedRows > 0) {
      result.message += `. ${result.skippedRows} redova preskočeno zbog grešaka.`;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri importu fajla',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
