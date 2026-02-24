import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';

// GET /api/employees/[id]/work-days
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromCookie(request.headers.get('cookie'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId } = await params;
    const searchParams = request.nextUrl.searchParams;

    // Parse date range from query params
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '30');

    let where: any = { employeeId };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) {
        where.date.gte = new Date(startDate);
      }
      if (endDate) {
        where.date.lte = new Date(endDate);
      }
    }

    const workDays = await prisma.workDay.findMany({
      where,
      orderBy: {
        date: 'desc',
      },
      take: limit,
      include: {
        events: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            isCheckIn: true,
            isCheckOut: true,
            isInternal: true,
            event: {
              select: {
                id: true,
                eventTime: true,
                eventId: true,
                place: {
                  select: {
                    placeName: true,
                    externalPlaceId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: workDays });
  } catch (error) {
    console.error('Error fetching work days:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch work days' },
      { status: 500 }
    );
  }
}

// POST /api/employees/[id]/work-days
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = getTokenFromCookie(request.headers.get('cookie'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id: employeeId } = await params;
    const body = await request.json();
    const {
      date,
      checkInTime,
      checkOutTime,
      notes,
    } = body;

    // Create manual work day entry
    const workDay = await prisma.workDay.create({
      data: {
        employeeId,
        date: new Date(date),
        checkInTime: checkInTime ? new Date(checkInTime) : null,
        checkOutTime: checkOutTime ? new Date(checkOutTime) : null,
        notes,
        isManualEntry: true,
        manualEntryBy: user.id,
        status: 'IN_PROGRESS',
      },
    });

    return NextResponse.json({ success: true, data: workDay }, { status: 201 });
  } catch (error) {
    console.error('Error creating work day:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create work day' },
      { status: 500 }
    );
  }
}
