import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ===================================
  // AIRLINES
  // ===================================
  console.log('📍 Seeding Airlines...');

  const airlines = await Promise.all([
    prisma.airline.upsert({
      where: { icaoCode: 'WZZ' },
      update: {},
      create: {
        name: 'Wizz Air',
        icaoCode: 'WZZ',
        iataCode: 'W6',
        country: 'Hungary',
      },
    }),
    prisma.airline.upsert({
      where: { icaoCode: 'PGT' },
      update: {},
      create: {
        name: 'Pegasus Airlines',
        icaoCode: 'PGT',
        iataCode: 'PC',
        country: 'Turkey',
      },
    }),
    prisma.airline.upsert({
      where: { icaoCode: 'TKJ' },
      update: {},
      create: {
        name: 'AJet (Turkish Airlines)',
        icaoCode: 'TKJ',
        iataCode: 'VF',
        country: 'Turkey',
      },
    }),
    prisma.airline.upsert({
      where: { icaoCode: 'THY' },
      update: {},
      create: {
        name: 'Turkish Airlines',
        icaoCode: 'THY',
        iataCode: 'TK',
        country: 'Turkey',
      },
    }),
    prisma.airline.upsert({
      where: { icaoCode: 'RYR' },
      update: {},
      create: {
        name: 'Ryanair',
        icaoCode: 'RYR',
        iataCode: 'FR',
        country: 'Ireland',
      },
    }),
  ]);

  console.log(`✅ Created ${airlines.length} airlines`);

  // ===================================
  // AIRCRAFT TYPES
  // ===================================
  console.log('📍 Seeding Aircraft Types from JSON...');

  let aircraftTypesCount = 0;
  try {
    // Read aircraft JSON file
    const aircraftPath = path.join(process.cwd(), 'docs', 'aircraft.json');
    const aircraftFile = fs.readFileSync(aircraftPath, 'utf-8');
    const aircraftData = JSON.parse(aircraftFile);

    if (!aircraftData.avioni || !Array.isArray(aircraftData.avioni)) {
      console.log('⚠️  Invalid aircraft JSON structure');
    } else {
      const aircraftTypes = await Promise.all(
        aircraftData.avioni.map((aircraft: {
          model_aviona: string;
          proizvodjac: string;
          broj_sjedista_tipicno: number;
          broj_sjedista_max: number;
          mtow_kg: number;
        }) =>
          prisma.aircraftType.upsert({
            where: { model: aircraft.model_aviona },
            update: {
              seats: aircraft.broj_sjedista_max || aircraft.broj_sjedista_tipicno,
              mtow: aircraft.mtow_kg,
            },
            create: {
              model: aircraft.model_aviona,
              seats: aircraft.broj_sjedista_max || aircraft.broj_sjedista_tipicno,
              mtow: aircraft.mtow_kg,
            },
          })
        )
      );

      aircraftTypesCount = aircraftTypes.length;
      console.log(`✅ Created/Updated ${aircraftTypesCount} aircraft types from JSON`);
    }
  } catch (error) {
    console.error('⚠️  Error seeding aircraft types:', error);
    console.log('   Continuing with other seed data...');
  }

  // ===================================
  // AIRPORTS
  // ===================================
  console.log('📍 Seeding Airports...');

  const airports = await Promise.all([
    prisma.airport.upsert({
      where: { iataCode: 'TZL' },
      update: {},
      create: {
        iataCode: 'TZL',
        icaoCode: 'LQTZ',
        name: 'Tuzla International Airport',
        city: 'Tuzla',
        country: 'Bosnia and Herzegovina',
        isEU: false,
        latitude: 44.4587,
        longitude: 18.7248,
      },
    }),
    prisma.airport.upsert({
      where: { iataCode: 'FMM' },
      update: {},
      create: {
        iataCode: 'FMM',
        icaoCode: 'EDJA',
        name: 'Memmingen Airport',
        city: 'Memmingen',
        country: 'Germany',
        isEU: true,
        latitude: 47.9888,
        longitude: 10.2395,
      },
    }),
    prisma.airport.upsert({
      where: { iataCode: 'BVA' },
      update: {},
      create: {
        iataCode: 'BVA',
        icaoCode: 'LFOB',
        name: 'Paris Beauvais Airport',
        city: 'Beauvais',
        country: 'France',
        isEU: true,
        latitude: 49.4544,
        longitude: 2.1128,
      },
    }),
    prisma.airport.upsert({
      where: { iataCode: 'SAW' },
      update: {},
      create: {
        iataCode: 'SAW',
        icaoCode: 'LTFJ',
        name: 'Sabiha Gökçen International Airport',
        city: 'Istanbul',
        country: 'Turkey',
        isEU: false,
        latitude: 40.8986,
        longitude: 29.3092,
      },
    }),
    prisma.airport.upsert({
      where: { iataCode: 'IST' },
      update: {},
      create: {
        iataCode: 'IST',
        icaoCode: 'LTFM',
        name: 'Istanbul Airport',
        city: 'Istanbul',
        country: 'Turkey',
        isEU: false,
        latitude: 41.2753,
        longitude: 28.7519,
      },
    }),
    prisma.airport.upsert({
      where: { iataCode: 'AYT' },
      update: {},
      create: {
        iataCode: 'AYT',
        icaoCode: 'LTAI',
        name: 'Antalya Airport',
        city: 'Antalya',
        country: 'Turkey',
        isEU: false,
        latitude: 36.8987,
        longitude: 30.8005,
      },
    }),
  ]);

  console.log(`✅ Created ${airports.length} airports`);

  // ===================================
  // DELAY CODES (IATA)
  // ===================================
  console.log('📍 Seeding Delay Codes from IATA JSON...');

  let delayCodesCount = 0;
  try {
    // Read IATA delay codes JSON file
    const delayCodesPath = path.join(process.cwd(), 'docs', 'iata_delay_codes.json');
    const delayCodesFile = fs.readFileSync(delayCodesPath, 'utf-8');
    const delayCodesData = JSON.parse(delayCodesFile);

    if (!delayCodesData.IATA_Delay_Codes || !Array.isArray(delayCodesData.IATA_Delay_Codes)) {
      console.log('⚠️  Invalid delay codes JSON structure');
    } else {
      const delayCodes = await Promise.all(
        delayCodesData.IATA_Delay_Codes.map((delayCode: { code: string; category: string; description: string }) =>
          prisma.delayCode.upsert({
            where: { code: delayCode.code },
            update: {
              description: delayCode.description,
              category: delayCode.category,
            },
            create: {
              code: delayCode.code,
              description: delayCode.description,
              category: delayCode.category,
            },
          })
        )
      );

      delayCodesCount = delayCodes.length;
      console.log(`✅ Created/Updated ${delayCodesCount} delay codes from IATA JSON`);
    }
  } catch (error) {
    console.error('⚠️  Error seeding delay codes:', error);
    console.log('   Continuing with other seed data...');
  }

  // ===================================
  // DEFAULT USERS
  // ===================================
  console.log('📍 Seeding Default Users...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const managerPassword = await bcrypt.hash('manager123', 10);
  const viewerPassword = await bcrypt.hash('viewer123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@airport-tzl.ba' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      email: 'admin@airport-tzl.ba',
      name: 'Admin User',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@airport-tzl.ba' },
    update: {
      password: managerPassword,
      role: 'MANAGER',
      isActive: true,
    },
    create: {
      email: 'manager@airport-tzl.ba',
      name: 'Manager User',
      password: managerPassword,
      role: 'MANAGER',
      isActive: true,
    },
  });

  const viewerUser = await prisma.user.upsert({
    where: { email: 'viewer@airport-tzl.ba' },
    update: {
      password: viewerPassword,
      role: 'VIEWER',
      isActive: true,
    },
    create: {
      email: 'viewer@airport-tzl.ba',
      name: 'Viewer User',
      password: viewerPassword,
      role: 'VIEWER',
      isActive: true,
    },
  });

  console.log(`✅ Created default users:`);
  console.log(`   - Admin: admin@airport-tzl.ba / admin123`);
  console.log(`   - Manager: manager@airport-tzl.ba / manager123`);
  console.log(`   - Viewer: viewer@airport-tzl.ba / viewer123`);

  // ===================================
  // OPERATION TYPES
  // ===================================
  console.log('📍 Seeding Operation Types...');

  const operationTypes = await Promise.all([
    prisma.operationType.upsert({
      where: { code: 'SCHEDULED' },
      update: {},
      create: {
        code: 'SCHEDULED',
        name: 'Redovan',
        description: 'Redovni komercijalni letovi',
        isActive: true,
      },
    }),
    prisma.operationType.upsert({
      where: { code: 'CHARTER' },
      update: {},
      create: {
        code: 'CHARTER',
        name: 'Charter',
        description: 'Charter letovi',
        isActive: true,
      },
    }),
    prisma.operationType.upsert({
      where: { code: 'MEDEVAC' },
      update: {},
      create: {
        code: 'MEDEVAC',
        name: 'Medicinska evakuacija',
        description: 'Medicinski hitni letovi',
        isActive: true,
      },
    }),
    prisma.operationType.upsert({
      where: { code: 'CARGO' },
      update: {},
      create: {
        code: 'CARGO',
        name: 'Cargo',
        description: 'Teretni letovi',
        isActive: true,
      },
    }),
    prisma.operationType.upsert({
      where: { code: 'MILITARY' },
      update: {},
      create: {
        code: 'MILITARY',
        name: 'Vojni',
        description: 'Vojni letovi',
        isActive: true,
      },
    }),
    prisma.operationType.upsert({
      where: { code: 'GENERAL_AVIATION' },
      update: {},
      create: {
        code: 'GENERAL_AVIATION',
        name: 'Generalna avijacija',
        description: 'Privatni i općeniti avijacijski letovi',
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${operationTypes.length} operation types`);

  // ===================================
  // FLIGHT TYPES
  // ===================================
  console.log('📍 Seeding Flight Types...');

  const flightTypes = await Promise.all([
    prisma.flightType.upsert({
      where: { code: 'SCHEDULED' },
      update: {},
      create: {
        code: 'SCHEDULED',
        name: 'Redovan',
        description: 'Redovni komercijalni letovi',
        isActive: true,
      },
    }),
    prisma.flightType.upsert({
      where: { code: 'CHARTER' },
      update: {},
      create: {
        code: 'CHARTER',
        name: 'Charter',
        description: 'Charter letovi',
        isActive: true,
      },
    }),
    prisma.flightType.upsert({
      where: { code: 'MEDEVAC' },
      update: {},
      create: {
        code: 'MEDEVAC',
        name: 'Medicinska evakuacija',
        description: 'Medicinski hitni letovi',
        isActive: true,
      },
    }),
    prisma.flightType.upsert({
      where: { code: 'CARGO' },
      update: {},
      create: {
        code: 'CARGO',
        name: 'Cargo',
        description: 'Teretni letovi',
        isActive: true,
      },
    }),
    prisma.flightType.upsert({
      where: { code: 'MILITARY' },
      update: {},
      create: {
        code: 'MILITARY',
        name: 'Vojni',
        description: 'Vojni letovi',
        isActive: true,
      },
    }),
    prisma.flightType.upsert({
      where: { code: 'GENERAL_AVIATION' },
      update: {},
      create: {
        code: 'GENERAL_AVIATION',
        name: 'Generalna avijacija',
        description: 'Privatni i općeniti avijacijski letovi',
        isActive: true,
      },
    }),
  ]);

  await prisma.operationTypeFlightType.createMany({
    data: operationTypes.map((operationType) => {
      const match = flightTypes.find((flightType) => flightType.code === operationType.code);
      if (!match) {
        return null;
      }
      return {
        operationTypeId: operationType.id,
        flightTypeId: match.id,
      };
    }).filter((item): item is { operationTypeId: string; flightTypeId: string } => item !== null),
    skipDuplicates: true,
  });

  console.log(`✅ Created ${flightTypes.length} flight types`);

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('Summary:');
  console.log(`  - ${airlines.length} airlines`);
  console.log(`  - ${aircraftTypesCount} aircraft types (from JSON)`);
  console.log(`  - ${airports.length} airports`);
  console.log(`  - ${operationTypes.length} operation types`);
  console.log(`  - ${flightTypes.length} flight types`);
  console.log(`  - ${delayCodesCount} delay codes (from IATA JSON)`);
  console.log(`  - 3 default users (admin, manager, viewer)`);
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:');
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
