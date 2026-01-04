import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/notifications - Lista notifikacija
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {};
    if (unreadOnly) {
      where.sent = false;
    }

    const notifications = await prisma.licenseNotification.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        license: {
          select: {
            id: true,
            licenseType: true,
            licenseNumber: true,
            expiryDate: true,
          },
        },
      },
    });

    // Calculate days until expiry
    const notificationsWithDays = notifications.map(notif => {
      const daysUntilExpiry = Math.floor(
        (new Date(notif.license.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );
      return {
        ...notif,
        daysUntilExpiry,
      };
    });

    const unreadCount = await prisma.licenseNotification.count({
      where: { sent: false },
    });

    return NextResponse.json({
      success: true,
      data: notificationsWithDays,
      unreadCount,
    });
  } catch (error) {
    console.error('Notifications GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

