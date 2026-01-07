#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('\n📊 Verifying Imported Data...\n');

  // Count flights
  const flightCount = await prisma.flight.count();
  console.log(`✈️  Flights: ${flightCount}`);

  // Count airlines
  const airlineCount = await prisma.airline.count();
  console.log(`🏢 Airlines: ${airlineCount}`);

  // Count airports
  const airportCount = await prisma.airport.count();
  console.log(`🏛️  Airports: ${airportCount}`);

  // Count aircraft types
  const aircraftTypeCount = await prisma.aircraftType.count();
  console.log(`🛩️  Aircraft Types: ${aircraftTypeCount}`);

  // Show top airlines by flight count
  const topAirlines = await prisma.airline.findMany({
    include: {
      _count: {
        select: { flights: true },
      },
    },
    orderBy: {
      flights: {
        _count: 'desc',
      },
    },
    take: 5,
  });

  console.log('\n📈 Top Airlines by Flight Count:');
  topAirlines.forEach((airline, i) => {
    console.log(`   ${i + 1}. ${airline.name}: ${airline._count.flights} flights`);
  });

  // Show airports
  const airports = await prisma.airport.findMany({
    orderBy: { iataCode: 'asc' },
  });

  console.log(`\n🗺️  Airports (${airports.length}):`);
  airports.forEach(airport => {
    console.log(`   - ${airport.iataCode}: ${airport.name}`);
  });

  // Show flights by date
  const flightsByDate = await prisma.flight.groupBy({
    by: ['date'],
    _count: true,
    orderBy: { date: 'asc' },
  });

  console.log(`\n📅 Flights by Date (${flightsByDate.length} days):`);
  flightsByDate.slice(0, 10).forEach(day => {
    console.log(`   - ${day.date.toISOString().split('T')[0]}: ${day._count} flights`);
  });

  if (flightsByDate.length > 10) {
    console.log(`   ... and ${flightsByDate.length - 10} more days`);
  }

  await prisma.$disconnect();
}

verify().catch(console.error);
