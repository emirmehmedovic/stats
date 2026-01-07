# 🚀 Multi-Year Import - Quick Reference

## Jednostavno korištenje:

```bash
# Import jedne godine (sve u jednom)
./scripts/import-multi-year.sh 2024

# Import više godina odjednom  
./scripts/import-multi-year.sh 2023 2024

# Import sa 2025 (već imamo)
./scripts/import-multi-year.sh 2025
```

## Ručno korak-po-korak:

```bash
# 1. Ekstraktuj podatke iz Excel-a
python3 scripts/extract-flights.py 2024

# 2. Importuj u bazu
npx tsx scripts/import-year.ts 2024

# 3. Izračunaj load faktore
npx tsx scripts/calculate-load-factors.ts
```

## Trenutno stanje:

- ✅ **2025**: 1,142 letova (cijela godina)
- ✅ **2024**: 267/320 letova (Septembar-Decembar)
  - ⚠️ 53 skipped (missing airlines/aircraft types)

## Detaljnu dokumentaciju vidi u: `IMPORT_GUIDE.md`
