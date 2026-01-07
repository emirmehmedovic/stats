import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function startOfDayUtc(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCHours(0, 0, 0, 0);
  return date;
}

function endOfDayUtc(dateStr: string) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCHours(23, 59, 59, 999);
  return date;
}

async function main() {
  const testDate = '2025-12-30';
  const dateFrom = startOfDayUtc(testDate);
  const dateTo = endOfDayUtc(testDate);

  console.log(`Testing query for ${testDate}:`);
  console.log(`  dateFrom (gte): ${dateFrom.toISOString()}`);
  console.log(`  dateTo (lte): ${dateTo.toISOString()}`);
  console.log('');

  const flights = await prisma.flight.findMany({
    where: {
      date: {
        gte: dateFrom,
        lte: dateTo,
      }
    },
    select: {
      id: true,
      date: true,
      route: true,
      airline: {
        select: { name: true }
      }
    },
    orderBy: { date: 'asc' },
  });

  console.log(`Found ${flights.length} flights for ${testDate}:`);
  flights.forEach(f => {
    const dateStr = f.date.toISOString();
    console.log(`  ${dateStr} - ${f.airline.name} - ${f.route}`);
  });

  await prisma.$disconnect();
}

main();
