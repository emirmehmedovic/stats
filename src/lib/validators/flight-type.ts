import { z } from 'zod';

export const createFlightTypeSchema = z.object({
  code: z.string().min(1, 'Kod je obavezan').toUpperCase(),
  name: z.string().min(1, 'Naziv je obavezan'),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export const updateFlightTypeSchema = createFlightTypeSchema.partial();
