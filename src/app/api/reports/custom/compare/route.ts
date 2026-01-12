import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { endOfDayUtc, formatDateDisplay, getDateStringInTimeZone, startOfDayUtc, TIME_ZONE_SARAJEVO } from '@/lib/dates';
import { cache, CacheTTL } from '@/lib/cache';

const ON_TIME_THRESHOLD_MINUTES = 15;

type SummaryMetrics = {
  loadFactor: number | null;
  onTimeRate: number | null;
  avgDelayMinutes: number | null;
  cancelledRate: number | null;
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

const computeSummaryMetrics = (flights: any[]): SummaryMetrics => {
  let totalSeats = 0;
  let totalPassengers = 0;
  let totalDelayMinutes = 0;
  let totalDelaySamples = 0;
  let totalOnTimeSamples = 0;
  let totalLegs = 0;
  let cancelledLegs = 0;

  flights.forEach((flight) => {
    const passengers = getArrivalPassengers(flight) + getDeparturePassengers(flight);
    totalPassengers += passengers;

    const legCount = getLegCount(flight);
    const seatsPerLeg = flight.availableSeats || flight.aircraftType?.seats || 0;
    if (seatsPerLeg > 0 && legCount > 0) {
      totalSeats += seatsPerLeg * legCount;
    }

    if (flight.arrivalFlightNumber) {
      totalLegs += 1;
      if (flight.arrivalStatus === 'CANCELLED') cancelledLegs += 1;
    }

    if (flight.departureFlightNumber) {
      totalLegs += 1;
      if (flight.departureStatus === 'CANCELLED') cancelledLegs += 1;
    }

    const arrivalDelay = getDelayMinutes(
      flight.arrivalScheduledTime,
      flight.arrivalActualTime
    );
    if (arrivalDelay !== null && flight.arrivalStatus !== 'CANCELLED') {
      totalDelayMinutes += arrivalDelay;
      totalDelaySamples += 1;
      if (arrivalDelay <= ON_TIME_THRESHOLD_MINUTES) {
        totalOnTimeSamples += 1;
      }
    }

    const departureDelay = getDelayMinutes(
      flight.departureScheduledTime,
      flight.departureActualTime
    );
    if (departureDelay !== null && flight.departureStatus !== 'CANCELLED') {
      totalDelayMinutes += departureDelay;
      totalDelaySamples += 1;
      if (departureDelay <= ON_TIME_THRESHOLD_MINUTES) {
        totalOnTimeSamples += 1;
      }
    }
  });

  const loadFactor = totalSeats > 0 ? (totalPassengers / totalSeats) * 100 : null;
  const avgDelayMinutes = totalDelaySamples > 0 ? totalDelayMinutes / totalDelaySamples : null;
  const onTimeRate = totalDelaySamples > 0 ? (totalOnTimeSamples / totalDelaySamples) * 100 : null;
  const cancelledRate = totalLegs > 0 ? (cancelledLegs / totalLegs) * 100 : null;

  return {
    loadFactor: loadFactor !== null ? Number(loadFactor.toFixed(2)) : null,
    onTimeRate: onTimeRate !== null ? Number(onTimeRate.toFixed(2)) : null,
    avgDelayMinutes: avgDelayMinutes !== null ? Number(avgDelayMinutes.toFixed(2)) : null,
    cancelledRate: cancelledRate !== null ? Number(cancelledRate.toFixed(2)) : null,
  };
};

const computeTotals = (flights: any[]) => {
  const arrivalFlights = flights.filter((flight) => flight.arrivalFlightNumber).length;
  const departureFlights = flights.filter((flight) => flight.departureFlightNumber).length;
  const arrivalPassengers = flights.reduce((sum, flight) => sum + getArrivalPassengers(flight), 0);
  const departurePassengers = flights.reduce((sum, flight) => sum + getDeparturePassengers(flight), 0);
  const arrivalBaggage = flights.reduce((sum, flight) => sum + (flight.arrivalBaggage || 0), 0);
  const departureBaggage = flights.reduce((sum, flight) => sum + (flight.departureBaggage || 0), 0);
  const arrivalCargo = flights.reduce((sum, flight) => sum + (flight.arrivalCargo || 0), 0);
  const departureCargo = flights.reduce((sum, flight) => sum + (flight.departureCargo || 0), 0);
  const arrivalMail = flights.reduce((sum, flight) => sum + (flight.arrivalMail || 0), 0);
  const departureMail = flights.reduce((sum, flight) => sum + (flight.departureMail || 0), 0);

  return {
    flights: flights.length,
    arrivalFlights,
    departureFlights,
    arrivalPassengers,
    departurePassengers,
    arrivalBaggage,
    departureBaggage,
    arrivalCargo,
    departureCargo,
    arrivalMail,
    departureMail,
    totalPassengers: arrivalPassengers + departurePassengers,
    totalBaggage: arrivalBaggage + departureBaggage,
    totalCargo: arrivalCargo + departureCargo,
    totalMail: arrivalMail + departureMail,
  };
};

const getHourInTimeZone = (date: Date): number => {
  const hourStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE_SARAJEVO,
    hour: '2-digit',
    hour12: false,
  }).format(date);
  return Number(hourStr);
};

const computeGrowth = (current: number | null, previous: number | null) => {
  if (current === null || previous === null || previous <= 0) return 0;
  return ((current - previous) / previous) * 100;
};

const buildWhereClause = (
  startDate: Date,
  endDate: Date,
  airlineIds: string[] | null,
  routes: string[] | null,
  operationTypeId: string | null
) => {
  const whereClause: any = {
    date: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (airlineIds && airlineIds.length > 0) {
    whereClause.airlineId = { in: airlineIds };
  }

  if (routes && routes.length > 0) {
    whereClause.route = { in: routes };
  }

  if (operationTypeId && operationTypeId !== 'ALL') {
    whereClause.operationTypeId = operationTypeId;
  }

  return whereClause;
};

const buildPeriodAnalytics = (flights: any[], startDate: Date, endDate: Date) => {
  const totals = computeTotals(flights);
  const summary = computeSummaryMetrics(flights);

  const monthsInRange = eachMonthOfInterval({ start: startDate, end: endDate });
  const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
  const monthStats = new Map<
    string,
    {
      monthLabel: string;
      monthNumber: number;
      flights: number;
      passengers: number;
      arrivalFlights: number;
      departureFlights: number;
      cargo: number;
      passengersForLoad: number;
      seats: number;
      delayTotal: number;
      delayCount: number;
      onTimeCount: number;
    }
  >();

  const routeStats = new Map<
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

  let totalSeats = 0;
  let totalDelayMinutes = 0;
  let totalDelaySamples = 0;
  let totalOnTimeSamples = 0;
  let totalLegs = 0;
  let cancelledLegs = 0;
  let divertedLegs = 0;
  let scheduledLegs = 0;
  let operatedLegs = 0;

  const peakDaysMap = new Map<string, { date: string; passengers: number; flights: number }>();
  const peakHoursMap = new Map<number, { hour: number; passengers: number; flights: number }>();
  const dailyMap = new Map<
    string,
    {
      date: string;
      label: string;
      flights: number;
      passengers: number;
      seats: number;
      passengersForLoad: number;
      delayTotal: number;
      delayCount: number;
      onTimeCount: number;
    }
  >();

  flights.forEach((flight) => {
    const routeKey = flight.route || 'N/A';
    const currentRoute = routeStats.get(routeKey) || {
      route: routeKey,
      flights: 0,
      passengers: 0,
      seats: 0,
      passengersForLoad: 0,
      delayCount: 0,
      delayTotal: 0,
      onTimeCount: 0,
    };

    const arrivalPassengers = getArrivalPassengers(flight);
    const departurePassengers = getDeparturePassengers(flight);
    const passengers = arrivalPassengers + departurePassengers;
    const legCount = getLegCount(flight);
    const seatsPerLeg = flight.availableSeats || flight.aircraftType?.seats || 0;

    currentRoute.flights += 1;
    currentRoute.passengers += passengers;

    if (seatsPerLeg > 0 && legCount > 0) {
      const seatsForFlight = seatsPerLeg * legCount;
      currentRoute.seats += seatsForFlight;
      currentRoute.passengersForLoad += passengers;
      totalSeats += seatsForFlight;
    }

    const arrivalDelay = getDelayMinutes(
      flight.arrivalScheduledTime,
      flight.arrivalActualTime
    );
    if (arrivalDelay !== null && flight.arrivalStatus !== 'CANCELLED') {
      currentRoute.delayTotal += arrivalDelay;
      currentRoute.delayCount += 1;
      totalDelayMinutes += arrivalDelay;
      totalDelaySamples += 1;
      if (arrivalDelay <= ON_TIME_THRESHOLD_MINUTES) {
        currentRoute.onTimeCount += 1;
        totalOnTimeSamples += 1;
      }
    }

    const departureDelay = getDelayMinutes(
      flight.departureScheduledTime,
      flight.departureActualTime
    );
    if (departureDelay !== null && flight.departureStatus !== 'CANCELLED') {
      currentRoute.delayTotal += departureDelay;
      currentRoute.delayCount += 1;
      totalDelayMinutes += departureDelay;
      totalDelaySamples += 1;
      if (departureDelay <= ON_TIME_THRESHOLD_MINUTES) {
        currentRoute.onTimeCount += 1;
        totalOnTimeSamples += 1;
      }
    }

    routeStats.set(routeKey, currentRoute);

    if (flight.arrivalFlightNumber) {
      totalLegs += 1;
      if (flight.arrivalStatus === 'CANCELLED') cancelledLegs += 1;
      else if (flight.arrivalStatus === 'DIVERTED') divertedLegs += 1;
      else if (flight.arrivalStatus === 'SCHEDULED') scheduledLegs += 1;
      else if (flight.arrivalStatus === 'OPERATED') operatedLegs += 1;
    }

    if (flight.departureFlightNumber) {
      totalLegs += 1;
      if (flight.departureStatus === 'CANCELLED') cancelledLegs += 1;
      else if (flight.departureStatus === 'DIVERTED') divertedLegs += 1;
      else if (flight.departureStatus === 'SCHEDULED') scheduledLegs += 1;
      else if (flight.departureStatus === 'OPERATED') operatedLegs += 1;
    }

    const dateKey = getDateStringInTimeZone(flight.date);
    const peakDay = peakDaysMap.get(dateKey) || { date: dateKey, passengers: 0, flights: 0 };
    peakDay.passengers += passengers;
    peakDay.flights += 1;
    peakDaysMap.set(dateKey, peakDay);

    const hour = getHourInTimeZone(new Date(flight.date));
    const peakHour = peakHoursMap.get(hour) || { hour, passengers: 0, flights: 0 };
    peakHour.passengers += passengers;
    peakHour.flights += 1;
    peakHoursMap.set(hour, peakHour);

    const dailyEntry = dailyMap.get(dateKey) || {
      date: dateKey,
      label: formatDateDisplay(dateKey),
      flights: 0,
      passengers: 0,
      seats: 0,
      passengersForLoad: 0,
      delayTotal: 0,
      delayCount: 0,
      onTimeCount: 0,
    };
    dailyEntry.flights += 1;
    dailyEntry.passengers += passengers;
    if (seatsPerLeg > 0 && legCount > 0) {
      const seatsForFlight = seatsPerLeg * legCount;
      dailyEntry.seats += seatsForFlight;
      dailyEntry.passengersForLoad += passengers;
    }
    if (arrivalDelay !== null && flight.arrivalStatus !== 'CANCELLED') {
      dailyEntry.delayTotal += arrivalDelay;
      dailyEntry.delayCount += 1;
      if (arrivalDelay <= ON_TIME_THRESHOLD_MINUTES) {
        dailyEntry.onTimeCount += 1;
      }
    }
    if (departureDelay !== null && flight.departureStatus !== 'CANCELLED') {
      dailyEntry.delayTotal += departureDelay;
      dailyEntry.delayCount += 1;
      if (departureDelay <= ON_TIME_THRESHOLD_MINUTES) {
        dailyEntry.onTimeCount += 1;
      }
    }
    dailyMap.set(dateKey, dailyEntry);

    const monthKey = `${dateKey.slice(0, 7)}`;
    const monthLabel = formatDateDisplay(`${monthKey}-01`);
    const monthEntry = monthStats.get(monthKey) || {
      monthLabel,
      monthNumber: Number(monthKey.split('-')[1]),
      flights: 0,
      passengers: 0,
      arrivalFlights: 0,
      departureFlights: 0,
      cargo: 0,
      passengersForLoad: 0,
      seats: 0,
      delayTotal: 0,
      delayCount: 0,
      onTimeCount: 0,
    };

    monthEntry.flights += 1;
    monthEntry.passengers += passengers;
    monthEntry.arrivalFlights += flight.arrivalFlightNumber ? 1 : 0;
    monthEntry.departureFlights += flight.departureFlightNumber ? 1 : 0;
    monthEntry.cargo += (flight.arrivalCargo || 0) + (flight.departureCargo || 0);
    if (seatsPerLeg > 0 && legCount > 0) {
      const seatsForFlight = seatsPerLeg * legCount;
      monthEntry.seats += seatsForFlight;
      monthEntry.passengersForLoad += passengers;
    }
    if (arrivalDelay !== null && flight.arrivalStatus !== 'CANCELLED') {
      monthEntry.delayTotal += arrivalDelay;
      monthEntry.delayCount += 1;
      if (arrivalDelay <= ON_TIME_THRESHOLD_MINUTES) {
        monthEntry.onTimeCount += 1;
      }
    }
    if (departureDelay !== null && flight.departureStatus !== 'CANCELLED') {
      monthEntry.delayTotal += departureDelay;
      monthEntry.delayCount += 1;
      if (departureDelay <= ON_TIME_THRESHOLD_MINUTES) {
        monthEntry.onTimeCount += 1;
      }
    }
    monthStats.set(monthKey, monthEntry);
  });

  const monthlyBreakdown = monthsInRange.map((monthDate) => {
    const monthKey = `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, '0')}`;
    const entry = monthStats.get(monthKey);
    return {
      month: formatDateDisplay(monthDate),
      monthNumber: monthDate.getUTCMonth() + 1,
      flights: entry?.flights || 0,
      passengers: entry?.passengers || 0,
      arrivalFlights: entry?.arrivalFlights || 0,
      departureFlights: entry?.departureFlights || 0,
      cargo: entry?.cargo || 0,
    };
  });

  const dailyData = daysInRange.map((dayDate) => {
    const dateKey = getDateStringInTimeZone(dayDate);
    const entry = dailyMap.get(dateKey);
    const loadFactor =
      entry && entry.seats > 0 ? (entry.passengersForLoad / entry.seats) * 100 : null;
    const onTimeRate =
      entry && entry.delayCount > 0 ? (entry.onTimeCount / entry.delayCount) * 100 : null;
    const avgDelayMinutes =
      entry && entry.delayCount > 0 ? entry.delayTotal / entry.delayCount : null;
    return {
      date: dateKey,
      label: formatDateDisplay(dateKey),
      flights: entry?.flights || 0,
      passengers: entry?.passengers || 0,
      loadFactor: loadFactor !== null ? Number(loadFactor.toFixed(2)) : null,
      onTimeRate: onTimeRate !== null ? Number(onTimeRate.toFixed(2)) : null,
      avgDelayMinutes: avgDelayMinutes !== null ? Number(avgDelayMinutes.toFixed(2)) : null,
    };
  });

  const loadFactorByMonth = monthsInRange.map((monthDate) => {
    const monthKey = `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, '0')}`;
    const entry = monthStats.get(monthKey);
    const loadFactor =
      entry && entry.seats > 0 ? (entry.passengersForLoad / entry.seats) * 100 : null;
    return {
      monthNumber: monthDate.getUTCMonth() + 1,
      month: formatDateDisplay(monthDate),
      passengers: entry?.passengersForLoad || 0,
      seats: entry?.seats || 0,
      loadFactor: loadFactor !== null ? Number(loadFactor.toFixed(2)) : null,
    };
  });

  const punctualityByMonth = monthsInRange.map((monthDate) => {
    const monthKey = `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, '0')}`;
    const entry = monthStats.get(monthKey);
    const onTimeRate =
      entry && entry.delayCount > 0 ? (entry.onTimeCount / entry.delayCount) * 100 : null;
    const avgDelayMinutes =
      entry && entry.delayCount > 0 ? entry.delayTotal / entry.delayCount : null;
    return {
      monthNumber: monthDate.getUTCMonth() + 1,
      month: formatDateDisplay(monthDate),
      onTimeRate: onTimeRate !== null ? Number(onTimeRate.toFixed(2)) : null,
      avgDelayMinutes: avgDelayMinutes !== null ? Number(avgDelayMinutes.toFixed(2)) : null,
      delaySamples: entry?.delayCount || 0,
    };
  });

  const MIN_ROUTE_FLIGHTS = 3;
  const routeStatsArray = Array.from(routeStats.values())
    .map((route) => {
      const avgPassengers = route.flights > 0 ? route.passengers / route.flights : null;
      const loadFactor = route.seats > 0 ? (route.passengersForLoad / route.seats) * 100 : null;
      const avgDelayMinutes = route.delayCount > 0 ? route.delayTotal / route.delayCount : null;
      const onTimeRate = route.delayCount > 0 ? (route.onTimeCount / route.delayCount) * 100 : null;
      return {
        route: route.route,
        flights: route.flights,
        passengers: route.passengers,
        avgPassengers: avgPassengers !== null ? Number(avgPassengers.toFixed(2)) : null,
        loadFactor: loadFactor !== null ? Number(loadFactor.toFixed(2)) : null,
        avgDelayMinutes: avgDelayMinutes !== null ? Number(avgDelayMinutes.toFixed(2)) : null,
        onTimeRate: onTimeRate !== null ? Number(onTimeRate.toFixed(2)) : null,
      };
    })
    .filter((route) => route.flights >= MIN_ROUTE_FLIGHTS);

  const routes = {
    topByPassengers: [...routeStatsArray].sort((a, b) => b.passengers - a.passengers).slice(0, 8),
    topByLoadFactor: [...routeStatsArray]
      .filter((route) => route.loadFactor !== null)
      .sort((a, b) => (b.loadFactor || 0) - (a.loadFactor || 0))
      .slice(0, 8),
    mostDelayed: [...routeStatsArray]
      .filter((route) => route.avgDelayMinutes !== null)
      .sort((a, b) => (b.avgDelayMinutes || 0) - (a.avgDelayMinutes || 0))
      .slice(0, 8),
    leastDelayed: [...routeStatsArray]
      .filter((route) => route.avgDelayMinutes !== null)
      .sort((a, b) => (a.avgDelayMinutes || 0) - (b.avgDelayMinutes || 0))
      .slice(0, 8),
    lowestAvgPassengers: [...routeStatsArray]
      .filter((route) => route.avgPassengers !== null)
      .sort((a, b) => (a.avgPassengers || 0) - (b.avgPassengers || 0))
      .slice(0, 8),
  };

  const statusBreakdown = {
    totalLegs,
    operatedLegs,
    cancelledLegs,
    divertedLegs,
    scheduledLegs,
    operatedRate: totalLegs > 0 ? Number(((operatedLegs / totalLegs) * 100).toFixed(2)) : null,
    cancelledRate: totalLegs > 0 ? Number(((cancelledLegs / totalLegs) * 100).toFixed(2)) : null,
    divertedRate: totalLegs > 0 ? Number(((divertedLegs / totalLegs) * 100).toFixed(2)) : null,
  };

  const peakDays = Array.from(peakDaysMap.values())
    .sort((a, b) => b.passengers - a.passengers)
    .slice(0, 8)
    .map((item) => ({
      date: item.date,
      passengers: item.passengers,
      flights: item.flights,
    }));

  const peakHours = Array.from(peakHoursMap.values())
    .sort((a, b) => b.passengers - a.passengers)
    .slice(0, 6)
    .map((item) => ({
      hour: item.hour,
      passengers: item.passengers,
      flights: item.flights,
    }));

  const loadFactor = {
    overall: summary.loadFactor,
    totalPassengers: totals.totalPassengers,
    totalSeats: totalSeats,
    byMonth: loadFactorByMonth,
  };

  const punctuality = {
    overallOnTimeRate: summary.onTimeRate,
    overallAvgDelayMinutes: summary.avgDelayMinutes,
    totalDelaySamples: totalDelaySamples,
    byMonth: punctualityByMonth,
  };

  return {
    totals,
    summary,
    monthlyBreakdown,
    dailyData,
    loadFactor,
    punctuality,
    routes,
    statusBreakdown,
    peakDays,
    peakHours,
  };
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { primary, comparison, airlines, routes, operationTypeId } = body;

    if (!primary?.dateFrom || !primary?.dateTo || !comparison?.dateFrom || !comparison?.dateTo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Potrebno je unijeti oba perioda',
        },
        { status: 400 }
      );
    }

    const primaryStart = startOfDayUtc(primary.dateFrom);
    const primaryEnd = endOfDayUtc(primary.dateTo);
    const comparisonStart = startOfDayUtc(comparison.dateFrom);
    const comparisonEnd = endOfDayUtc(comparison.dateTo);

    if (
      isNaN(primaryStart.getTime()) ||
      isNaN(primaryEnd.getTime()) ||
      isNaN(comparisonStart.getTime()) ||
      isNaN(comparisonEnd.getTime())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: 'Neispravan format datuma',
        },
        { status: 400 }
      );
    }

    if (primaryStart > primaryEnd || comparisonStart > comparisonEnd) {
      return NextResponse.json(
        {
          success: false,
          error: 'Datum od mora biti prije datuma do',
        },
        { status: 400 }
      );
    }

    const normalizedFilters = {
      primary: {
        dateFrom: primary.dateFrom,
        dateTo: primary.dateTo,
      },
      comparison: {
        dateFrom: comparison.dateFrom,
        dateTo: comparison.dateTo,
      },
      airlines: Array.isArray(airlines) ? [...airlines].sort() : [],
      routes: Array.isArray(routes) ? [...routes].sort() : [],
      operationTypeId: operationTypeId || 'ALL',
    };

    const cacheKey = `reports:custom:compare:${JSON.stringify(normalizedFilters)}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached,
        cached: true,
      });
    }

    let airlineIds: string[] | null = null;
    if (airlines && airlines.length > 0) {
      const airlineRecords = await prisma.airline.findMany({
        where: {
          icaoCode: {
            in: airlines,
          },
        },
        select: { id: true },
      });
      airlineIds = airlineRecords.map((airline) => airline.id);
    }

    const primaryWhere = buildWhereClause(
      primaryStart,
      primaryEnd,
      airlineIds,
      routes,
      operationTypeId
    );
    const comparisonWhere = buildWhereClause(
      comparisonStart,
      comparisonEnd,
      airlineIds,
      routes,
      operationTypeId
    );

    const baseSelect = {
      date: true,
      arrivalFlightNumber: true,
      departureFlightNumber: true,
      arrivalPassengers: true,
      departurePassengers: true,
      arrivalFerryIn: true,
      departureFerryOut: true,
      arrivalBaggage: true,
      departureBaggage: true,
      arrivalCargo: true,
      departureCargo: true,
      arrivalMail: true,
      departureMail: true,
      availableSeats: true,
      arrivalStatus: true,
      departureStatus: true,
      arrivalScheduledTime: true,
      arrivalActualTime: true,
      departureScheduledTime: true,
      departureActualTime: true,
      aircraftType: {
        select: {
          seats: true,
        },
      },
    };

    const [primaryFlights, comparisonFlights] = await Promise.all([
      prisma.flight.findMany({
        where: primaryWhere,
        select: baseSelect,
      }),
      prisma.flight.findMany({
        where: comparisonWhere,
        select: baseSelect,
      }),
    ]);

    const primaryAnalytics = buildPeriodAnalytics(primaryFlights, primaryStart, primaryEnd);
    const comparisonAnalytics = buildPeriodAnalytics(comparisonFlights, comparisonStart, comparisonEnd);

    const comparisonData = {
      flights: {
        current: primaryAnalytics.totals.flights,
        previous: comparisonAnalytics.totals.flights,
        growth: computeGrowth(primaryAnalytics.totals.flights, comparisonAnalytics.totals.flights),
      },
      passengers: {
        current: primaryAnalytics.totals.totalPassengers,
        previous: comparisonAnalytics.totals.totalPassengers,
        growth: computeGrowth(primaryAnalytics.totals.totalPassengers, comparisonAnalytics.totals.totalPassengers),
      },
      cargo: {
        current: primaryAnalytics.totals.totalCargo,
        previous: comparisonAnalytics.totals.totalCargo,
        growth: computeGrowth(primaryAnalytics.totals.totalCargo, comparisonAnalytics.totals.totalCargo),
      },
      loadFactor: {
        current: primaryAnalytics.summary.loadFactor,
        previous: comparisonAnalytics.summary.loadFactor,
        growth: computeGrowth(primaryAnalytics.summary.loadFactor, comparisonAnalytics.summary.loadFactor),
      },
      onTimeRate: {
        current: primaryAnalytics.summary.onTimeRate,
        previous: comparisonAnalytics.summary.onTimeRate,
        growth: computeGrowth(primaryAnalytics.summary.onTimeRate, comparisonAnalytics.summary.onTimeRate),
      },
      avgDelayMinutes: {
        current: primaryAnalytics.summary.avgDelayMinutes,
        previous: comparisonAnalytics.summary.avgDelayMinutes,
        growth: computeGrowth(primaryAnalytics.summary.avgDelayMinutes, comparisonAnalytics.summary.avgDelayMinutes),
      },
      cancelledRate: {
        current: primaryAnalytics.summary.cancelledRate,
        previous: comparisonAnalytics.summary.cancelledRate,
        growth: computeGrowth(primaryAnalytics.summary.cancelledRate, comparisonAnalytics.summary.cancelledRate),
      },
    };

    const data = {
      periodA: {
        dateFrom: primary.dateFrom,
        dateTo: primary.dateTo,
        ...primaryAnalytics,
      },
      periodB: {
        dateFrom: comparison.dateFrom,
        dateTo: comparison.dateTo,
        ...comparisonAnalytics,
      },
      comparison: comparisonData,
    };

    cache.set(cacheKey, data, CacheTTL.ONE_HOUR);

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error generating custom comparison report:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Greška pri generisanju usporednog izvještaja',
      },
      { status: 500 }
    );
  }
}
