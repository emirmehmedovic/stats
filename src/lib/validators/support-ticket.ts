import { z } from 'zod';
import { TicketStatus, TicketPriority, TicketCategory, TicketLocation, TicketSystem } from '@prisma/client';

// Create ticket schema
export const createTicketSchema = z.object({
  title: z.string().min(1, 'Naslov je obavezan').max(200, 'Naslov može imati maksimalno 200 karaktera'),
  description: z.string().min(1, 'Opis problema je obavezan').max(5000, 'Opis može imati maksimalno 5000 karaktera'),
  priority: z.nativeEnum(TicketPriority).default('MEDIUM'),
  category: z.nativeEnum(TicketCategory).default('OTHER'),
  // New fields
  reporterName: z.string().min(1, 'Ime i prezime je obavezno').max(100).optional(),
  incidentDate: z.coerce.date().optional().nullable(),
  location: z.nativeEnum(TicketLocation).optional().nullable(),
  system: z.nativeEnum(TicketSystem).optional().nullable(),
  airlineId: z.string().optional().nullable(),
  flightId: z.string().optional().nullable(),
});

// Update ticket schema (admin only)
export const updateTicketSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  priority: z.nativeEnum(TicketPriority).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
  assignedToId: z.string().nullable().optional(),
  reporterName: z.string().max(100).optional().nullable(),
  incidentDate: z.coerce.date().optional().nullable(),
  location: z.nativeEnum(TicketLocation).optional().nullable(),
  system: z.nativeEnum(TicketSystem).optional().nullable(),
  airlineId: z.string().optional().nullable(),
  flightId: z.string().optional().nullable(),
});

// Create comment schema
export const createCommentSchema = z.object({
  content: z.string().min(1, 'Komentar je obavezan').max(5000, 'Komentar može imati maksimalno 5000 karaktera'),
  isInternal: z.boolean().default(false), // Only ADMIN can set this to true
});

// Query schema for listing tickets
export const getTicketsQuerySchema = z.object({
  page: z.preprocess(
    (val) => (val === null || val === undefined ? 1 : Number(val)),
    z.number().int().positive().default(1)
  ),
  limit: z.preprocess(
    (val) => (val === null || val === undefined ? 20 : Number(val)),
    z.number().int().positive().max(1000).default(20)
  ),
  search: z.string().nullable().optional().transform((val) => val || undefined),
  status: z.nativeEnum(TicketStatus).nullable().optional().transform((val) => val || undefined),
  priority: z.nativeEnum(TicketPriority).nullable().optional().transform((val) => val || undefined),
  category: z.nativeEnum(TicketCategory).nullable().optional().transform((val) => val || undefined),
  location: z.nativeEnum(TicketLocation).nullable().optional().transform((val) => val || undefined),
  system: z.nativeEnum(TicketSystem).nullable().optional().transform((val) => val || undefined),
  dateFrom: z.string().nullable().optional().transform((val) => val || undefined),
  dateTo: z.string().nullable().optional().transform((val) => val || undefined),
  reporterName: z.string().nullable().optional().transform((val) => val || undefined),
  assignedToId: z.string().nullable().optional().transform((val) => val || undefined),
  submittedById: z.string().nullable().optional().transform((val) => val || undefined),
});

// Type exports
export type CreateTicketInput = z.infer<typeof createTicketSchema>;
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type GetTicketsQuery = z.infer<typeof getTicketsQuerySchema>;
