import { z } from 'zod';

export const createLicenseSchema = z.object({
  licenseTypeId: z.string().min(1, 'License type is required'),
  licenseNumber: z.string().min(1, 'License number is required'),
  issuedDate: z.string(), // ISO date string
  expiryDate: z.string(), // ISO date string
  issuer: z.string().optional(),
  status: z.enum(['ACTIVE', 'EXPIRED', 'SUSPENDED']).default('ACTIVE'),
  requiredForPosition: z.string().optional(),
});

export const updateLicenseSchema = createLicenseSchema.partial();

export type CreateLicenseInput = z.infer<typeof createLicenseSchema>;
export type UpdateLicenseInput = z.infer<typeof updateLicenseSchema>;

