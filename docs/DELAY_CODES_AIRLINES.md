# Delay Codes and Airline Linking

## Airline-Specific Delay Codes in Daily Ops
- Delay codes now load per airline using `/api/airline-delay-codes`.
- Add button is disabled until an airline is selected.
- If no airline is chosen, a hint is shown.
- File: `src/components/daily-operations/MultipleDelaysInput.tsx`

## Link Delay Codes to Airlines (UI)
- Added modal for linking a delay code to multiple airlines.
- New “Poveži” action in delay codes list.
- Files:
  - `src/components/delay-codes/DelayCodeAirlinesModal.tsx`
  - `src/app/delay-codes/page.tsx`

## Delay Codes Page: Airline Visibility and Filtering
- Each delay code card shows its connected airlines.
- Added filter by airline.
- Added loading state for link mapping.
- File: `src/app/delay-codes/page.tsx`

## API Safeguards
- `/api/airline-delay-codes` now normalizes `null` query params to `undefined`.
- `/api/flights/[id]` validates:
  - `delayCodeId` exists
  - `delayCodeId` is linked to the flight airline and active

## Files Updated
- `src/components/daily-operations/MultipleDelaysInput.tsx`
- `src/components/delay-codes/DelayCodeAirlinesModal.tsx`
- `src/app/delay-codes/page.tsx`
- `src/app/api/airline-delay-codes/route.ts`
- `src/app/api/flights/[id]/route.ts`
