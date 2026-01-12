import { z } from 'zod';
import { FlightStatus } from '@prisma/client';
import { endOfDayUtc, startOfDayUtc } from '@/lib/dates';

export const createFlightSchema = z.object({
  date: z.coerce.date(),
  airlineId: z.string().min(1, 'Aviokompanija je obavezna'),
  aircraftTypeId: z.string().min(1, 'Tip aviona je obavezan'),
  registration: z.string().min(1, 'Registracija je obavezna'),
  route: z.string().min(1, 'Ruta je obavezna'),
  operationTypeId: z.string().min(1, 'Tip operacije je obavezan'),
  flightTypeId: z.preprocess(
    (val) => (val === '' ? null : val),
    z.string().min(1, 'Tip leta je obavezan').optional().nullable()
  ),
  availableSeats: z.number().int().positive().optional().nullable(),

  // Airports
  arrivalAirportId: z.string().optional().nullable(),
  departureAirportId: z.string().optional().nullable(),

  // Arrival
  arrivalFlightNumber: z.string().optional().nullable(),
  arrivalScheduledTime: z.coerce.date().optional().nullable(),
  arrivalActualTime: z.coerce.date().optional().nullable(),
  arrivalPassengers: z
    .number()
    .int()
    .nonnegative()
    .max(999, 'Broj putnika ne može biti 4-cifren')
    .optional()
    .nullable(),
  arrivalMalePassengers: z.number().int().nonnegative().optional().nullable(),
  arrivalFemalePassengers: z.number().int().nonnegative().optional().nullable(),
  arrivalChildren: z.number().int().nonnegative().optional().nullable(),
  arrivalInfants: z.number().int().nonnegative().optional().nullable(),
  arrivalBaggage: z.number().int().nonnegative().optional().nullable(),
  arrivalBaggageCount: z.number().int().nonnegative().optional().nullable(),
  arrivalCargo: z.number().int().nonnegative().optional().nullable(),
  arrivalMail: z.number().int().nonnegative().optional().nullable(),
  arrivalStatus: z.nativeEnum(FlightStatus).default('OPERATED'),
  arrivalCancelReason: z.string().optional().nullable(),
  arrivalFerryIn: z.boolean().optional().default(false),

  // Departure
  departureFlightNumber: z.string().optional().nullable(),
  departureScheduledTime: z.coerce.date().optional().nullable(),
  departureActualTime: z.coerce.date().optional().nullable(),
  departureDoorClosingTime: z.coerce.date().optional().nullable(),
  departurePassengers: z
    .number()
    .int()
    .nonnegative()
    .max(999, 'Broj putnika ne može biti 4-cifren')
    .optional()
    .nullable(),
  departureMalePassengers: z.number().int().nonnegative().optional().nullable(),
  departureFemalePassengers: z.number().int().nonnegative().optional().nullable(),
  departureChildren: z.number().int().nonnegative().optional().nullable(),
  departureInfants: z.number().int().nonnegative().optional().nullable(),
  departureNoShow: z.number().int().nonnegative().optional().nullable(),
  departureBaggage: z.number().int().nonnegative().optional().nullable(),
  departureBaggageCount: z.number().int().nonnegative().optional().nullable(),
  departureCargo: z.number().int().nonnegative().optional().nullable(),
  departureMail: z.number().int().nonnegative().optional().nullable(),
  departureStatus: z.nativeEnum(FlightStatus).default('OPERATED'),
  departureCancelReason: z.string().optional().nullable(),
  departureFerryOut: z.boolean().optional().default(false),

  // Operativni detalji
  handlingAgent: z.string().optional().nullable(),
  stand: z.string().optional().nullable(),
  gate: z.string().optional().nullable(),

  // Meta
  dataSource: z.string().default('MANUAL'),
  importedFile: z.string().optional().nullable(),
  isLocked: z.boolean().default(false),
  isVerified: z.boolean().optional(),
});

export const updateFlightSchema = createFlightSchema.partial();

export const getFlightsQuerySchema = z.object({
  page: z.preprocess(
    (val) => (val === null || val === undefined ? 1 : Number(val)),
    z.number().int().positive().default(1)
  ),
  limit: z.preprocess(
    (val) => (val === null || val === undefined ? 20 : Number(val)),
    z.number().int().positive().max(100).default(20)
  ),
  search: z.string().nullable().optional().transform((val) => val || undefined),
  airlineId: z.string().nullable().optional().transform((val) => val || undefined),
  dateFrom: z.string().nullable().optional().transform((val) => {
    if (!val) return undefined;
    try {
      return startOfDayUtc(val);
    } catch {
      return undefined;
    }
  }),
  dateTo: z.string().nullable().optional().transform((val) => {
    if (!val) return undefined;
    try {
      return endOfDayUtc(val);
    } catch {
      return undefined;
    }
  }),
  route: z.string().nullable().optional().transform((val) => val || undefined),
  operationTypeId: z.string().nullable().optional().transform((val) => val || undefined),
  flightTypeId: z.string().nullable().optional().transform((val) => val || undefined),
});

export type CreateFlightInput = z.infer<typeof createFlightSchema>;
export type UpdateFlightInput = z.infer<typeof updateFlightSchema>;
export type GetFlightsQuery = z.infer<typeof getFlightsQuerySchema>;
