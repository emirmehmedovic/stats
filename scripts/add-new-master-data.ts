#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Adding new master data from extracted-master-data.json\n');

  // Load extracted data
  const extractedData = JSON.parse(
    fs.readFileSync('output/extracted-master-data.json', 'utf-8')
  );

  const extractedAirlines = extractedData.airlines as string[];
  const extractedAircraftTypes = extractedData.aircraftTypes as string[];

  console.log(`📊 Extracted: ${extractedAirlines.length} airlines, ${extractedAircraftTypes.length} aircraft types\n`);

  // Get existing data from database
  const existingAirlines = await prisma.airline.findMany({
    select: { name: true },
  });
  const existingAirlineNames = new Set(existingAirlines.map((a) => a.name));

  const existingAircraftTypes = await prisma.aircraftType.findMany({
    select: { model: true },
  });
  const existingAircraftModels = new Set(existingAircraftTypes.map((a) => a.model));

  // Find new airlines (filter out invalid ones like sheet names)
  const invalidAirlines = /^\d+\s+(DECEMBAR|OKTOBAR|NOVEMBAR|JANUAR|FEBRUAR|MART|APRIL|MAJ|JUNI|JULI|AUGUST|SEPTEMBAR)/i;
  const newAirlines = extractedAirlines.filter(
    (name) => !existingAirlineNames.has(name) && !invalidAirlines.test(name)
  );
  const newAircraftTypes = extractedAircraftTypes.filter((model) => !existingAircraftModels.has(model));

  console.log(`✨ New airlines to add: ${newAirlines.length}`);
  console.log(`✨ New aircraft types to add: ${newAircraftTypes.length}\n`);

  if (newAirlines.length > 0) {
    console.log('Adding new airlines:');

    // Get current max ICAO placeholder number
    const existingPlaceholders = await prisma.airline.findMany({
      where: {
        icaoCode: {
          startsWith: 'UNK',
        },
      },
      select: { icaoCode: true },
    });

    let maxNum = 0;
    for (const a of existingPlaceholders) {
      const match = a.icaoCode.match(/^UNK(\d+)$/);
      if (match) {
        maxNum = Math.max(maxNum, parseInt(match[1]));
      }
    }

    let counter = maxNum + 1;

    for (const name of newAirlines) {
      const icaoCode = `UNK${String(counter).padStart(3, '0')}`;
      await prisma.airline.create({
        data: {
          name,
          icaoCode,
        },
      });
      console.log(`  ✓ ${name} (${icaoCode})`);
      counter++;
    }
  }

  if (newAircraftTypes.length > 0) {
    console.log('\nAdding new aircraft types:');
    for (const model of newAircraftTypes) {
      await prisma.aircraftType.create({
        data: {
          model,
          seats: 0, // Placeholder
          mtow: 0, // Placeholder
        },
      });
      console.log(`  ✓ ${model}`);
    }
  }

  console.log('\n✅ Master data updated!');

  const finalStats = await Promise.all([
    prisma.airline.count(),
    prisma.aircraftType.count(),
  ]);

  console.log(`\nFinal counts:`);
  console.log(`  Airlines: ${finalStats[0]}`);
  console.log(`  Aircraft types: ${finalStats[1]}`);

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
