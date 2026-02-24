import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

type WorkerAggregate = {
  employeeId: string;
  employeeName: string;
  employeeNumber: string;
  position: string;
  workedDays: number;
  onTimeDays: number;
  totalLateMinutes: number;
  averageLateMinutes: number;
  totalOvertimeMinutes: number;
  punctualityRate: number;
};

function getStartDate(period: string): Date {
  const now = new Date();

  switch (period) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'today': {
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      return start;
    }
    default:
      return new Date('2000-01-01');
  }
}

function aggregateWorkers(
  workDays: Array<{
    employeeId: string;
    lateMinutes: number | null;
    overtimeMinutes: number | null;
    employee: {
      firstName: string;
      lastName: string;
      employeeNumber: string;
      position: string;
    };
  }>
): WorkerAggregate[] {
  const map = new Map<string, WorkerAggregate>();

  for (const day of workDays) {
    const lateMinutes = day.lateMinutes || 0;
    const overtimeMinutes = day.overtimeMinutes || 0;
    const existing = map.get(day.employeeId);

    if (!existing) {
      map.set(day.employeeId, {
        employeeId: day.employeeId,
        employeeName: `${day.employee.firstName} ${day.employee.lastName}`,
        employeeNumber: day.employee.employeeNumber,
        position: day.employee.position,
        workedDays: 1,
        onTimeDays: lateMinutes <= 0 ? 1 : 0,
        totalLateMinutes: lateMinutes,
        averageLateMinutes: 0,
        totalOvertimeMinutes: overtimeMinutes,
        punctualityRate: 0,
      });
      continue;
    }

    existing.workedDays += 1;
    existing.onTimeDays += lateMinutes <= 0 ? 1 : 0;
    existing.totalLateMinutes += lateMinutes;
    existing.totalOvertimeMinutes += overtimeMinutes;
  }

  const result = Array.from(map.values());

  for (const worker of result) {
    worker.averageLateMinutes = worker.workedDays > 0
      ? Math.round((worker.totalLateMinutes / worker.workedDays) * 100) / 100
      : 0;
    worker.punctualityRate = worker.workedDays > 0
      ? Math.round((worker.onTimeDays / worker.workedDays) * 10000) / 100
      : 0;
  }

  return result;
}

// GET /api/access-control/stats - Dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';
    const eventsLimitRaw = Number(searchParams.get('eventsLimit') || '10');
    const eventsOffsetRaw = Number(searchParams.get('eventsOffset') || '0');

    const eventsLimit = Number.isFinite(eventsLimitRaw) ? Math.min(Math.max(eventsLimitRaw, 1), 100) : 10;
    const eventsOffset = Number.isFinite(eventsOffsetRaw) ? Math.max(eventsOffsetRaw, 0) : 0;

    const startDate = getStartDate(period);

    const [
      totalEvents,
      uniqueUsers,
      recentEvents,
      completedWorkDays,
    ] = await Promise.all([
      prisma.accessControlEvent.count({
        where: { eventTime: { gte: startDate } },
      }),
      prisma.accessControlEvent.groupBy({
        by: ['userId'],
        where: {
          eventTime: { gte: startDate },
          userId: { not: null },
        },
      }),
      prisma.accessControlEvent.findMany({
        where: { eventTime: { gte: startDate } },
        include: {
          user: {
            select: {
              firstname: true,
              lastname: true,
            },
          },
          place: {
            select: {
              placeName: true,
            },
          },
        },
        orderBy: { eventTime: 'desc' },
        skip: eventsOffset,
        take: eventsLimit,
      }),
      prisma.workDay.findMany({
        where: {
          date: { gte: startDate },
          status: 'COMPLETED',
        },
        select: {
          employeeId: true,
          lateMinutes: true,
          overtimeMinutes: true,
          employee: {
            select: {
              firstName: true,
              lastName: true,
              employeeNumber: true,
              position: true,
            },
          },
        },
      }),
    ]);

    const workers = aggregateWorkers(completedWorkDays);

    const topWorkersByPunctuality = [...workers]
      .sort((a, b) => {
        if (b.punctualityRate !== a.punctualityRate) {
          return b.punctualityRate - a.punctualityRate;
        }
        return b.workedDays - a.workedDays;
      })
      .slice(0, 10);

    const topWorkersByLateMinutes = [...workers]
      .sort((a, b) => {
        if (b.totalLateMinutes !== a.totalLateMinutes) {
          return b.totalLateMinutes - a.totalLateMinutes;
        }
        return b.averageLateMinutes - a.averageLateMinutes;
      })
      .slice(0, 10);

    const topWorkersByOvertime = [...workers]
      .sort((a, b) => b.totalOvertimeMinutes - a.totalOvertimeMinutes)
      .slice(0, 10);

    return NextResponse.json({
      period,
      totalEvents,
      uniqueUsers: uniqueUsers.length,
      recentEvents: recentEvents.map((event) => ({
        id: event.id,
        eventTime: event.eventTime,
        userName: event.user
          ? `${event.user.firstname || ''} ${event.user.lastname || ''}`.trim()
          : 'Unknown',
        placeName: event.place?.placeName || 'Unknown',
        eventId: event.eventId,
      })),
      recentEventsHasMore: eventsOffset + recentEvents.length < totalEvents,
      topWorkersByPunctuality,
      topWorkersByLateMinutes,
      topWorkersByOvertime,
    });
  } catch (error: any) {
    console.error('Stats API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
