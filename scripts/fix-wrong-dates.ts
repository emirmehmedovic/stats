#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixDates() {
  console.log('\n🔧 Fixing wrong dates...\n');

  // Fix 2024-01-04 -> 2025-01-04
  const fix1 = await prisma.flight.updateMany({
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

  console.log(`✅ Fixed 2024-01-04 -> 2025-01-04: ${fix1.count} flights`);

  // Fix 2024-01-11 -> 2025-01-11
  const fix2 = await prisma.flight.updateMany({
    where: {
      date: {
        gte: new Date('2024-01-11T00:00:00Z'),
        lt: new Date('2024-01-12T00:00:00Z'),
      },
    },
    data: {
      date: new Date('2025-01-11T00:00:00Z'),
    },
  });

  console.log(`✅ Fixed 2024-01-11 -> 2025-01-11: ${fix2.count} flights`);

  // Fix 2024-12-31 -> 2025-01-01
  const fix3 = await prisma.flight.updateMany({
    where: {
      date: {
        gte: new Date('2024-12-31T00:00:00Z'),
        lt: new Date('2025-01-01T00:00:00Z'),
      },
    },
    data: {
      date: new Date('2025-01-01T00:00:00Z'),
    },
  });

  console.log(`✅ Fixed 2024-12-31 -> 2025-01-01: ${fix3.count} flights`);

  // Verify
  const jan2025Count = await prisma.flight.count({
    where: {
      date: {
        gte: new Date('2025-01-01T00:00:00Z'),
        lt: new Date('2025-02-01T00:00:00Z'),
      },
    },
  });

  console.log(`\n✅ Total flights in January 2025: ${jan2025Count}`);

  await prisma.$disconnect();
}

fixDates().catch(console.error);
