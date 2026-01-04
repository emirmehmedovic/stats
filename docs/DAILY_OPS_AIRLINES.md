# Daily Operations Airline Selection

## Issue
Imported flights did not always show a selected airline, and the list was incomplete due to paginated `/api/airlines`.

## Fixes Implemented
- Airline ID is populated from either:
  - `flightData.airline.id` or
  - `flightData.airlineId` (fallback).
- If the airline for the flight is missing from the list, it is injected.
- Added search input and paginated fetching to ensure all airlines are available.

## Files Updated
- `src/app/daily-operations/[id]/page.tsx`
