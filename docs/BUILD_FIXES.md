# Build and TypeScript Fixes

## Routing/Type Changes
- Standardized API route handler types to use `RouteContext` with `params: Promise<...>` in multiple `src/app/api/.../route.ts` files.
- Added Suspense boundaries for `useSearchParams()` in:
  - `src/app/daily-operations/page.tsx`
  - `src/app/flights/new/page.tsx`

## Recharts Type Fixes
- Updated `Pie` label callbacks to use `payload` and added null checks:
  - `src/app/analytics/routes/page.tsx`
  - `src/app/comparison/*-trend/page.tsx`
  - `src/app/reports/custom/page.tsx`
  - `src/app/summary/page.tsx`

## Zod and Resolver Fixes
- Replaced `error.errors` with `error.issues` across API routes.
- Cast `zodResolver` to `Resolver<CreateFlightInput>` in:
  - `src/components/flights/FlightForm.tsx`

## Misc Type Fixes
- `next-themes` type import normalized in `src/components/ui/theme-provider.tsx`.
- JWT payload cast through `unknown` in `src/lib/auth-utils.ts`.
- Excel parser field fix (`operationTypeCode`) in `src/lib/parsers/excel.ts`.
- Removed non-existent `FlightOperationType` usage in:
  - `src/types/flight.ts`
  - `src/types/models.ts`

## Hydration Fix
- Sidebar hydration mismatch fixed by deferring `userRole` rendering until mount:
  - `src/components/layout/Sidebar.tsx`
