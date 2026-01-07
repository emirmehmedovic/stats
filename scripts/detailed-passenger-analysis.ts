#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyze() {
  console.log('\n📊 Detailed Passenger Analysis...\n');

  const totalFlights = await prisma.flight.count();
  console.log(`Total flights: ${totalFlights}\n`);

  // Get different calculations
  const stats = await prisma.flight.aggregate({
    _sum: {
      arrivalPassengers: true,
      arrivalInfants: true,
      departurePassengers: true,
      departureInfants: true,
    },
  });

  // Count flights with data
  const arrivalCount = await prisma.flight.count({
    where: { arrivalPassengers: { not: null } },
  });

  const departureCount = await prisma.flight.count({
    where: { departurePassengers: { not: null } },
  });

  console.log('=' .repeat(80));
  console.log('RAZLIČITI NAČINI RAČUNANJA:');
  console.log('=' .repeat(80));

  // Method 1: Arrivals + Departures (both directions)
  const arrivalTotal = (stats._sum.arrivalPassengers || 0) + (stats._sum.arrivalInfants || 0);
  const departureTotal = (stats._sum.departurePassengers || 0) + (stats._sum.departureInfants || 0);
  const method1 = arrivalTotal + departureTotal;

  console.log(`\n1. Dolazak + Odlazak (OBA smjera):`);
  console.log(`   Arrival: ${arrivalTotal} putnika (${arrivalCount} letova)`);
  console.log(`   Departure: ${departureTotal} putnika (${departureCount} letova)`);
  console.log(`   TOTAL: ${method1} putnika`);

  // Method 2: Only arrivals (passengers arriving at TZL)
  console.log(`\n2. Samo dolasci (passengers arriving at TZL):`);
  console.log(`   TOTAL: ${arrivalTotal} putnika`);

  // Method 3: Only departures (passengers departing from TZL)
  console.log(`\n3. Samo odlasci (passengers departing from TZL):`);
  console.log(`   TOTAL: ${departureTotal} putnika`);

  // Method 4: Only adults (no infants)
  const adultsOnly = (stats._sum.arrivalPassengers || 0) + (stats._sum.departurePassengers || 0);
  console.log(`\n4. Samo odrasli (bez beba):`);
  console.log(`   TOTAL: ${adultsOnly} putnika`);

  // Method 5: Average per flight
  const avgPerFlight = method1 / totalFlights;
  console.log(`\n5. Prosječno po letu:`);
  console.log(`   ${avgPerFlight.toFixed(1)} putnika/let`);

  // Check what 18,048 could be
  console.log('\n' + '=' .repeat(80));
  console.log('ANALIZA ZA 18,048:');
  console.log('=' .repeat(80));

  const target = 18048;
  console.log(`\nKorisnik vidi: ${target} putnika`);
  console.log(`Razlika od metoda 1: ${method1 - target} putnika`);
  console.log(`Razlika od metoda 2: ${arrivalTotal - target} putnika`);
  console.log(`Razlika od metoda 3: ${departureTotal - target} putnika`);
  console.log(`Razlika od metoda 4: ${adultsOnly - target} putnika`);

  // Check for NULL values
  const nullArrival = await prisma.flight.count({
    where: { arrivalPassengers: null },
  });

  const nullDeparture = await prisma.flight.count({
    where: { departurePassengers: null },
  });

  console.log(`\n⚠️  Letovi sa NULL vrijednostima:`);
  console.log(`   Arrival: ${nullArrival} letova`);
  console.log(`   Departure: ${nullDeparture} letova`);

  // Get all flights and calculate manually
  const allFlights = await prisma.flight.findMany({
    select: {
      id: true,
      arrivalPassengers: true,
      arrivalInfants: true,
      departurePassengers: true,
      departureInfants: true,
    },
  });

  let manualTotal = 0;
  let flightsWithData = 0;

  allFlights.forEach(f => {
    const arr = (f.arrivalPassengers || 0) + (f.arrivalInfants || 0);
    const dep = (f.departurePassengers || 0) + (f.departureInfants || 0);
    const total = arr + dep;

    if (total > 0) {
      flightsWithData++;
    }

    manualTotal += total;
  });

  console.log(`\n📊 Manuelno računanje:`);
  console.log(`   Total: ${manualTotal} putnika`);
  console.log(`   Letovi sa podacima: ${flightsWithData}/${totalFlights}`);

  await prisma.$disconnect();
}

analyze().catch(console.error);
