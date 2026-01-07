#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const capacities = [
  // Airbus - glavni avioni za putnike
  { model: 'A320', seats: 180, mtow: 79000 },
  { model: 'A321', seats: 220, mtow: 93000 },

  // Boeing - glavni avioni za putnike
  { model: 'B738', seats: 189, mtow: 79010 }, // Boeing 737-800
  { model: 'B737', seats: 189, mtow: 79010 }, // Boeing 737

  // Regionalni avioni
  { model: 'SF34', seats: 34, mtow: 12700 }, // Saab 340

  // Business jets
  { model: 'CL650', seats: 12, mtow: 24040 }, // Challenger 650
  { model: 'GLF6', seats: 19, mtow: 45360 }, // Gulfstream G650
  { model: 'FDCT', seats: 6, mtow: 5670 }, // Falcon 2000
  { model: 'BE40', seats: 7, mtow: 7303 }, // Beechjet 400
  { model: 'LJ45', seats: 9, mtow: 9752 }, // Learjet 45
  { model: 'BE9L', seats: 8, mtow: 6350 }, // King Air 90

  // Laki avioni
  { model: 'PC12', seats: 9, mtow: 4740 }, // Pilatus PC-12
  { model: 'C172F', seats: 4, mtow: 1111 }, // Cessna 172
  { model: 'DA42', seats: 4, mtow: 1999 }, // Diamond DA42
];

async function main() {
  console.log('✈️  Ažuriranje kapaciteta aviona...\n');

  for (const aircraft of capacities) {
    try {
      const result = await prisma.aircraftType.updateMany({
        where: { model: aircraft.model },
        data: {
          seats: aircraft.seats,
          mtow: aircraft.mtow,
        },
      });

      if (result.count > 0) {
        console.log(`  ✅ ${aircraft.model.padEnd(10)} → ${aircraft.seats} sjedišta`);
      } else {
        console.log(`  ⚠️  ${aircraft.model} ne postoji u bazi`);
      }
    } catch (error: any) {
      console.error(`  ❌ ${aircraft.model}: ${error.message}`);
    }
  }

  console.log('\n✅ Kapaciteti ažurirani!\n');

  // Provjeri koliko aviona još nema kapacitet
  const remaining = await prisma.aircraftType.count({
    where: { seats: { lte: 0 } },
  });

  console.log(`📊 Preostalo aviona bez kapaciteta: ${remaining}\n`);

  await prisma.$disconnect();
}

main();
