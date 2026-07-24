import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAnyAuth } from '@/lib/route-guards';

// GET /api/notifications - Get user's notifications
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');

    const where = {
      userId: user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    };

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          ticket: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      }),
      prisma.notification.count({
        where: { userId: user.id, isRead: false },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAnyAuth(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const body = await request.json();
    const { notificationIds, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { userId: user.id, isRead: false },
        data: { isRead: true },
      });
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await prisma.notification.updateMany({
        where: {
          id: { in: notificationIds },
          userId: user.id,
        },
        data: { isRead: true },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Notifications marked as read',
    });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
