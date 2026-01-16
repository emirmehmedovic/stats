export type CarrierKey = string;

export type ServiceItem = {
  id: string;
  label: string;
  code: string;
  unit: string;
  price: number;
  currency: 'EUR' | 'KM';
  qty: number;
  amountOverride?: number;
};

export type CarrierReport = {
  label: string;
  services: ServiceItem[];
  bookings: {
    transactions: BookingTransaction[];
  };
};

export type DailyExtras = {
  pvcZipAmount: number;
  masksAmount: number;
  internetQty: number;
  internetAmount: number;
  childWeekAmount: number;
  extraServiceAmount: number;
  adjustmentsAmount: number;
};

export type DailyReport = {
  date: string;
  fxRateEurToKm: number;
  carrierOrder: CarrierKey[];
  carriers: Record<CarrierKey, CarrierReport>;
  airportServices: ServiceItem[];
  adjustmentsAmount: number;
};

export type BookingTransaction = {
  id: string;
  pnr: string;
  pax: number;
  amountEur: number;
  airportRemunerationKm: number;
  commissionKm: number;
};

export const carrierLabels: Record<string, string> = {
  wizz: 'Wizz Air',
  pegasus: 'Pegasus',
  ajet: 'Ajet',
};
export const defaultCarrierOrder: CarrierKey[] = ['wizz', 'pegasus', 'ajet'];

export const defaultServices: ServiceItem[] = [
  { id: 'airport_checkin', label: 'Airport Check in', code: 'CHKA', unit: 'flight/pax', price: 40, currency: 'EUR', qty: 0 },
  { id: 'bag_20', label: 'Torba do 20KG', code: 'BAGD', unit: 'bag/flight', price: 70, currency: 'EUR', qty: 0 },
  { id: 'bag_32', label: 'Torba do 32KG', code: '2xBagd', unit: 'bag/flight', price: 120, currency: 'EUR', qty: 0 },
  { id: 'cabin_checkin', label: 'Kabinska Torba na check-in', code: 'LACBC', unit: 'bag/flight', price: 55, currency: 'EUR', qty: 0 },
  { id: 'cabin_gate', label: 'Kabinska Torba u gate-u', code: 'LACBG', unit: 'bag/flight', price: 55, currency: 'EUR', qty: 0 },
  { id: 'prb', label: 'PRB', code: 'PRB', unit: 'flight/pax', price: 65, currency: 'EUR', qty: 0 },
  { id: 'infant', label: 'Infant', code: 'INF', unit: 'flight/pax', price: 31, currency: 'EUR', qty: 0 },
  { id: 'missed_flight', label: 'Missed Flight Fee', code: 'MFF', unit: 'flight/pax', price: 80, currency: 'EUR', qty: 0 },
  { id: 'name_change', label: 'Name change fee', code: 'NCHG', unit: 'flight/pax', price: 60, currency: 'EUR', qty: 0 },
  { id: 'sporting', label: 'Sporting Equipment', code: 'SPEQ', unit: 'bag/flight', price: 60, currency: 'EUR', qty: 0 },
  { id: 'extra_kg_1', label: 'Doplata 1kg', code: 'BAGEXC', unit: 'bag/flight', price: 13, currency: 'EUR', qty: 0 },
  { id: 'extra_kg_2', label: 'Doplata 2kg', code: 'BAGEXC', unit: 'bag/flight', price: 26, currency: 'EUR', qty: 0 },
  { id: 'extra_kg_3', label: 'Doplata 3kg', code: 'BAGEXC', unit: 'bag/flight', price: 39, currency: 'EUR', qty: 0 },
  { id: 'extra_kg_4', label: 'Doplata 4kg', code: 'BAGEXC', unit: 'bag/flight', price: 52, currency: 'EUR', qty: 0 },
  { id: 'extra_kg_5', label: 'Doplata 5kg', code: 'BAGEXC', unit: 'bag/flight', price: 65, currency: 'EUR', qty: 0 },
];

export const defaultAirportServices: ServiceItem[] = [
  { id: 'airport_pvc', label: 'PVC ZIP vrećice', code: 'PVC', unit: 'kom', price: 5, currency: 'KM', qty: 0 },
  { id: 'airport_masks', label: 'Higijenske maske', code: 'MASK', unit: 'kom', price: 1, currency: 'KM', qty: 0 },
  { id: 'airport_internet', label: 'Internet kodovi', code: 'NET', unit: 'kom', price: 3, currency: 'KM', qty: 0 },
  { id: 'airport_donation', label: 'Dječija nedelja', code: 'DON', unit: 'iznos', price: 0, currency: 'KM', qty: 0, amountOverride: 0 },
];

export const defaultFxRate = 1.95583;

export function createServiceItem(overrides?: Partial<ServiceItem>): ServiceItem {
  const id = overrides?.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    label: '',
    code: '',
    unit: '',
    price: 0,
    currency: 'EUR',
    qty: 0,
    amountOverride: 0,
    ...overrides,
  };
}

export function createEmptyCarrierReport(label = ''): CarrierReport {
  return {
    label,
    services: defaultServices.map((item) => ({ ...item })),
    bookings: { transactions: [] },
  };
}

export function createEmptyDailyReport(date: string): DailyReport {
  return {
    date,
    fxRateEurToKm: defaultFxRate,
    carrierOrder: [...defaultCarrierOrder],
    carriers: {
      wizz: createEmptyCarrierReport(carrierLabels.wizz),
      pegasus: createEmptyCarrierReport(carrierLabels.pegasus),
      ajet: createEmptyCarrierReport(carrierLabels.ajet),
    },
    airportServices: defaultAirportServices.map((item) => ({ ...item })),
    adjustmentsAmount: 0,
  };
}

export function getServiceAmount(item: ServiceItem): number {
  if (!item.price) return Number(item.amountOverride || 0);
  return Number((item.qty * item.price).toFixed(2));
}

export function getCarrierFeeTotal(report: DailyReport, carrier: CarrierKey): number {
  return report.carriers[carrier]?.services.reduce((sum, item) => sum + getServiceAmount(item), 0) || 0;
}

export function getCarrierTotalEur(report: DailyReport, carrier: CarrierKey): number {
  const fees = getCarrierFeeTotal(report, carrier);
  const bookingTotal = getBookingTotals(report, carrier).amountEur;
  return Number((fees + bookingTotal).toFixed(2));
}

export function getAirportTotalKm(report: DailyReport): number {
  const servicesTotal = report.airportServices.reduce((sum, item) => sum + getServiceAmount(item), 0);
  const commissions = Object.keys(report.carriers).reduce((sum, carrier) => {
    const totals = getBookingTotals(report, carrier);
    return sum + totals.airportRemunerationKm + totals.commissionKm;
  }, 0);
  return Number((servicesTotal + report.adjustmentsAmount + commissions).toFixed(2));
}

export function getGrandTotalKm(report: DailyReport): number {
  const eurTotal = Object.keys(report.carriers).reduce(
    (sum, carrier) => sum + getCarrierTotalEur(report, carrier),
    0
  ) * report.fxRateEurToKm;
  return Number((eurTotal + getAirportTotalKm(report)).toFixed(2));
}

export function createBookingTransaction(overrides?: Partial<BookingTransaction>): BookingTransaction {
  const id = overrides?.id || `booking-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    pnr: '',
    pax: 1,
    amountEur: 0,
    airportRemunerationKm: 0,
    commissionKm: 0,
    ...overrides,
  };
}

export function getBookingTotals(report: DailyReport, carrier: CarrierKey) {
  const carrierData = report.carriers[carrier];
  const transactions = carrierData?.bookings?.transactions || [];
  return transactions.reduce(
    (acc, txn) => {
      acc.pax += txn.pax || 0;
      acc.amountEur += txn.amountEur || 0;
      acc.airportRemunerationKm += txn.airportRemunerationKm || 0;
      acc.commissionKm += txn.commissionKm || 0;
      return acc;
    },
    { pax: 0, amountEur: 0, airportRemunerationKm: 0, commissionKm: 0 }
  );
}

export function normalizeDailyReport(data: Partial<DailyReport> | null | undefined): DailyReport {
  const date = data?.date || new Date().toISOString().slice(0, 10);
  const base = createEmptyDailyReport(date);
  const incomingCarriers = (data?.carriers && typeof data.carriers === 'object') ? data.carriers : {};
  const incomingOrder = Array.isArray(data?.carrierOrder) ? data?.carrierOrder : Object.keys(incomingCarriers || {});
  const carrierOrder = incomingOrder.length ? incomingOrder : base.carrierOrder;
  const merged: DailyReport = {
    ...base,
    ...data,
    carrierOrder,
    airportServices: Array.isArray(data?.airportServices)
      ? data?.airportServices.map((service: ServiceItem) => ({
          ...createServiceItem(),
          ...service,
        }))
      : base.airportServices,
    adjustmentsAmount: typeof data?.adjustmentsAmount === 'number'
      ? data.adjustmentsAmount
      : ((data as any)?.extras?.adjustmentsAmount || 0),
    carriers: {},
  };

  carrierOrder.forEach((carrier) => {
    const incoming = (incomingCarriers as any)[carrier] || {};
    const baseCarrier = base.carriers[carrier] || createEmptyCarrierReport(carrierLabels[carrier] || carrier);
    const services = Array.isArray(incoming.services)
      ? incoming.services.map((service: ServiceItem) => {
          const fallback = createServiceItem();
          return {
            ...fallback,
            ...service,
            id: service.id || fallback.id,
          };
        })
      : baseCarrier.services;

    merged.carriers[carrier] = {
      ...baseCarrier,
      ...incoming,
      label: incoming.label || baseCarrier.label || carrierLabels[carrier] || carrier,
      services,
      bookings: {
        transactions: Array.isArray(incoming.bookings?.transactions)
          ? incoming.bookings.transactions.map((txn: BookingTransaction) => ({
              ...createBookingTransaction(),
              ...txn,
              id: txn.id || createBookingTransaction().id,
            }))
          : buildLegacyBookings(incoming.bookings),
      },
    };
  });

  if (!Array.isArray(data?.airportServices) && (data as any)?.extras) {
    const legacyExtras = (data as any).extras as DailyExtras;
    const airportServices = base.airportServices.map((item) => {
      if (item.id === 'airport_pvc') {
        return { ...item, qty: legacyExtras.pvcZipAmount ? legacyExtras.pvcZipAmount / 5 : 0 };
      }
      if (item.id === 'airport_masks') {
        return { ...item, qty: legacyExtras.masksAmount ? legacyExtras.masksAmount / 1 : 0 };
      }
      if (item.id === 'airport_internet') {
        return { ...item, qty: legacyExtras.internetQty || 0, amountOverride: 0 };
      }
      if (item.id === 'airport_donation') {
        return { ...item, amountOverride: legacyExtras.childWeekAmount || 0 };
      }
      return item;
    });
    merged.airportServices = airportServices;
    merged.adjustmentsAmount = legacyExtras.adjustmentsAmount || 0;
  }

  return merged;
}

export function createCarrierKey(label: string, existing: CarrierKey[] = []): CarrierKey {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `carrier-${Date.now()}`;
  let key = base;
  let counter = 2;
  while (existing.includes(key)) {
    key = `${base}-${counter}`;
    counter += 1;
  }
  return key;
}

function buildLegacyBookings(legacy: any) {
  if (!legacy) {
    return [];
  }
  if (Array.isArray(legacy.transactions)) {
    return legacy.transactions;
  }
  const qty = Number(legacy.qty || 0);
  const amount = Number(legacy.amount || 0);
  const airportRemunerationKm = Number(legacy.airportRemunerationKm || 0);
  const commissionKm = Number(legacy.ticketCommissionKm || 0);
  if (!qty && !amount && !airportRemunerationKm && !commissionKm) {
    return [];
  }
  return [
    createBookingTransaction({
      pnr: '',
      pax: qty || 1,
      amountEur: amount,
      airportRemunerationKm,
      commissionKm,
    }),
  ];
}
