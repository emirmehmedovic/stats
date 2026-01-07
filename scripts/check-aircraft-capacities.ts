#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const total = await prisma.aircraftType.count();
  const withSeats = await prisma.aircraftType.count({
    where: { seats: { gt: 0 } },
  });
  const withoutSeats = total - withSeats;

  console.log('📊 Kapaciteti aviona u bazi:\n');
  console.log(`  Ukupno tipova aviona: ${total}`);
  console.log(`  Sa kapacitetom: ${withSeats}`);
  console.log(`  Bez kapaciteta: ${withoutSeats}\n`);

  // Nađi tipove bez kapaciteta
  const missing = await prisma.aircraftType.findMany({
    where: {
      seats: { lte: 0 },
    },
    select: { model: true },
  });

  if (missing.length > 0) {
    console.log('Avioni bez kapaciteta:');
    missing.forEach((a) => console.log(`  - ${a.model}`));
  }

  await prisma.$disconnect();
}

main();
