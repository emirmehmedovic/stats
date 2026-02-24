import { PrismaClient, WorkDayStatus } from '@prisma/client';

const prisma = new PrismaClient();

const employeeId = process.argv[2];
if (!employeeId) {
  console.error('Usage: npx tsx scripts/generate-dummy-workdays.ts <employeeId> [daysBack]');
  process.exit(1);
}

const daysBack = Number(process.argv[3] || '60');

function atTime(base: Date, h: number, m: number) {
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
}

function dateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

async function main() {
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: { id: true, firstName: true, lastName: true },
  });

  if (!employee) {
    throw new Error(`Employee not found: ${employeeId}`);
  }

  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (daysBack - 1));

  const existing = await prisma.workDay.findMany({
    where: {
      employeeId,
      date: { gte: start, lte: end },
    },
    select: { date: true },
  });

  const existingKeys = new Set(existing.map((e) => dateKey(new Date(e.date))));
  const toCreate: any[] = [];

  for (let i = 0; i < daysBack; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    day.setHours(0, 0, 0, 0);

    const key = dateKey(day);
    if (existingKeys.has(key)) continue;

    const dow = day.getDay(); // 0 Sun ... 6 Sat
    const isWeekend = dow === 0 || dow === 6;

    const expectedStart = atTime(day, 8, 0);
    const expectedEnd = atTime(day, 16, 0);

    let status: WorkDayStatus = 'COMPLETED';
    let lateMinutes = 0;
    let earlyLeaveMinutes = 0;
    let overtimeMinutes = 0;

    const r = Math.random();
    if (!isWeekend && r < 0.08) status = 'INCOMPLETE';
    if (!isWeekend && r >= 0.08 && r < 0.12) status = 'ABSENT';
    if (isWeekend && r < 0.85) status = 'ABSENT';

    if (status === 'ABSENT') {
      toCreate.push({
        employeeId,
        date: day,
        checkInTime: null,
        checkOutTime: null,
        expectedStartTime: expectedStart,
        expectedEndTime: expectedEnd,
        totalHours: null,
        expectedHours: 8,
        lateMinutes: 0,
        earlyLeaveMinutes: 0,
        overtimeMinutes: 0,
        status,
        notes: 'DUMMY: automatski generisan dan',
        isManualEntry: true,
        calculatedAt: new Date(),
      });
      continue;
    }

    if (isWeekend) {
      lateMinutes = Math.floor(Math.random() * 16); // 0-15
      overtimeMinutes = 30 + Math.floor(Math.random() * 91); // 30-120
      earlyLeaveMinutes = Math.random() < 0.15 ? Math.floor(Math.random() * 16) : 0;
    } else {
      lateMinutes = Math.random() < 0.35 ? 5 + Math.floor(Math.random() * 41) : 0; // 5-45
      overtimeMinutes = Math.random() < 0.30 ? 10 + Math.floor(Math.random() * 81) : 0; // 10-90
      earlyLeaveMinutes = Math.random() < 0.18 ? 5 + Math.floor(Math.random() * 26) : 0; // 5-30
    }

    const checkIn = new Date(expectedStart.getTime() + lateMinutes * 60_000);

    if (status === 'INCOMPLETE') {
      toCreate.push({
        employeeId,
        date: day,
        checkInTime: checkIn,
        checkOutTime: null,
        expectedStartTime: expectedStart,
        expectedEndTime: expectedEnd,
        totalHours: null,
        expectedHours: 8,
        lateMinutes,
        earlyLeaveMinutes: 0,
        overtimeMinutes: 0,
        status,
        notes: 'DUMMY: automatski generisan dan',
        isManualEntry: true,
        calculatedAt: new Date(),
      });
      continue;
    }

    const workedMinutes = Math.max(240, 480 - earlyLeaveMinutes + overtimeMinutes);
    const checkOut = new Date(checkIn.getTime() + workedMinutes * 60_000);
    const totalHours = round2(workedMinutes / 60);

    toCreate.push({
      employeeId,
      date: day,
      checkInTime: checkIn,
      checkOutTime: checkOut,
      expectedStartTime: expectedStart,
      expectedEndTime: expectedEnd,
      totalHours,
      expectedHours: 8,
      lateMinutes,
      earlyLeaveMinutes,
      overtimeMinutes,
      status,
      notes: 'DUMMY: automatski generisan dan',
      isManualEntry: true,
      calculatedAt: new Date(),
    });
  }

  let created = 0;
  if (toCreate.length > 0) {
    const result = await prisma.workDay.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
    created = result.count;
  }

  console.log(
    `Dummy work days done for ${employee.firstName} ${employee.lastName} (${employeeId}). ` +
      `Range: ${dateKey(start)} -> ${dateKey(end)}. Created: ${created}. Skipped existing: ${daysBack - created}.`
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
