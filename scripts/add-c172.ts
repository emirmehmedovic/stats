#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.aircraftType.create({
    data: { model: 'C172', seats: 4, mtow: 1111 }
  });
  console.log('✅ Added C172');
  await prisma.$disconnect();
}

main();
