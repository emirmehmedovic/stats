import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Check December 30 and 31 flights
  const flights = await prisma.flight.findMany({
    where: {
      date: {
        gte: new Date('2025-12-29T00:00:00.000Z'),
        lte: new Date('2026-01-02T00:00:00.000Z'),
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
    take: 20,
  });

  console.log('Flights around Dec 30-31:');
  flights.forEach(f => {
    const dateStr = f.date.toISOString();
    console.log(`  ${dateStr} - ${f.airline.name} - ${f.route}`);
  });

  await prisma.$disconnect();
}

main();
