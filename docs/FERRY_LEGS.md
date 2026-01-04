# Ferry IN/OUT (Empty Legs)

## Model and Validation
- Added new flags in Prisma schema:
  - `arrivalFerryIn` (bool, default false)
  - `departureFerryOut` (bool, default false)
- Added these fields to Zod flight schemas:
  - `src/lib/validators/flight.ts`

## UI Updates
- Daily operations flight entry:
  - Added Ferry IN/OUT checkboxes.
  - Passenger inputs disabled when ferry is checked.
  - `src/app/daily-operations/[id]/page.tsx`
- New/Edit Flight forms:
  - Added Ferry IN/OUT checkboxes.
  - Disabled passenger inputs when ferry is checked.
  - `src/components/flights/FlightForm.tsx`
  - `src/app/flights/[id]/edit/page.tsx`

## API Logic
- Passenger validation bypassed for ferry legs:
  - `src/lib/validators/passenger-validation.ts`
- Passenger fields are nulled when ferry is checked:
  - `src/app/api/flights/route.ts`
  - `src/app/api/flights/[id]/route.ts`

## Analytics and Reports
Passenger and load-factor calculations exclude ferry legs:
- `src/app/api/summary/route.ts`
- `src/app/api/dashboard/stats/route.ts`
- `src/app/api/dashboard/stats/route.optimized.ts`
- `src/app/api/analytics/load-factor/route.ts`
- `src/app/api/analytics/routes/route.ts`
- `src/app/api/comparison/route.ts`
- `src/app/api/comparison/route.optimized.ts`
- `src/app/api/comparison/trends/route.ts`
- `src/app/api/reports/daily/route.ts`
- `src/app/api/reports/monthly/route.ts`
- `src/app/api/reports/yearly/route.ts`
- `src/app/api/reports/custom/route.ts`

## Migration Note
After adding the fields:
- Run `npx prisma migrate dev -n add_ferry_flags` or `npx prisma db push`.
  Then regenerate client if needed (`npx prisma generate`).
