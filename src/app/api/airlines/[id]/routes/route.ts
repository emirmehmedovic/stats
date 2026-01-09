import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - Fetch all routes for an airline
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: airlineId } = await params;

    const routes = await prisma.airlineRoute.findMany({
      where: {
        airlineId,
      },
      orderBy: {
        route: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      data: routes,
    });
  } catch (error) {
    console.error('Error fetching airline routes:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri učitavanju ruta' },
      { status: 500 }
    );
  }
}

// POST - Add a new route for an airline
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: airlineId } = await params;
    const body = await request.json();
    const { route, destination, country } = body;

    if (!route || !destination || !country) {
      return NextResponse.json(
        { success: false, error: 'Ruta, destinacija i zemlja su obavezni' },
        { status: 400 }
      );
    }

    // Check if route already exists for this airline
    const existing = await prisma.airlineRoute.findUnique({
      where: {
        airlineId_route: {
          airlineId,
          route,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Ova ruta već postoji za ovu aviokompaniju' },
        { status: 400 }
      );
    }

    const newRoute = await prisma.airlineRoute.create({
      data: {
        airlineId,
        route,
        destination,
        country,
        isActive: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: newRoute,
      message: 'Ruta uspješno dodana',
    });
  } catch (error) {
    console.error('Error creating airline route:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri dodavanju rute' },
      { status: 500 }
    );
  }
}
