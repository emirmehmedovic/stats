import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { endOfDayUtc, startOfDayUtc } from '@/lib/dates';

const ON_TIME_THRESHOLD_MINUTES = 15;

type RouteStats = {
  route: string;
  flights: number;
  passengers: number;
  avgPassengers: number | null;
  loadFactor: number | null;
  avgDelayMinutes: number | null;
  onTimeRate: number | null;
};

type DailyReport = {
  mode: 'single';
  period: string;
  date: string;
  flights: any[];
  totals: {
    flights: number;
    arrivalFlights: number;
    arrivalPassengers: number;
    arrivalInfants: number;
    arrivalBaggage: number;
    arrivalCargo: number;
    arrivalMail: number;
    departureFlights: number;
    departurePassengers: number;
    departureInfants: number;
    departureBaggage: number;
    departureCargo: number;
    departureMail: number;
    totalPassengers: number;
    totalBaggage: number;
    totalCargo: number;
    totalMail: number;
  };
  loadFactor: {
    overall: number | null;
    totalPassengers: number;
    totalSeats: number;
  };
  punctuality: {
    overallOnTimeRate: number | null;
    overallAvgDelayMinutes: number | null;
    totalDelaySamples: number;
  };
  byAirline: Array<{
    airline: string;
    icaoCode: string;
    flights: number;
    passengers: number;
  }>;
  routesAll: RouteStats[];
  airlinesAll: Array<{
    airline: string;
    icaoCode: string;
    flights: number;
    passengers: number;
    avgPassengers: number | null;
    loadFactor: number | null;
    avgDelayMinutes: number | null;
    onTimeRate: number | null;
  }>;
};

type MultiDailyReport = {
  mode: 'multi';
  periods: string[];
  periodsData: DailyReport[];
  comparisons: {
    commonRoutes: Array<{
      route: string;
      totalPassengers: number;
      perPeriod: Array<{
        period: string;
        flights: number;
        passengers: number;
        loadFactor: number | null;
        avgDelayMinutes: number | null;
        onTimeRate: number | null;
      }>;
    }>;
    commonAirlines: Array<{
      airline: string;
      icaoCode: string;
      totalPassengers: number;
      perPeriod: Array<{
        period: string;
        flights: number;
        passengers: number;
        loadFactor: number | null;
        avgDelayMinutes: number | null;
        onTimeRate: number | null;
      }>;
    }>;
  };
};

const getArrivalPassengers = (flight: any) =>
  flight.arrivalFerryIn ? 0 : (flight.arrivalPassengers || 0);
const getDeparturePassengers = (flight: any) =>
  flight.departureFerryOut ? 0 : (flight.departurePassengers || 0);
const getLegCount = (flight: any) =>
  (flight.arrivalFlightNumber ? 1 : 0) + (flight.departureFlightNumber ? 1 : 0);
const getDelayMinutes = (scheduled?: Date | null, actual?: Date | null) => {
  if (!scheduled || !actual) return null;
  const diffMs = actual.getTime() - scheduled.getTime();
  const minutes = Math.round(diffMs / 60000);
  return minutes < 0 ? 0 : minutes;
};

const buildDailyReport = async (
  periodLabel: string,
  dateStartStr: string,
  dateEndStr: string,
  includeFlights: boolean
): Promise<DailyReport> => {
  const dayStart = startOfDayUtc(dateStartStr);
  const dayEnd = endOfDayUtc(dateEndStr);

  const flights = await prisma.flight.findMany({
    where: {
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
    include: {
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
    orderBy: [
      { arrivalScheduledTime: 'asc' },
      { departureScheduledTime: 'asc' },
    ],
  });

  const totals = {
    flights: flights.length,
    arrivalFlights: flights.filter((f) => f.arrivalFlightNumber).length,
    arrivalPassengers: flights.reduce((sum, f) => sum + getArrivalPassengers(f), 0),
    arrivalInfants: flights.reduce((sum, f) => sum + (f.arrivalInfants || 0), 0),
    arrivalBaggage: flights.reduce((sum, f) => sum + (f.arrivalBaggage || 0), 0),
    arrivalCargo: flights.reduce((sum, f) => sum + (f.arrivalCargo || 0), 0),
    arrivalMail: flights.reduce((sum, f) => sum + (f.arrivalMail || 0), 0),
    departureFlights: flights.filter((f) => f.departureFlightNumber).length,
    departurePassengers: flights.reduce((sum, f) => sum + getDeparturePassengers(f), 0),
    departureInfants: flights.reduce((sum, f) => sum + (f.departureInfants || 0), 0),
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

  const routeAccumulator = new Map<
    string,
    {
      route: string;
      flights: number;
      passengers: number;
      seats: number;
      passengersForLoad: number;
      delayCount: number;
      delayTotal: number;
      onTimeCount: number;
    }
  >();

  const airlineAccumulator = new Map<
    string,
    {
      airline: string;
      icaoCode: string;
      flights: number;
      passengers: number;
      seats: number;
      passengersForLoad: number;
      delayCount: number;
      delayTotal: number;
      onTimeCount: number;
    }
  >();

  let totalSeats = 0;
  let totalPassengersForLoad = 0;
  let totalDelayMinutes = 0;
  let totalDelaySamples = 0;
  let totalOnTimeSamples = 0;

  flights.forEach((flight) => {
    const routeKey = flight.route || 'N/A';
    const routeCurrent = routeAccumulator.get(routeKey) || {
      route: routeKey,
      flights: 0,
      passengers: 0,
      seats: 0,
      passengersForLoad: 0,
      delayCount: 0,
      delayTotal: 0,
      onTimeCount: 0,
    };

    const airlineKey = flight.airline.icaoCode || flight.airline.name;
    const airlineCurrent = airlineAccumulator.get(airlineKey) || {
      airline: flight.airline.name,
      icaoCode: flight.airline.icaoCode,
      flights: 0,
      passengers: 0,
      seats: 0,
      passengersForLoad: 0,
      delayCount: 0,
      delayTotal: 0,
      onTimeCount: 0,
    };

    const passengers = getArrivalPassengers(flight) + getDeparturePassengers(flight);
    routeCurrent.flights += 1;
    routeCurrent.passengers += passengers;
    airlineCurrent.flights += 1;
    airlineCurrent.passengers += passengers;

    const legCount = getLegCount(flight);
    if (flight.availableSeats && legCount > 0) {
      const seats = flight.availableSeats * legCount;
      routeCurrent.seats += seats;
      routeCurrent.passengersForLoad += passengers;
      airlineCurrent.seats += seats;
      airlineCurrent.passengersForLoad += passengers;
      totalSeats += seats;
      totalPassengersForLoad += passengers;
    }

    const arrivalDelay = getDelayMinutes(
      flight.arrivalScheduledTime,
      flight.arrivalActualTime
    );
    if (arrivalDelay !== null && flight.arrivalStatus !== 'CANCELLED') {
      routeCurrent.delayCount += 1;
      routeCurrent.delayTotal += arrivalDelay;
      airlineCurrent.delayCount += 1;
      airlineCurrent.delayTotal += arrivalDelay;
      totalDelayMinutes += arrivalDelay;
      totalDelaySamples += 1;
      if (arrivalDelay <= ON_TIME_THRESHOLD_MINUTES) {
        routeCurrent.onTimeCount += 1;
        airlineCurrent.onTimeCount += 1;
        totalOnTimeSamples += 1;
      }
    }

    const departureDelay = getDelayMinutes(
      flight.departureScheduledTime,
      flight.departureActualTime
    );
    if (departureDelay !== null && flight.departureStatus !== 'CANCELLED') {
      routeCurrent.delayCount += 1;
      routeCurrent.delayTotal += departureDelay;
      airlineCurrent.delayCount += 1;
      airlineCurrent.delayTotal += departureDelay;
      totalDelayMinutes += departureDelay;
      totalDelaySamples += 1;
      if (departureDelay <= ON_TIME_THRESHOLD_MINUTES) {
        routeCurrent.onTimeCount += 1;
        airlineCurrent.onTimeCount += 1;
        totalOnTimeSamples += 1;
      }
    }

    routeAccumulator.set(routeKey, routeCurrent);
    airlineAccumulator.set(airlineKey, airlineCurrent);
  });

  const routesAll = Array.from(routeAccumulator.values()).map((route) => {
    const avgPassengers =
      route.flights > 0 ? route.passengers / route.flights : null;
    const loadFactor =
      route.seats > 0 ? route.passengersForLoad / route.seats : null;
    const avgDelayMinutes =
      route.delayCount > 0 ? route.delayTotal / route.delayCount : null;
    const onTimeRate =
      route.delayCount > 0 ? route.onTimeCount / route.delayCount : null;
    return {
      route: route.route,
      flights: route.flights,
      passengers: route.passengers,
      avgPassengers: avgPassengers ? Number(avgPassengers.toFixed(2)) : null,
      loadFactor: loadFactor ? Number((loadFactor * 100).toFixed(2)) : null,
      avgDelayMinutes: avgDelayMinutes !== null ? Number(avgDelayMinutes.toFixed(2)) : null,
      onTimeRate: onTimeRate !== null ? Number((onTimeRate * 100).toFixed(2)) : null,
    };
  });

  const airlinesAll = Array.from(airlineAccumulator.values()).map((airline) => {
    const avgPassengers =
      airline.flights > 0 ? airline.passengers / airline.flights : null;
    const loadFactor =
      airline.seats > 0 ? airline.passengersForLoad / airline.seats : null;
    const avgDelayMinutes =
      airline.delayCount > 0 ? airline.delayTotal / airline.delayCount : null;
    const onTimeRate =
      airline.delayCount > 0 ? airline.onTimeCount / airline.delayCount : null;
    return {
      airline: airline.airline,
      icaoCode: airline.icaoCode,
      flights: airline.flights,
      passengers: airline.passengers,
      avgPassengers: avgPassengers ? Number(avgPassengers.toFixed(2)) : null,
      loadFactor: loadFactor ? Number((loadFactor * 100).toFixed(2)) : null,
      avgDelayMinutes: avgDelayMinutes !== null ? Number(avgDelayMinutes.toFixed(2)) : null,
      onTimeRate: onTimeRate !== null ? Number((onTimeRate * 100).toFixed(2)) : null,
    };
  });

  const byAirline = flights.reduce((acc, flight) => {
    const airlineKey = flight.airline.icaoCode;
    if (!acc[airlineKey]) {
      acc[airlineKey] = {
        airline: flight.airline.name,
        icaoCode: flight.airline.icaoCode,
        flights: 0,
        passengers: 0,
      };
    }
    acc[airlineKey].flights++;
    acc[airlineKey].passengers += getArrivalPassengers(flight) + getDeparturePassengers(flight);
    return acc;
  }, {} as Record<string, any>);

  const airlineStats = Object.values(byAirline);

  const overallLoadFactor =
    totalSeats > 0 ? Number(((totalPassengersForLoad / totalSeats) * 100).toFixed(2)) : null;
  const overallAvgDelay =
    totalDelaySamples > 0 ? Number((totalDelayMinutes / totalDelaySamples).toFixed(2)) : null;
  const overallOnTimeRate =
    totalDelaySamples > 0 ? Number(((totalOnTimeSamples / totalDelaySamples) * 100).toFixed(2)) : null;

  return {
    mode: 'single',
    period: periodLabel,
    date: dateStartStr,
    flights: includeFlights ? flights : [],
    totals,
    loadFactor: {
      overall: overallLoadFactor,
      totalPassengers: totalPassengersForLoad,
      totalSeats,
    },
    punctuality: {
      overallOnTimeRate: overallOnTimeRate,
      overallAvgDelayMinutes: overallAvgDelay,
      totalDelaySamples,
    },
    byAirline: airlineStats,
    routesAll,
    airlinesAll,
  };
};

// GET /api/reports/daily?date=YYYY-MM-DD - Daily report
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    const periodsParam = searchParams.get('periods');

    if (!dateParam && !periodsParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datum je obavezan (format: YYYY-MM-DD)',
        },
        { status: 400 }
      );
    }

    if (periodsParam) {
      const periods = periodsParam
        .split(',')
        .map((value) => value.trim())
        .filter((value) => value.length > 0);

      if (periods.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Neispravan format perioda',
          },
          { status: 400 }
        );
      }

      const periodsData = await Promise.all(
        periods.map((period) => {
          if (period.includes('..')) {
            const [start, end] = period.split('..');
            return buildDailyReport(period, start, end, false);
          }
          return buildDailyReport(period, period, period, false);
        })
      );

      const routeSets = periodsData.map(
        (periodData) => new Set(periodData.routesAll.map((route) => route.route))
      );
      const commonRoutes = routeSets.reduce((acc, set) => {
        if (!acc) return set;
        return new Set([...acc].filter((route) => set.has(route)));
      }, undefined as Set<string> | undefined);

      const routeComparisons = [...(commonRoutes || new Set())].map((route) => {
        const perPeriod = periodsData.map((periodData) => {
          const routeStats = periodData.routesAll.find((item) => item.route === route);
          return {
            period: periodData.period,
            flights: routeStats?.flights || 0,
            passengers: routeStats?.passengers || 0,
            loadFactor: routeStats?.loadFactor ?? null,
            avgDelayMinutes: routeStats?.avgDelayMinutes ?? null,
            onTimeRate: routeStats?.onTimeRate ?? null,
          };
        });
        const totalPassengers = perPeriod.reduce((sum, item) => sum + item.passengers, 0);
        return { route, totalPassengers, perPeriod };
      });

      const airlineSets = periodsData.map(
        (periodData) =>
          new Set(periodData.airlinesAll.map((airline) => airline.icaoCode || airline.airline))
      );
      const commonAirlines = airlineSets.reduce((acc, set) => {
        if (!acc) return set;
        return new Set([...acc].filter((code) => set.has(code)));
      }, undefined as Set<string> | undefined);

      const airlineComparisons = [...(commonAirlines || new Set())].map((code) => {
        const perPeriod = periodsData.map((periodData) => {
          const airlineStats = periodData.airlinesAll.find(
            (item) => item.icaoCode === code || item.airline === code
          );
          return {
            period: periodData.period,
            flights: airlineStats?.flights || 0,
            passengers: airlineStats?.passengers || 0,
            loadFactor: airlineStats?.loadFactor ?? null,
            avgDelayMinutes: airlineStats?.avgDelayMinutes ?? null,
            onTimeRate: airlineStats?.onTimeRate ?? null,
          };
        });
        const totalPassengers = perPeriod.reduce((sum, item) => sum + item.passengers, 0);
        const airlineName =
          periodsData.find((periodData) =>
            periodData.airlinesAll.find(
              (item) => item.icaoCode === code || item.airline === code
            )
          )?.airlinesAll.find((item) => item.icaoCode === code || item.airline === code)?.airline ||
          code;
        return { airline: airlineName, icaoCode: code, totalPassengers, perPeriod };
      });

      routeComparisons.sort((a, b) => b.totalPassengers - a.totalPassengers);
      airlineComparisons.sort((a, b) => b.totalPassengers - a.totalPassengers);

      const payload: MultiDailyReport = {
        mode: 'multi',
        periods,
        periodsData,
        comparisons: {
          commonRoutes: routeComparisons,
          commonAirlines: airlineComparisons,
        },
      };

      return NextResponse.json({
        success: true,
        data: payload,
      });
    }

    if (!dateParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datum je obavezan (format: YYYY-MM-DD)',
        },
        { status: 400 }
      );
    }

    const dayStart = startOfDayUtc(dateParam);
    const dayEnd = endOfDayUtc(dateParam);
    if (isNaN(dayStart.getTime()) || isNaN(dayEnd.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Neispravan format datuma',
        },
        { status: 400 }
      );
    }

    const payload = await buildDailyReport(dateParam, dateParam, dateParam, true);

    return NextResponse.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    console.error('Daily report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri generisanju izvještaja',
      },
      { status: 500 }
    );
  }
}
