#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Uzmi par letova sa load faktorom iz Aprila
  const flights = await prisma.flight.findMany({
    where: {
      AND: [
        { arrivalLoadFactor: { not: null } },
        { availableSeats: { not: null } },
      ]
    },
    include: {
      aircraftType: {
        select: {
          model: true,
          seats: true,
        },
      },
      airline: {
        select: {
          name: true,
        },
      },
    },
    take: 5,
    orderBy: { date: 'asc' },
  });

  console.log('📊 Primjeri letova SA availableSeats (iz Excel-a):\n');

  flights.forEach((f) => {
    const dateStr = f.date.toISOString().split('T')[0];
    console.log(`${dateStr} | ${f.airline.name}`);
    console.log(`  Avion: ${f.aircraftType.model}`);
    console.log(`  ✅ Kapacitet (Excel): ${f.availableSeats}`);
    console.log(`  Kapacitet (tip aviona): ${f.aircraftType.seats}`);
    console.log(`  Putnici (dolazak): ${f.arrivalPassengers || 'N/A'}`);
    console.log(`  Load factor (dolazak): ${f.arrivalLoadFactor ? f.arrivalLoadFactor.toFixed(2) + '%' : 'N/A'}`);
    console.log(`  Putnici (odlazak): ${f.departurePassengers || 'N/A'}`);
    console.log(`  Load factor (odlazak): ${f.departureLoadFactor ? f.departureLoadFactor.toFixed(2) + '%' : 'N/A'}`);
    console.log('');
  });

  await prisma.$disconnect();
}

main();
