import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

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

const bulkImportSchema = z.object({
  // Zbirni unos od početka godine do određenog datuma
  cumulativeAmount: z.number().min(0, 'Iznos mora biti pozitivan'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Neispravan format datuma'),
  notes: z.string().optional(),
});

const bulkEntriesSchema = z.object({
  entries: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Neispravan format datuma'),
    amount: z.number().min(0, 'Iznos mora biti pozitivan'),
    notes: z.string().optional(),
  })),
});

// POST /api/parking-revenue/bulk - Bulk unos podataka
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireParkingAccess(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const body = await request.json();

    // Check if it's cumulative import or entries import
    if (body.cumulativeAmount !== undefined) {
      // Cumulative import - distribute amount across days
      const validatedData = bulkImportSchema.parse(body);

      const endDate = new Date(validatedData.endDate);
      const year = endDate.getFullYear();
      const startDate = new Date(year, 0, 1); // January 1st of the year

      // Calculate number of days
      const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (daysDiff <= 0) {
        return NextResponse.json(
          { success: false, error: 'Datum mora biti nakon 1. januara' },
          { status: 400 }
        );
      }

      // Calculate daily amount (rounded to 2 decimal places)
      const dailyAmount = Math.round((validatedData.cumulativeAmount / daysDiff) * 100) / 100;

      // Check for existing entries in this period
      const existingEntries = await prisma.parkingRevenue.findMany({
        where: {
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      if (existingEntries.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Već postoji ${existingEntries.length} unosa u ovom periodu. Obrišite ih prije bulk unosa.`
          },
          { status: 400 }
        );
      }

      // Create entries for each day
      const entries: Prisma.ParkingRevenueCreateManyInput[] = [];
      let currentDate = new Date(startDate);
      let remainingAmount = validatedData.cumulativeAmount;

      while (currentDate <= endDate) {
        const isLastDay = currentDate.getTime() === endDate.getTime();
        // On last day, use remaining amount to avoid rounding errors
        const amount = isLastDay ? remainingAmount : dailyAmount;
        remainingAmount -= dailyAmount;

        entries.push({
          date: new Date(currentDate),
          amount: new Prisma.Decimal(Math.max(0, amount)),
          notes: validatedData.notes || `Zbirni unos od ${startDate.toISOString().split('T')[0]} do ${validatedData.endDate}`,
          createdById: user.id,
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      await prisma.parkingRevenue.createMany({
        data: entries,
      });

      return NextResponse.json({
        success: true,
        message: `Uspješno kreirano ${entries.length} unosa`,
        data: {
          entriesCreated: entries.length,
          totalAmount: validatedData.cumulativeAmount,
          dailyAmount,
          period: {
            from: startDate.toISOString().split('T')[0],
            to: validatedData.endDate,
          },
        },
      });
    } else if (body.entries) {
      // Multiple individual entries
      const validatedData = bulkEntriesSchema.parse(body);

      // Check for duplicates
      const dates = validatedData.entries.map((e) => new Date(e.date));
      const existingEntries = await prisma.parkingRevenue.findMany({
        where: {
          date: { in: dates },
        },
      });

      if (existingEntries.length > 0) {
        const existingDates = existingEntries.map((e) => new Date(e.date).toISOString().split('T')[0]);
        return NextResponse.json(
          {
            success: false,
            error: `Unosi za sljedeće datume već postoje: ${existingDates.join(', ')}`
          },
          { status: 400 }
        );
      }

      const entries: Prisma.ParkingRevenueCreateManyInput[] = validatedData.entries.map((e) => ({
        date: new Date(e.date),
        amount: new Prisma.Decimal(e.amount),
        notes: e.notes,
        createdById: user.id,
      }));

      await prisma.parkingRevenue.createMany({
        data: entries,
      });

      return NextResponse.json({
        success: true,
        message: `Uspješno kreirano ${entries.length} unosa`,
        data: {
          entriesCreated: entries.length,
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Nedostaju parametri za bulk unos' },
        { status: 400 }
      );
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error bulk importing parking revenue:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri bulk unosu podataka' },
      { status: 500 }
    );
  }
}
