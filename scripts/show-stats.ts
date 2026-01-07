#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const years = await prisma.$queryRaw<Array<{year: number, count: number}>>`
    SELECT EXTRACT(YEAR FROM date)::INTEGER as year, COUNT(*)::INTEGER as count
    FROM "Flight"
    GROUP BY EXTRACT(YEAR FROM date)
    ORDER BY year DESC
  `;

  const totalFlights = await prisma.flight.count();

  console.log('');
  console.log('='.repeat(80));
  console.log('📊 FINAL DATABASE STATISTICS');
  console.log('='.repeat(80));
  console.log('');
  console.log('Total flights imported:', totalFlights);
  console.log('');
  console.log('By year:');
  for (const y of years) {
    console.log(`  ${y.year}: ${y.count} flights`);
  }

  const airlines = await prisma.airline.count();
  const aircraftTypes = await prisma.aircraftType.count();
  const airports = await prisma.airport.count();

  console.log('');
  console.log('Master data:');
  console.log('  Airlines:', airlines);
  console.log('  Aircraft types:', aircraftTypes);
  console.log('  Airports:', airports);
  console.log('');

  await prisma.$disconnect();
}

main();
