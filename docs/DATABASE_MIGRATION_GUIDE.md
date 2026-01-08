# Database Migration Guide: Dev → Production

## Pregled

Ovaj dokument opisuje **optimalni način** za migraciju svih podataka iz development baze u production bazu, uključujući sigurnosne mjere i rollback plan.

---

## 📋 Preduslovi

### 1. Backup Production Baze (OBAVEZNO!)
```bash
# Kreiraj backup produkcijske baze PRIJE bilo kakvih promjena
pg_dump -h <PROD_HOST> -U <PROD_USER> -d <PROD_DB> -F c -b -v -f "backup_production_$(date +%Y%m%d_%H%M%S).dump"

# Ili ako koristiš Vercel Postgres / Neon / Supabase
# Koristi njihov UI za kreiranje snapshot-a
```

### 2. Provjeri Konekcije
```bash
# Dev baza
psql $DATABASE_URL

# Production baza  
psql $DATABASE_URL_PRODUCTION
```

---

## 🎯 Preporučena Strategija: pg_dump & pg_restore

### Metoda 1: Potpuna Zamjena (Najsigurnija)

**Koraci:**

#### 1. Export Dev Baze
```bash
# Export cijele dev baze u custom format (preporučeno)
pg_dump -h localhost -U postgres -d stats_dev \
  -F c \
  -b \
  -v \
  -f dev_full_export_$(date +%Y%m%d_%H%M%S).dump

# Ili u SQL format (čitljiviji)
pg_dump -h localhost -U postgres -d stats_dev \
  --clean \
  --if-exists \
  -f dev_full_export_$(date +%Y%m%d_%H%M%S).sql
```

#### 2. Očisti Production Bazu
```bash
# Opcija A: Drop i recreate bazu (najčistije)
psql -h <PROD_HOST> -U <PROD_USER> -d postgres -c "DROP DATABASE IF EXISTS <PROD_DB>;"
psql -h <PROD_HOST> -U <PROD_USER> -d postgres -c "CREATE DATABASE <PROD_DB>;"

# Opcija B: Očisti sve tabele (ako ne možeš dropovati bazu)
psql -h <PROD_HOST> -U <PROD_USER> -d <PROD_DB> -c "
DO \$\$ DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
END \$\$;
"
```

#### 3. Import u Production
```bash
# Ako si koristio custom format (.dump)
pg_restore -h <PROD_HOST> -U <PROD_USER> -d <PROD_DB> \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  -v \
  dev_full_export_YYYYMMDD_HHMMSS.dump

# Ako si koristio SQL format (.sql)
psql -h <PROD_HOST> -U <PROD_USER> -d <PROD_DB> -f dev_full_export_YYYYMMDD_HHMMSS.sql
```

#### 4. Verifikacija
```bash
# Provjeri broj redova u ključnim tabelama
psql -h <PROD_HOST> -U <PROD_USER> -d <PROD_DB> -c "
SELECT 
  'Flight' as table_name, COUNT(*) as count FROM \"Flight\"
UNION ALL
SELECT 'Airline', COUNT(*) FROM \"Airline\"
UNION ALL
SELECT 'Airport', COUNT(*) FROM \"Airport\"
UNION ALL
SELECT 'AircraftType', COUNT(*) FROM \"AircraftType\"
UNION ALL
SELECT 'Employee', COUNT(*) FROM \"Employee\"
UNION ALL
SELECT 'License', COUNT(*) FROM \"License\"
UNION ALL
SELECT 'User', COUNT(*) FROM \"User\";
"
```

---

### Metoda 2: Selektivni Export (Samo Podaci, Bez Schema)

Ako već imaš schema u produkciji (iz Prisma migrations) i želiš samo podatke:

#### 1. Export Samo Podataka
```bash
pg_dump -h localhost -U postgres -d stats_dev \
  --data-only \
  --column-inserts \
  -t '"Flight"' \
  -t '"Airline"' \
  -t '"Airport"' \
  -t '"AircraftType"' \
  -t '"OperationType"' \
  -t '"DelayCode"' \
  -t '"FlightDelay"' \
  -t '"AirlineDelayCode"' \
  -t '"Employee"' \
  -t '"Sector"' \
  -t '"License"' \
  -t '"LicenseType"' \
  -t '"DailyOperationsVerification"' \
  -f dev_data_only_$(date +%Y%m%d_%H%M%S).sql
```

#### 2. Očisti Podatke u Production (Zadrži Schema)
```bash
psql -h <PROD_HOST> -U <PROD_USER> -d <PROD_DB> -c "
TRUNCATE TABLE \"Flight\" CASCADE;
TRUNCATE TABLE \"Airline\" CASCADE;
TRUNCATE TABLE \"Airport\" CASCADE;
TRUNCATE TABLE \"AircraftType\" CASCADE;
TRUNCATE TABLE \"OperationType\" CASCADE;
TRUNCATE TABLE \"DelayCode\" CASCADE;
TRUNCATE TABLE \"Employee\" CASCADE;
TRUNCATE TABLE \"Sector\" CASCADE;
TRUNCATE TABLE \"License\" CASCADE;
TRUNCATE TABLE \"LicenseType\" CASCADE;
TRUNCATE TABLE \"DailyOperationsVerification\" CASCADE;
"
```

#### 3. Import Podataka
```bash
psql -h <PROD_HOST> -U <PROD_USER> -d <PROD_DB> -f dev_data_only_YYYYMMDD_HHMMSS.sql
```

---

### Metoda 3: Prisma-Based Migration (Najsigurnija za Schema)

Ako želiš biti 100% siguran da je schema identična:

#### 1. Reset Production Schema
```bash
# U .env postavi DATABASE_URL na production
DATABASE_URL="postgresql://..." npx prisma migrate reset --force
```

#### 2. Export Dev Podataka
```bash
pg_dump -h localhost -U postgres -d stats_dev \
  --data-only \
  --column-inserts \
  -f dev_data_$(date +%Y%m%d_%H%M%S).sql
```

#### 3. Import Podataka
```bash
psql $DATABASE_URL_PRODUCTION -f dev_data_YYYYMMDD_HHMMSS.sql
```

---

## 🛡️ Sigurnosne Mjere

### 1. Backup Checklist
- ✅ Backup production baze kreiran
- ✅ Backup testiran (restore u test environment)
- ✅ Backup pohranjen na sigurno mjesto (S3, Google Drive, etc.)

### 2. Downtime Plan
```bash
# Ako je moguće, stavi aplikaciju u maintenance mode
# Kreiraj maintenance.html stranicu
```

### 3. Verifikacija Podataka
```sql
-- Provjeri kritične metrike
SELECT 
  DATE_TRUNC('month', date) as month,
  COUNT(*) as flights,
  SUM("arrivalPassengers" + "departurePassengers") as total_passengers
FROM "Flight"
GROUP BY month
ORDER BY month DESC
LIMIT 12;

-- Provjeri da li postoje NULL vrijednosti gdje ne bi trebalo
SELECT COUNT(*) FROM "Flight" WHERE "airlineId" IS NULL;
SELECT COUNT(*) FROM "Flight" WHERE "aircraftTypeId" IS NULL;
```

---

## 🔄 Rollback Plan

Ako nešto pođe po zlu:

### Brzi Rollback
```bash
# Restore iz backup-a
pg_restore -h <PROD_HOST> -U <PROD_USER> -d <PROD_DB> \
  --clean \
  --if-exists \
  backup_production_YYYYMMDD_HHMMSS.dump
```

### Verifikacija Nakon Rollback
```bash
# Provjeri da li je sve vraćeno
psql -h <PROD_HOST> -U <PROD_USER> -d <PROD_DB> -c "
SELECT COUNT(*) FROM \"Flight\";
SELECT COUNT(*) FROM \"User\";
"
```

---

## 📝 Korak-po-Korak Checklist

### Pre-Migration
- [ ] Kreiraj backup production baze
- [ ] Testiraj backup (restore u test environment)
- [ ] Obavijesti korisnike o downtime-u (ako je potrebno)
- [ ] Zaustavi background jobs / cron tasks
- [ ] Dokumentuj trenutno stanje (broj redova u tabelama)

### Migration
- [ ] Export dev baze
- [ ] Verifikuj export file (otvori i provjeri)
- [ ] Očisti production bazu
- [ ] Import dev podataka u production
- [ ] Verifikuj broj redova u svim tabelama

### Post-Migration
- [ ] Testiraj ključne funkcionalnosti (login, dashboard, reports)
- [ ] Provjeri da li svi grafici prikazuju podatke
- [ ] Testiraj Excel export
- [ ] Provjeri API endpoints
- [ ] Pokreni background jobs / cron tasks
- [ ] Obavijesti korisnike da je sistem ponovo aktivan

---

## 🚀 Automatizovani Script (Preporučeno)

Kreiraj `migrate-to-production.sh`:

```bash
#!/bin/bash

set -e  # Exit on error

echo "🔄 Starting database migration from DEV to PRODUCTION..."

# Variables
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DEV_DB="stats_dev"
PROD_HOST="your-prod-host"
PROD_USER="your-prod-user"
PROD_DB="your-prod-db"
BACKUP_DIR="./backups"

mkdir -p $BACKUP_DIR

# Step 1: Backup Production
echo "📦 Creating production backup..."
pg_dump -h $PROD_HOST -U $PROD_USER -d $PROD_DB \
  -F c -b -v \
  -f "$BACKUP_DIR/prod_backup_$TIMESTAMP.dump"

# Step 2: Export Dev
echo "📤 Exporting dev database..."
pg_dump -h localhost -U postgres -d $DEV_DB \
  -F c -b -v \
  -f "$BACKUP_DIR/dev_export_$TIMESTAMP.dump"

# Step 3: Verify export
echo "✅ Verifying export..."
pg_restore --list "$BACKUP_DIR/dev_export_$TIMESTAMP.dump" > /dev/null

# Step 4: Import to Production
echo "📥 Importing to production..."
pg_restore -h $PROD_HOST -U $PROD_USER -d $PROD_DB \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  -v \
  "$BACKUP_DIR/dev_export_$TIMESTAMP.dump"

# Step 5: Verify
echo "🔍 Verifying migration..."
psql -h $PROD_HOST -U $PROD_USER -d $PROD_DB -c "
SELECT 'Flight' as table_name, COUNT(*) FROM \"Flight\"
UNION ALL SELECT 'Airline', COUNT(*) FROM \"Airline\"
UNION ALL SELECT 'User', COUNT(*) FROM \"User\";
"

echo "✅ Migration completed successfully!"
echo "📦 Backups stored in: $BACKUP_DIR"
```

---

## ⚠️ Važne Napomene

1. **User Passwords**: Ako koristiš bcrypt hash-ove, oni će biti kopirani direktno (što je OK)
2. **File Uploads**: Ako imaš upload-ovane fajlove (slike, dokumenti), moraš ih ručno kopirati
3. **Environment Variables**: Provjeri da su `.env` varijable u produkciji ispravne
4. **Sequences**: PostgreSQL sequences će biti automatski resetovani na maksimalne vrijednosti
5. **Indexes**: Svi indexi će biti kreirani tokom import-a

---

## 🔧 Troubleshooting

### Problem: "relation already exists"
**Rješenje:** Dodaj `--clean --if-exists` flagove u pg_restore

### Problem: "permission denied"
**Rješenje:** Koristi `--no-owner --no-acl` flagove

### Problem: "foreign key constraint violation"
**Rješenje:** Import sa `--disable-triggers` ili import tabele po određenom redoslijedu

### Problem: Spor import
**Rješenje:** Privremeno isključi indexe, importuj, pa ih ponovo kreiraj

---

## 📊 Verifikacioni Queries

```sql
-- Provjeri ukupan broj letova po godinama
SELECT 
  EXTRACT(YEAR FROM date) as year,
  COUNT(*) as flights,
  SUM("arrivalPassengers") as arr_pax,
  SUM("departurePassengers") as dep_pax
FROM "Flight"
GROUP BY year
ORDER BY year;

-- Provjeri aviokompanije
SELECT name, "icaoCode", COUNT(*) as flight_count
FROM "Airline" a
LEFT JOIN "Flight" f ON f."airlineId" = a.id
GROUP BY a.id, name, "icaoCode"
ORDER BY flight_count DESC;

-- Provjeri korisnike
SELECT email, role, "isActive" FROM "User";

-- Provjeri licence koje ističu
SELECT 
  e."firstName", e."lastName",
  lt.name as license_type,
  l."expiryDate"
FROM "License" l
JOIN "Employee" e ON e.id = l."employeeId"
JOIN "LicenseType" lt ON lt.id = l."licenseTypeId"
WHERE l."expiryDate" < NOW() + INTERVAL '30 days'
ORDER BY l."expiryDate";
```

---

## ✅ Zaključak

**Preporučeni pristup:**
1. Koristi **Metodu 1** (pg_dump & pg_restore) za potpunu migraciju
2. Obavezno kreiraj backup prije bilo čega
3. Testiraj u staging environmentu ako je moguće
4. Koristi automatizovani script za konzistentnost
5. Verifikuj podatke nakon migracije

**Vrijeme trajanja:** ~10-30 minuta (zavisno od veličine baze)

**Downtime:** ~5-15 minuta (tokom import-a)
