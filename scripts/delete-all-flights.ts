#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Brisanje svih letova...\n');
  
  const result = await prisma.flight.deleteMany({});
  
  console.log(`✅ Obrisano ${result.count} letova\n`);
  
  await prisma.$disconnect();
}

main();
