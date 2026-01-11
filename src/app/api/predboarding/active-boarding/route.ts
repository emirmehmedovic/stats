import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSTW } from '@/lib/route-guards';

/**
 * GET /api/predboarding/active-boarding
 *
 * Vraća sve aktivne manifeste (IN_PROGRESS) sa putnicima i flight info
 * Za unified boarding view gdje STW vidi sve letove odjednom
 * Auth: requireSTW (STW ili ADMIN)
 */
export async function GET(request: Request) {
  const authCheck = await requireSTW(request);
  if ('error' in authCheck) return authCheck.error;

  try {
    // Get all IN_PROGRESS manifests with passengers (optimized query)
    const manifests = await prisma.boardingManifest.findMany({
      where: {
        boardingStatus: 'IN_PROGRESS'
      },
      select: {
        id: true,
        flightId: true,
        uploadedAt: true,
        originalFileName: true,
        flight: {
          select: {
            id: true,
            date: true,
            departureFlightNumber: true,
            route: true,
            departureScheduledTime: true,
            airline: {
              select: {
                id: true,
                name: true,
                icaoCode: true,
                iataCode: true,
                logoUrl: true
              }
            },
            aircraftType: {
              select: {
                id: true,
                model: true
              }
            }
          }
        },
        passengers: {
          select: {
            id: true,
            manifestId: true,
            seatNumber: true,
            passengerName: true,
            title: true,
            passengerId: true,
            fareClass: true,
            confirmationDate: true,
            isInfant: true,
            boardingStatus: true,
            boardedAt: true
          },
          orderBy: {
            seatNumber: 'asc'
          }
        }
      },
      orderBy: {
        flight: {
          departureScheduledTime: 'asc'
        }
      }
    });

    // Calculate stats for each manifest
    const manifestsWithStats = manifests.map(manifest => {
      const passengers = manifest.passengers;
      const boarded = passengers.filter(p => p.boardingStatus === 'BOARDED');
      const noShow = passengers.filter(p => p.boardingStatus === 'NO_SHOW');

      return {
        manifest: {
          id: manifest.id,
          flightId: manifest.flightId,
          uploadedAt: manifest.uploadedAt,
          flight: manifest.flight,
          passengerCount: passengers.length
        },
        passengers: manifest.passengers,
        stats: {
          total: passengers.length,
          boarded: boarded.length,
          noShow: noShow.length,
          pending: noShow.length // pending = NO_SHOW (još nije ukrcan)
        }
      };
    });

    // Calculate overall stats
    const overallStats = {
      totalFlights: manifestsWithStats.length,
      totalPassengers: manifestsWithStats.reduce((sum, m) => sum + m.stats.total, 0),
      totalBoarded: manifestsWithStats.reduce((sum, m) => sum + m.stats.boarded, 0),
      totalPending: manifestsWithStats.reduce((sum, m) => sum + m.stats.pending, 0)
    };

    return NextResponse.json({
      success: true,
      data: {
        manifests: manifestsWithStats,
        overallStats
      }
    });
  } catch (error) {
    console.error('Error fetching active boarding:', error);
    return NextResponse.json(
      { success: false, error: 'Greška pri učitavanju aktivnih boardinga' },
      { status: 500 }
    );
  }
}
