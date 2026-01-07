#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function analyze() {
  console.log('\n📊 Analyzing Passenger Data...\n');

  // Total flights
  const totalFlights = await prisma.flight.count();
  console.log(`Total flights: ${totalFlights}`);

  // Flights with arrival passenger data
  const flightsWithArrival = await prisma.flight.count({
    where: {
      OR: [
        { arrivalPassengers: { not: null } },
        { arrivalInfants: { not: null } },
      ],
    },
  });

  // Flights with departure passenger data
  const flightsWithDeparture = await prisma.flight.count({
    where: {
      OR: [
        { departurePassengers: { not: null } },
        { departureInfants: { not: null } },
      ],
    },
  });

  // Flights WITHOUT any passenger data
  const flightsWithoutData = await prisma.flight.count({
    where: {
      AND: [
        { arrivalPassengers: null },
        { arrivalInfants: null },
        { departurePassengers: null },
        { departureInfants: null },
      ],
    },
  });

  console.log(`\nFlights with arrival data: ${flightsWithArrival}`);
  console.log(`Flights with departure data: ${flightsWithDeparture}`);
  console.log(`Flights WITHOUT passenger data: ${flightsWithoutData}\n`);

  // Show flights without passenger data
  if (flightsWithoutData > 0) {
    console.log('🔍 Flights without passenger data:');
    const emptyFlights = await prisma.flight.findMany({
      where: {
        AND: [
          { arrivalPassengers: null },
          { arrivalInfants: null },
          { departurePassengers: null },
          { departureInfants: null },
        ],
      },
      include: {
        airline: true,
      },
    });

    emptyFlights.forEach((flight, i) => {
      console.log(`  ${i + 1}. ${flight.date.toISOString().split('T')[0]} - ${flight.airline.name} - ${flight.route}`);
    });
    console.log();
  }

  // Get actual totals
  const stats = await prisma.flight.aggregate({
    _sum: {
      arrivalPassengers: true,
      arrivalInfants: true,
      departurePassengers: true,
      departureInfants: true,
    },
  });

  const arrivalTotal = (stats._sum.arrivalPassengers || 0) + (stats._sum.arrivalInfants || 0);
  const departureTotal = (stats._sum.departurePassengers || 0) + (stats._sum.departureInfants || 0);
  const grandTotal = arrivalTotal + departureTotal;

  console.log('📈 Current Totals:');
  console.log(`  Arrival: ${stats._sum.arrivalPassengers || 0} adults + ${stats._sum.arrivalInfants || 0} infants = ${arrivalTotal}`);
  console.log(`  Departure: ${stats._sum.departurePassengers || 0} adults + ${stats._sum.departureInfants || 0} infants = ${departureTotal}`);
  console.log(`  TOTAL: ${grandTotal}`);
  console.log(`\n  Expected: ~20,748`);
  console.log(`  Difference: ${20748 - grandTotal}`);

  await prisma.$disconnect();
}

analyze().catch(console.error);
