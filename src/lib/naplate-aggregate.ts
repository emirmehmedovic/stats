import {
  createBookingTransaction,
  createEmptyCarrierReport,
  createEmptyDailyReport,
  createServiceItem,
  getServiceAmount,
  type CarrierKey,
  type DailyReport,
  type ServiceItem,
} from '@/lib/naplate-config';

type CarrierTotals = {
  servicesEur: number;
  bookingsEur: number;
  totalEur: number;
  airportRemunerationKm: number;
  commissionKm: number;
};

const matchService = (items: ServiceItem[], candidate: ServiceItem) => {
  if (candidate.code) {
    return items.find((item) => item.code === candidate.code);
  }
  return items.find(
    (item) =>
      item.label === candidate.label &&
      item.price === candidate.price &&
      item.currency === candidate.currency &&
      item.unit === candidate.unit
  );
};

export function aggregateDailyReports(reports: DailyReport[], rangeLabel: string): DailyReport {
  const base = createEmptyDailyReport(rangeLabel);
  const carrierOrder: CarrierKey[] = [];
  const carriers: Record<CarrierKey, ReturnType<typeof createEmptyCarrierReport>> = {};

  const ensureCarrier = (carrier: CarrierKey, label?: string) => {
    if (!carriers[carrier]) {
      carriers[carrier] = createEmptyCarrierReport(label || carrier);
      carrierOrder.push(carrier);
    } else if (label && carriers[carrier].label !== label) {
      carriers[carrier].label = label;
    }
    return carriers[carrier];
  };

  const airportServices: ServiceItem[] = base.airportServices.map((item) => ({ ...item, qty: 0, amountOverride: 0 }));
  let adjustmentsAmount = 0;

  reports.forEach((report) => {
    adjustmentsAmount += Number(report.adjustmentsAmount || 0);

    report.airportServices.forEach((service) => {
      let target = airportServices.find((item) => item.id === service.id);
      if (!target) {
        target = createServiceItem({
          ...service,
          id: service.id || createServiceItem().id,
          amountOverride: service.amountOverride ?? 0,
        });
        airportServices.push(target);
      }
      target.qty += Number(service.qty || 0);
      target.amountOverride = Number((target.amountOverride || 0) + (service.amountOverride || 0));
    });

    Object.entries(report.carriers || {}).forEach(([carrierKey, carrierData]) => {
      const carrier = ensureCarrier(carrierKey, carrierData.label);

      carrierData.services.forEach((service) => {
        const existing = matchService(carrier.services, service);
        if (existing) {
          existing.qty += Number(service.qty || 0);
          existing.amountOverride = Number((existing.amountOverride || 0) + (service.amountOverride || 0));
        } else {
          carrier.services.push(
            createServiceItem({
              ...service,
              id: service.id || createServiceItem().id,
            })
          );
        }
      });

      const totals = carrierData.bookings?.transactions?.reduce(
        (acc, txn) => {
          acc.pax += Number(txn.pax || 0);
          acc.amountEur += Number(txn.amountEur || 0);
          acc.airportRemunerationKm += Number(txn.airportRemunerationKm || 0);
          acc.commissionKm += Number(txn.commissionKm || 0);
          return acc;
        },
        { pax: 0, amountEur: 0, airportRemunerationKm: 0, commissionKm: 0 }
      ) || { pax: 0, amountEur: 0, airportRemunerationKm: 0, commissionKm: 0 };

      if (totals.pax || totals.amountEur || totals.airportRemunerationKm || totals.commissionKm) {
        carrier.bookings.transactions.push(
          createBookingTransaction({
            pnr: '',
            pax: totals.pax,
            amountEur: totals.amountEur,
            airportRemunerationKm: totals.airportRemunerationKm,
            commissionKm: totals.commissionKm,
          })
        );
      }
    });
  });

  return {
    ...base,
    date: rangeLabel,
    carrierOrder: carrierOrder.length ? carrierOrder : base.carrierOrder,
    carriers: carrierOrder.length ? carriers : base.carriers,
    airportServices,
    adjustmentsAmount,
  };
}

export function getCarrierMonthlyTotals(report: DailyReport, carrier: CarrierKey): CarrierTotals {
  const carrierData = report.carriers[carrier];
  if (!carrierData) {
    return { servicesEur: 0, bookingsEur: 0, totalEur: 0, airportRemunerationKm: 0, commissionKm: 0 };
  }
  const servicesEur = carrierData.services.reduce((sum, item) => sum + getServiceAmount(item), 0);
  const bookingTotals = carrierData.bookings?.transactions?.reduce(
    (acc, txn) => {
      acc.amountEur += Number(txn.amountEur || 0);
      acc.airportRemunerationKm += Number(txn.airportRemunerationKm || 0);
      acc.commissionKm += Number(txn.commissionKm || 0);
      return acc;
    },
    { amountEur: 0, airportRemunerationKm: 0, commissionKm: 0 }
  ) || { amountEur: 0, airportRemunerationKm: 0, commissionKm: 0 };
  const bookingsEur = bookingTotals.amountEur;
  return {
    servicesEur,
    bookingsEur,
    totalEur: Number((servicesEur + bookingsEur).toFixed(2)),
    airportRemunerationKm: bookingTotals.airportRemunerationKm,
    commissionKm: bookingTotals.commissionKm,
  };
}
