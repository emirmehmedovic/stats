import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { endOfDayUtc, getDateStringInTimeZone, getTodayDateString, startOfDayUtc, TIME_ZONE_SARAJEVO } from '@/lib/dates';

// POST /api/notifications/check-expiring - Check for expiring licenses and create notifications
// Ovo bi trebalo biti cron job, ali za sada je API endpoint
export async function POST(request: NextRequest) {
  try {
    const todayStr = getTodayDateString();
    const today = startOfDayUtc(todayStr);
    const daysAhead = 30; // Provjeravamo licence koje ističu u sljedećih 30 dana
    const futureDate = new Date(today);
    futureDate.setUTCDate(today.getUTCDate() + daysAhead);
    const futureDateStr = getDateStringInTimeZone(futureDate, TIME_ZONE_SARAJEVO);

    // Pronađi sve aktivne licence koje ističu u sljedećih 30 dana
    const expiringLicenses = await prisma.license.findMany({
      where: {
        status: 'ACTIVE',
        expiryDate: {
          gte: today,
          lte: endOfDayUtc(futureDateStr),
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const notificationsCreated = [];

    for (const license of expiringLicenses) {
      const daysUntilExpiry = Math.floor(
        (new Date(license.expiryDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Kreiraj notifikacije za 60, 30, 15 dana prije isteka
      const notificationDays = [60, 30, 15];
      
      for (const dayThreshold of notificationDays) {
        if (daysUntilExpiry <= dayThreshold && daysUntilExpiry > dayThreshold - 7) {
          // Provjeri da li notifikacija već postoji
          const existing = await prisma.licenseNotification.findFirst({
            where: {
              licenseId: license.id,
              employeeId: license.employeeId,
              notificationDate: {
                gte: startOfDayUtc(todayStr),
                lt: endOfDayUtc(todayStr),
              },
            },
          });

          if (!existing) {
            const notification = await prisma.licenseNotification.create({
              data: {
                employeeId: license.employeeId,
                licenseId: license.id,
                notificationDate: today,
                sent: false,
              },
            });
            notificationsCreated.push(notification);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${notificationsCreated.length} notifications`,
      data: {
        expiringLicenses: expiringLicenses.length,
        notificationsCreated: notificationsCreated.length,
      },
    });
  } catch (error) {
    console.error('Check expiring licenses error:', error);
    return NextResponse.json(
      { error: 'Failed to check expiring licenses' },
      { status: 500 }
    );
  }
}
