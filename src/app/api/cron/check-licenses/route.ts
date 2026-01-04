import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { endOfDayUtc, getDateStringInTimeZone, getPreviousDateString, getTodayDateString, startOfDayUtc, TIME_ZONE_SARAJEVO } from '@/lib/dates';

// POST /api/cron/check-licenses
// Ovo bi trebalo biti pozvano iz cron job-a (npr. svaki dan u 9:00)
// Za sada je API endpoint koji se može pozvati ručno ili iz cron servisa
export async function POST(request: NextRequest) {
  try {
    // Provjeri authorization header (za sigurnost)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const todayStr = getTodayDateString();
    const today = startOfDayUtc(todayStr);
    const daysAhead = 60; // Provjeravamo licence koje ističu u sljedećih 60 dana
    const futureDate = new Date(today);
    futureDate.setUTCDate(today.getUTCDate() + daysAhead);
    const futureDateStr = getDateStringInTimeZone(futureDate, TIME_ZONE_SARAJEVO);

    // Pronađi sve aktivne licence koje ističu
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
        if (daysUntilExpiry <= dayThreshold && daysUntilExpiry > dayThreshold - 1) {
          // Provjeri da li notifikacija već postoji za ovaj threshold
          const existing = await prisma.licenseNotification.findFirst({
            where: {
              licenseId: license.id,
              employeeId: license.employeeId,
              notificationDate: {
                gte: startOfDayUtc(getPreviousDateString(todayStr)),
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
      message: `Checked ${expiringLicenses.length} licenses, created ${notificationsCreated.length} notifications`,
      data: {
        expiringLicenses: expiringLicenses.length,
        notificationsCreated: notificationsCreated.length,
      },
    });
  } catch (error) {
    console.error('Cron check licenses error:', error);
    return NextResponse.json(
      { error: 'Failed to check licenses' },
      { status: 500 }
    );
  }
}
