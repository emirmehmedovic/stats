#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Deleting all flights...\n');

  // Delete FlightDelay first (foreign key constraint)
  const delays = await prisma.flightDelay.deleteMany({});
  console.log(`  ✅ Deleted ${delays.count} flight delays`);

  // Delete flights
  const flights = await prisma.flight.deleteMany({});
  console.log(`  ✅ Deleted ${flights.count} flights`);

  console.log('\n✅ Database cleaned!\n');

  await prisma.$disconnect();
}

main();
