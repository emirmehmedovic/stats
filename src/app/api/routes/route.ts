import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// GET /api/routes - List distinct routes with optional search and pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search')?.trim();

    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (page < 1 || limit < 1 || limit > 200) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid pagination parameters. Page must be >= 1, limit between 1-200',
        },
        { status: 400 }
      );
    }

    const filters: Prisma.Sql[] = [Prisma.sql`f.route <> ''`];
    if (search) {
      filters.push(Prisma.sql`f.route ILIKE ${`%${search}%`}`);
    }
    const whereSql = Prisma.join(filters, ' AND ');

    const [routes, totalResult] = await Promise.all([
      prisma.$queryRaw<{ route: string }[]>`
        SELECT DISTINCT f.route
        FROM "Flight" f
        WHERE ${whereSql}
        ORDER BY f.route ASC
        LIMIT ${limit} OFFSET ${(page - 1) * limit};
      `,
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT f.route) AS count
        FROM "Flight" f
        WHERE ${whereSql};
      `,
    ]);

    const total = Number(totalResult?.[0]?.count ?? 0);

    return NextResponse.json({
      success: true,
      data: routes.map((item) => item.route),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching routes:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch routes',
      },
      { status: 500 }
    );
  }
}
