#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Scanning for airline duplicates...\n');

  const airlines = await prisma.airline.findMany({
    include: {
      _count: {
        select: { flights: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // Group airlines by similarity
  const groups: Map<string, typeof airlines> = new Map();

  for (const airline of airlines) {
    const normalized = airline.name
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .replace(/[.,\-()]/g, '')
      .trim();

    // Extract key words
    const keyWords = normalized.split(' ').filter(w =>
      w.length > 2 && !['LTD', 'LLC', 'DOO', 'GMBH', 'SRL', 'SAS', 'THE'].includes(w)
    );

    const key = keyWords.slice(0, 2).join(' ');

    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(airline);
  }

  // Filter and display groups with multiple entries
  console.log('═'.repeat(80));
  console.log('📋 POTENTIAL DUPLICATES');
  console.log('═'.repeat(80));
  console.log('');

  let totalGroups = 0;
  for (const [key, group] of groups) {
    if (group.length > 1) {
      totalGroups++;
      const totalFlights = group.reduce((sum, a) => sum + a._count.flights, 0);

      console.log(`\n🔸 ${key} (${group.length} variants, ${totalFlights} total flights)`);
      console.log('─'.repeat(80));

      for (const airline of group) {
        console.log(`   ${airline.name}`);
        console.log(`   ├─ ICAO: ${airline.icaoCode} | IATA: ${airline.iataCode || 'N/A'}`);
        console.log(`   ├─ Country: ${airline.country}`);
        console.log(`   └─ Flights: ${airline._count.flights}`);
        console.log('');
      }
    }
  }

  console.log('═'.repeat(80));
  console.log(`Found ${totalGroups} potential duplicate groups`);
  console.log('═'.repeat(80));

  await prisma.$disconnect();
}

main().catch(console.error);
