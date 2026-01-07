# 📊 Multi-Year Flight Data Import Guide

Vodič za efikasan import podataka o letovima za više godina.

## 🚀 Brzi Start

### Import jedne godine:

```bash
# Ekstrakcija + Import + Load Factor izračun za 2024
./scripts/import-multi-year.sh 2024
```

### Import više godina odjednom:

```bash
# Importuj 2023 i 2024 redom
./scripts/import-multi-year.sh 2023 2024

# Ili sve tri godine
./scripts/import-multi-year.sh 2023 2024 2025
```

## 📁 Struktura Projekta

```
STATS/
├── 2023/Dnevni izvještaji/
├── 2024/Dnevni izvještaji/
├── 2025/Dnevni izvještaji/
└── ...

scripts/
├── extract-flights.py          # Ekstraktuje podatke iz Excel-a
├── import-year.ts              # Importuje u bazu
├── calculate-load-factors.ts   # Računa load faktore
└── import-multi-year.sh        # Master skripta (sve u jednom)
```

## 🔧 Ručni Postupak (Korak po Korak)

### 1. Ekstrakcija podataka iz Excel-a

```bash
python3 scripts/extract-flights.py 2024
```

**Output:** `output/2024-flights-data.json`

**Opcije:**
- Bez argumenta: koristi 2025 kao default
- Sa godinom: `python3 scripts/extract-flights.py 2024`
- Sa godinom i mjesecom: `python3 scripts/extract-flights.py 2025 "03. MART"`

### 2. Import u bazu

```bash
npx tsx scripts/import-year.ts 2024
```

**Dry run (test bez pisanja u bazu):**
```bash
npx tsx scripts/import-year.ts 2024 --dry-run
```

### 3. Izračunavanje load faktora

```bash
npx tsx scripts/calculate-load-factors.ts
```

Automatski računa load faktore za **SVE** letove u bazi.

## ⚠️ Česte Greške i Rješenja

### Greška: "Airline not found"

**Problem:** Nova aviokompanija koja ne postoji u bazi.

**Rješenje:**
```bash
# Dodaj aviokom paniju preko admin panela ili direktno u bazu
npx prisma studio
```

Dodaj u `Airline` tabelu:
- `name`: Puno ime (npr. "TAILWIND AIRLINES")
- `icaoCode`: ICAO kod (npr. "TZL")
- `iataCode`: IATA kod (opciono)

### Greška: "Aircraft type not found"

**Problem:** Novi tip aviona koji ne postoji u bazi.

**Rješenje:**
```bash
npx prisma studio
```

Dodaj u `AircraftType` tabelu:
- `model`: Model aviona (npr. "EC45", "MI-17")
- `seats`: Broj sjedišta (npr. 4, 180)
- `mtow`: Maksimalna težina (kg)

### Greška: "Operation type not found"

**Problem:** Novi tip operacije.

**Rješenje:**
```bash
npx prisma studio
```

Dodaj u `OperationType` tabelu sa kodom (SCHEDULED, CHARTER, itd.)

## 📊 Pregled Podataka

### Statistika po godinama:

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const years = await prisma.\$queryRaw\`
    SELECT
      EXTRACT(YEAR FROM date) as year,
      COUNT(*) as flights,
      SUM(COALESCE(\"arrivalPassengers\", 0) + COALESCE(\"departurePassengers\", 0)) as passengers
    FROM \"Flight\"
    GROUP BY EXTRACT(YEAR FROM date)
    ORDER BY year DESC
  \`;

  console.table(years);
  await prisma.\$disconnect();
})();
"
```

### Prosječan load factor po godini:

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const loadFactors = await prisma.\$queryRaw\`
    SELECT
      EXTRACT(YEAR FROM date) as year,
      ROUND(AVG(\"arrivalLoadFactor\")::numeric, 2) as avg_arrival_lf,
      ROUND(AVG(\"departureLoadFactor\")::numeric, 2) as avg_departure_lf
    FROM \"Flight\"
    WHERE \"arrivalLoadFactor\" IS NOT NULL OR \"departureLoadFactor\" IS NOT NULL
    GROUP BY EXTRACT(YEAR FROM date)
    ORDER BY year DESC
  \`;

  console.table(loadFactors);
  await prisma.\$disconnect();
})();
"
```

## 🗑️ Reset Podataka

### Obriši sve letove:

```bash
npx tsx scripts/delete-all-flights.ts
```

### Obriši samo jednu godinu:

```bash
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const year = 2024;
  const result = await prisma.flight.deleteMany({
    where: {
      date: {
        gte: new Date(\`\${year}-01-01\`),
        lt: new Date(\`\${year + 1}-01-01\`)
      }
    }
  });
  console.log(\`Deleted \${result.count} flights from \${year}\`);
  await prisma.\$disconnect();
})();
"
```

## 📈 Optimizacija za Velike Količine Podataka

### Batch Import (za starije godine sa mnogo podataka):

```bash
# Importuj mjesec po mjesec za 2023
for month in {1..12}; do
  month_padded=$(printf "%02d" $month)
  python3 scripts/extract-flights.py 2023 "${month_padded}. $(date -d "2023-${month_padded}-01" +%B | tr '[:lower:]' '[:upper:]')"
  npx tsx scripts/import-year.ts 2023
done
```

## 🔄 Migracija na Produkciju

### 1. Kreiraj backup trenutne baze:

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### 2. Primijeni migracije:

```bash
npx prisma migrate deploy
```

### 3. Pokreni import:

```bash
./scripts/import-multi-year.sh 2023 2024 2025
```

### 4. Verifikuj podatke:

```bash
npx prisma studio
```

## 💡 Pro Tips

1. **Test prvo sa --dry-run**: Uvijek prvo testiraj import sa `--dry-run` zastavom
2. **Dodaj missing data prije importa**: Dodaj aviokomanije i aircraft types prije nego počneš sa importom
3. **Batch processing**: Za velike godine (2008-2022), importuj mjesec po mjesec
4. **Backup prije importa**: Uvijek napravi backup prije velikih import operacija
5. **Monitor disk space**: Veliki importi mogu zauzeti dosta prostora

## 📞 Troubleshooting

### Import je spor?

Povećaj batch size u import skripti ili koristi transakcije.

### Memory issues?

Procesiraj mjesec po mjesec umjesto cijele godine odjednom.

### Timezone problemi?

Svi datumi se čuvaju kao UTC midnight (`YYYY-MM-DDT00:00:00.000Z`).

---

**Last Updated:** 2026-01-07
