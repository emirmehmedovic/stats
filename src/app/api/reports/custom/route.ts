import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { eachDayOfInterval } from 'date-fns';
import { endOfDayUtc, formatDateDisplay, getDateStringInTimeZone, startOfDayUtc, TIME_ZONE_SARAJEVO } from '@/lib/dates';

// POST /api/reports/custom - Custom report with flexible filters
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dateFrom, dateTo, airlines, routes, operationTypeId, groupBy } = body;

    // Validate required fields
    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datum od i do su obavezni',
        },
        { status: 400 }
      );
    }

    const startDate = startOfDayUtc(dateFrom);
    const endDate = endOfDayUtc(dateTo);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Neispravan format datuma',
        },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datum od mora biti prije datuma do',
        },
        { status: 400 }
      );
    }

    // Build where clause
    const whereClause: any = {
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    // Add airline filter (array of ICAO codes)
    if (airlines && airlines.length > 0) {
      const airlineRecords = await prisma.airline.findMany({
        where: {
          icaoCode: {
            in: airlines,
          },
        },
        select: {
          id: true,
        },
      });

      if (airlineRecords.length > 0) {
        whereClause.airlineId = {
          in: airlineRecords.map(a => a.id),
        };
      }
    }

    // Add route filter (array of route strings)
    if (routes && routes.length > 0) {
      whereClause.route = {
        in: routes,
      };
    }

    // Add operation type filter
    if (operationTypeId && operationTypeId !== 'ALL') {
      whereClause.operationTypeId = operationTypeId;
    }

    // Fetch flights
    const flights = await prisma.flight.findMany({
      where: whereClause,
      include: {
        operationType: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        airline: {
          select: {
            name: true,
            icaoCode: true,
          },
        },
        aircraftType: {
          select: {
            model: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    const getArrivalPassengers = (flight: any) =>
      flight.arrivalFerryIn ? 0 : (flight.arrivalPassengers || 0);
    const getDeparturePassengers = (flight: any) =>
      flight.departureFerryOut ? 0 : (flight.departurePassengers || 0);

    // Calculate totals
    const totals = {
      flights: flights.length,
      arrivalFlights: flights.filter(f => f.arrivalFlightNumber).length,
      arrivalPassengers: flights.reduce((sum, f) => sum + getArrivalPassengers(f), 0),
      arrivalBaggage: flights.reduce((sum, f) => sum + (f.arrivalBaggage || 0), 0),
      arrivalCargo: flights.reduce((sum, f) => sum + (f.arrivalCargo || 0), 0),
      arrivalMail: flights.reduce((sum, f) => sum + (f.arrivalMail || 0), 0),
      departureFlights: flights.filter(f => f.departureFlightNumber).length,
      departurePassengers: flights.reduce((sum, f) => sum + getDeparturePassengers(f), 0),
      departureBaggage: flights.reduce((sum, f) => sum + (f.departureBaggage || 0), 0),
      departureCargo: flights.reduce((sum, f) => sum + (f.departureCargo || 0), 0),
      departureMail: flights.reduce((sum, f) => sum + (f.departureMail || 0), 0),
      totalPassengers: 0,
      totalBaggage: 0,
      totalCargo: 0,
      totalMail: 0,
    };

    totals.totalPassengers = totals.arrivalPassengers + totals.departurePassengers;
    totals.totalBaggage = totals.arrivalBaggage + totals.departureBaggage;
    totals.totalCargo = totals.arrivalCargo + totals.departureCargo;
    totals.totalMail = totals.arrivalMail + totals.departureMail;

    // Dynamic grouping
    let groupedData: any[] = [];

    if (groupBy === 'day') {
      // Group by day
      const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
      groupedData = daysInRange.map(day => {
        const dayStr = getDateStringInTimeZone(day, TIME_ZONE_SARAJEVO);
        const dayStart = startOfDayUtc(dayStr);
        const dayEnd = endOfDayUtc(dayStr);

        const dayFlights = flights.filter(f => {
          const flightDate = new Date(f.date);
          return flightDate >= dayStart && flightDate <= dayEnd;
        });

        return {
          label: dayStr,
          displayLabel: formatDateDisplay(day),
          flights: dayFlights.length,
          passengers: dayFlights.reduce(
            (sum, f) => sum + getArrivalPassengers(f) + getDeparturePassengers(f),
            0
          ),
          arrivalFlights: dayFlights.filter(f => f.arrivalFlightNumber).length,
          departureFlights: dayFlights.filter(f => f.departureFlightNumber).length,
        };
      });
    } else if (groupBy === 'airline') {
      // Group by airline
      const byAirline = flights.reduce((acc, flight) => {
        const airlineKey = flight.airline.icaoCode;
        if (!acc[airlineKey]) {
          acc[airlineKey] = {
            label: airlineKey,
            displayLabel: flight.airline.name,
            flights: 0,
            passengers: 0,
            arrivalFlights: 0,
            departureFlights: 0,
          };
        }
        acc[airlineKey].flights++;
        acc[airlineKey].passengers += getArrivalPassengers(flight) + getDeparturePassengers(flight);
        if (flight.arrivalFlightNumber) acc[airlineKey].arrivalFlights++;
        if (flight.departureFlightNumber) acc[airlineKey].departureFlights++;
        return acc;
      }, {} as Record<string, any>);

      groupedData = Object.values(byAirline).sort((a: any, b: any) => b.flights - a.flights);
    } else if (groupBy === 'route') {
      // Group by route
      const byRoute = flights.reduce((acc, flight) => {
        const routeKey = flight.route;
        if (!acc[routeKey]) {
          acc[routeKey] = {
            label: routeKey,
            displayLabel: routeKey,
            flights: 0,
            passengers: 0,
            arrivalFlights: 0,
            departureFlights: 0,
          };
        }
        acc[routeKey].flights++;
        acc[routeKey].passengers += getArrivalPassengers(flight) + getDeparturePassengers(flight);
        if (flight.arrivalFlightNumber) acc[routeKey].arrivalFlights++;
        if (flight.departureFlightNumber) acc[routeKey].departureFlights++;
        return acc;
      }, {} as Record<string, any>);

      groupedData = Object.values(byRoute).sort((a: any, b: any) => b.flights - a.flights);
    } else if (groupBy === 'operationType') {
      // Group by operation type
      const byType = flights.reduce((acc, flight) => {
        const typeKey = flight.operationType?.code || 'NEPOZNATO';
        const typeName = flight.operationType?.name || 'Nepoznato';
        if (!acc[typeKey]) {
          acc[typeKey] = {
            label: typeKey,
            displayLabel: typeName,
            flights: 0,
            passengers: 0,
            arrivalFlights: 0,
            departureFlights: 0,
          };
        }
        acc[typeKey].flights++;
        acc[typeKey].passengers += getArrivalPassengers(flight) + getDeparturePassengers(flight);
        if (flight.arrivalFlightNumber) acc[typeKey].arrivalFlights++;
        if (flight.departureFlightNumber) acc[typeKey].departureFlights++;
        return acc;
      }, {} as Record<string, any>);

      groupedData = Object.values(byType);
    }

    return NextResponse.json({
      success: true,
      data: {
        filters: {
          dateFrom,
          dateTo,
          airlines: airlines || [],
          routes: routes || [],
          operationTypeId: operationTypeId || 'ALL',
          groupBy: groupBy || 'day',
        },
        totals,
        groupedData,
        flights: flights.slice(0, 100), // Return first 100 flights for details
        totalFlightsCount: flights.length,
      },
    });
  } catch (error) {
    console.error('Custom report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri generisanju custom izvještaja',
      },
      { status: 500 }
    );
  }
}
