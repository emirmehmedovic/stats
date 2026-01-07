#!/usr/bin/env npx tsx

// Test if load factor calculation works with aircraftType.seats fallback

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const year = 2024;
  const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
  const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`);

  const flights = await prisma.flight.findMany({
    where: {
      date: {
        gte: yearStart,
        lte: yearEnd,
      },
    },
    include: {
      aircraftType: {
        select: {
          seats: true,
        },
      },
    },
    take: 10,
  });

  console.log('Sample flights from 2024:\n');

  let totalSeats = 0;
  let totalPassengers = 0;

  flights.forEach((flight, i) => {
    const arrivalPassengers = flight.arrivalFerryIn ? 0 : (flight.arrivalPassengers || 0);
    const departurePassengers = flight.departureFerryOut ? 0 : (flight.departurePassengers || 0);
    const passengers = arrivalPassengers + departurePassengers;

    const legCount =
      (flight.arrivalFlightNumber ? 1 : 0) +
      (flight.departureFlightNumber ? 1 : 0);

    const seatsPerLeg = flight.availableSeats || flight.aircraftType?.seats || 0;
    const seats = seatsPerLeg * legCount;

    if (seatsPerLeg > 0 && legCount > 0) {
      totalSeats += seats;
      totalPassengers += passengers;
    }

    console.log(`${i + 1}. Date: ${flight.date.toISOString().split('T')[0]}`);
    console.log(`   Available seats: ${flight.availableSeats}`);
    console.log(`   Aircraft seats: ${flight.aircraftType?.seats || 'N/A'}`);
    console.log(`   Seats per leg: ${seatsPerLeg}`);
    console.log(`   Leg count: ${legCount}`);
    console.log(`   Total seats: ${seats}`);
    console.log(`   Passengers: ${passengers}`);
    console.log(`   Load factor: ${seats > 0 ? ((passengers / seats) * 100).toFixed(2) : 'N/A'}%`);
    console.log('');
  });

  console.log('Summary:');
  console.log(`Total seats: ${totalSeats}`);
  console.log(`Total passengers: ${totalPassengers}`);
  console.log(`Overall load factor: ${totalSeats > 0 ? ((totalPassengers / totalSeats) * 100).toFixed(2) : 0}%`);

  await prisma.$disconnect();
}

main();
