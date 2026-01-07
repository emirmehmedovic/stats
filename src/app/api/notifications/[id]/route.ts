import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireNonOperations } from '@/lib/route-guards';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// PUT /api/notifications/[id] - Mark notification as read
export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authCheck = await requireNonOperations(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const { id } = await context.params;
    const notification = await prisma.licenseNotification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    const updated = await prisma.licenseNotification.update({
      where: { id },
      data: {
        sent: true,
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authCheck = await requireNonOperations(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const { id } = await context.params;
    await prisma.licenseNotification.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    console.error('Notification delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
