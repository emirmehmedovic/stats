import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireNaplateAccess } from '@/lib/route-guards';

const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
};

const parseMonth = (value: string) => {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return null;
  return new Date(Date.UTC(year, month - 1, 1));
};

export async function GET(request: NextRequest) {
  try {
    const authCheck = await requireNaplateAccess(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const date = searchParams.get('date');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const month = searchParams.get('month');

    if (!type || (type !== 'DAILY' && type !== 'MONTHLY')) {
      return NextResponse.json({ error: 'Neispravan tip izvještaja' }, { status: 400 });
    }

    if (type === 'DAILY' && from && to) {
      const fromDate = parseDateOnly(from);
      const toDate = parseDateOnly(to);
      if (!fromDate || !toDate) {
        return NextResponse.json({ error: 'Neispravan raspon datuma' }, { status: 400 });
      }
      const reports = await prisma.billingReport.findMany({
        where: {
          type: 'DAILY',
          periodStart: {
            gte: fromDate,
            lte: toDate,
          },
        },
        orderBy: { periodStart: 'asc' },
      });
      return NextResponse.json({ reports });
    }

    const periodStart = type === 'DAILY'
      ? (date ? parseDateOnly(date) : null)
      : (month ? parseMonth(month) : null);

    if (!periodStart) {
      return NextResponse.json({ error: 'Nedostaje datum ili mjesec' }, { status: 400 });
    }

    const report = await prisma.billingReport.findUnique({
      where: {
        type_periodStart: {
          type,
          periodStart,
        },
      },
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Get billing report error:', error);
    return NextResponse.json(
      { error: 'Greška pri učitavanju izvještaja' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authCheck = await requireNaplateAccess(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const body = await request.json();
    const { type, date, month, data } = body || {};

    if (!type || (type !== 'DAILY' && type !== 'MONTHLY')) {
      return NextResponse.json({ error: 'Neispravan tip izvještaja' }, { status: 400 });
    }

    const periodStart = type === 'DAILY'
      ? (date ? parseDateOnly(date) : null)
      : (month ? parseMonth(month) : null);

    if (!periodStart) {
      return NextResponse.json({ error: 'Nedostaje datum ili mjesec' }, { status: 400 });
    }

    const report = await prisma.billingReport.upsert({
      where: {
        type_periodStart: {
          type,
          periodStart,
        },
      },
      update: {
        data,
        createdById: authCheck.user.id,
      },
      create: {
        type,
        periodStart,
        data,
        createdById: authCheck.user.id,
      },
    });

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Save billing report error:', error);
    return NextResponse.json(
      { error: 'Greška pri čuvanju izvještaja' },
      { status: 500 }
    );
  }
}
