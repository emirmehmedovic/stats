#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('✈️  Adding missing airlines...\n');

  const airlines = [
    {
      name: 'WIZZAIR MALTA',
      icaoCode: 'WMT',
      iataCode: 'W4',
      country: 'Malta',
    },
    {
      name: 'FAI REANT A JET',
      icaoCode: 'FAI',
      iataCode: null,
      country: 'Germany',
    },
    {
      name: 'AK FENIX ŽIVINICE',
      icaoCode: 'FNX',  // Dummy code
      iataCode: null,
      country: 'Bosnia and Herzegovina',
    },
  ];

  for (const airline of airlines) {
    try {
      // Check if airline already exists
      const existing = await prisma.airline.findFirst({
        where: { name: airline.name },
      });

      if (!existing) {
        await prisma.airline.create({
          data: airline,
        });
        console.log(`  ✅ Created: ${airline.name}`);
      } else {
        console.log(`  ⏭️  Already exists: ${airline.name}`);
      }
    } catch (error: any) {
      console.error(`  ❌ ${airline.name}: ${error.message}`);
    }
  }

  console.log('\n✅ Airlines added!\n');
  await prisma.$disconnect();
}

main();
