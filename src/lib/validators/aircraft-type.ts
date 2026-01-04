import { z } from 'zod';

export const createAircraftTypeSchema = z.object({
  model: z.string().min(1, 'Model aviona je obavezan'),
  seats: z.number().int().positive('Broj sjedišta mora biti pozitivan broj'),
  mtow: z.number().int().positive('MTOW mora biti pozitivan broj'),
});

export const updateAircraftTypeSchema = createAircraftTypeSchema.partial();

export type CreateAircraftTypeInput = z.infer<typeof createAircraftTypeSchema>;
export type UpdateAircraftTypeInput = z.infer<typeof updateAircraftTypeSchema>;
