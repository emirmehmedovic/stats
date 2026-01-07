#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const expected = {
  1: 20748,
  2: 17839,
  3: 22724,
  4: 21827,
  5: 21866,
  6: 31637,
  7: 38214,
  8: 42087,
  9: 34390,
  10: 32977,
  11: 21934,
};

async function main() {
  console.log('\n📊 Database Passenger Count Verification\n');
  console.log('='.repeat(80));
  console.log(
    `${'Month'.padEnd(12)} ${'Flights'.padStart(8)} ${'Expected'.padStart(10)} ${'Actual'.padStart(10)} ${'Diff'.padStart(10)} ${'Status'.padStart(8)}`
  );
  console.log('='.repeat(80));

  let totalExpected = 0;
  let totalActual = 0;
  let totalFlights = 0;

  const monthNames = [
    '',
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  for (let month = 1; month <= 11; month++) {
    const startDate = new Date(`2025-${String(month).padStart(2, '0')}-01`);
    const endDate = new Date(
      month === 12
        ? '2026-01-01'
        : `2025-${String(month + 1).padStart(2, '0')}-01`
    );

    const flights = await prisma.flight.count({
      where: {
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    const result = await prisma.$queryRaw<Array<{ total: bigint | null }>>`
      SELECT
        COALESCE(SUM("arrivalPassengers"), 0) + COALESCE(SUM("departurePassengers"), 0) as total
      FROM "Flight"
      WHERE date >= ${startDate} AND date < ${endDate}
    `;

    const actual = Number(result[0].total || 0);
    const exp = expected[month] || 0;
    const diff = actual - exp;
    const status = Math.abs(diff) < 100 ? '✅' : '❌';

    console.log(
      `${monthNames[month].padEnd(12)} ${String(flights).padStart(8)} ${exp.toLocaleString().padStart(10)} ${actual.toLocaleString().padStart(10)} ${(diff >= 0 ? '+' + diff : diff).toLocaleString().padStart(10)} ${status.padStart(8)}`
    );

    totalFlights += flights;
    totalExpected += exp;
    totalActual += actual;
  }

  console.log('='.repeat(80));
  console.log(
    `${'TOTAL'.padEnd(12)} ${String(totalFlights).padStart(8)} ${totalExpected.toLocaleString().padStart(10)} ${totalActual.toLocaleString().padStart(10)} ${(totalActual - totalExpected >= 0 ? '+' + (totalActual - totalExpected) : totalActual - totalExpected).toLocaleString().padStart(10)}`
  );
  console.log('='.repeat(80));

  await prisma.$disconnect();
}

main();
