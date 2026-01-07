#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Comprehensive Airline Cleanup\n');
  console.log('═'.repeat(80));

  // Define all airline merges with correct ICAO/IATA codes
  const merges = [
    {
      name: 'AJet',
      icaoCode: 'TKJ',
      iataCode: 'VF',
      country: 'Turkey',
      variants: ['AJET', 'ANADOLU JET', 'ANADOLUJET']
    },
    {
      name: 'Pegasus Airlines',
      icaoCode: 'PGT',
      iataCode: 'PC',
      country: 'Turkey',
      variants: ['PEGASUS AIRLINES', 'PEGASUS']
    },
    {
      name: 'Corendon Airlines',
      icaoCode: 'CAI',
      iataCode: 'XC',
      country: 'Turkey',
      variants: ['CORENDON AIRLINES', 'CORENDON']
    },
    {
      name: 'Turkish Airlines',
      icaoCode: 'THY',
      iataCode: 'TK',
      country: 'Turkey',
      variants: ['TURKISH']
    },
    {
      name: 'Ryanair',
      icaoCode: 'RYR',
      iataCode: 'FR',
      country: 'Ireland',
      variants: ['RYANAIR']
    },
    {
      name: 'Aero-Dienst',
      icaoCode: 'ADI',
      iataCode: null,
      country: 'Germany',
      variants: ['AERO-DIENST', 'AERO-DIENST GMBH']
    },
    {
      name: 'Aviator Group',
      icaoCode: 'AVG',
      iataCode: null,
      country: 'Serbia',
      variants: ['AVIATOR GROUP D.O.O. STARA PAZOVA', 'AVIATOR GROUP DOO']
    },
    {
      name: 'Delic Air',
      icaoCode: 'DLC',
      iataCode: null,
      country: 'Bosnia and Herzegovina',
      variants: ['DELIC AIR', 'DELIC AIR DOO']
    },
    {
      name: 'GlobeAir',
      icaoCode: 'GAC',
      iataCode: null,
      country: 'Austria',
      variants: ['GLOBEAIR', 'GLOBEAIR AG']
    },
    {
      name: 'Luxembourg Air Ambulance',
      icaoCode: 'LXA',
      iataCode: null,
      country: 'Luxembourg',
      variants: ['LUXEMBOURG AIR AMBULANCE', 'LUXEMBOURG AIR AMBULANCES']
    },
    {
      name: 'MGGP Aero',
      icaoCode: 'MGG',
      iataCode: null,
      country: 'Poland',
      variants: ['MGGP AERO SP Z.O.O.', 'MGGP AERO SP. Z O.O.', 'MGGP AERO SP.Z.OO']
    },
    {
      name: 'Novelico',
      icaoCode: 'NOV',
      iataCode: null,
      country: 'United Kingdom',
      variants: ['NOVELICO', 'NOVELICO LTD', 'NOVELICO LTD.']
    },
    {
      name: 'Oyonnair',
      icaoCode: 'OYN',
      iataCode: null,
      country: 'France',
      variants: ['OYONNAIR', 'OYONNAIR SAS']
    },
    {
      name: 'Red Star Aviation',
      icaoCode: 'RSA',
      iataCode: null,
      country: 'Serbia',
      variants: ['RED STAR AVATION', 'RED STAR AVIATION']
    },
    {
      name: 'SMATSA',
      icaoCode: 'SMA',
      iataCode: null,
      country: 'Serbia',
      variants: ['SMATSA', 'SMATSA LLC', 'SMATSA LTD']
    },
    {
      name: 'SOS Air Ambulance',
      icaoCode: 'SOS',
      iataCode: null,
      country: 'Italy',
      variants: ['SOS AIR', 'SOS AIR AMBULANCE']
    },
    {
      name: 'Swiss Air Ambulance',
      icaoCode: 'SAZ',
      iataCode: null,
      country: 'Switzerland',
      variants: ['SWISS AIR AMBULANCE', 'SWISS AIR AMBULANCE - REGA', 'SWISS AIR AMBULANCE LTD', 'SWISS AIR AMBULANCE REGA']
    },
    {
      name: 'TAG Aviation San Marino',
      icaoCode: 'SMR',
      iataCode: null,
      country: 'San Marino',
      variants: ['TAG AVIATION SAN MARINO S.R.L', 'TAG AVIATION SAN MARINO SRL']
    },
    {
      name: 'Airport Mali Lošinj',
      icaoCode: 'MLJ',
      iataCode: null,
      country: 'Croatia',
      variants: ['AIRPORT MALI LOSINJ LTD', 'AIRPORT MALI LOŠINJ', 'AIRPORT MALI LOŠINJ LTD', 'AIRPORT MALI LOŠNJIN']
    },
    {
      name: 'Aero Klub Fenix',
      icaoCode: 'AKF',
      iataCode: null,
      country: 'Bosnia and Herzegovina',
      variants: ['AERO KLUB FENIX', 'AERO KLUB FENIX ŽIVINICE']
    }
  ];

  let totalMerged = 0;
  let totalFlightsMigrated = 0;

  for (const merge of merges) {
    console.log(`\n📋 ${merge.name}`);
    console.log('─'.repeat(80));

    // Create or update main airline
    const mainAirline = await prisma.airline.upsert({
      where: { icaoCode: merge.icaoCode },
      update: {
        name: merge.name,
        iataCode: merge.iataCode,
        country: merge.country
      },
      create: {
        name: merge.name,
        icaoCode: merge.icaoCode,
        iataCode: merge.iataCode,
        country: merge.country
      }
    });

    console.log(`✓ Main: ${mainAirline.name} (${merge.icaoCode}${merge.iataCode ? `/${merge.iataCode}` : ''})`);

    let mergedCount = 0;
    let flightsMigrated = 0;

    // Find and merge variants
    for (const variantName of merge.variants) {
      const variants = await prisma.airline.findMany({
        where: {
          name: variantName,
          id: { not: mainAirline.id }
        }
      });

      for (const variant of variants) {
        const flightCount = await prisma.flight.count({
          where: { airlineId: variant.id }
        });

        if (flightCount > 0) {
          await prisma.flight.updateMany({
            where: { airlineId: variant.id },
            data: { airlineId: mainAirline.id }
          });
          flightsMigrated += flightCount;
        }

        await prisma.airline.delete({
          where: { id: variant.id }
        });

        mergedCount++;
        console.log(`  ✓ Merged: ${variantName} (${flightCount} flights)`);
      }
    }

    if (mergedCount > 0) {
      console.log(`  → Total: ${flightsMigrated} flights migrated`);
      totalMerged += mergedCount;
      totalFlightsMigrated += flightsMigrated;
    } else {
      console.log(`  (no variants to merge)`);
    }
  }

  console.log('\n');
  console.log('═'.repeat(80));
  console.log('✅ CLEANUP COMPLETED');
  console.log('═'.repeat(80));
  console.log(`\n📊 Summary:`);
  console.log(`   - Airlines merged: ${totalMerged}`);
  console.log(`   - Flights migrated: ${totalFlightsMigrated}`);

  // Show final count
  const totalAirlines = await prisma.airline.count();
  const airlinesWithFlights = await prisma.airline.count({
    where: {
      flights: {
        some: {}
      }
    }
  });

  console.log(`\n   - Total airlines: ${totalAirlines}`);
  console.log(`   - Airlines with flights: ${airlinesWithFlights}`);
  console.log('');

  await prisma.$disconnect();
}

main().catch(console.error);
