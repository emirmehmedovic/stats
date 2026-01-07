# Database Cleanup Report
**Date:** 2026-01-07
**Status:** Complete ✅

## Summary
Cleaned up invalid entries that were incorrectly extracted from Excel files as airlines and aircraft types. These were actually header labels and summary row labels from the spreadsheets.

## Invalid Entries Removed

### Airlines (4 entries removed)
- **UKUPNO** - "Total" label from summary rows
- **REDOVNI PROMET** - "Regular traffic" category label
- **VANREDNI PROMET** - "Charter traffic" category label
- **OSTALA SLIJETANJA** - "Other landings" category label

### Aircraft Types (6 entries removed)
- **BROJ LETOVA** - "Number of flights" column header
- **ISTOVARENO** - "Unloaded" column header
- **PUTNICI** - "Passengers" column header
- **TERET** - "Cargo" column header
- **UKRCANO** - "Boarded" column header
- **UTOVARENO** - "Loaded" column header

## Verification
All removed entries had **0 flights** associated with them, confirming they were never used in actual flight records.

## Prevention
Updated `/scripts/extract-missing-data.py` with filtering logic to prevent these invalid entries from being extracted in future imports:

```python
# Skip summary/header labels for airlines
invalid_airlines = ['UKUPNO', 'REDOVNI PROMET', 'VANREDNI PROMET', 'OSTALA SLIJETANJA']

# Skip invalid aircraft types (header/summary labels)
invalid_aircraft = ['BROJ LETOVA', 'ISTOVARENO', 'PUTNICI', 'TERET', 'UKRCANO', 'UTOVARENO']
```

## Final Database Statistics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| **Flights** | 3,662 | 3,662 | 0 |
| **Airlines** | 177 | 173 | -4 |
| **Aircraft Types** | 160 | 154 | -6 |
| **Airports** | 234 | 234 | 0 |

## Master Data Re-extraction
Re-extracted master data from all years (2023, 2024, 2025) with improved filtering:
- **Airlines:** 201 unique entries found (clean)
- **Aircraft Types:** 136 unique entries found (clean)
- Output saved to: `output/extracted-master-data.json`

## Scripts Created
- `/scripts/cleanup-invalid-entries.ts` - One-time cleanup script to remove invalid entries

## Notes
While the invalid entries have been removed, there are still some data quality issues to potentially address in the future:
- Duplicate airlines with slight name variations (e.g., "AERO DIENST GMBH", "AERO-DIENST", "AERODIESNT GMBH")
- Duplicate aircraft types with variations (e.g., "C172", "C172 F", "C172F")
- Some aircraft types in the database have 0 seats as placeholders

These are minor issues that don't affect data integrity but could be cleaned up for better reporting consistency.
