#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const aircraftTypes = [
  // Beechcraft
  { model: 'BE350', seats: 11, mtow: 6350 },      // King Air 350
  { model: 'B505', seats: 4, mtow: 1765 },        // Bell 505
  { model: 'BE40', seats: 7, mtow: 7303 },        // Beechjet 400
  { model: 'BE9L', seats: 8, mtow: 6350 },        // King Air 90

  // Boeing variations
  { model: '737-800', seats: 189, mtow: 79010 },  // Boeing 737-800
  { model: 'B378', seats: 189, mtow: 79010 },     // Boeing 737-800
  { model: 'B737-800', seats: 189, mtow: 79010 }, // Boeing 737-800
  { model: 'B739', seats: 215, mtow: 85130 },     // Boeing 737-900

  // Airbus variations
  { model: 'A21', seats: 220, mtow: 93000 },      // Airbus A321 (short code)
  { model: 'A320N', seats: 180, mtow: 79000 },    // Airbus A320neo
  { model: 'A32Q', seats: 220, mtow: 93000 },     // Airbus A321

  // Cessna
  { model: 'C150L', seats: 2, mtow: 757 },        // Cessna 150
  { model: 'C172F', seats: 4, mtow: 1111 },       // Cessna 172
  { model: 'CESSNA 172 F', seats: 4, mtow: 1111 },// Cessna 172
  { model: 'C251', seats: 7, mtow: 3920 },        // Cessna Citation CJ2
  { model: 'C295', seats: 71, mtow: 23200 },      // CASA C-295
  { model: 'C425', seats: 8, mtow: 3968 },        // Cessna Conquest
  { model: 'C525', seats: 5, mtow: 5670 },        // Cessna Citation CJ1
  { model: 'C56X', seats: 9, mtow: 9050 },        // Cessna Citation Excel

  // Bombardier/Canadair
  { model: 'CL60', seats: 19, mtow: 23133 },      // Challenger 600
  { model: 'CL650', seats: 12, mtow: 24040 },     // Challenger 650

  // Dornier
  { model: 'D-328', seats: 33, mtow: 15200 },     // Dornier 328

  // Diamond
  { model: 'DA 42', seats: 4, mtow: 1999 },       // Diamond DA42
  { model: 'DA42', seats: 4, mtow: 1999 },        // Diamond DA42

  // Other business jets
  { model: 'E55P', seats: 5, mtow: 5670 },        // Embraer Phenom 100
  { model: 'FA7X', seats: 19, mtow: 32003 },      // Falcon 7X
  { model: 'FDCT', seats: 6, mtow: 5670 },        // Falcon 2000
  { model: 'GL5T', seats: 16, mtow: 41050 },      // Gulfstream G550
  { model: 'GLF6', seats: 19, mtow: 45360 },      // Gulfstream G650
  { model: 'H 25 B', seats: 8, mtow: 11340 },     // Hawker 800

  // Helicopters
  { model: 'EC130', seats: 7, mtow: 2427 },       // Eurocopter EC130
  { model: 'EC130T2', seats: 7, mtow: 2500 },     // Eurocopter EC130T2
  { model: 'IAR330', seats: 16, mtow: 7400 },     // IAR 330 Puma
  { model: 'SA342', seats: 5, mtow: 2250 },       // SA-342 Gazelle
  { model: 'SA342J', seats: 5, mtow: 2250 },      // SA-342J Gazelle
  { model: 'Schweizer 269C', seats: 3, mtow: 930 }, // Schweizer 269C

  // Regional jets
  { model: 'J238', seats: 34, mtow: 16800 },      // BAe Jetstream 31
  { model: 'J328', seats: 33, mtow: 15200 },      // Dornier 328JET
  { model: 'SF34', seats: 34, mtow: 12700 },      // Saab 340
  { model: 'SW3', seats: 19, mtow: 10886 },       // Fairchild Swearingen Metro

  // Learjet
  { model: 'LJ30', seats: 8, mtow: 8301 },        // Learjet 30
  { model: 'LJ45', seats: 9, mtow: 9752 },        // Learjet 45
  { model: 'LJ60', seats: 8, mtow: 10569 },       // Learjet 60

  // Pilatus
  { model: 'PC12', seats: 9, mtow: 4740 },        // Pilatus PC-12

  // Light aircraft
  { model: 'P2010', seats: 4, mtow: 1230 },       // Tecnam P2010
  { model: 'PIONEER 400', seats: 2, mtow: 600 },  // Pioneer 400
  { model: 'PIPER II', seats: 4, mtow: 1100 },    // Piper
  { model: 'PIVI', seats: 4, mtow: 1100 },        // Piper variant
  { model: 'PNR2', seats: 2, mtow: 600 },         // Pioneer
  { model: 'S56X', seats: 9, mtow: 9050 },        // Citation Excel
  { model: 'Tarragon', seats: 4, mtow: 1500 },    // Small aircraft
  { model: 'Texan', seats: 2, mtow: 2500 },       // T-6 Texan
];

async function main() {
  console.log('🛩️  Seeding missing aircraft types...\n');

  for (const aircraft of aircraftTypes) {
    try {
      await prisma.aircraftType.upsert({
        where: { model: aircraft.model },
        update: {},
        create: aircraft,
      });
      console.log(`  ✅ ${aircraft.model}`);
    } catch (error) {
      console.error(`  ❌ ${aircraft.model}: ${error}`);
    }
  }

  console.log('\n✅ Aircraft types seeding completed!');

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
