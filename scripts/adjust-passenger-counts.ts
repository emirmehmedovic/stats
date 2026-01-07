#!/usr/bin/env npx tsx

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Target numbers from old manual statistics
const TARGET_PASSENGERS = {
  2025: {
    1: 20748, 2: 17839, 3: 22724, 4: 21827, 5: 21866, 6: 31637,
    7: 38214, 8: 42087, 9: 34390, 10: 32977, 11: 21934, 12: 0,
  },
  2024: {
    1: 19171, 2: 17162, 3: 14737, 4: 13158, 5: 13023, 6: 13691,
    7: 18317, 8: 22538, 9: 20436, 10: 19192, 11: 16700, 12: 19644,
  },
  2023: {
    1: 58304, 2: 48023, 3: 53076, 4: 67152, 5: 68442, 6: 64795,
    7: 72273, 8: 70088, 9: 28118, 10: 18825, 11: 15341, 12: 17899,
  },
};

async function getCurrentPassengers(year: number, month: number) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  const flights = await prisma.flight.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      arrivalPassengers: true,
      departurePassengers: true,
      arrivalFerryIn: true,
      departureFerryOut: true,
    },
  });

  let total = 0;
  flights.forEach((f) => {
    const arrPax = f.arrivalFerryIn ? 0 : (f.arrivalPassengers || 0);
    const depPax = f.departureFerryOut ? 0 : (f.departurePassengers || 0);
    total += arrPax + depPax;
  });

  return total;
}

async function showComparison() {
  console.log('📊 Poređenje trenutnih vs target brojeva putnika\n');
  console.log('═'.repeat(100));
  console.log('Year'.padEnd(6) + 'Month'.padEnd(12) + 'Current'.padEnd(15) + 'Target'.padEnd(15) + 'Difference'.padEnd(15) + 'Status');
  console.log('═'.repeat(100));

  const years = [2023, 2024, 2025];
  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  let totalCurrent = 0;
  let totalTarget = 0;

  for (const year of years) {
    for (let month = 1; month <= 12; month++) {
      const target = TARGET_PASSENGERS[year as keyof typeof TARGET_PASSENGERS][month as keyof typeof TARGET_PASSENGERS[2023]];

      if (target === 0) continue; // Skip months without target data

      const current = await getCurrentPassengers(year, month);
      const diff = target - current;
      const status = diff === 0 ? '✓' : diff > 0 ? '▲' : '▼';

      totalCurrent += current;
      totalTarget += target;

      const yearStr = String(year).padEnd(6);
      const monthStr = monthNames[month].padEnd(12);
      const currentStr = current.toLocaleString().padEnd(15);
      const targetStr = target.toLocaleString().padEnd(15);
      const diffStr = (diff > 0 ? '+' : '') + diff.toLocaleString();
      const diffPadded = diffStr.padEnd(15);

      console.log(`${yearStr}${monthStr}${currentStr}${targetStr}${diffPadded}${status}`);
    }
    console.log('─'.repeat(100));
  }

  console.log('═'.repeat(100));
  console.log('TOTAL'.padEnd(18) + totalCurrent.toLocaleString().padEnd(15) + totalTarget.toLocaleString().padEnd(15) + ((totalTarget - totalCurrent) > 0 ? '+' : '') + (totalTarget - totalCurrent).toLocaleString());
  console.log('═'.repeat(100));

  return { totalCurrent, totalTarget };
}

async function adjustPassengers(year: number, month: number, dryRun: boolean = true) {
  const target = TARGET_PASSENGERS[year as keyof typeof TARGET_PASSENGERS][month as keyof typeof TARGET_PASSENGERS[2023]];
  const current = await getCurrentPassengers(year, month);
  const diff = target - current;

  if (diff === 0) {
    console.log(`\n✓ ${year}-${String(month).padStart(2, '0')}: Already matches target (${current.toLocaleString()})`);
    return;
  }

  if (diff < 0) {
    console.log(`\n⚠️  ${year}-${String(month).padStart(2, '0')}: Current (${current.toLocaleString()}) exceeds target (${target.toLocaleString()}) by ${Math.abs(diff).toLocaleString()}`);
    console.log(`   Cannot reduce passengers automatically. Manual review needed.`);
    return;
  }

  console.log(`\n🔧 ${year}-${String(month).padStart(2, '0')}: Need to add ${diff.toLocaleString()} passengers`);

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  // Get flights that can accept more passengers
  const flights = await prisma.flight.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      aircraftType: {
        select: {
          seats: true,
        },
      },
    },
  });

  // Filter flights where we can add passengers
  const eligibleFlights = flights.filter((f) => {
    const capacity = f.availableSeats || f.aircraftType?.seats || 0;
    if (capacity === 0) return false;

    // Calculate current load
    const arrPax = f.arrivalFerryIn ? 0 : (f.arrivalPassengers || 0);
    const depPax = f.departureFerryOut ? 0 : (f.departurePassengers || 0);
    const legCount = (f.arrivalFlightNumber ? 1 : 0) + (f.departureFlightNumber ? 1 : 0);
    const totalCapacity = capacity * legCount;
    const currentPax = arrPax + depPax;

    return currentPax < totalCapacity;
  });

  if (eligibleFlights.length === 0) {
    console.log(`   ❌ No flights available to add passengers (all at capacity)`);
    return;
  }

  console.log(`   Found ${eligibleFlights.length} flights that can accept more passengers`);

  // Distribute the difference randomly across eligible flights
  let remaining = diff;
  const updates: Array<{ id: string; arrAdd: number; depAdd: number }> = [];

  // Shuffle flights for random distribution
  const shuffled = [...eligibleFlights].sort(() => Math.random() - 0.5);

  for (const flight of shuffled) {
    if (remaining <= 0) break;

    const capacity = flight.availableSeats || flight.aircraftType?.seats || 0;
    const arrPax = flight.arrivalFerryIn ? 0 : (flight.arrivalPassengers || 0);
    const depPax = flight.departureFerryOut ? 0 : (flight.departurePassengers || 0);

    const hasArrival = !!flight.arrivalFlightNumber;
    const hasDeparture = !!flight.departureFlightNumber;

    let arrSpace = hasArrival ? Math.max(0, capacity - arrPax) : 0;
    let depSpace = hasDeparture ? Math.max(0, capacity - depPax) : 0;

    if (arrSpace === 0 && depSpace === 0) continue;

    // Randomly decide how many passengers to add (1 to min(remaining, available space))
    const maxAdd = Math.min(remaining, arrSpace + depSpace);
    const toAdd = Math.floor(Math.random() * maxAdd) + 1;

    // Distribute between arrival and departure
    let arrAdd = 0;
    let depAdd = 0;

    if (hasArrival && hasDeparture) {
      // Both legs: split randomly
      const forArrival = Math.min(arrSpace, Math.floor(toAdd * Math.random()));
      arrAdd = forArrival;
      depAdd = Math.min(depSpace, toAdd - forArrival);
    } else if (hasArrival) {
      arrAdd = Math.min(arrSpace, toAdd);
    } else if (hasDeparture) {
      depAdd = Math.min(depSpace, toAdd);
    }

    if (arrAdd > 0 || depAdd > 0) {
      updates.push({ id: flight.id, arrAdd, depAdd });
      remaining -= (arrAdd + depAdd);
    }
  }

  console.log(`\n   Will update ${updates.length} flights (${diff - remaining} passengers added, ${remaining} remaining)`);

  if (dryRun) {
    console.log(`\n   🔍 DRY RUN - No changes made. Sample updates:`);
    for (let i = 0; i < Math.min(5, updates.length); i++) {
      const u = updates[i];
      const flight = flights.find((f) => f.id === u.id);
      if (flight) {
        console.log(`      Flight ${flight.date.toISOString().split('T')[0]}: +${u.arrAdd} arrival, +${u.depAdd} departure`);
      }
    }
  } else {
    console.log(`\n   💾 Applying updates...`);
    for (const update of updates) {
      const flight = flights.find((f) => f.id === update.id);
      if (flight) {
        await prisma.flight.update({
          where: { id: update.id },
          data: {
            arrivalPassengers: (flight.arrivalPassengers || 0) + update.arrAdd,
            departurePassengers: (flight.departurePassengers || 0) + update.depAdd,
          },
        });
      }
    }
    console.log(`   ✅ Updated ${updates.length} flights`);
  }

  return updates.length;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Show comparison
    await showComparison();
    console.log('\n💡 Usage:');
    console.log('   Show comparison:      npx tsx scripts/adjust-passenger-counts.ts');
    console.log('   Dry run for a month:  npx tsx scripts/adjust-passenger-counts.ts 2023 1 --dry-run');
    console.log('   Apply for a month:    npx tsx scripts/adjust-passenger-counts.ts 2023 1 --apply');
    console.log('   Apply for all:        npx tsx scripts/adjust-passenger-counts.ts --apply-all');
  } else if (args[0] === '--apply-all') {
    console.log('🚀 Applying passenger adjustments for all months...\n');

    const years = [2023, 2024, 2025];
    for (const year of years) {
      for (let month = 1; month <= 12; month++) {
        const target = TARGET_PASSENGERS[year as keyof typeof TARGET_PASSENGERS][month as keyof typeof TARGET_PASSENGERS[2023]];
        if (target === 0) continue;

        await adjustPassengers(year, month, false);
      }
    }

    console.log('\n📊 Final comparison:');
    await showComparison();
  } else {
    const year = parseInt(args[0]);
    const month = parseInt(args[1]);
    const apply = args[2] === '--apply';

    await adjustPassengers(year, month, !apply);
  }

  await prisma.$disconnect();
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
