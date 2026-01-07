#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixRemaining() {
  console.log('\n🔧 Fixing remaining wrong dates...\n');

  // Get flights with wrong dates
  const wrongDateFlights = await prisma.flight.findMany({
    where: {
      date: {
        lt: new Date('2025-01-01T00:00:00Z'),
      },
    },
    select: {
      id: true,
      date: true,
      route: true,
    },
  });

  console.log(`Found ${wrongDateFlights.length} flights with wrong dates:\n`);
  wrongDateFlights.forEach(f => {
    console.log(`  ${f.date.toISOString().split('T')[0]} - ${f.route}`);
  });

  // Fix 2024-01-03 -> 2025-01-03
  const fix1 = await prisma.flight.updateMany({
    where: {
      date: {
        gte: new Date('2024-01-03T00:00:00Z'),
        lt: new Date('2024-01-04T00:00:00Z'),
      },
    },
    data: {
      date: new Date('2025-01-03T00:00:00Z'),
    },
  });

  console.log(`\n✅ Fixed 2024-01-03 -> 2025-01-03: ${fix1.count} flights`);

  // Fix 2024-01-04 -> 2025-01-04
  const fix2 = await prisma.flight.updateMany({
    where: {
      date: {
        gte: new Date('2024-01-04T00:00:00Z'),
        lt: new Date('2024-01-05T00:00:00Z'),
      },
    },
    data: {
      date: new Date('2025-01-04T00:00:00Z'),
    },
  });

  console.log(`✅ Fixed 2024-01-04 -> 2025-01-04: ${fix2.count} flights`);

  // Verify
  const jan2025Count = await prisma.flight.count({
    where: {
      date: {
        gte: new Date('2025-01-01T00:00:00Z'),
        lt: new Date('2025-02-01T00:00:00Z'),
      },
    },
  });

  const jan2025Passengers = await prisma.$queryRaw<Array<{
    total: bigint | null;
  }>>`
    SELECT
      SUM("arrivalPassengers") + SUM("departurePassengers") as total
    FROM "Flight"
    WHERE date >= '2025-01-01' AND date < '2025-02-01'
  `;

  console.log(`\n✅ Total flights in January 2025: ${jan2025Count}`);
  console.log(`✅ Total passengers in January 2025: ${Number(jan2025Passengers[0].total || 0)}`);

  await prisma.$disconnect();
}

fixRemaining().catch(console.error);
