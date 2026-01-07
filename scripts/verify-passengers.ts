#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('\n📊 Verifying Passenger Data...\n');

  // Get flights with passenger data
  const flights = await prisma.flight.findMany({
    include: {
      airline: true,
    },
    orderBy: { date: 'asc' },
    take: 10,
  });

  console.log(`Found ${flights.length} flights. Showing first 10:\n`);

  flights.forEach((flight, i) => {
    console.log(`${i + 1}. ${flight.date.toISOString().split('T')[0]} - ${flight.airline.name}`);
    console.log(`   Route: ${flight.route}`);
    console.log(`   Arrival: ${flight.arrivalPassengers || 0} adults + ${flight.arrivalInfants || 0} infants = ${(flight.arrivalPassengers || 0) + (flight.arrivalInfants || 0)} total`);
    console.log(`   Departure: ${flight.departurePassengers || 0} adults + ${flight.departureInfants || 0} infants = ${(flight.departurePassengers || 0) + (flight.departureInfants || 0)} total`);
    console.log(`   Baggage: ${flight.arrivalBaggage || 0} kg (arr), ${flight.departureBaggage || 0} kg (dep)`);
    console.log();
  });

  // Get statistics
  const stats = await prisma.flight.aggregate({
    _sum: {
      arrivalPassengers: true,
      arrivalInfants: true,
      departurePassengers: true,
      departureInfants: true,
      arrivalBaggage: true,
      departureBaggage: true,
    },
  });

  console.log('=' .repeat(80));
  console.log('📈 TOTAL STATISTICS (January 2025)');
  console.log('=' .repeat(80));
  console.log(`\nPassengers (Arrival):`);
  console.log(`  - Adults: ${stats._sum.arrivalPassengers || 0}`);
  console.log(`  - Infants: ${stats._sum.arrivalInfants || 0}`);
  console.log(`  - Total: ${(stats._sum.arrivalPassengers || 0) + (stats._sum.arrivalInfants || 0)}`);

  console.log(`\nPassengers (Departure):`);
  console.log(`  - Adults: ${stats._sum.departurePassengers || 0}`);
  console.log(`  - Infants: ${stats._sum.departureInfants || 0}`);
  console.log(`  - Total: ${(stats._sum.departurePassengers || 0) + (stats._sum.departureInfants || 0)}`);

  console.log(`\nBaggage:`);
  console.log(`  - Arrival: ${stats._sum.arrivalBaggage || 0} kg`);
  console.log(`  - Departure: ${stats._sum.departureBaggage || 0} kg`);
  console.log();

  await prisma.$disconnect();
}

verify().catch(console.error);
