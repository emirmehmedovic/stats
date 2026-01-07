#!/usr/bin/env ts-node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMissingAircraft() {
  console.log('🛩️  Adding missing aircraft types...\n');

  const aircraftTypes = [
    {
      model: 'SA-342J',
      seats: 5,  // SA-342 Gazelle helicopter - typically 5 seats
      mtow: 2250,  // ~2250 kg
    },
    {
      model: '737-800',
      seats: 189,  // Boeing 737-800 typical config
      mtow: 79010,  // 79,010 kg
    },
    {
      model: 'IAR-330',
      seats: 16,  // IAR 330 Puma helicopter
      mtow: 7400,  // ~7400 kg
    },
  ];

  for (const aircraft of aircraftTypes) {
    const existing = await prisma.aircraftType.findFirst({
      where: { model: aircraft.model },
    });

    if (existing) {
      console.log(`   ⚠️  ${aircraft.model} already exists`);
    } else {
      await prisma.aircraftType.create({
        data: aircraft,
      });
      console.log(`   ✅ Added ${aircraft.model} (${aircraft.seats} seats, ${aircraft.mtow} kg MTOW)`);
    }
  }

  console.log('\n✅ Missing aircraft types added!\n');

  await prisma.$disconnect();
}

seedMissingAircraft().catch(console.error);
