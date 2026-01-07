#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const flights = await prisma.flight.groupBy({
    by: ['date'],
    where: {
      date: {
        gte: new Date('2023-01-01'),
        lte: new Date('2023-12-31'),
      },
    },
    _count: true,
    orderBy: { date: 'asc' },
  });

  const byMonth: Record<number, number> = {};
  flights.forEach((f) => {
    const month = f.date.getMonth() + 1;
    byMonth[month] = (byMonth[month] || 0) + f._count;
  });

  console.log('Letovi po mjesecima za 2023:\n');
  const monthNames = [
    '',
    'Januar',
    'Februar',
    'Mart',
    'April',
    'Maj',
    'Juni',
    'Juli',
    'August',
    'Septembar',
    'Oktobar',
    'Novembar',
    'Decembar',
  ];

  for (let m = 1; m <= 12; m++) {
    const count = byMonth[m] || 0;
    const status = count > 0 ? '✓' : '❌';
    console.log(
      `  ${status} ${String(m).padStart(2, '0')}. ${monthNames[m].padEnd(10)}: ${count} letova`
    );
  }

  const total = await prisma.flight.count({
    where: {
      date: {
        gte: new Date('2023-01-01'),
        lte: new Date('2023-12-31'),
      },
    },
  });

  console.log(`\nUkupno 2023: ${total} letova`);

  await prisma.$disconnect();
}

main();
