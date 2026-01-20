import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireNonOperations } from '@/lib/route-guards';

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/license-types/[id]/employees - Lista svih radnika sa ovom licencom
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const authCheck = await requireNonOperations(request);
    if ('error' in authCheck) {
      return authCheck.error;
    }

    const { id } = await context.params;

    // Pronađi sve licence ovog tipa
    const licenses = await prisma.license.findMany({
      where: {
        licenseTypeId: id,
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeNumber: true,
            position: true,
            sector: {
              select: {
                id: true,
                name: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

    return NextResponse.json(licenses);
  } catch (error) {
    console.error('Error fetching license type employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employees' },
      { status: 500 }
    );
  }
}
