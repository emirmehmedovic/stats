#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning up Wizzair airlines...\n');

  // Define the 3 main Wizzair companies with correct ICAO/IATA codes
  const mainAirlines = [
    {
      name: 'Wizz Air Hungary',
      icaoCode: 'WZZ',
      iataCode: 'W6',
      country: 'Hungary',
      variants: [
        'WIZZ AIR HUNGARY LTD.',
        'WIZZAIR HUNGARY LTD',
        'WIZZAIR HUNGARY LTD/WIZZAIR MALTA LTD',
        'WIZZAIR MALTA LTD/WIZZAIR HUNGARY LTD' // Mixed, assign to Hungary
      ]
    },
    {
      name: 'Wizz Air Malta',
      icaoCode: 'WMT',
      iataCode: 'W4',
      country: 'Malta',
      variants: [
        'WIZZ AIR MALTA LTD.',
        'WIZZAIR MALTA',
        'WIZZAIR MALTA LTD',
        'WIZZAIR MALTA LTD.'
      ]
    },
    {
      name: 'Wizz Air UK',
      icaoCode: 'WUK',
      iataCode: 'W9',
      country: 'United Kingdom',
      variants: [
        'WIZZAIR UK LTD'
      ]
    }
  ];

  for (const airline of mainAirlines) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`📋 Processing: ${airline.name}`);
    console.log(`   ICAO: ${airline.icaoCode} | IATA: ${airline.iataCode}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    // Step 1: Create or update the main airline
    const mainAirline = await prisma.airline.upsert({
      where: { icaoCode: airline.icaoCode },
      update: {
        name: airline.name,
        iataCode: airline.iataCode,
        country: airline.country
      },
      create: {
        name: airline.name,
        icaoCode: airline.icaoCode,
        iataCode: airline.iataCode,
        country: airline.country
      }
    });

    console.log(`✓ Main airline ready: ${mainAirline.name} (ID: ${mainAirline.id})`);

    // Step 2: Find all variant airlines and their flights
    let totalFlightsMigrated = 0;
    const variantsToDelete: string[] = [];

    for (const variantName of airline.variants) {
      const variant = await prisma.airline.findFirst({
        where: { name: variantName }
      });

      if (!variant) {
        console.log(`  ⚠️  Variant not found: ${variantName}`);
        continue;
      }

      // Count flights for this variant
      const flightCount = await prisma.flight.count({
        where: { airlineId: variant.id }
      });

      console.log(`\n  📦 ${variantName}`);
      console.log(`     ICAO: ${variant.icaoCode} | Flights: ${flightCount}`);

      if (flightCount > 0) {
        // Migrate flights to main airline
        const updated = await prisma.flight.updateMany({
          where: { airlineId: variant.id },
          data: { airlineId: mainAirline.id }
        });

        console.log(`     ✓ Migrated ${updated.count} flights → ${airline.name}`);
        totalFlightsMigrated += updated.count;
      }

      variantsToDelete.push(variant.id);
    }

    // Step 3: Delete old variants
    console.log(`\n  🗑️  Deleting ${variantsToDelete.length} variant(s)...`);

    for (const variantId of variantsToDelete) {
      await prisma.airline.delete({
        where: { id: variantId }
      });
    }

    console.log(`  ✓ Deleted ${variantsToDelete.length} old variants`);
    console.log(`\n  📊 Total flights now in ${airline.name}: ${totalFlightsMigrated}`);
  }

  // Final summary
  console.log('\n');
  console.log('═'.repeat(80));
  console.log('✅ CLEANUP COMPLETED');
  console.log('═'.repeat(80));

  const wizzairAirlines = await prisma.airline.findMany({
    where: {
      OR: [
        { icaoCode: 'WZZ' },
        { icaoCode: 'WMT' },
        { icaoCode: 'WUK' }
      ]
    },
    include: {
      _count: {
        select: { flights: true }
      }
    }
  });

  console.log('\n📋 Final Wizzair Airlines:\n');
  for (const airline of wizzairAirlines) {
    console.log(`   ${airline.name}`);
    console.log(`   ├─ ICAO: ${airline.icaoCode} | IATA: ${airline.iataCode || 'N/A'}`);
    console.log(`   ├─ Country: ${airline.country}`);
    console.log(`   └─ Flights: ${airline._count.flights}`);
    console.log('');
  }

  const totalFlights = wizzairAirlines.reduce((sum, a) => sum + a._count.flights, 0);
  console.log(`   Total Wizzair flights: ${totalFlights}`);
  console.log('');

  await prisma.$disconnect();
}

main().catch(console.error);
