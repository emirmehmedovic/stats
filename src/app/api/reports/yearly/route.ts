import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { eachMonthOfInterval } from 'date-fns';
import { dateStringFromParts, endOfDayUtc, formatDateDisplay, startOfDayUtc } from '@/lib/dates';

const ON_TIME_THRESHOLD_MINUTES = 15;
const MIN_ROUTE_FLIGHTS = 3;

type RouteStats = {
  route: string;
  flights: number;
  passengers: number;
  seats: number;
  avgPassengers: number | null;
  loadFactor: number | null;
  delayCount: number;
  avgDelayMinutes: number | null;
  onTimeRate: number | null;
};

type RouteAccumulator = {
  route: string;
  flights: number;
  passengers: number;
  seats: number;
  passengersForLoad: number;
  delayCount: number;
  delayTotal: number;
  onTimeCount: number;
};

type YearlyReport = {
  mode: 'single';
  year: number;
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
  monthlyBreakdown: Array<{
    month: string;
    monthNumber: number;
    flights: number;
    passengers: number;
    arrivalFlights: number;
    departureFlights: number;
    cargo: number;
  }>;
  loadFactor: {
    overall: number | null;
    totalPassengers: number;
    totalSeats: number;
    byMonth: Array<{
      monthNumber: number;
      month: string;
      passengers: number;
      seats: number;
      loadFactor: number | null;
    }>;
  };
  punctuality: {
    overallOnTimeRate: number | null;
    overallAvgDelayMinutes: number | null;
    totalDelaySamples: number;
    byMonth: Array<{
      monthNumber: number;
      month: string;
      onTimeRate: number | null;
      avgDelayMinutes: number | null;
      delaySamples: number;
    }>;
  };
  routes: {
    topByPassengers: RouteStats[];
    topByLoadFactor: RouteStats[];
    mostDelayed: RouteStats[];
    leastDelayed: RouteStats[];
    lowestAvgPassengers: RouteStats[];
  };
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
  yoyComparison: {
    flights: {
      current: number;
      previous: number;
      growth: number;
    };
    passengers: {
      current: number;
      previous: number;
      growth: number;
    };
    cargo: {
      current: number;
      previous: number;
      growth: number;
    };
  };
  byAirline: Array<{
    airline: string;
    icaoCode: string;
    flights: number;
    passengers: number;
  }>;
  seasonalAnalysis: Array<{
    quarter: string;
    flights: number;
    passengers: number;
    avgFlightsPerMonth: number;
  }>;
  hasPreviousYearData: boolean;
};

type MultiYearReport = {
  mode: 'multi';
  years: number[];
  yearsData: YearlyReport[];
  comparisons: {
    commonRoutes: Array<{
      route: string;
      totalPassengers: number;
      perYear: Array<{
        year: number;
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
      perYear: Array<{
        year: number;
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

const buildYearlyReport = async (year: number): Promise<YearlyReport> => {
  const yearStart = startOfDayUtc(dateStringFromParts(year, 1, 1));
  const yearEnd = endOfDayUtc(dateStringFromParts(year, 12, 31));

  const flights = await prisma.flight.findMany({
    where: {
      date: {
        gte: yearStart,
        lte: yearEnd,
      },
    },
    include: {
      airline: {
        select: {
          name: true,
          icaoCode: true,
        },
      },
    },
    orderBy: {
      date: 'asc',
    },
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

  const monthsInYear = eachMonthOfInterval({ start: yearStart, end: yearEnd });
  const monthlyBreakdown = monthsInYear.map((month) => {
    const monthStart = startOfDayUtc(
      dateStringFromParts(month.getUTCFullYear(), month.getUTCMonth() + 1, 1)
    );
    const monthEnd = endOfDayUtc(
      dateStringFromParts(month.getUTCFullYear(), month.getUTCMonth() + 2, 0)
    );

    const monthFlights = flights.filter((f) => {
      const flightDate = new Date(f.date);
      return flightDate >= monthStart && flightDate <= monthEnd;
    });

    return {
      month: formatDateDisplay(month),
      monthNumber: month.getUTCMonth() + 1,
      flights: monthFlights.length,
      passengers: monthFlights.reduce(
        (sum, f) => sum + getArrivalPassengers(f) + getDeparturePassengers(f),
        0
      ),
      arrivalFlights: monthFlights.filter((f) => f.arrivalFlightNumber).length,
      departureFlights: monthFlights.filter((f) => f.departureFlightNumber).length,
      cargo: monthFlights.reduce(
        (sum, f) => sum + (f.arrivalCargo || 0) + (f.departureCargo || 0),
        0
      ),
    };
  });

  const routeStats = new Map<string, RouteAccumulator>();
  const monthLoadFactor = new Map<number, { passengers: number; seats: number }>();
  const monthPunctuality = new Map<
    number,
    { delayTotal: number; delayCount: number; onTimeCount: number }
  >();

  let totalSeats = 0;
  let totalPassengers = 0;
  let totalDelayMinutes = 0;
  let totalDelaySamples = 0;
  let totalOnTimeSamples = 0;

  flights.forEach((flight) => {
    const routeKey = flight.route || 'N/A';
    const current = routeStats.get(routeKey) || {
      route: routeKey,
      flights: 0,
      passengers: 0,
      seats: 0,
      passengersForLoad: 0,
      delayCount: 0,
      delayTotal: 0,
      onTimeCount: 0,
    };

    const passengers =
      getArrivalPassengers(flight) + getDeparturePassengers(flight);
    current.flights += 1;
    current.passengers += passengers;

    const legCount = getLegCount(flight);
    if (flight.availableSeats && legCount > 0) {
      const seats = flight.availableSeats * legCount;
      current.seats += seats;
      current.passengersForLoad += passengers;
      totalSeats += seats;
      totalPassengers += passengers;
    }

    const monthNumber = new Date(flight.date).getUTCMonth() + 1;
    const monthLoad = monthLoadFactor.get(monthNumber) || { passengers: 0, seats: 0 };
    if (flight.availableSeats && legCount > 0) {
      monthLoad.seats += flight.availableSeats * legCount;
      monthLoad.passengers += passengers;
    }
    monthLoadFactor.set(monthNumber, monthLoad);

    const arrivalDelay = getDelayMinutes(
      flight.arrivalScheduledTime,
      flight.arrivalActualTime
    );
    if (arrivalDelay !== null && flight.arrivalStatus !== 'CANCELLED') {
      current.delayCount += 1;
      current.delayTotal += arrivalDelay;
      totalDelayMinutes += arrivalDelay;
      totalDelaySamples += 1;
      if (arrivalDelay <= ON_TIME_THRESHOLD_MINUTES) {
        totalOnTimeSamples += 1;
        current.onTimeCount += 1;
      }
      const monthDelay =
        monthPunctuality.get(monthNumber) || { delayTotal: 0, delayCount: 0, onTimeCount: 0 };
      monthDelay.delayTotal += arrivalDelay;
      monthDelay.delayCount += 1;
      if (arrivalDelay <= ON_TIME_THRESHOLD_MINUTES) {
        monthDelay.onTimeCount += 1;
      }
      monthPunctuality.set(monthNumber, monthDelay);
    }

    const departureDelay = getDelayMinutes(
      flight.departureScheduledTime,
      flight.departureActualTime
    );
    if (departureDelay !== null && flight.departureStatus !== 'CANCELLED') {
      current.delayCount += 1;
      current.delayTotal += departureDelay;
      totalDelayMinutes += departureDelay;
      totalDelaySamples += 1;
      if (departureDelay <= ON_TIME_THRESHOLD_MINUTES) {
        totalOnTimeSamples += 1;
        current.onTimeCount += 1;
      }
      const monthDelay =
        monthPunctuality.get(monthNumber) || { delayTotal: 0, delayCount: 0, onTimeCount: 0 };
      monthDelay.delayTotal += departureDelay;
      monthDelay.delayCount += 1;
      if (departureDelay <= ON_TIME_THRESHOLD_MINUTES) {
        monthDelay.onTimeCount += 1;
      }
      monthPunctuality.set(monthNumber, monthDelay);
    }

    routeStats.set(routeKey, current);
  });

  const routesArray = Array.from(routeStats.values()).map((route) => {
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
      seats: route.seats,
      delayCount: route.delayCount,
      avgPassengers: avgPassengers ? Number(avgPassengers.toFixed(2)) : null,
      loadFactor: loadFactor ? Number((loadFactor * 100).toFixed(2)) : null,
      avgDelayMinutes: avgDelayMinutes !== null ? Number(avgDelayMinutes.toFixed(2)) : null,
      onTimeRate: onTimeRate !== null ? Number((onTimeRate * 100).toFixed(2)) : null,
    };
  });

  const filteredRoutes = routesArray.filter((route) => route.flights >= MIN_ROUTE_FLIGHTS);

  const topByPassengers = [...filteredRoutes]
    .sort((a, b) => b.passengers - a.passengers)
    .slice(0, 10);
  const topByLoadFactor = [...filteredRoutes]
    .filter((route) => route.loadFactor !== null)
    .sort((a, b) => (b.loadFactor || 0) - (a.loadFactor || 0))
    .slice(0, 10);
  const mostDelayed = [...filteredRoutes]
    .filter((route) => route.avgDelayMinutes !== null)
    .sort((a, b) => (b.avgDelayMinutes || 0) - (a.avgDelayMinutes || 0))
    .slice(0, 10);
  const leastDelayed = [...filteredRoutes]
    .filter((route) => route.avgDelayMinutes !== null)
    .sort((a, b) => (a.avgDelayMinutes || 0) - (b.avgDelayMinutes || 0))
    .slice(0, 10);
  const lowestAvgPassengers = [...filteredRoutes]
    .sort((a, b) => (a.avgPassengers || 0) - (b.avgPassengers || 0))
    .slice(0, 10);

  const routesAll = routesArray;

  const loadFactorByMonth = monthsInYear.map((month) => {
    const monthNumber = month.getUTCMonth() + 1;
    const monthLoad = monthLoadFactor.get(monthNumber) || { passengers: 0, seats: 0 };
    const loadFactor = monthLoad.seats > 0 ? (monthLoad.passengers / monthLoad.seats) * 100 : null;
    return {
      monthNumber,
      month: formatDateDisplay(month),
      passengers: monthLoad.passengers,
      seats: monthLoad.seats,
      loadFactor: loadFactor !== null ? Number(loadFactor.toFixed(2)) : null,
    };
  });

  const punctualityByMonth = monthsInYear.map((month) => {
    const monthNumber = month.getUTCMonth() + 1;
    const monthDelay = monthPunctuality.get(monthNumber) || {
      delayTotal: 0,
      delayCount: 0,
      onTimeCount: 0,
    };
    const avgDelayMinutes =
      monthDelay.delayCount > 0 ? monthDelay.delayTotal / monthDelay.delayCount : null;
    const onTimeRate =
      monthDelay.delayCount > 0 ? (monthDelay.onTimeCount / monthDelay.delayCount) * 100 : null;
    return {
      monthNumber,
      month: formatDateDisplay(month),
      onTimeRate: onTimeRate !== null ? Number(onTimeRate.toFixed(2)) : null,
      avgDelayMinutes: avgDelayMinutes !== null ? Number(avgDelayMinutes.toFixed(2)) : null,
      delaySamples: monthDelay.delayCount,
    };
  });

  const prevYear = year - 1;
  const prevYearStart = startOfDayUtc(dateStringFromParts(prevYear, 1, 1));
  const prevYearEnd = endOfDayUtc(dateStringFromParts(prevYear, 12, 31));

  const prevYearFlights = await prisma.flight.findMany({
    where: {
      date: {
        gte: prevYearStart,
        lte: prevYearEnd,
      },
    },
  });

  const prevYearTotals = {
    flights: prevYearFlights.length,
    passengers: prevYearFlights.reduce(
      (sum, f) => sum + getArrivalPassengers(f) + getDeparturePassengers(f),
      0
    ),
    cargo: prevYearFlights.reduce(
      (sum, f) => sum + (f.arrivalCargo || 0) + (f.departureCargo || 0),
      0
    ),
  };

  const yoyComparison = {
    flights: {
      current: totals.flights,
      previous: prevYearTotals.flights,
      growth:
        prevYearTotals.flights > 0
          ? ((totals.flights - prevYearTotals.flights) / prevYearTotals.flights) * 100
          : 0,
    },
    passengers: {
      current: totals.totalPassengers,
      previous: prevYearTotals.passengers,
      growth:
        prevYearTotals.passengers > 0
          ? ((totals.totalPassengers - prevYearTotals.passengers) / prevYearTotals.passengers) * 100
          : 0,
    },
    cargo: {
      current: totals.totalCargo,
      previous: prevYearTotals.cargo,
      growth:
        prevYearTotals.cargo > 0
          ? ((totals.totalCargo - prevYearTotals.cargo) / prevYearTotals.cargo) * 100
          : 0,
    },
  };

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

  const airlineStats = Object.values(byAirline).sort(
    (a: any, b: any) => b.flights - a.flights
  );

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

  flights.forEach((flight) => {
    const key = flight.airline.icaoCode || flight.airline.name;
    const current = airlineAccumulator.get(key) || {
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
    current.flights += 1;
    current.passengers += passengers;

    const legCount = getLegCount(flight);
    if (flight.availableSeats && legCount > 0) {
      const seats = flight.availableSeats * legCount;
      current.seats += seats;
      current.passengersForLoad += passengers;
    }

    const arrivalDelay = getDelayMinutes(
      flight.arrivalScheduledTime,
      flight.arrivalActualTime
    );
    if (arrivalDelay !== null && flight.arrivalStatus !== 'CANCELLED') {
      current.delayCount += 1;
      current.delayTotal += arrivalDelay;
      if (arrivalDelay <= ON_TIME_THRESHOLD_MINUTES) {
        current.onTimeCount += 1;
      }
    }

    const departureDelay = getDelayMinutes(
      flight.departureScheduledTime,
      flight.departureActualTime
    );
    if (departureDelay !== null && flight.departureStatus !== 'CANCELLED') {
      current.delayCount += 1;
      current.delayTotal += departureDelay;
      if (departureDelay <= ON_TIME_THRESHOLD_MINUTES) {
        current.onTimeCount += 1;
      }
    }

    airlineAccumulator.set(key, current);
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

  const quarters = [
    { name: 'Q1 (Jan-Mar)', months: [1, 2, 3] },
    { name: 'Q2 (Apr-Jun)', months: [4, 5, 6] },
    { name: 'Q3 (Jul-Sep)', months: [7, 8, 9] },
    { name: 'Q4 (Oct-Dec)', months: [10, 11, 12] },
  ];

  const seasonalAnalysis = quarters.map((quarter) => {
    const quarterData = monthlyBreakdown.filter((m) =>
      quarter.months.includes(m.monthNumber)
    );

    return {
      quarter: quarter.name,
      flights: quarterData.reduce((sum, m) => sum + m.flights, 0),
      passengers: quarterData.reduce((sum, m) => sum + m.passengers, 0),
      avgFlightsPerMonth: Math.round(
        quarterData.reduce((sum, m) => sum + m.flights, 0) / quarter.months.length
      ),
    };
  });

  const overallLoadFactor =
    totalSeats > 0 ? Number(((totalPassengers / totalSeats) * 100).toFixed(2)) : null;

  const overallAvgDelay =
    totalDelaySamples > 0 ? Number((totalDelayMinutes / totalDelaySamples).toFixed(2)) : null;
  const overallOnTimeRate =
    totalDelaySamples > 0 ? Number(((totalOnTimeSamples / totalDelaySamples) * 100).toFixed(2)) : null;

  return {
    mode: 'single',
    year,
    totals,
    monthlyBreakdown,
    loadFactor: {
      overall: overallLoadFactor,
      totalPassengers,
      totalSeats,
      byMonth: loadFactorByMonth,
    },
    punctuality: {
      overallOnTimeRate,
      overallAvgDelayMinutes: overallAvgDelay,
      totalDelaySamples,
      byMonth: punctualityByMonth,
    },
    routes: {
      topByPassengers,
      topByLoadFactor,
      mostDelayed,
      leastDelayed,
      lowestAvgPassengers,
    },
    routesAll,
    airlinesAll,
    yoyComparison,
    byAirline: airlineStats,
    seasonalAnalysis,
    hasPreviousYearData: prevYearFlights.length > 0,
  };
};


// GET /api/reports/yearly?year=YYYY - Yearly report
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const yearParam = searchParams.get('year');
    const yearsParam = searchParams.get('years');

    if (!yearParam && !yearsParam) {
      return NextResponse.json(
        {
          success: false,
          error: 'Godina je obavezna (format: year=YYYY)',
        },
        { status: 400 }
      );
    }

    if (yearsParam) {
      const years = yearsParam
        .split(',')
        .map((value) => parseInt(value.trim(), 10))
        .filter((value) => !isNaN(value));

      if (years.length === 0) {
        return NextResponse.json(
          {
            success: false,
            error: 'Neispravan format godina',
          },
          { status: 400 }
        );
      }

      const yearsData = await Promise.all(years.map((value) => buildYearlyReport(value)));

      const routeSets = yearsData.map(
        (yearData) => new Set(yearData.routesAll.map((route) => route.route))
      );
      const commonRoutes = routeSets.reduce((acc, set) => {
        if (!acc) return set;
        return new Set([...acc].filter((route) => set.has(route)));
      }, undefined as Set<string> | undefined);

      const routeComparisons = [...(commonRoutes || new Set())].map((route) => {
        const perYear = yearsData.map((yearData) => {
          const routeStats = yearData.routesAll.find((item) => item.route === route);
          return {
            year: yearData.year,
            flights: routeStats?.flights || 0,
            passengers: routeStats?.passengers || 0,
            loadFactor: routeStats?.loadFactor ?? null,
            avgDelayMinutes: routeStats?.avgDelayMinutes ?? null,
            onTimeRate: routeStats?.onTimeRate ?? null,
          };
        });
        const totalPassengers = perYear.reduce((sum, item) => sum + item.passengers, 0);
        return { route, totalPassengers, perYear };
      });

      const airlineSets = yearsData.map(
        (yearData) => new Set(yearData.airlinesAll.map((airline) => airline.icaoCode || airline.airline))
      );
      const commonAirlines = airlineSets.reduce((acc, set) => {
        if (!acc) return set;
        return new Set([...acc].filter((code) => set.has(code)));
      }, undefined as Set<string> | undefined);

      const airlineComparisons = [...(commonAirlines || new Set())].map((code) => {
        const perYear = yearsData.map((yearData) => {
          const airlineStats = yearData.airlinesAll.find(
            (item) => item.icaoCode === code || item.airline === code
          );
          return {
            year: yearData.year,
            flights: airlineStats?.flights || 0,
            passengers: airlineStats?.passengers || 0,
            loadFactor: airlineStats?.loadFactor ?? null,
            avgDelayMinutes: airlineStats?.avgDelayMinutes ?? null,
            onTimeRate: airlineStats?.onTimeRate ?? null,
          };
        });
        const totalPassengers = perYear.reduce((sum, item) => sum + item.passengers, 0);
        const airlineName =
          yearsData.find((yearData) =>
            yearData.airlinesAll.find(
              (item) => item.icaoCode === code || item.airline === code
            )
          )?.airlinesAll.find((item) => item.icaoCode === code || item.airline === code)?.airline || code;
        return { airline: airlineName, icaoCode: code, totalPassengers, perYear };
      });

      routeComparisons.sort((a, b) => b.totalPassengers - a.totalPassengers);
      airlineComparisons.sort((a, b) => b.totalPassengers - a.totalPassengers);

      const payload: MultiYearReport = {
        mode: 'multi',
        years,
        yearsData,
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

    const year = parseInt(yearParam || '', 10);
    if (isNaN(year)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Neispravan format godine',
        },
        { status: 400 }
      );
    }

    const payload = await buildYearlyReport(year);

    return NextResponse.json({
      success: true,
      data: payload,
    });
  } catch (error) {
    console.error('Yearly report error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri generisanju godišnjeg izvještaja',
      },
      { status: 500 }
    );
  }
}
