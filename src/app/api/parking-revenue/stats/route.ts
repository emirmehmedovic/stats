import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';

async function requireParkingAccess(request: NextRequest) {
  const cookieHeader = request.headers.get('cookie');
  const token = getTokenFromCookie(cookieHeader);

  if (!token) {
    return { error: NextResponse.json({ success: false, error: 'Niste autentifikovani' }, { status: 401 }) };
  }

  const decoded = await verifyToken(token);
  if (!decoded) {
    return { error: NextResponse.json({ success: false, error: 'Niste autentifikovani' }, { status: 401 }) };
  }

  if (decoded.role !== 'ADMIN' && decoded.role !== 'PARKING') {
    return { error: NextResponse.json({ success: false, error: 'Nemate dozvolu za pristup' }, { status: 403 }) };
  }

  return { user: decoded };
}

// GET /api/parking-revenue/stats - Statistika prihoda
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireParkingAccess(request);
    if ('error' in authResult) return authResult.error;

    const searchParams = request.nextUrl.searchParams;
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());

    // Get all revenues for the year
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31);

    const revenues = await prisma.parkingRevenue.findMany({
      where: {
        date: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      orderBy: { date: 'asc' },
    });

    // Calculate yearly total
    const yearlyTotal = revenues.reduce((sum, r) => sum + Number(r.amount), 0);

    // Group by month
    const monthlyData: { month: number; total: number; count: number }[] = [];
    for (let month = 0; month < 12; month++) {
      const monthRevenues = revenues.filter((r) => {
        const d = new Date(r.date);
        return d.getMonth() === month;
      });
      monthlyData.push({
        month: month + 1,
        total: monthRevenues.reduce((sum, r) => sum + Number(r.amount), 0),
        count: monthRevenues.length,
      });
    }

    // Calculate weekly data for current month
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const currentMonthRevenues = revenues.filter((r) => {
      const d = new Date(r.date);
      return d >= currentMonthStart && d <= currentMonthEnd;
    });

    // Group by week
    const weeklyData: { week: number; total: number; count: number }[] = [];
    const weeksInMonth = Math.ceil(currentMonthEnd.getDate() / 7);
    for (let week = 0; week < weeksInMonth; week++) {
      const weekStart = week * 7 + 1;
      const weekEnd = Math.min((week + 1) * 7, currentMonthEnd.getDate());
      const weekRevenues = currentMonthRevenues.filter((r) => {
        const day = new Date(r.date).getDate();
        return day >= weekStart && day <= weekEnd;
      });
      weeklyData.push({
        week: week + 1,
        total: weekRevenues.reduce((sum, r) => sum + Number(r.amount), 0),
        count: weekRevenues.length,
      });
    }

    // Daily average
    const daysWithData = revenues.length;
    const dailyAverage = daysWithData > 0 ? yearlyTotal / daysWithData : 0;

    // Today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRevenue = revenues.find((r) => {
      const d = new Date(r.date);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });

    // This month's total
    const currentMonth = now.getMonth();
    const thisMonthTotal = monthlyData[currentMonth]?.total || 0;

    // Last 7 days trend
    const last7Days: { date: string; amount: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const revenue = revenues.find((r) => {
        const rd = new Date(r.date);
        rd.setHours(0, 0, 0, 0);
        return rd.getTime() === d.getTime();
      });
      last7Days.push({
        date: d.toISOString().split('T')[0],
        amount: revenue ? Number(revenue.amount) : 0,
      });
    }

    // Count missing days in current year (days without entry)
    const daysPassed = Math.floor((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const missingDays = daysPassed - daysWithData;

    return NextResponse.json({
      success: true,
      data: {
        year,
        summary: {
          yearlyTotal,
          thisMonthTotal,
          todayAmount: todayRevenue ? Number(todayRevenue.amount) : null,
          dailyAverage: Math.round(dailyAverage * 100) / 100,
          daysWithData,
          missingDays,
        },
        monthly: monthlyData,
        weekly: weeklyData,
        last7Days,
      },
    });
  } catch (error) {
    console.error('Error fetching parking revenue stats:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri učitavanju statistike' },
      { status: 500 }
    );
  }
}
