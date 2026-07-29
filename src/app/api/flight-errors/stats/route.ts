import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/route-guards';
import { FlightErrorStatus, FlightErrorType, FlightErrorPriority } from '@prisma/client';

// GET /api/flight-errors/stats - Statistika grešaka (samo admin)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request);
    if ('error' in authResult) return authResult.error;

    const searchParams = request.nextUrl.searchParams;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const dateFilter = {
      ...(dateFrom && { createdAt: { gte: new Date(dateFrom) } }),
      ...(dateTo && { createdAt: { lte: new Date(dateTo + 'T23:59:59.999Z') } }),
    };

    // Get total counts by status
    const [totalByStatus, totalByType, totalByPriority, errorsByUser] = await Promise.all([
      // Errors by status
      prisma.flightErrorReport.groupBy({
        by: ['status'],
        _count: true,
        where: dateFilter,
      }),

      // Errors by type
      prisma.flightErrorReport.groupBy({
        by: ['errorType'],
        _count: true,
        where: dateFilter,
      }),

      // Errors by priority
      prisma.flightErrorReport.groupBy({
        by: ['priority'],
        _count: true,
        where: dateFilter,
      }),

      // Errors by assigned user (top 10)
      prisma.flightErrorReport.groupBy({
        by: ['assignedToId'],
        _count: true,
        where: dateFilter,
        orderBy: {
          _count: {
            assignedToId: 'desc',
          },
        },
        take: 10,
      }),
    ]);

    // Calculate average resolution time using Prisma (not raw SQL)
    const resolvedErrors = await prisma.flightErrorReport.findMany({
      where: {
        ...dateFilter,
        status: FlightErrorStatus.RESOLVED,
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    let avgHours = 0;
    let minHours = 0;
    let maxHours = 0;
    const resolvedCount = resolvedErrors.length;

    if (resolvedCount > 0) {
      const hours = resolvedErrors.map((e) => {
        const diff = e.updatedAt.getTime() - e.createdAt.getTime();
        return diff / (1000 * 60 * 60); // Convert to hours
      });
      avgHours = hours.reduce((sum, h) => sum + h, 0) / resolvedCount;
      minHours = Math.min(...hours);
      maxHours = Math.max(...hours);
    }

    // Get user details for top error makers
    const userIds = errorsByUser.map((e) => e.assignedToId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    const errorsByUserWithDetails = errorsByUser.map((e) => ({
      user: userMap.get(e.assignedToId) || { id: e.assignedToId, name: 'Unknown', email: '' },
      count: e._count,
    }));

    // Count disputed errors
    const disputedCount = await prisma.flightErrorReport.count({
      where: {
        ...dateFilter,
        status: FlightErrorStatus.DISPUTED,
      },
    });

    // Count pending (open + in_progress)
    const pendingCount = await prisma.flightErrorReport.count({
      where: {
        ...dateFilter,
        status: { in: [FlightErrorStatus.OPEN, FlightErrorStatus.IN_PROGRESS] },
      },
    });

    // Total errors
    const totalCount = await prisma.flightErrorReport.count({
      where: dateFilter,
    });

    // Count false reports
    const falseReportCount = await prisma.flightErrorReport.count({
      where: {
        ...dateFilter,
        isFalseReport: true,
      },
    });

    // False reports by reporter (who is reporting false errors)
    const falseReportsByReporter = await prisma.flightErrorReport.groupBy({
      by: ['reportedById'],
      _count: true,
      where: {
        ...dateFilter,
        isFalseReport: true,
      },
      orderBy: {
        _count: {
          reportedById: 'desc',
        },
      },
      take: 10,
    });

    // Get reporter details for false reports
    const reporterIds = falseReportsByReporter.map((r) => r.reportedById);
    const reporters = await prisma.user.findMany({
      where: { id: { in: reporterIds } },
      select: { id: true, name: true, email: true },
    });

    const reporterMap = new Map(reporters.map((r) => [r.id, r]));

    // Also get total reports by each reporter to calculate accuracy
    const totalReportsByReporter = await prisma.flightErrorReport.groupBy({
      by: ['reportedById'],
      _count: true,
      where: {
        ...dateFilter,
        reportedById: { in: reporterIds },
      },
    });

    const totalByReporterMap = new Map(
      totalReportsByReporter.map((t) => [t.reportedById, t._count])
    );

    const falseReportsByReporterWithDetails = falseReportsByReporter.map((r) => {
      const totalReports = totalByReporterMap.get(r.reportedById) || r._count;
      const falseCount = r._count;
      const accuracyPercent = Math.round(((totalReports - falseCount) / totalReports) * 100);

      return {
        user: reporterMap.get(r.reportedById) || { id: r.reportedById, name: 'Nepoznat', email: '' },
        falseReportCount: falseCount,
        totalReportCount: totalReports,
        accuracyPercent,
      };
    });

    // Recent errors (last 7 days trend) - use Prisma groupBy instead of raw SQL
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentErrors = await prisma.flightErrorReport.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const trendMap = new Map<string, number>();
    recentErrors.forEach((e) => {
      const dateStr = e.createdAt.toISOString().split('T')[0];
      trendMap.set(dateStr, (trendMap.get(dateStr) || 0) + 1);
    });

    const recentTrend = Array.from(trendMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    const statusCounts: Record<string, number> = {};
    totalByStatus.forEach((s) => {
      statusCounts[s.status] = s._count;
    });

    const typeCounts: Record<string, number> = {};
    totalByType.forEach((t) => {
      typeCounts[t.errorType] = t._count;
    });

    const priorityCounts: Record<string, number> = {};
    totalByPriority.forEach((p) => {
      priorityCounts[p.priority] = p._count;
    });

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total: totalCount,
          pending: pendingCount,
          disputed: disputedCount,
          resolved: statusCounts[FlightErrorStatus.RESOLVED] || 0,
          closed: statusCounts[FlightErrorStatus.CLOSED] || 0,
          falseReports: falseReportCount,
        },
        byStatus: statusCounts,
        byType: typeCounts,
        byPriority: priorityCounts,
        byUser: errorsByUserWithDetails,
        falseReportsByReporter: falseReportsByReporterWithDetails,
        resolutionTime: {
          avgHours: Math.round(avgHours * 10) / 10,
          minHours: Math.round(minHours * 10) / 10,
          maxHours: Math.round(maxHours * 10) / 10,
          count: resolvedCount,
        },
        trend: recentTrend,
      },
    });
  } catch (error) {
    console.error('Error fetching flight error stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch statistics',
      },
      { status: 500 }
    );
  }
}
