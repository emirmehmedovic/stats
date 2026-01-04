import { z } from 'zod';

export const createAirlineSchema = z.object({
  name: z.string().min(1, 'Naziv aviokompanije je obavezan'),
  icaoCode: z
    .string()
    .length(3, 'ICAO kod mora imati tačno 3 karaktera')
    .toUpperCase(),
  iataCode: z
    .string()
    .length(2, 'IATA kod mora imati tačno 2 karaktera')
    .toUpperCase()
    .optional()
    .nullable(),
  country: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
});

export const updateAirlineSchema = createAirlineSchema.partial();

export type CreateAirlineInput = z.infer<typeof createAirlineSchema>;
export type UpdateAirlineInput = z.infer<typeof updateAirlineSchema>;
