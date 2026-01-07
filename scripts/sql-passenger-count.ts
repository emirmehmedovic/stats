#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runSQL() {
  console.log('\n📊 Running Direct SQL Queries...\n');

  // Query 1: Total flights
  const flightCount = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM "Flight"
  `;
  console.log(`Total flights: ${flightCount[0].count}\n`);

  // Query 2: Sum of all passengers
  const passengerTotals = await prisma.$queryRaw<Array<{
    arrival_adults: bigint | null;
    arrival_infants: bigint | null;
    departure_adults: bigint | null;
    departure_infants: bigint | null;
  }>>`
    SELECT
      SUM("arrivalPassengers") as arrival_adults,
      SUM("arrivalInfants") as arrival_infants,
      SUM("departurePassengers") as departure_adults,
      SUM("departureInfants") as departure_infants
    FROM "Flight"
  `;

  const result = passengerTotals[0];
  const arrivalAdults = Number(result.arrival_adults || 0);
  const arrivalInfants = Number(result.arrival_infants || 0);
  const departureAdults = Number(result.departure_adults || 0);
  const departureInfants = Number(result.departure_infants || 0);

  const arrivalTotal = arrivalAdults + arrivalInfants;
  const departureTotal = departureAdults + departureInfants;
  const grandTotal = arrivalTotal + departureTotal;

  console.log('=' .repeat(80));
  console.log('SQL REZULTATI:');
  console.log('=' .repeat(80));
  console.log(`\nDOLAZAK:`);
  console.log(`  Odrasli: ${arrivalAdults}`);
  console.log(`  Bebe: ${arrivalInfants}`);
  console.log(`  Total: ${arrivalTotal}`);

  console.log(`\nODLAZAK:`);
  console.log(`  Odrasli: ${departureAdults}`);
  console.log(`  Bebe: ${departureInfants}`);
  console.log(`  Total: ${departureTotal}`);

  console.log(`\n🎯 UKUPNO: ${grandTotal} putnika\n`);

  // Query 3: Count NULL values
  const nullCounts = await prisma.$queryRaw<Array<{
    null_arrival_passengers: bigint;
    null_departure_passengers: bigint;
  }>>`
    SELECT
      COUNT(*) FILTER (WHERE "arrivalPassengers" IS NULL) as null_arrival_passengers,
      COUNT(*) FILTER (WHERE "departurePassengers" IS NULL) as null_departure_passengers
    FROM "Flight"
  `;

  console.log('NULL vrijednosti:');
  console.log(`  Arrival NULL: ${nullCounts[0].null_arrival_passengers} letova`);
  console.log(`  Departure NULL: ${nullCounts[0].null_departure_passengers} letova\n`);

  // Query 4: Flights with 0 passengers
  const zeroPassengers = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count
    FROM "Flight"
    WHERE COALESCE("arrivalPassengers", 0) = 0
      AND COALESCE("arrivalInfants", 0) = 0
      AND COALESCE("departurePassengers", 0) = 0
      AND COALESCE("departureInfants", 0) = 0
  `;

  console.log(`Letovi sa 0 putnika: ${zeroPassengers[0].count}\n`);

  // Query 5: Show sample data
  const sample = await prisma.$queryRaw<Array<{
    date: Date;
    route: string;
    arrival_pax: number | null;
    arrival_inf: number | null;
    departure_pax: number | null;
    departure_inf: number | null;
  }>>`
    SELECT
      date,
      route,
      "arrivalPassengers" as arrival_pax,
      "arrivalInfants" as arrival_inf,
      "departurePassengers" as departure_pax,
      "departureInfants" as departure_inf
    FROM "Flight"
    ORDER BY date
    LIMIT 5
  `;

  console.log('=' .repeat(80));
  console.log('Prvih 5 letova (sample):');
  console.log('=' .repeat(80));
  sample.forEach((row, i) => {
    const arr = (row.arrival_pax || 0) + (row.arrival_inf || 0);
    const dep = (row.departure_pax || 0) + (row.departure_inf || 0);
    console.log(`\n${i + 1}. ${row.date.toISOString().split('T')[0]} - ${row.route}`);
    console.log(`   Arrival: ${row.arrival_pax || 0} + ${row.arrival_inf || 0} = ${arr}`);
    console.log(`   Departure: ${row.departure_pax || 0} + ${row.departure_inf || 0} = ${dep}`);
  });

  await prisma.$disconnect();
}

runSQL().catch(console.error);
