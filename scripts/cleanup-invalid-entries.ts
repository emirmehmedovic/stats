#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up invalid database entries\n');

  // Invalid airlines (these are summary/header labels, not actual airlines)
  const invalidAirlines = [
    'UKUPNO',
    'REDOVNI PROMET',
    'VANREDNI PROMET',
    'OSTALA SLIJETANJA',
  ];

  // Invalid aircraft types (these are column headers, not aircraft)
  const invalidAircraftTypes = [
    'BROJ LETOVA',
    'ISTOVARENO',
    'PUTNICI',
    'TERET',
    'UKRCANO',
    'UTOVARENO',
  ];

  // Check for flights using invalid airlines
  console.log('📊 Checking for flights with invalid airlines...');
  for (const name of invalidAirlines) {
    const airline = await prisma.airline.findFirst({
      where: { name },
      include: {
        _count: {
          select: { flights: true },
        },
      },
    });

    if (airline) {
      console.log(`  - "${name}": ${airline._count.flights} flights`);

      if (airline._count.flights > 0) {
        console.log(`    ⚠️  WARNING: This airline has flights. Skipping deletion.`);
      } else {
        await prisma.airline.delete({ where: { id: airline.id } });
        console.log(`    ✓ Deleted`);
      }
    }
  }

  // Check for flights using invalid aircraft types
  console.log('\n📊 Checking for flights with invalid aircraft types...');
  for (const name of invalidAircraftTypes) {
    const aircraftType = await prisma.aircraftType.findFirst({
      where: { model: name },
      include: {
        _count: {
          select: { flights: true },
        },
      },
    });

    if (aircraftType) {
      console.log(`  - "${name}": ${aircraftType._count.flights} flights`);

      if (aircraftType._count.flights > 0) {
        console.log(`    ⚠️  WARNING: This aircraft type has flights. Skipping deletion.`);
      } else {
        await prisma.aircraftType.delete({ where: { id: aircraftType.id } });
        console.log(`    ✓ Deleted`);
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📈 Final Database Statistics');
  console.log('='.repeat(80));

  const stats = await Promise.all([
    prisma.flight.count(),
    prisma.airline.count(),
    prisma.aircraftType.count(),
    prisma.airport.count(),
  ]);

  console.log(`\nFlights:        ${stats[0]}`);
  console.log(`Airlines:       ${stats[1]}`);
  console.log(`Aircraft types: ${stats[2]}`);
  console.log(`Airports:       ${stats[3]}`);

  console.log('\n✅ Cleanup complete!');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
