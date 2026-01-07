#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  console.log('\n📅 Date Distribution Analysis...\n');

  // Get all flights with dates
  const flights = await prisma.flight.findMany({
    select: {
      date: true,
      arrivalPassengers: true,
      departurePassengers: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  console.log(`Total flights: ${flights.length}\n`);

  // Group by year-month
  const groupedByMonth = new Map<string, { count: number; passengers: number }>();

  flights.forEach(f => {
    const yearMonth = f.date.toISOString().substring(0, 7); // "2025-01"
    const existing = groupedByMonth.get(yearMonth) || { count: 0, passengers: 0 };

    groupedByMonth.set(yearMonth, {
      count: existing.count + 1,
      passengers: existing.passengers + (f.arrivalPassengers || 0) + (f.departurePassengers || 0),
    });
  });

  console.log('Flights by month:');
  Array.from(groupedByMonth.entries())
    .sort()
    .forEach(([month, data]) => {
      console.log(`  ${month}: ${data.count} flights, ${data.passengers} passengers`);
    });

  // Check January 2025
  const jan2025 = groupedByMonth.get('2025-01');
  console.log(`\n📊 January 2025:`);
  console.log(`  Flights: ${jan2025?.count || 0}`);
  console.log(`  Passengers: ${jan2025?.passengers || 0}`);

  await prisma.$disconnect();
}

check().catch(console.error);
