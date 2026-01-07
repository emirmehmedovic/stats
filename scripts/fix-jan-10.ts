#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
  // Fix 2024-01-10 -> 2025-01-10
  const result = await prisma.flight.updateMany({
    where: {
      date: {
        gte: new Date('2024-01-10T00:00:00Z'),
        lt: new Date('2024-01-11T00:00:00Z'),
      },
    },
    data: {
      date: new Date('2025-01-10T00:00:00Z'),
    },
  });

  console.log(`✅ Fixed 2024-01-10 -> 2025-01-10: ${result.count} flights`);

  // Final check
  const total = await prisma.flight.count();
  const jan2025 = await prisma.flight.count({
    where: {
      date: {
        gte: new Date('2025-01-01T00:00:00Z'),
        lt: new Date('2025-02-01T00:00:00Z'),
      },
    },
  });

  const passengers = await prisma.$queryRaw<Array<{ total: bigint | null }>>`
    SELECT SUM("arrivalPassengers") + SUM("departurePassengers") as total
    FROM "Flight"
    WHERE date >= '2025-01-01' AND date < '2025-02-01'
  `;

  console.log(`\n✅ Total flights: ${total}`);
  console.log(`✅ January 2025: ${jan2025} flights`);
  console.log(`✅ January 2025 passengers: ${Number(passengers[0].total || 0)}\n`);

  await prisma.$disconnect();
}

fix().catch(console.error);
