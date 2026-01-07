#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

// Helper to convert date string to UTC without timezone offset
function dateOnlyToUtc(dateStr: string): Date {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

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
  'N/A': 'SCHEDULED',
  '-': 'SCHEDULED',
  'NA': 'SCHEDULED',
};

interface FlightData {
  date: string;
  airline: string;
  route: string;
  departureAirport: string;
  arrivalAirport: string;
  aircraftModel: string;
  registration: string;
  operationType: string;
  availableSeats?: number | null;
  mtow?: number | null;
  arrivalFlightNumber?: string | null;
  departureFlightNumber?: string | null;
  scheduledArrivalTime?: string | null;
  actualArrivalTime?: string | null;
  scheduledDepartureTime?: string | null;
  actualDepartureTime?: string | null;
  arrivalPassengers?: number | null;
  arrivalInfants?: number | null;
  departurePassengers?: number | null;
  departureInfants?: number | null;
  arrivalBaggage?: number | null;
  departureBaggage?: number | null;
  arrivalCargo?: number | null;
  departureCargo?: number | null;
  arrivalMail?: number | null;
  departureMail?: number | null;
  sourceFile: string;
  sheet: string;
}

interface ExtractedData {
  flights: FlightData[];
  totalCount: number;
  extractedAt: string;
}

// Cache for airports, airlines, aircraft types, operation types
const airportCache = new Map<string, string>();
const airlineCache = new Map<string, string>();
const aircraftTypeCache = new Map<string, string>();
const operationTypeCache = new Map<string, string>();

// Get or create airport
async function getOrCreateAirport(iataCode: string): Promise<string> {
  if (airportCache.has(iataCode)) {
    return airportCache.get(iataCode)!;
  }

  let airport = await prisma.airport.findUnique({
    where: { iataCode },
  });

  if (!airport) {
    airport = await prisma.airport.create({
      data: {
        iataCode,
        name: iataCode,
        country: 'Unknown',
      },
    });
    console.log(`   🆕 Created airport: ${iataCode}`);
  }

  airportCache.set(iataCode, airport.id);
  return airport.id;
}

// Get airline ID
async function getAirlineId(airlineName: string): Promise<string | null> {
  if (airlineCache.has(airlineName)) {
    return airlineCache.get(airlineName)!;
  }

  const airline = await prisma.airline.findFirst({
    where: { name: airlineName },
  });

  if (airline) {
    airlineCache.set(airlineName, airline.id);
    return airline.id;
  }

  return null;
}

// Get aircraft type ID
async function getAircraftTypeId(model: string): Promise<string | null> {
  if (aircraftTypeCache.has(model)) {
    return aircraftTypeCache.get(model)!;
  }

  const aircraftType = await prisma.aircraftType.findFirst({
    where: { model },
  });

  if (aircraftType) {
    aircraftTypeCache.set(model, aircraftType.id);
    return aircraftType.id;
  }

  return null;
}

// Get operation type ID
async function getOperationTypeId(code: string): Promise<string | null> {
  if (operationTypeCache.has(code)) {
    return operationTypeCache.get(code)!;
  }

  const operationType = await prisma.operationType.findUnique({
    where: { code },
  });

  if (operationType) {
    operationTypeCache.set(code, operationType.id);
    return operationType.id;
  }

  return null;
}

// Map operation type from Excel to database
function mapOperationType(excelType: string): string {
  const normalized = excelType.trim().toUpperCase();
  return OPERATION_TYPE_MAP[normalized] || 'SCHEDULED';
}

async function importFlights(year: string, dryRun: boolean = false) {
  console.log(`🚀 Starting Flight Import for ${year}...`);
  console.log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE IMPORT'}\n`);

  // Read JSON file
  const jsonPath = path.join(process.cwd(), 'output', `${year}-flights-data.json`);

  if (!fs.existsSync(jsonPath)) {
    console.error(`❌ File not found: ${jsonPath}`);
    console.log(`\n💡 Run extraction first: python3 scripts/extract-flights.py ${year}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const data: ExtractedData = JSON.parse(rawData);

  console.log(`📊 Data source:`);
  console.log(`   - Total flights: ${data.totalCount}`);
  console.log(`   - Extracted at: ${data.extractedAt}\n`);

  let importedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  console.log('🔄 Processing flights...\n');

  for (let i = 0; i < data.flights.length; i++) {
    const flight = data.flights[i];

    try {
      const airlineId = await getAirlineId(flight.airline);
      if (!airlineId) {
        errors.push(`Flight ${i + 1}: Airline not found: ${flight.airline}`);
        skippedCount++;
        continue;
      }

      const aircraftTypeId = await getAircraftTypeId(flight.aircraftModel);
      if (!aircraftTypeId) {
        errors.push(`Flight ${i + 1}: Aircraft type not found: ${flight.aircraftModel}`);
        skippedCount++;
        continue;
      }

      const operationTypeCode = mapOperationType(flight.operationType);
      const operationTypeId = await getOperationTypeId(operationTypeCode);
      if (!operationTypeId) {
        errors.push(`Flight ${i + 1}: Operation type not found: ${operationTypeCode}`);
        skippedCount++;
        continue;
      }

      const departureAirportId = await getOrCreateAirport(flight.departureAirport);
      const arrivalAirportId = await getOrCreateAirport(flight.arrivalAirport);

      if (!dryRun) {
        await prisma.flight.create({
          data: {
            date: dateOnlyToUtc(flight.date),
            airlineId,
            route: flight.route,
            registration: flight.registration,
            aircraftTypeId,
            operationTypeId,
            departureAirportId,
            arrivalAirportId,

            availableSeats: flight.availableSeats || null,

            arrivalFlightNumber: flight.arrivalFlightNumber || null,
            departureFlightNumber: flight.departureFlightNumber || null,

            arrivalScheduledTime: flight.scheduledArrivalTime && flight.scheduledArrivalTime.trim() !== '-'
              ? (() => {
                  const d = new Date(`${flight.date.split('T')[0]}T${flight.scheduledArrivalTime}`);
                  return isNaN(d.getTime()) ? null : d;
                })()
              : null,
            arrivalActualTime: flight.actualArrivalTime && flight.actualArrivalTime.trim() !== '-'
              ? (() => {
                  const d = new Date(`${flight.date.split('T')[0]}T${flight.actualArrivalTime}`);
                  return isNaN(d.getTime()) ? null : d;
                })()
              : null,
            departureScheduledTime: flight.scheduledDepartureTime && flight.scheduledDepartureTime.trim() !== '-'
              ? (() => {
                  const d = new Date(`${flight.date.split('T')[0]}T${flight.scheduledDepartureTime}`);
                  return isNaN(d.getTime()) ? null : d;
                })()
              : null,
            departureActualTime: flight.actualDepartureTime && flight.actualDepartureTime.trim() !== '-'
              ? (() => {
                  const d = new Date(`${flight.date.split('T')[0]}T${flight.actualDepartureTime}`);
                  return isNaN(d.getTime()) ? null : d;
                })()
              : null,

            arrivalPassengers: flight.arrivalPassengers || null,
            arrivalInfants: flight.arrivalInfants || null,
            departurePassengers: flight.departurePassengers || null,
            departureInfants: flight.departureInfants || null,

            arrivalBaggage: flight.arrivalBaggage || null,
            departureBaggage: flight.departureBaggage || null,
            arrivalCargo: flight.arrivalCargo || null,
            departureCargo: flight.departureCargo || null,
            arrivalMail: flight.arrivalMail || null,
            departureMail: flight.departureMail || null,

            dataSource: `EXCEL_IMPORT_${year}`,
            importedFile: flight.sourceFile,
            isVerified: false,
          },
        });
      }

      importedCount++;

      if (importedCount % 50 === 0) {
        console.log(`   ✓ Processed ${importedCount} flights...`);
      }

    } catch (error: any) {
      errors.push(`Flight ${i + 1}: ${error.message}`);
      skippedCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`✅ IMPORT COMPLETED ${dryRun ? '(DRY RUN)' : ''}`);
  console.log('='.repeat(80));
  console.log('\n📋 Summary:');
  console.log(`   - Imported: ${importedCount}`);
  console.log(`   - Skipped: ${skippedCount}`);
  console.log(`   - Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log('\n⚠️  Errors (showing first 10):');
    errors.slice(0, 10).forEach(err => console.log(`   - ${err}`));

    if (errors.length > 10) {
      console.log(`   ... and ${errors.length - 10} more errors`);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log('Usage: npx tsx scripts/import-year.ts <year> [--dry-run]');
    console.log('');
    console.log('Examples:');
    console.log('  npx tsx scripts/import-year.ts 2024');
    console.log('  npx tsx scripts/import-year.ts 2023 --dry-run');
    process.exit(0);
  }

  const year = args[0];
  const dryRun = args.includes('--dry-run');

  try {
    await importFlights(year, dryRun);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
