#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  const operationTypes = await prisma.operationType.findMany({
    orderBy: { code: 'asc' }
  });

  console.log('\n📋 OperationType records preserved:');
  console.log(`   Total: ${operationTypes.length}`);

  operationTypes.forEach(ot => {
    console.log(`   - ${ot.code}: ${ot.name}`);
  });

  await prisma.$disconnect();
}

verify().catch(console.error);
