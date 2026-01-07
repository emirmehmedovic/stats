#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  console.log('\n📊 Passenger Count - WITHOUT Infants...\n');

  const result = await prisma.$queryRaw<Array<{
    arrival_adults: bigint | null;
    departure_adults: bigint | null;
  }>>`
    SELECT
      SUM("arrivalPassengers") as arrival_adults,
      SUM("departurePassengers") as departure_adults
    FROM "Flight"
  `;

  const arrivalAdults = Number(result[0].arrival_adults || 0);
  const departureAdults = Number(result[0].departure_adults || 0);
  const total = arrivalAdults + departureAdults;

  console.log(`Dolazak (adults only): ${arrivalAdults}`);
  console.log(`Odlazak (adults only): ${departureAdults}`);
  console.log(`\n🎯 UKUPNO (bez beba): ${total}`);
  console.log(`\nKorisnik vidi: 18,048`);
  console.log(`Razlika: ${total - 18048}\n`);

  await prisma.$disconnect();
}

check().catch(console.error);
