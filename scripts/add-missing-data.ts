#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface ExtractedData {
  airlines: string[];
  aircraftTypes: string[];
  extractedAt: string;
  years: string[];
}

// Common aircraft type capacities (can be overridden)
const AIRCRAFT_CAPACITIES: Record<string, { seats: number; mtow: number }> = {
  'A320': { seats: 180, mtow: 79000 },
  'A321': { seats: 220, mtow: 93000 },
  'A319': { seats: 156, mtow: 75500 },
  'B737': { seats: 189, mtow: 79010 },
  'B738': { seats: 189, mtow: 79010 },
  'B739': { seats: 189, mtow: 79010 },
  'E190': { seats: 114, mtow: 56000 },
  'E195': { seats: 132, mtow: 61500 },
  'ATR72': { seats: 72, mtow: 23000 },
  'CRJ900': { seats: 90, mtow: 38329 },
  'DHC8': { seats: 78, mtow: 29257 },
};

async function askUser(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const autoMode = args.includes('--auto');

  console.log('🔧 Adding Missing Data to Database\n');

  // Read extracted data
  const jsonPath = path.join(process.cwd(), 'output', 'extracted-master-data.json');

  if (!fs.existsSync(jsonPath)) {
    console.error('❌ File not found: output/extracted-master-data.json');
    console.log('\n💡 Run extraction first:');
    console.log('   1. python3 scripts/extract-missing-data.py 2024 2025');
    console.log('   2. npx tsx scripts/compare-with-database.ts');
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const data: ExtractedData = JSON.parse(rawData);

  // Get existing data
  const dbAirlines = await prisma.airline.findMany({ select: { name: true } });
  const dbAirlineNames = new Set(dbAirlines.map(a => a.name.toUpperCase()));

  const dbAircraftTypes = await prisma.aircraftType.findMany({ select: { model: true } });
  const dbAircraftModels = new Set(dbAircraftTypes.map(a => a.model.toUpperCase()));

  // Find missing
  const missingAirlines = data.airlines.filter(
    airline => !dbAirlineNames.has(airline.toUpperCase())
  );

  const missingAircraftTypes = data.aircraftTypes.filter(
    aircraft => !dbAircraftModels.has(aircraft.toUpperCase())
  );

  console.log(`Missing airlines: ${missingAirlines.length}`);
  console.log(`Missing aircraft types: ${missingAircraftTypes.length}\n`);

  if (missingAirlines.length === 0 && missingAircraftTypes.length === 0) {
    console.log('✅ No missing data! All airlines and aircraft types exist in database.');
    await prisma.$disconnect();
    return;
  }

  if (!autoMode) {
    console.log('⚠️  This will add missing data with default/placeholder values.');
    console.log('   You should review and update these values later in Prisma Studio.\n');
    const confirm = await askUser('Continue? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes' && confirm.toLowerCase() !== 'y') {
      console.log('❌ Cancelled');
      await prisma.$disconnect();
      return;
    }
  }

  console.log('\n🚀 Starting...\n');

  let addedAirlines = 0;
  let addedAircraft = 0;

  // Helper function to generate unique ICAO code
  async function generateUniqueIcaoCode(airlineName: string): Promise<string> {
    const letters = airlineName.replace(/[^A-Z]/g, '');

    // Try base code (first 3 letters)
    let baseCode = letters.substring(0, 3).padEnd(3, 'X');

    // Check if base code exists
    const existing = await prisma.airline.findUnique({
      where: { icaoCode: baseCode }
    });

    if (!existing) {
      return baseCode;
    }

    // If exists, try with 4 characters
    if (letters.length >= 4) {
      const code4 = letters.substring(0, 4);
      const existing4 = await prisma.airline.findUnique({
        where: { icaoCode: code4 }
      });
      if (!existing4) {
        return code4;
      }
    }

    // If still exists, append numbers
    for (let i = 2; i <= 99; i++) {
      const numberedCode = baseCode + i;
      const existingNum = await prisma.airline.findUnique({
        where: { icaoCode: numberedCode }
      });
      if (!existingNum) {
        return numberedCode;
      }
    }

    // Last resort: use first 5 letters or generate random
    return letters.substring(0, 5).padEnd(5, 'X');
  }

  // Add missing airlines
  if (missingAirlines.length > 0) {
    console.log('✈️  Adding airlines...');
    for (const airlineName of missingAirlines) {
      try {
        const icaoCode = await generateUniqueIcaoCode(airlineName);

        await prisma.airline.create({
          data: {
            name: airlineName,
            icaoCode: icaoCode,
            country: 'Unknown', // Placeholder
          }
        });

        console.log(`   ✓ ${airlineName} (ICAO: ${icaoCode})`);
        addedAirlines++;
      } catch (error: any) {
        console.log(`   ❌ ${airlineName}: ${error.message}`);
      }
    }
  }

  // Add missing aircraft types
  if (missingAircraftTypes.length > 0) {
    console.log('\n🛩️  Adding aircraft types...');
    for (const model of missingAircraftTypes) {
      try {
        // Check if we have known capacity
        const capacity = AIRCRAFT_CAPACITIES[model.toUpperCase()] || { seats: 0, mtow: 0 };

        await prisma.aircraftType.create({
          data: {
            model: model,
            seats: capacity.seats,
            mtow: capacity.mtow,
          }
        });

        const status = capacity.seats > 0 ? '✓' : '⚠️';
        console.log(`   ${status} ${model} (${capacity.seats} seats, ${capacity.mtow} kg)`);
        addedAircraft++;
      } catch (error: any) {
        console.log(`   ❌ ${model}: ${error.message}`);
      }
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ COMPLETED');
  console.log('='.repeat(80));
  console.log(`\n   Airlines added: ${addedAirlines}`);
  console.log(`   Aircraft types added: ${addedAircraft}\n`);

  if (addedAircraft > 0) {
    console.log('⚠️  Some aircraft types were added with 0 seats/MTOW.');
    console.log('   Please update them in Prisma Studio before importing flights:\n');
    console.log('   npx prisma studio\n');
  }

  console.log('💡 Next steps:');
  console.log('   1. Review added data: npx prisma studio');
  console.log('   2. Update aircraft capacities: scripts/update-aircraft-capacities.ts');
  console.log('   3. Re-run import: ./scripts/import-multi-year.sh 2024');

  await prisma.$disconnect();
}

main().catch(console.error);
