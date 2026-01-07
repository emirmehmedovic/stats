#!/usr/bin/env ts-node

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const STATS_DIR = '/Users/emir_mw/stats/STATS/2025/Dnevni izvještaji';

interface AirlineData {
  name: string;
  count: number;
}

interface AircraftData {
  model: string;
  count: number;
}

const airlines = new Map<string, number>();
const aircraftTypes = new Map<string, number>();
const operationTypes = new Map<string, number>();

// Valid aircraft type patterns
const VALID_AIRCRAFT = /^[A-Z0-9]{2,6}$/;  // A320, B737, BE40, PC12, etc.
const INVALID_AIRCRAFT = /-TZL-|TZL-|^\d{1,3}$/;  // Rute ili brojevi

// Normalize airline name
function normalizeAirline(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');  // Multiple spaces to single
}

// Check if aircraft type is valid
function isValidAircraft(type: string): boolean {
  if (!type) return false;
  const clean = type.trim();

  // Skip if looks like route
  if (INVALID_AIRCRAFT.test(clean)) return false;

  // Skip if too long (probably route)
  if (clean.length > 10) return false;

  // Valid aircraft pattern
  return VALID_AIRCRAFT.test(clean);
}

// Parse all months
const monthFolders = fs.readdirSync(STATS_DIR)
  .filter(f => fs.statSync(path.join(STATS_DIR, f)).isDirectory())
  .sort();

console.log(`📂 Found ${monthFolders.length} months\n`);

for (const monthFolder of monthFolders) {
  const monthPath = path.join(STATS_DIR, monthFolder);

  // Find Excel file
  const files = fs.readdirSync(monthPath)
    .filter(f => f.includes('Dnevni izvještaj o saobraćaju') && f.endsWith('.xlsx'));

  if (files.length === 0) continue;

  const filePath = path.join(monthPath, files[0]);

  try {
    console.log(`📊 ${monthFolder.substring(0, 10)}: `, );

    const workbook = XLSX.readFile(filePath);
    let totalFlights = 0;

    // Iterate through all sheets (days)
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

      // Skip header
      for (let i = 1; i < data.length; i++) {
        const row = data[i];

        // Skip empty rows
        if (!row[0]) continue;

        totalFlights++;

        // Extract data
        // [0] datum, [1] kompanija, [2] ruta, [3] tip a/c, [4] reg, [5] tip OPER
        const airline = row[1];
        const aircraft = row[3];
        const opType = row[5];

        // Airline
        if (airline && typeof airline === 'string') {
          const normalized = normalizeAirline(airline);
          airlines.set(normalized, (airlines.get(normalized) || 0) + 1);
        }

        // Aircraft type
        if (aircraft && typeof aircraft === 'string') {
          const clean = aircraft.trim();
          if (isValidAircraft(clean)) {
            aircraftTypes.set(clean, (aircraftTypes.get(clean) || 0) + 1);
          }
        }

        // Operation type
        if (opType && typeof opType === 'string') {
          const clean = opType.trim().toUpperCase();
          // Skip if it's a number (capacity)
          if (!/^\d+$/.test(clean)) {
            operationTypes.set(clean, (operationTypes.get(clean) || 0) + 1);
          }
        }
      }
    }

    console.log(`✅ ${totalFlights} flights`);

  } catch (error: any) {
    console.log(`❌ Error: ${error.message}`);
  }
}

// Sort by count
const sortedAirlines = Array.from(airlines.entries())
  .sort((a, b) => b[1] - a[1]);

const sortedAircraft = Array.from(aircraftTypes.entries())
  .sort((a, b) => b[1] - a[1]);

const sortedOpTypes = Array.from(operationTypes.entries())
  .sort((a, b) => b[1] - a[1]);

// Print results
console.log('\n' + '='.repeat(80));
console.log('📊 EKSTRAKTOVANI PODACI IZ 2025 GODINE (CLEAN)');
console.log('='.repeat(80));

console.log(`\n✈️  AVIOKOMPANIJE (${sortedAirlines.length}):`);
sortedAirlines.forEach(([name, count]) => {
  console.log(`  ${count.toString().padStart(4)} x ${name}`);
});

console.log(`\n🛩️  TIPOVI AVIONA (${sortedAircraft.length}):`);
sortedAircraft.forEach(([model, count]) => {
  console.log(`  ${count.toString().padStart(4)} x ${model}`);
});

console.log(`\n🔧 TIPOVI OPERACIJA (${sortedOpTypes.length}):`);
sortedOpTypes.forEach(([type, count]) => {
  console.log(`  ${count.toString().padStart(4)} x ${type}`);
});

// Save to JSON
const output = {
  airlines: sortedAirlines.map(([name, count]) => ({ name, count })),
  aircraftTypes: sortedAircraft.map(([model, count]) => ({ model, count })),
  operationTypes: sortedOpTypes.map(([type, count]) => ({ type, count })),
};

fs.writeFileSync(
  'output/2025-extracted-data.json',
  JSON.stringify(output, null, 2)
);

console.log('\n✅ Data saved to: output/2025-extracted-data.json');
