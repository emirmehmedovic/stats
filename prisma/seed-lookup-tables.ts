#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ExtractedData {
  airlines: Array<{ name: string; count: number }>;
  aircraftTypes: Array<{ model: string; count: number }>;
  operationTypes: Array<{ type: string; count: number }>;
  totalFlights: number;
}

async function seedLookupTables() {
  console.log('🌱 Starting seed for lookup tables...\n');

  try {
    // Read extracted data
    const dataPath = path.join(process.cwd(), 'output', '2025-extracted-data.json');
    const rawData = fs.readFileSync(dataPath, 'utf-8');
    const data: ExtractedData = JSON.parse(rawData);

    console.log('📊 Data source:');
    console.log(`   - ${data.airlines.length} airlines`);
    console.log(`   - ${data.aircraftTypes.length} aircraft types`);
    console.log(`   - From ${data.totalFlights} flights\n`);

    // ===============================
    // SEED AIRLINES
    // ===============================
    console.log('✈️  Seeding Airlines...');

    // Helper function to generate temporary ICAO code from airline name
    const generateIcaoCode = (name: string, index: number): string => {
      // Take first 3 letters of name, uppercase, remove spaces
      const prefix = name.replace(/[^A-Z]/g, '').substring(0, 3).padEnd(3, 'X');
      // Add a number to ensure uniqueness
      return `${prefix}${index.toString().padStart(3, '0')}`;
    };

    let airlineCount = 0;
    for (const airline of data.airlines) {
      const icaoCode = generateIcaoCode(airline.name, airlineCount + 1);

      await prisma.airline.create({
        data: {
          name: airline.name,
          icaoCode: icaoCode, // Temporary code - update manually later
          iataCode: null,
          country: null,
        },
      });
      airlineCount++;

      // Show progress for top 10
      if (airlineCount <= 10) {
        console.log(`   ${airlineCount.toString().padStart(2)}. ${airline.name} (ICAO: ${icaoCode}, ${airline.count} flights)`);
      }
    }
    console.log(`   ✅ Seeded ${airlineCount} airlines\n`);

    // ===============================
    // SEED AIRCRAFT TYPES
    // ===============================
    console.log('🛩️  Seeding Aircraft Types...');

    let aircraftCount = 0;
    for (const aircraft of data.aircraftTypes) {
      await prisma.aircraftType.create({
        data: {
          model: aircraft.model,
          seats: 0, // Placeholder - update manually later
          mtow: 0,  // Placeholder - update manually later
        },
      });
      aircraftCount++;
      console.log(`   ${aircraftCount.toString().padStart(2)}. ${aircraft.model} (${aircraft.count} flights)`);
    }
    console.log(`   ✅ Seeded ${aircraftCount} aircraft types\n`);

    // ===============================
    // SUMMARY
    // ===============================
    console.log('=' .repeat(80));
    console.log('✅ SEED COMPLETED');
    console.log('=' .repeat(80));
    console.log('\n📋 Summary:');
    console.log(`   - Airlines: ${airlineCount}`);
    console.log(`   - Aircraft Types: ${aircraftCount}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Review seeded data in Prisma Studio');
    console.log('   2. Update airline ICAO codes (currently using temporary codes)');
    console.log('   3. Add IATA codes and country for airlines');
    console.log('   4. Update aircraft seats and MTOW (currently 0)');
    console.log('   5. Proceed with flight data import\n');

    console.log('⚠️  Note:');
    console.log('   - Airline ICAO codes are temporary (e.g., WIZ001, WIZ002)');
    console.log('   - Aircraft seats and MTOW are set to 0 as placeholders');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedLookupTables()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
