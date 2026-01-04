import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dateStringFromParts, endOfDayUtc, getTodayDateString, startOfDayUtc } from '@/lib/dates';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const monthParam = searchParams.get('month');

    if (!monthParam) {
      return NextResponse.json(
        { error: 'Month parameter is required (format: YYYY-MM)' },
        { status: 400 }
      );
    }

    // Parse month parameter
    const [year, month] = monthParam.split('-').map(Number);
    const startDate = startOfDayUtc(dateStringFromParts(year, month, 1));

    // Determine end date based on current date
    const todayStr = getTodayDateString();
    const [todayYear, todayMonth, todayDay] = todayStr.split('-').map(Number);
    const isCurrentMonth = todayYear === year && todayMonth === month;
    const endDate = isCurrentMonth
      ? endOfDayUtc(todayStr)
      : endOfDayUtc(dateStringFromParts(year, month + 1, 0));

    // Calculate equivalent period in previous month
    const currentDayOfMonth = isCurrentMonth ? todayDay : new Date(Date.UTC(year, month, 0)).getUTCDate();
    const prevMonthDate = new Date(Date.UTC(year, month - 2, 1));
    const prevMonthYear = prevMonthDate.getUTCFullYear();
    const prevMonth = prevMonthDate.getUTCMonth() + 1;
    const prevMonthStart = startOfDayUtc(dateStringFromParts(prevMonthYear, prevMonth, 1));
    const prevMonthEnd = endOfDayUtc(dateStringFromParts(prevMonthYear, prevMonth, currentDayOfMonth));

    // Fetch current month flights
    const currentFlights = await prisma.flight.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        airline: true,
        operationType: true,
      },
    });

    // Fetch previous month flights for comparison
    const previousFlights = await prisma.flight.findMany({
      where: {
        date: {
          gte: prevMonthStart,
          lte: prevMonthEnd,
        },
      },
      include: {
        airline: true,
        operationType: true,
      },
    });

    // Calculate current month stats
    const currentStats = calculateStats(currentFlights);
    const previousStats = calculateStats(previousFlights);

    // Calculate growth percentages
    const comparison = {
      passengerGrowth: calculateGrowth(currentStats.totalPassengers, previousStats.totalPassengers),
      operationsGrowth: calculateGrowth(currentStats.totalOperations, previousStats.totalOperations),
      baggageGrowth: calculateGrowth(currentStats.totalBaggage, previousStats.totalBaggage),
    };

    return NextResponse.json({
      ...currentStats,
      comparison,
    });
  } catch (error) {
    console.error('Summary API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch summary statistics',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

function calculateStats(flights: any[]) {
  let totalPassengers = 0;
  let totalArrivalPassengers = 0;
  let totalDeparturePassengers = 0;
  let totalOperations = 0;
  let totalBaggage = 0;
  let totalCargo = 0;

  // Operation type stats
  let scheduledOperations = 0;
  let charterOperations = 0;
  let scheduledPassengers = 0;
  let charterPassengers = 0;

  // Load factor and delays
  let totalSeatsAvailable = 0;
  let totalSeatsUsed = 0;
  let arrivalDelays = 0;
  let departureDelays = 0;
  let totalArrivalFlights = 0;
  let totalDepartureFlights = 0;

  // Maps for grouping
  const airlineMap = new Map<string, { passengers: number; operations: number; logoUrl: string | null }>();
  const destinationMap = new Map<string, {
    arrivalPassengers: number;
    departurePassengers: number;
    totalBaggage: number;
  }>();

  flights.forEach((flight) => {
    // Sum passengers (exclude ferry legs)
    const arrivalPax = flight.arrivalFerryIn ? 0 : (flight.arrivalPassengers || 0);
    const departurePax = flight.departureFerryOut ? 0 : (flight.departurePassengers || 0);
    const flightPassengers = arrivalPax + departurePax;

    totalArrivalPassengers += arrivalPax;
    totalDeparturePassengers += departurePax;
    totalPassengers += flightPassengers;

    // Sum baggage and cargo
    const arrivalBaggage = flight.arrivalBaggage || 0;
    const departureBaggage = flight.departureBaggage || 0;
    totalBaggage += arrivalBaggage + departureBaggage;
    totalCargo += (flight.arrivalCargo || 0) + (flight.departureCargo || 0);

    // Count operations: each flight can have arrival and/or departure
    let flightOperations = 0;
    if (flight.arrivalFlightNumber || arrivalPax > 0 || flight.arrivalScheduledTime) {
      flightOperations++;
    }
    if (flight.departureFlightNumber || departurePax > 0 || flight.departureScheduledTime) {
      flightOperations++;
    }
    totalOperations += flightOperations;

    // Track operation type (SCHEDULED vs all others)
    const operationCode = flight.operationType?.code || 'SCHEDULED';
    if (operationCode === 'SCHEDULED') {
      scheduledOperations += flightOperations;
      scheduledPassengers += flightPassengers;
    } else {
      // All non-scheduled operations (CHARTER, DIVERTED, MEDEVAC, etc.)
      charterOperations += flightOperations;
      charterPassengers += flightPassengers;
    }

    // Calculate load factor
    if (flight.availableSeats && flight.availableSeats > 0) {
      totalSeatsAvailable += (flight.arrivalFerryIn ? 0 : flight.availableSeats);
      totalSeatsAvailable += (flight.departureFerryOut ? 0 : flight.availableSeats);
      totalSeatsUsed += flightPassengers;
    }

    // Calculate delays (flights delayed by more than 15 minutes)
    if (flight.arrivalScheduledTime && flight.arrivalActualTime) {
      totalArrivalFlights++;
      const scheduledTime = new Date(flight.arrivalScheduledTime).getTime();
      const actualTime = new Date(flight.arrivalActualTime).getTime();
      const delayMinutes = (actualTime - scheduledTime) / (1000 * 60);
      if (delayMinutes > 15) {
        arrivalDelays++;
      }
    }

    if (flight.departureScheduledTime && flight.departureActualTime) {
      totalDepartureFlights++;
      const scheduledTime = new Date(flight.departureScheduledTime).getTime();
      const actualTime = new Date(flight.departureActualTime).getTime();
      const delayMinutes = (actualTime - scheduledTime) / (1000 * 60);
      if (delayMinutes > 15) {
        departureDelays++;
      }
    }

    // Group by airline (with Wizzair consolidation)
    let airlineName = flight.airline?.name || 'Unknown';
    let logoUrl = flight.airline?.logoUrl || null;

    // Combine all Wizzair variants into one
    if (airlineName.toLowerCase().includes('wizz air') ||
        airlineName.toLowerCase().includes('wizzair')) {
      airlineName = 'Wizz Air';
      // Use the logo from any Wizzair variant
      if (!logoUrl) {
        logoUrl = flight.airline?.logoUrl || null;
      }
    }

    if (!airlineMap.has(airlineName)) {
      airlineMap.set(airlineName, { passengers: 0, operations: 0, logoUrl });
    } else if (logoUrl && !airlineMap.get(airlineName)!.logoUrl) {
      // Update logo if we didn't have one before
      airlineMap.get(airlineName)!.logoUrl = logoUrl;
    }
    const airlineData = airlineMap.get(airlineName)!;
    airlineData.passengers += arrivalPax + departurePax;
    airlineData.operations += flightOperations;

    // Group by destination
    const destination = flight.route || 'Unknown';
    if (!destinationMap.has(destination)) {
      destinationMap.set(destination, {
        arrivalPassengers: 0,
        departurePassengers: 0,
        totalBaggage: 0,
      });
    }
    const destData = destinationMap.get(destination)!;
    destData.arrivalPassengers += arrivalPax;
    destData.departurePassengers += departurePax;
    destData.totalBaggage += arrivalBaggage + departureBaggage;
  });

  // Convert maps to sorted arrays
  const airlineStats = Array.from(airlineMap.entries())
    .map(([airline, data]) => ({
      airline,
      passengers: data.passengers,
      operations: data.operations,
      logoUrl: data.logoUrl,
    }))
    .sort((a, b) => b.passengers - a.passengers);

  const destinationStats = Array.from(destinationMap.entries())
    .map(([destination, data]) => ({
      destination,
      arrivalPassengers: data.arrivalPassengers,
      departurePassengers: data.departurePassengers,
      totalBaggage: data.totalBaggage,
    }))
    .sort((a, b) =>
      (b.arrivalPassengers + b.departurePassengers) -
      (a.arrivalPassengers + a.departurePassengers)
    );

  // Calculate percentages
  const loadFactor = totalSeatsAvailable > 0
    ? (totalSeatsUsed / totalSeatsAvailable) * 100
    : 0;

  const arrivalDelayRate = totalArrivalFlights > 0
    ? (arrivalDelays / totalArrivalFlights) * 100
    : 0;

  const departureDelayRate = totalDepartureFlights > 0
    ? (departureDelays / totalDepartureFlights) * 100
    : 0;

  const arrivalOnTimeRate = 100 - arrivalDelayRate;
  const departureOnTimeRate = 100 - departureDelayRate;

  return {
    totalPassengers,
    totalArrivalPassengers,
    totalDeparturePassengers,
    totalOperations,
    totalBaggage,
    totalCargo,
    scheduledOperations,
    charterOperations,
    scheduledPassengers,
    charterPassengers,
    loadFactor,
    arrivalOnTimeRate,
    departureOnTimeRate,
    arrivalDelayRate,
    departureDelayRate,
    airlineStats,
    destinationStats,
  };
}

function calculateGrowth(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
