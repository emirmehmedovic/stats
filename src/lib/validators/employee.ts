import { z } from 'zod';

export const createEmployeeSchema = z.object({
  employeeNumber: z.string().min(1, 'Employee number is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().nullable(),
  nationalId: z.string().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(), // ISO date string
  hireDate: z.string(), // ISO date string, required
  position: z.string().min(1, 'Position is required'),
  department: z.string().optional().nullable(),
  sectorId: z.string().optional().nullable(),
  photo: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE']).default('ACTIVE'),
  workScheduleType: z.enum(['STANDARD', 'SHIFT_WORK']).optional(),
  standardStartTime: z.string().optional().nullable(),
  standardEndTime: z.string().optional().nullable(),
  expectedHoursPerDay: z.preprocess(
    (value) => (value === '' || value === null || value === undefined ? null : Number(value)),
    z.number().nonnegative().nullable().optional()
  ),
  shiftStartTime1: z.string().optional().nullable(),
  shiftEndTime1: z.string().optional().nullable(),
  shiftStartTime2: z.string().optional().nullable(),
  shiftEndTime2: z.string().optional().nullable(),
  shiftRotationStart: z.string().optional().nullable(), // ISO date
});

export const updateEmployeeSchema = createEmployeeSchema.partial();

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
