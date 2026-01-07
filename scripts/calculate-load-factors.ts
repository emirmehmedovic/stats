#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Izračunavanje load faktora za sve letove...\n');

  // Uzmi sve letove sa aircraft type i kapacitetom
  const flights = await prisma.flight.findMany({
    include: {
      aircraftType: {
        select: {
          model: true,
          seats: true,
        },
      },
    },
  });

  console.log(`Ukupno letova: ${flights.length}\n`);

  let updatedCount = 0;
  let arrivalCount = 0;
  let departureCount = 0;
  let skippedNoCapacity = 0;
  let skippedNoPassengers = 0;
  let usedAvailableSeats = 0;
  let usedAircraftCapacity = 0;

  for (const flight of flights) {
    // Use availableSeats if present, otherwise use aircraft type capacity
    const capacity = flight.availableSeats || flight.aircraftType.seats;

    if (flight.availableSeats) {
      usedAvailableSeats++;
    } else if (flight.aircraftType.seats) {
      usedAircraftCapacity++;
    }

    // Preskoči ako avion nema kapacitet
    if (!capacity || capacity === 0) {
      skippedNoCapacity++;
      continue;
    }

    let arrivalLoadFactor: number | null = null;
    let departureLoadFactor: number | null = null;

    // Izračunaj arrival load factor
    if (flight.arrivalPassengers && flight.arrivalPassengers > 0) {
      arrivalLoadFactor = (flight.arrivalPassengers / capacity) * 100;
      arrivalLoadFactor = Math.round(arrivalLoadFactor * 100) / 100; // Round to 2 decimals
      arrivalCount++;
    }

    // Izračunaj departure load factor
    if (flight.departurePassengers && flight.departurePassengers > 0) {
      departureLoadFactor = (flight.departurePassengers / capacity) * 100;
      departureLoadFactor = Math.round(departureLoadFactor * 100) / 100; // Round to 2 decimals
      departureCount++;
    }

    // Ažuriraj let samo ako ima barem jedan load factor
    if (arrivalLoadFactor !== null || departureLoadFactor !== null) {
      await prisma.flight.update({
        where: { id: flight.id },
        data: {
          arrivalLoadFactor,
          departureLoadFactor,
        },
      });
      updatedCount++;
    } else {
      skippedNoPassengers++;
    }

    // Progress indicator
    if (updatedCount % 100 === 0 && updatedCount > 0) {
      console.log(`  ✓ Obrađeno ${updatedCount} letova...`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ LOAD FACTOR IZRAČUNAT');
  console.log('='.repeat(80));
  console.log(`\n📋 Statistika:`);
  console.log(`   - Ukupno letova: ${flights.length}`);
  console.log(`   - Ažurirano: ${updatedCount}`);
  console.log(`   - Arrival load factor: ${arrivalCount}`);
  console.log(`   - Departure load factor: ${departureCount}`);
  console.log(`\n📊 Izvor kapaciteta:`);
  console.log(`   - Korišteno availableSeats (iz Excel-a): ${usedAvailableSeats}`);
  console.log(`   - Korišteno AircraftType.seats: ${usedAircraftCapacity}`);
  console.log(`\n⚠️  Preskočeno:`);
  console.log(`   - Nema kapacitet: ${skippedNoCapacity}`);
  console.log(`   - Nema putnike: ${skippedNoPassengers}\n`);

  // Prikazi prosječan load factor
  const avgLoadFactors = await prisma.$queryRaw<
    Array<{ avg_arrival: number | null; avg_departure: number | null }>
  >`
    SELECT
      AVG("arrivalLoadFactor") as avg_arrival,
      AVG("departureLoadFactor") as avg_departure
    FROM "Flight"
    WHERE "arrivalLoadFactor" IS NOT NULL OR "departureLoadFactor" IS NOT NULL
  `;

  if (avgLoadFactors.length > 0) {
    const avgArr = avgLoadFactors[0].avg_arrival;
    const avgDep = avgLoadFactors[0].avg_departure;

    console.log('📈 Prosječan load factor:');
    if (avgArr) {
      console.log(`   - Dolazak: ${Number(avgArr).toFixed(2)}%`);
    }
    if (avgDep) {
      console.log(`   - Odlazak: ${Number(avgDep).toFixed(2)}%`);
    }
  }

  await prisma.$disconnect();
}

main();
