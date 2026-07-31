import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getTokenFromCookie, verifyToken } from '@/lib/auth-utils';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Provjera da li korisnik ima pristup parking modulu
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

  // Samo ADMIN i PARKING role imaju pristup
  if (decoded.role !== 'ADMIN' && decoded.role !== 'PARKING') {
    return { error: NextResponse.json({ success: false, error: 'Nemate dozvolu za pristup' }, { status: 403 }) };
  }

  return { user: decoded };
}

// Validation schemas
const createParkingRevenueSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Neispravan format datuma'),
  amount: z.number().min(0, 'Iznos mora biti pozitivan'),
  notes: z.string().optional(),
});

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(31),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  month: z.string().optional(), // Format: YYYY-MM
  year: z.string().optional(),  // Format: YYYY
});

// GET /api/parking-revenue - Lista prihoda
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireParkingAccess(request);
    if ('error' in authResult) return authResult.error;

    const searchParams = request.nextUrl.searchParams;
    const query = querySchema.parse({
      page: searchParams.get('page') || 1,
      limit: searchParams.get('limit') || 31,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      month: searchParams.get('month') || undefined,
      year: searchParams.get('year') || undefined,
    });

    // Build where clause
    const where: Prisma.ParkingRevenueWhereInput = {};

    if (query.month) {
      // Filter by month (YYYY-MM)
      const [year, month] = query.month.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0); // Last day of month
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    } else if (query.year) {
      // Filter by year
      const year = parseInt(query.year);
      where.date = {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      };
    } else if (query.dateFrom || query.dateTo) {
      where.date = {};
      if (query.dateFrom) {
        where.date.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        where.date.lte = new Date(query.dateTo);
      }
    }

    const [total, revenues] = await Promise.all([
      prisma.parkingRevenue.count({ where }),
      prisma.parkingRevenue.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, name: true, email: true },
          },
          updatedBy: {
            select: { id: true, name: true, email: true },
          },
        },
        orderBy: { date: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);

    // Calculate sum for the filtered period
    const sumResult = await prisma.parkingRevenue.aggregate({
      where,
      _sum: { amount: true },
    });

    return NextResponse.json({
      success: true,
      data: revenues,
      pagination: {
        total,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(total / query.limit),
      },
      summary: {
        totalAmount: sumResult._sum.amount || 0,
        count: total,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error fetching parking revenue:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri učitavanju podataka' },
      { status: 500 }
    );
  }
}

// POST /api/parking-revenue - Kreiranje novog unosa
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireParkingAccess(request);
    if ('error' in authResult) return authResult.error;
    const { user } = authResult;

    const body = await request.json();
    const validatedData = createParkingRevenueSchema.parse(body);

    // Check if entry for this date already exists
    const existing = await prisma.parkingRevenue.findUnique({
      where: { date: new Date(validatedData.date) },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Unos za ovaj datum već postoji' },
        { status: 400 }
      );
    }

    const revenue = await prisma.parkingRevenue.create({
      data: {
        date: new Date(validatedData.date),
        amount: new Prisma.Decimal(validatedData.amount),
        notes: validatedData.notes,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(
      { success: true, data: revenue, message: 'Unos uspješno kreiran' },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    console.error('Error creating parking revenue:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri kreiranju unosa' },
      { status: 500 }
    );
  }
}
