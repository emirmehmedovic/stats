import { PrismaClient, WorkDayStatus } from '@prisma/client';
import { TIME_ZONE_SARAJEVO, dateOnlyToUtc, getDateStringInTimeZone, makeDateInTimeZone } from '../src/lib/dates';

const prisma = new PrismaClient();

const employeeId = process.argv[2];
const daysBack = Number(process.argv[3] || '60');

if (!employeeId) {
  console.error('Usage: npx tsx scripts/generate-employee-worktime-sim.ts <employeeId> [daysBack]');
  process.exit(1);
}

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function timeAt(dateStr: string, hour: number, minute: number) {
  const t = `${pad2(hour)}:${pad2(minute)}:00`;
  return makeDateInTimeZone(dateStr, t, TIME_ZONE_SARAJEVO) || dateOnlyToUtc(dateStr);
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

async function ensureActorAndPlaces() {
  const userCount = await prisma.accessControlUser.count();
  let user = await prisma.accessControlUser.findFirst({ orderBy: { externalUserId: 'asc' } });
  if (!user) {
    user = await prisma.accessControlUser.create({
      data: {
        externalUserId: 900001,
        firstname: 'Dummy',
        lastname: 'Employee',
        card: 'CARD-DUMMY-001',
      },
    });
  }

  // Ensure at least 4 places for movement simulation
  let places = await prisma.accessControlPlace.findMany({
    orderBy: { externalPlaceId: 'asc' },
    take: 4,
  });

  if (places.length < 4) {
    const existing = await prisma.accessControlPlace.findMany({ select: { externalPlaceId: true } });
    let nextExternal = existing.length > 0 ? Math.max(...existing.map((p) => p.externalPlaceId)) + 1 : 700001;

    const names = ['Glavni ulaz', 'Terminal A', 'Security Gate', 'Administracija'];
    for (let i = places.length; i < 4; i += 1) {
      const created = await prisma.accessControlPlace.create({
        data: {
          externalPlaceId: nextExternal++,
          placeName: names[i] || `Lokacija ${i + 1}`,
        },
      });
      places.push(created);
    }
  }

  return { user, places };
}

async function main() {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!employee) {
    throw new Error(`Employee not found: ${employeeId}`);
  }

  // Set schedule Monday-Friday 08:00-16:00
  await prisma.employee.update({
    where: { id: employeeId },
    data: {
      workScheduleType: 'STANDARD',
      standardStartTime: '08:00',
      standardEndTime: '16:00',
      expectedHoursPerDay: 8,
      shiftStartTime1: null,
      shiftEndTime1: null,
      shiftStartTime2: null,
      shiftEndTime2: null,
      shiftRotationStart: null,
    },
  });

  const endKey = getDateStringInTimeZone(new Date(), TIME_ZONE_SARAJEVO);
  const end = dateOnlyToUtc(endKey);
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - (daysBack - 1));

  const { user, places } = await ensureActorAndPlaces();

  // Ensure mapping exists (optional but useful for consistency)
  await prisma.accessControlMapping.upsert({
    where: {
      employeeId_accessControlUserId: {
        employeeId,
        accessControlUserId: user.id,
      },
    },
    update: { isActive: true, isPrimary: true },
    create: {
      employeeId,
      accessControlUserId: user.id,
      isActive: true,
      isPrimary: true,
    },
  });

  // Clear old generated work days + linked events in target range
  const existingDays = await prisma.workDay.findMany({
    where: { employeeId, date: { gte: start, lte: end } },
    select: { id: true },
  });
  const dayIds = existingDays.map((d) => d.id);

  if (dayIds.length > 0) {
    const linked = await prisma.workDayEvent.findMany({
      where: { workDayId: { in: dayIds } },
      select: { eventId: true },
    });
    const eventIds = linked.map((l) => l.eventId);

    await prisma.workDayEvent.deleteMany({ where: { workDayId: { in: dayIds } } });
    await prisma.workDay.deleteMany({ where: { id: { in: dayIds } } });

    if (eventIds.length > 0) {
      await prisma.accessControlEvent.deleteMany({ where: { id: { in: eventIds } } });
    }
  }

  const maxExternalEvent = await prisma.accessControlEvent.aggregate({ _max: { externalEventId: true } });
  let nextExternalEventId = (maxExternalEvent._max.externalEventId || 1000000) + 1;

  let createdDays = 0;
  let createdEvents = 0;

  for (let i = 0; i < daysBack; i += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    const dayDate = day.toISOString().split('T')[0];
    const weekday = day.getUTCDay();

    // Monday-Friday only
    if (weekday === 0 || weekday === 6) {
      continue;
    }

    // deterministic "variation" by date index
    const seed = i + 1;
    const late = seed % 5 === 0 ? clamp(3 + (seed % 18), 0, 25) : 0;
    const overtime = seed % 4 === 0 ? 10 + (seed % 45) : 0;

    const expectedStart = timeAt(dayDate, 8, 0);
    const expectedEnd = timeAt(dayDate, 16, 0);

    const checkIn = new Date(expectedStart.getTime() + late * 60_000);
    const mid1 = timeAt(dayDate, 10, (seed * 7) % 60);
    const mid2 = timeAt(dayDate, 12, (seed * 11) % 60);
    const mid3 = timeAt(dayDate, 14, (seed * 13) % 60);

    const earlyLeave = seed % 9 === 0 ? 5 + (seed % 10) : 0;
    const checkOut = new Date(expectedEnd.getTime() - earlyLeave * 60_000 + overtime * 60_000);

    const totalHours = Math.round(((checkOut.getTime() - checkIn.getTime()) / 3_600_000) * 100) / 100;
    const lateMinutes = Math.max(0, Math.round((checkIn.getTime() - expectedStart.getTime()) / 60_000));
    const earlyLeaveMinutes = Math.max(0, Math.round((expectedEnd.getTime() - checkOut.getTime()) / 60_000));
    const overtimeMinutes = Math.max(0, Math.round((totalHours - 8) * 60));

    const workDay = await prisma.workDay.create({
      data: {
        employeeId,
        date: dateOnlyToUtc(dayDate),
        checkInTime: checkIn,
        checkOutTime: checkOut,
        expectedStartTime: expectedStart,
        expectedEndTime: expectedEnd,
        totalHours,
        expectedHours: 8,
        lateMinutes,
        earlyLeaveMinutes,
        overtimeMinutes,
        status: 'COMPLETED' as WorkDayStatus,
        notes: 'SIMULACIJA: generisani podaci sa dnevnim otkucavanjima',
        isManualEntry: false,
        calculatedAt: new Date(),
      },
    });

    const eventDefs = [
      { t: checkIn, place: places[0], eventId: 20, in: true, out: false, internal: false },
      { t: mid1, place: places[1], eventId: 22, in: false, out: false, internal: true },
      { t: mid2, place: places[2], eventId: 23, in: false, out: false, internal: true },
      { t: mid3, place: places[3], eventId: 24, in: false, out: false, internal: true },
      { t: checkOut, place: places[0], eventId: 21, in: false, out: true, internal: false },
    ];

    for (const ev of eventDefs) {
      const event = await prisma.accessControlEvent.create({
        data: {
          externalEventId: nextExternalEventId++,
          userId: user.id,
          placeId: ev.place.id,
          eventTime: ev.t,
          eventId: ev.eventId,
          rawData: {
            source: 'simulation',
            employeeId,
            employeeName: `${employee.firstName} ${employee.lastName}`,
          },
        },
      });

      await prisma.workDayEvent.create({
        data: {
          workDayId: workDay.id,
          eventId: event.id,
          isCheckIn: ev.in,
          isCheckOut: ev.out,
          isInternal: ev.internal,
        },
      });

      createdEvents += 1;
    }

    createdDays += 1;
  }

  console.log(
    `Simulation done for ${employee.firstName} ${employee.lastName} (${employeeId}). ` +
    `Range ${start.toISOString().split('T')[0]} -> ${end.toISOString().split('T')[0]}, created workDays=${createdDays}, events=${createdEvents}.`
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
