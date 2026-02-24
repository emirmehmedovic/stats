import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type DecimalLike = { toNumber: () => number };

type EventWithFlags = {
  id: string;
  eventTime: Date;
  isEntryExit: boolean;
  isInternal: boolean;
};

const DEFAULT_START = '08:00';
const DEFAULT_END = '16:00';
const DEFAULT_SHIFT_1_START = '06:00';
const DEFAULT_SHIFT_1_END = '14:00';
const DEFAULT_SHIFT_2_START = '14:00';
const DEFAULT_SHIFT_2_END = '22:00';

function buildDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseTimeToDate(dateKey: string, timeValue?: string | null) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const [hours, minutes] = (timeValue || DEFAULT_START).split(':').map(Number);
  return new Date(year, month - 1, day, hours, minutes, 0, 0);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getDateRange(start: Date, end: Date) {
  const dates: Date[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);

  while (cursor <= endDate) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function diffDays(a: Date, b: Date) {
  const start = new Date(a);
  const end = new Date(b);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diffMs = start.getTime() - end.getTime();
  return Math.floor(diffMs / 86400000);
}

type ScheduleWindow = {
  isOff: boolean;
  start: Date | null;
  end: Date | null;
  expectedHours: number;
};

function buildScheduleWindow(
  date: Date,
  employee: {
    workScheduleType: 'STANDARD' | 'SHIFT_WORK';
    standardStartTime: string | null;
    standardEndTime: string | null;
    expectedHoursPerDay: number | DecimalLike | null;
    shiftStartTime1: string | null;
    shiftEndTime1: string | null;
    shiftStartTime2: string | null;
    shiftEndTime2: string | null;
    shiftRotationStart: Date | null;
  }
): ScheduleWindow {
  const dateKey = buildDateKey(date);
  const expectedHoursFallback = employee.expectedHoursPerDay === null
    ? 8
    : typeof employee.expectedHoursPerDay === 'number'
      ? employee.expectedHoursPerDay
      : employee.expectedHoursPerDay.toNumber();

  if (employee.workScheduleType === 'SHIFT_WORK') {
    if (!employee.shiftRotationStart) {
      const start = parseTimeToDate(dateKey, employee.standardStartTime || DEFAULT_START);
      const end = parseTimeToDate(dateKey, employee.standardEndTime || DEFAULT_END);
      if (end <= start) {
        end.setDate(end.getDate() + 1);
      }
      return {
        isOff: false,
        start,
        end,
        expectedHours: Math.round(((end.getTime() - start.getTime()) / 3600000) * 100) / 100,
      };
    }

    const rotationStart = new Date(employee.shiftRotationStart);
    const cycleDay = ((diffDays(date, rotationStart) % 6) + 6) % 6;

    if (cycleDay >= 4) {
      return {
        isOff: true,
        start: null,
        end: null,
        expectedHours: 0,
      };
    }

    const shiftStart = cycleDay <= 1
      ? (employee.shiftStartTime1 || DEFAULT_SHIFT_1_START)
      : (employee.shiftStartTime2 || DEFAULT_SHIFT_2_START);
    const shiftEnd = cycleDay <= 1
      ? (employee.shiftEndTime1 || DEFAULT_SHIFT_1_END)
      : (employee.shiftEndTime2 || DEFAULT_SHIFT_2_END);

    const start = parseTimeToDate(dateKey, shiftStart);
    const end = parseTimeToDate(dateKey, shiftEnd);
    if (end <= start) {
      end.setDate(end.getDate() + 1);
    }

    const expectedHours = Math.round(((end.getTime() - start.getTime()) / 3600000) * 100) / 100;
    return {
      isOff: false,
      start,
      end,
      expectedHours: expectedHours || expectedHoursFallback,
    };
  }

  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return {
      isOff: true,
      start: null,
      end: null,
      expectedHours: 0,
    };
  }

  const start = parseTimeToDate(dateKey, employee.standardStartTime || DEFAULT_START);
  const end = parseTimeToDate(dateKey, employee.standardEndTime || DEFAULT_END);
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  return {
    isOff: false,
    start,
    end,
    expectedHours: expectedHoursFallback,
  };
}

function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.WORK_TIME_API_KEY || process.env.ACCESS_CONTROL_API_KEY;

  if (!expectedKey) {
    console.error('WORK_TIME_API_KEY/ACCESS_CONTROL_API_KEY not configured');
    return false;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const providedKey = authHeader.substring(7);
  return providedKey === expectedKey;
}

// POST /api/work-time/process
// Body: { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD", dryRun?: boolean }
export async function POST(request: NextRequest) {
  try {
    if (!validateApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { startDate, endDate, dryRun, rebuild } = body || {};

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required (YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59.999`);

    const mappings = await prisma.accessControlMapping.findMany({
      where: { isActive: true },
      select: { employeeId: true, accessControlUserId: true },
    });

    if (mappings.length === 0) {
      return NextResponse.json({ success: true, processed: 0, message: 'No active mappings.' });
    }

    const accessUserToEmployee = new Map<string, string>();
    const employeeIds = new Set<string>();
    const mappedAccessUsers = new Set<string>();

    for (const mapping of mappings) {
      accessUserToEmployee.set(mapping.accessControlUserId, mapping.employeeId);
      employeeIds.add(mapping.employeeId);
      mappedAccessUsers.add(mapping.accessControlUserId);
    }

    const employees = await prisma.employee.findMany({
      where: { id: { in: Array.from(employeeIds) } },
      select: {
        id: true,
        workScheduleType: true,
        standardStartTime: true,
        standardEndTime: true,
        expectedHoursPerDay: true,
        shiftStartTime1: true,
        shiftEndTime1: true,
        shiftStartTime2: true,
        shiftEndTime2: true,
        shiftRotationStart: true,
      },
    });

    const employeeMap = new Map(employees.map((employee) => [employee.id, employee]));

    const placeConfigs = await prisma.placeConfiguration.findMany({
      where: { isActive: true },
      select: { externalPlaceId: true, type: true },
    });

    let entryExitPlaceIds = new Set<string>();
    let internalPlaceIds = new Set<string>();

    if (placeConfigs.length > 0) {
      const configPlaceIds = placeConfigs.map((config) => config.externalPlaceId);
      const places = await prisma.accessControlPlace.findMany({
        where: { externalPlaceId: { in: configPlaceIds } },
        select: { id: true, externalPlaceId: true },
      });

      const placeIdMap = new Map(places.map((place) => [place.externalPlaceId, place.id]));

      for (const config of placeConfigs) {
        const internalId = placeIdMap.get(config.externalPlaceId);
        if (!internalId) continue;

        if (config.type === 'ENTRY_EXIT') {
          entryExitPlaceIds.add(internalId);
        } else if (config.type === 'INTERNAL') {
          internalPlaceIds.add(internalId);
        }
      }
    }

    const rangeStart = addDays(start, -1);
    const rangeEnd = addDays(end, 1);

    const events = await prisma.accessControlEvent.findMany({
      where: {
        eventTime: { gte: rangeStart, lte: rangeEnd },
        userId: { in: Array.from(mappedAccessUsers) },
      },
      orderBy: { eventTime: 'asc' },
      select: {
        id: true,
        userId: true,
        placeId: true,
        eventTime: true,
      },
    });

    const eventsByEmployee = new Map<string, EventWithFlags[]>();

    for (const event of events) {
      if (!event.userId) continue;
      const employeeId = accessUserToEmployee.get(event.userId);
      if (!employeeId) continue;

      const isEntryExit = entryExitPlaceIds.size > 0
        ? (event.placeId ? entryExitPlaceIds.has(event.placeId) : false)
        : Boolean(event.placeId);

      const isInternal = event.placeId ? internalPlaceIds.has(event.placeId) : true;

      const list = eventsByEmployee.get(employeeId) || [];
      list.push({
        id: event.id,
        eventTime: event.eventTime,
        isEntryExit,
        isInternal,
      });
      eventsByEmployee.set(employeeId, list);
    }

    let processed = 0;
    let linkedEvents = 0;

    const dates = getDateRange(start, end);

    if (rebuild && !dryRun) {
      const workDaysToDelete = await prisma.workDay.findMany({
        where: {
          employeeId: { in: Array.from(employeeIds) },
          date: { gte: start, lte: end },
        },
        select: { id: true },
      });
      const workDayIds = workDaysToDelete.map((day) => day.id);

      if (workDayIds.length > 0) {
        await prisma.workDayEvent.deleteMany({
          where: { workDayId: { in: workDayIds } },
        });
        await prisma.workDay.deleteMany({
          where: { id: { in: workDayIds } },
        });
      }
    }

    for (const employee of employees) {
      const employeeEvents = eventsByEmployee.get(employee.id) || [];

      for (const date of dates) {
        const schedule = buildScheduleWindow(date, employee);
        const windowStart = schedule.start;
        const windowEnd = schedule.end;

        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = addDays(dayStart, 1);
        dayEnd.setMilliseconds(-1);

        const eventsForWindow = schedule.isOff
          ? employeeEvents.filter((event) => event.eventTime >= dayStart && event.eventTime <= dayEnd)
          : (windowStart && windowEnd)
            ? employeeEvents.filter((event) => event.eventTime >= windowStart && event.eventTime <= windowEnd)
            : [];

        const entryExitEvents = eventsForWindow.filter((event) => event.isEntryExit);
        if (entryExitEvents.length === 0) {
          continue;
        }

        if (schedule.isOff) {
          schedule.start = dayStart;
          schedule.end = dayEnd;
        }

        const checkIn = entryExitEvents[0];
        const checkOut = entryExitEvents[entryExitEvents.length - 1];

        const totalHours = checkIn && checkOut
          ? Math.round(((checkOut.eventTime.getTime() - checkIn.eventTime.getTime()) / 3600000) * 100) / 100
          : null;

        const expectedStart = schedule.start || dayStart;
        const expectedEnd = schedule.end || dayEnd;

        const lateMinutes = checkIn
          ? Math.max(0, Math.round((checkIn.eventTime.getTime() - expectedStart.getTime()) / 60000))
          : 0;

        const earlyLeaveMinutes = checkOut
          ? Math.max(0, Math.round((expectedEnd.getTime() - checkOut.eventTime.getTime()) / 60000))
          : 0;

        const expectedHours = schedule.expectedHours;
        const overtimeMinutes = totalHours !== null
          ? Math.max(0, Math.round((totalHours - expectedHours) * 60))
          : 0;

        const workDate = new Date(date);
        workDate.setHours(0, 0, 0, 0);

        if (dryRun) {
          processed += 1;
          linkedEvents += eventsForWindow.length;
          continue;
        }

        await prisma.$transaction(async (tx) => {
          const workDay = await tx.workDay.upsert({
            where: {
              employeeId_date: {
                employeeId: employee.id,
                date: workDate,
              },
            },
            update: {
              checkInTime: checkIn?.eventTime || null,
              checkOutTime: checkOut?.eventTime || null,
              expectedStartTime: expectedStart,
              expectedEndTime: expectedEnd,
              totalHours,
              expectedHours,
              lateMinutes,
              earlyLeaveMinutes,
              overtimeMinutes,
              status: checkIn && checkOut ? 'COMPLETED' : 'INCOMPLETE',
              isManualEntry: false,
              calculatedAt: new Date(),
            },
            create: {
              employeeId: employee.id,
              date: workDate,
              checkInTime: checkIn?.eventTime || null,
              checkOutTime: checkOut?.eventTime || null,
              expectedStartTime: expectedStart,
              expectedEndTime: expectedEnd,
              totalHours,
              expectedHours,
              lateMinutes,
              earlyLeaveMinutes,
              overtimeMinutes,
              status: checkIn && checkOut ? 'COMPLETED' : 'INCOMPLETE',
              isManualEntry: false,
            },
          });

          await tx.workDayEvent.deleteMany({
            where: { workDayId: workDay.id },
          });

          await tx.workDayEvent.createMany({
            data: eventsForWindow.map((event) => ({
              workDayId: workDay.id,
              eventId: event.id,
              isCheckIn: event.id === checkIn?.id,
              isCheckOut: event.id === checkOut?.id,
              isInternal: event.isInternal,
            })),
            skipDuplicates: true,
          });

          processed += 1;
          linkedEvents += eventsForWindow.length;
        });
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      linkedEvents,
      rebuild: Boolean(rebuild),
    });
  } catch (error) {
    console.error('Error processing work time:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process work time' },
      { status: 500 }
    );
  }
}
