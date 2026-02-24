import { z } from 'zod';

// User schema za sync
export const accessControlUserSchema = z.object({
  externalUserId: z.number().int().nonnegative(),
  firstname: z.string().nullable(),
  lastname: z.string().nullable(),
  card: z.string().nullable(),
  deleted: z.boolean().default(false),
});

// Place schema za sync
export const accessControlPlaceSchema = z.object({
  externalPlaceId: z.number().int().nonnegative(),
  placeName: z.string().min(1, 'Place name is required'),
});

// Event schema za sync
export const accessControlEventSchema = z.object({
  externalEventId: z.number().int().nonnegative(),
  userId: z.number().int().nonnegative().nullable(),
  placeId: z.number().int().nonnegative().nullable(),
  eventTime: z.string().transform((str) => new Date(str)),
  eventId: z.number().int().nullable(),
  controllerId: z.number().int().nullable(),
  reader: z.number().int().nullable(),
  userToken: z.string().nullable(),
  username: z.string().nullable(),
  userLastname: z.string().nullable(),
  rawData: z.any().optional(),
});

// Sync payload schema
export const syncPayloadSchema = z.object({
  users: z.array(accessControlUserSchema),
  places: z.array(accessControlPlaceSchema),
  events: z.array(accessControlEventSchema),
});

export type AccessControlUser = z.infer<typeof accessControlUserSchema>;
export type AccessControlPlace = z.infer<typeof accessControlPlaceSchema>;
export type AccessControlEvent = z.infer<typeof accessControlEventSchema>;
export type SyncPayload = z.infer<typeof syncPayloadSchema>;
