#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const STATS_DIR = '/Users/emir_mw/stats/STATS/2025/Dnevni izvještaji';

// Map Excel operation types to database codes
const OPERATION_TYPE_MAP: Record<string, string> = {
  'SCHEDULED': 'SCHEDULED',
  'DIVERTED': 'DIVERTED',
  'MEDEVAC': 'MEDEVAC',
  'HELICOPTER': 'GENERAL_AVIATION',
  'GA': 'GENERAL_AVIATION',
  'NONSCHEDULED': 'CHARTER',
  'NON-SCHEDULED': 'CHARTER',
  'UNSCHEDULED': 'CHARTER',
  'CHARTER': 'CHARTER',
  'CARGO': 'CARGO',
  'MILITARY': 'MILITARY',
};

interface PassengerData {
  adults: number;
  infants: number;
  total: number;
}

// Parse passenger string like "165+6 INF" or "110" or "-"
function parsePassengers(value: any): PassengerData | null {
  if (!value || value === '-' || value === 'N/A') {
    return null;
  }

  const str = String(value).trim();

  // Pattern: "110+6 INF" or "110+6"
  const withInfantsMatch = str.match(/^(\d+)\s*\+\s*(\d+)/);
  if (withInfantsMatch) {
    const adults = parseInt(withInfantsMatch[1], 10);
    const infants = parseInt(withInfantsMatch[2], 10);
    return { adults, infants, total: adults + infants };
  }

  // Pattern: just a number "110"
  const numberMatch = str.match(/^(\d+)$/);
  if (numberMatch) {
    const adults = parseInt(numberMatch[1], 10);
    return { adults, infants: 0, total: adults };
  }

  return null;
}

// Parse route like "TZL-AYT" and return [departure, arrival]
function parseRoute(route: string): { departure: string; arrival: string } | null {
  if (!route || route === '-' || route === 'N/A') {
    return null;
  }

  const parts = route.split('-').map(p => p.trim()).filter(p => p.length > 0);

  if (parts.length >= 2) {
    return {
      departure: parts[0],
      arrival: parts[parts.length - 1],
    };
  }

  return null;
}

// Get or create airport
async function getOrCreateAirport(iataCode: string): Promise<string> {
  const existing = await prisma.airport.findUnique({
    where: { iataCode },
  });

  if (existing) {
    return existing.id;
  }

  // Create new airport with minimal data
  const airport = await prisma.airport.create({
    data: {
      iataCode,
      name: iataCode, // Placeholder - update later
      country: 'Unknown', // Placeholder - update later
    },
  });

  return airport.id;
}

// Map operation type
function mapOperationType(excelType: string | null): string {
  if (!excelType) {
    return 'SCHEDULED'; // Default
  }

  const normalized = excelType.trim().toUpperCase();
  return OPERATION_TYPE_MAP[normalized] || 'SCHEDULED';
}

// Import one month
async function importMonth(monthFolder: string, dryRun: boolean = false) {
  const monthPath = path.join(STATS_DIR, monthFolder);

  // Find Excel file
  const files = fs.readdirSync(monthPath)
    .filter(f => f.includes('Dnevni izvještaj o saobraćaju') && f.endsWith('.xlsx'));

  if (files.length === 0) {
    console.log(`   ⚠️  No Excel file found in ${monthFolder}`);
    return { success: false, count: 0 };
  }

  const filePath = path.join(monthPath, files[0]);

  try {
    console.log(`\n📊 ${monthFolder}:`);
    console.log(`   File: ${files[0]}`);

    const workbook = XLSX.readFile(filePath);
    let flightCount = 0;
    let errorCount = 0;

    // Iterate through all sheets (days)
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Skip header (row 0)
      for (let i = 1; i < data.length; i++) {
        const row = data[i];

        // Skip empty rows
        if (!row[0]) continue;

        try {
          // Extract data from row
          // [0] datum, [1] kompanija, [2] ruta, [3] tip a/c, [4] reg, [5] tip OPER
          const dateValue = row[0];
          const airlineName = row[1];
          const routeStr = row[2];
          const aircraftModel = row[3];
          const registration = row[4];
          const operationTypeStr = row[5];
          // TODO: Find where passenger data is in Excel
          const passengersStr = row[6];

          // Parse date (could be various formats - need to handle this)
          const flightDate = new Date(dateValue);
          if (isNaN(flightDate.getTime())) {
            console.log(`   ⚠️  Invalid date: ${dateValue}`);
            errorCount++;
            continue;
          }

          // Find airline
          const airline = await prisma.airline.findFirst({
            where: { name: String(airlineName).trim().toUpperCase() },
          });

          if (!airline) {
            console.log(`   ⚠️  Airline not found: ${airlineName}`);
            errorCount++;
            continue;
          }

          // Parse route
          const route = parseRoute(String(routeStr));
          if (!route) {
            console.log(`   ⚠️  Invalid route: ${routeStr}`);
            errorCount++;
            continue;
          }

          // Get or create airports
          const departureAirportId = await getOrCreateAirport(route.departure);
          const arrivalAirportId = await getOrCreateAirport(route.arrival);

          // Find aircraft type
          const aircraftType = await prisma.aircraftType.findFirst({
            where: { model: String(aircraftModel).trim() },
          });

          if (!aircraftType) {
            console.log(`   ⚠️  Aircraft type not found: ${aircraftModel}`);
            errorCount++;
            continue;
          }

          // Get operation type
          const operationTypeCode = mapOperationType(operationTypeStr);
          const operationType = await prisma.operationType.findUnique({
            where: { code: operationTypeCode },
          });

          if (!operationType) {
            console.log(`   ⚠️  Operation type not found: ${operationTypeCode}`);
            errorCount++;
            continue;
          }

          // Parse passengers
          const passengers = parsePassengers(passengersStr);

          if (!dryRun) {
            // Create flight record
            await prisma.flight.create({
              data: {
                date: flightDate,
                airlineId: airline.id,
                route: routeStr,
                registration: String(registration || ''),
                aircraftTypeId: aircraftType.id,
                operationTypeId: operationType.id,
                departureAirportId,
                arrivalAirportId,

                // Passenger data (we'll use arrival passengers as the main count)
                arrivalPassengers: passengers?.adults || null,
                arrivalInfants: passengers?.infants || null,

                // Metadata
                dataSource: 'EXCEL_IMPORT_2025',
                importedFile: files[0],
                isVerified: false,
              },
            });
          }

          flightCount++;

        } catch (error: any) {
          console.log(`   ❌ Error importing row ${i}: ${error.message}`);
          errorCount++;
        }
      }
    }

    const status = dryRun ? '(DRY RUN)' : '';
    console.log(`   ✅ Imported ${flightCount} flights ${status}`);
    if (errorCount > 0) {
      console.log(`   ⚠️  ${errorCount} errors`);
    }

    return { success: true, count: flightCount, errors: errorCount };

  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    return { success: false, count: 0, errors: 1 };
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const monthArg = args.find(arg => !arg.startsWith('--'));

  console.log('🚀 Starting 2025 Flight Import...');
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE IMPORT'}\n`);

  try {
    if (monthArg) {
      // Import specific month
      console.log(`📅 Importing single month: ${monthArg}`);
      await importMonth(monthArg, dryRun);
    } else {
      // Import all months
      const monthFolders = fs.readdirSync(STATS_DIR)
        .filter(f => fs.statSync(path.join(STATS_DIR, f)).isDirectory())
        .sort();

      console.log(`📅 Found ${monthFolders.length} months\n`);

      let totalFlights = 0;
      let totalErrors = 0;

      for (const monthFolder of monthFolders) {
        const result = await importMonth(monthFolder, dryRun);
        totalFlights += result.count;
        totalErrors += result.errors || 0;
      }

      console.log('\n' + '='.repeat(80));
      console.log('✅ IMPORT COMPLETED');
      console.log('='.repeat(80));
      console.log(`\n📋 Summary:`);
      console.log(`   - Total flights: ${totalFlights}`);
      console.log(`   - Total errors: ${totalErrors}`);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
