import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanup() {
  console.log('🧹 Starting database cleanup...\n');

  try {
    // Delete in correct order (respecting foreign keys)

    console.log('📊 Deleting FlightDelay records...');
    const deletedFlightDelays = await prisma.flightDelay.deleteMany({});
    console.log(`   ✅ Deleted ${deletedFlightDelays.count} FlightDelay records`);

    console.log('📊 Deleting Flight records...');
    const deletedFlights = await prisma.flight.deleteMany({});
    console.log(`   ✅ Deleted ${deletedFlights.count} Flight records`);

    console.log('📊 Deleting DailyOperationsVerification records...');
    const deletedDailyOps = await prisma.dailyOperationsVerification.deleteMany({});
    console.log(`   ✅ Deleted ${deletedDailyOps.count} DailyOperationsVerification records`);

    console.log('📊 Deleting AirlineDelayCode records...');
    const deletedAirlineDelayCodes = await prisma.airlineDelayCode.deleteMany({});
    console.log(`   ✅ Deleted ${deletedAirlineDelayCodes.count} AirlineDelayCode records`);

    console.log('📊 Deleting DelayCode records...');
    const deletedDelayCodes = await prisma.delayCode.deleteMany({});
    console.log(`   ✅ Deleted ${deletedDelayCodes.count} DelayCode records`);

    console.log('📊 Deleting Airline records...');
    const deletedAirlines = await prisma.airline.deleteMany({});
    console.log(`   ✅ Deleted ${deletedAirlines.count} Airline records`);

    console.log('📊 Deleting Airport records...');
    const deletedAirports = await prisma.airport.deleteMany({});
    console.log(`   ✅ Deleted ${deletedAirports.count} Airport records`);

    console.log('📊 Deleting AircraftType records...');
    const deletedAircraftTypes = await prisma.aircraftType.deleteMany({});
    console.log(`   ✅ Deleted ${deletedAircraftTypes.count} AircraftType records`);

    console.log('\n' + '='.repeat(80));
    console.log('✅ DATABASE CLEANUP COMPLETED');
    console.log('='.repeat(80));
    console.log('\n📋 Summary:');
    console.log(`   - FlightDelay: ${deletedFlightDelays.count}`);
    console.log(`   - Flight: ${deletedFlights.count}`);
    console.log(`   - DailyOperationsVerification: ${deletedDailyOps.count}`);
    console.log(`   - AirlineDelayCode: ${deletedAirlineDelayCodes.count}`);
    console.log(`   - DelayCode: ${deletedDelayCodes.count}`);
    console.log(`   - Airline: ${deletedAirlines.count}`);
    console.log(`   - Airport: ${deletedAirports.count}`);
    console.log(`   - AircraftType: ${deletedAircraftTypes.count}`);
    console.log('\n✅ PRESERVED:');
    console.log(`   - OperationType (not deleted)`);
    console.log(`   - User (not deleted)`);
    console.log(`   - Employee, License, Sector (not deleted)`);
    console.log(`   - Reports, Analytics (not deleted)`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanup()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
