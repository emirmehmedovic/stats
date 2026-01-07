#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ExtractedData {
  airlines: string[];
  aircraftTypes: string[];
  extractedAt: string;
  years: string[];
}

async function main() {
  console.log('🔍 Comparing extracted data with database...\n');

  // Read extracted data
  const jsonPath = path.join(process.cwd(), 'output', 'extracted-master-data.json');

  if (!fs.existsSync(jsonPath)) {
    console.error('❌ File not found: output/extracted-master-data.json');
    console.log('\n💡 Run extraction first: python3 scripts/extract-missing-data.py 2024 2025');
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const data: ExtractedData = JSON.parse(rawData);

  console.log(`📊 Extracted data from: ${data.years.join(', ')}`);
  console.log(`   - Airlines: ${data.airlines.length}`);
  console.log(`   - Aircraft types: ${data.aircraftTypes.length}\n`);

  // Get existing airlines from database
  const dbAirlines = await prisma.airline.findMany({
    select: { name: true, icaoCode: true }
  });

  const dbAirlineNames = new Set(dbAirlines.map(a => a.name.toUpperCase()));

  // Get existing aircraft types from database
  const dbAircraftTypes = await prisma.aircraftType.findMany({
    select: { model: true, seats: true, mtow: true }
  });

  const dbAircraftModels = new Set(dbAircraftTypes.map(a => a.model.toUpperCase()));

  // Find missing airlines
  const missingAirlines = data.airlines.filter(
    airline => !dbAirlineNames.has(airline.toUpperCase())
  );

  // Find missing aircraft types
  const missingAircraftTypes = data.aircraftTypes.filter(
    aircraft => !dbAircraftModels.has(aircraft.toUpperCase())
  );

  // Print results
  console.log('=' . repeat(80));
  console.log('✈️  AIRLINES');
  console.log('='.repeat(80));
  console.log(`   In database: ${dbAirlines.length}`);
  console.log(`   In Excel files: ${data.airlines.length}`);
  console.log(`   Missing in DB: ${missingAirlines.length}\n`);

  if (missingAirlines.length > 0) {
    console.log('❌ Missing airlines:');
    missingAirlines.forEach(airline => {
      console.log(`   - ${airline}`);
    });
  } else {
    console.log('✅ All airlines exist in database!');
  }

  console.log('\n' + '='.repeat(80));
  console.log('🛩️  AIRCRAFT TYPES');
  console.log('='.repeat(80));
  console.log(`   In database: ${dbAircraftTypes.length}`);
  console.log(`   In Excel files: ${data.aircraftTypes.length}`);
  console.log(`   Missing in DB: ${missingAircraftTypes.length}\n`);

  if (missingAircraftTypes.length > 0) {
    console.log('❌ Missing aircraft types:');
    missingAircraftTypes.forEach(aircraft => {
      console.log(`   - ${aircraft}`);
    });
  } else {
    console.log('✅ All aircraft types exist in database!');
  }

  // Generate SQL for missing data
  if (missingAirlines.length > 0 || missingAircraftTypes.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('💾 GENERATING INSERT SCRIPTS');
    console.log('='.repeat(80));

    const sqlStatements: string[] = [];

    // Generate airline inserts
    if (missingAirlines.length > 0) {
      console.log('\n📝 Airlines SQL:');
      missingAirlines.forEach(airline => {
        const icaoCode = airline.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X');
        const sql = `INSERT INTO "Airline" (id, name, "icaoCode") VALUES (gen_random_uuid(), '${airline.replace(/'/g, "''")}', '${icaoCode}');`;
        sqlStatements.push(sql);
        console.log(`   ${sql}`);
      });
    }

    // Generate aircraft type inserts
    if (missingAircraftTypes.length > 0) {
      console.log('\n📝 Aircraft Types SQL:');
      missingAircraftTypes.forEach(aircraft => {
        const sql = `INSERT INTO "AircraftType" (id, model, seats, mtow) VALUES (gen_random_uuid(), '${aircraft.replace(/'/g, "''")}', 0, 0);`;
        sqlStatements.push(sql);
        console.log(`   ${sql}`);
      });
    }

    // Save SQL to file
    const sqlFile = path.join(process.cwd(), 'output', 'missing-data-inserts.sql');
    fs.writeFileSync(sqlFile, sqlStatements.join('\n\n') + '\n', 'utf-8');
    console.log(`\n💾 SQL saved to: ${sqlFile}`);

    // Generate CSV for manual review
    if (missingAirlines.length > 0) {
      const airlinesCsv = 'name,icaoCode,iataCode,country\n' +
        missingAirlines.map(a => `"${a}","???","",""` ).join('\n');
      const csvFile = path.join(process.cwd(), 'output', 'missing-airlines.csv');
      fs.writeFileSync(csvFile, airlinesCsv, 'utf-8');
      console.log(`📄 Airlines CSV: ${csvFile}`);
    }

    if (missingAircraftTypes.length > 0) {
      const aircraftCsv = 'model,seats,mtow\n' +
        missingAircraftTypes.map(a => `"${a}",0,0`).join('\n');
      const csvFile = path.join(process.cwd(), 'output', 'missing-aircraft-types.csv');
      fs.writeFileSync(csvFile, aircraftCsv, 'utf-8');
      console.log(`📄 Aircraft CSV: ${csvFile}`);
    }

    console.log('\n💡 Next steps:');
    console.log('   1. Review CSV files and fill in correct data (ICAO codes, seats, MTOW)');
    console.log('   2. Run SQL file: psql $DATABASE_URL -f output/missing-data-inserts.sql');
    console.log('   3. Or add manually via: npx prisma studio');
    console.log('   4. Re-run import: ./scripts/import-multi-year.sh 2024');
  }

  await prisma.$disconnect();
}

main().catch(console.error);
