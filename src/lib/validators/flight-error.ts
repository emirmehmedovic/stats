import { z } from 'zod';
import { FlightErrorType, FlightErrorPriority, FlightErrorStatus } from '@prisma/client';

// Create flight error schema
export const createFlightErrorSchema = z.object({
  flightId: z.string().min(1, 'Flight ID je obavezan'),
  errorType: z.nativeEnum(FlightErrorType, {
    message: 'Tip greške je obavezan',
  }),
  priority: z.nativeEnum(FlightErrorPriority).optional().default(FlightErrorPriority.MEDIUM),
  description: z.string().min(10, 'Opis mora imati najmanje 10 karaktera'),
});

// Resolve error schema
export const resolveFlightErrorSchema = z.object({
  notes: z.string().optional(),
});

// Dispute error schema
export const disputeFlightErrorSchema = z.object({
  disputeReason: z.string().min(10, 'Razlog osporavanja mora imati najmanje 10 karaktera'),
});

// Admin close error schema
export const closeFlightErrorSchema = z.object({
  closedNotes: z.string().optional(),
  newStatus: z.enum(['RESOLVED', 'CLOSED'] as const, {
    message: 'Nevalidan status',
  }),
  // Označavanje lažne prijave - admin može označiti kad zatvara osporenu grešku
  isFalseReport: z.boolean().optional().default(false),
});

// Query schema for listing errors
export const getFlightErrorsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive()),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(z.number().int().min(1).max(100)),
  search: z.string().optional(),
  status: z
    .string()
    .optional()
    .transform((val) => (val ? (val as FlightErrorStatus) : undefined)),
  errorType: z
    .string()
    .optional()
    .transform((val) => (val ? (val as FlightErrorType) : undefined)),
  priority: z
    .string()
    .optional()
    .transform((val) => (val ? (val as FlightErrorPriority) : undefined)),
  assignedToId: z.string().optional(),
  reportedById: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export type CreateFlightErrorInput = z.infer<typeof createFlightErrorSchema>;
export type ResolveFlightErrorInput = z.infer<typeof resolveFlightErrorSchema>;
export type DisputeFlightErrorInput = z.infer<typeof disputeFlightErrorSchema>;
export type CloseFlightErrorInput = z.infer<typeof closeFlightErrorSchema>;
export type GetFlightErrorsQuery = z.infer<typeof getFlightErrorsQuerySchema>;
