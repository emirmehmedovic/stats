# Neon → Production: Najjednostavniji Način

## Situacija
- ✅ Dev baza je na **Neon** (PostgreSQL cloud)
- ✅ Production baza je **prazna** (novi deployment)
- ✅ Nema potrebe za backup-om production-a

---

## 🚀 Najjednostavniji Način (1 Komanda)

### Korak 1: Export iz Neon-a

```bash
# Koristi DATABASE_URL iz .env fajla za dev bazu
pg_dump "postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require" \
  -F c \
  -b \
  -v \
  -f neon_export.dump
```

**Ili jednostavnije, ako imaš DATABASE_URL u .env:**

```bash
# Učitaj .env i exportuj
export $(cat .env | grep DATABASE_URL | xargs)
pg_dump $DATABASE_URL -F c -b -v -f neon_export.dump
```

---

### Korak 2: Import u Production

```bash
# Ako je production na Vercel/Neon/Supabase
pg_restore -d "postgresql://prod_user:prod_pass@prod_host/prod_db?sslmode=require" \
  --no-owner \
  --no-acl \
  -v \
  neon_export.dump
```

**Ili sa environment varijablom:**

```bash
# Postavi production DATABASE_URL
export DATABASE_URL_PROD="postgresql://..."

pg_restore -d $DATABASE_URL_PROD \
  --no-owner \
  --no-acl \
  -v \
  neon_export.dump
```

---

## 📝 Kompletni Script (Copy-Paste Ready)

Kreiraj `migrate.sh`:

```bash
#!/bin/bash

set -e

echo "🔄 Migrating from Neon (dev) to Production..."

# 1. Export iz Neon-a
echo "📤 Exporting from Neon..."
pg_dump $DATABASE_URL \
  -F c \
  -b \
  -v \
  -f neon_export_$(date +%Y%m%d_%H%M%S).dump

EXPORT_FILE=$(ls -t neon_export_*.dump | head -1)
echo "✅ Export completed: $EXPORT_FILE"

# 2. Import u Production
echo "📥 Importing to Production..."
pg_restore -d $DATABASE_URL_PROD \
  --no-owner \
  --no-acl \
  -v \
  $EXPORT_FILE

# 3. Verifikacija
echo "🔍 Verifying..."
psql $DATABASE_URL_PROD -c "
SELECT 
  'Flight' as table_name, COUNT(*) as count FROM \"Flight\"
UNION ALL
SELECT 'Airline', COUNT(*) FROM \"Airline\"
UNION ALL
SELECT 'Airport', COUNT(*) FROM \"Airport\"
UNION ALL
SELECT 'User', COUNT(*) FROM \"User\";
"

echo "✅ Migration completed successfully!"
```

**Korištenje:**

```bash
chmod +x migrate.sh

# Postavi environment varijable
export DATABASE_URL="postgresql://neon_dev_url..."
export DATABASE_URL_PROD="postgresql://prod_url..."

# Pokreni
./migrate.sh
```

---

## 🎯 Još Jednostavnije: Direktan Pipe (Bez Fajla)

Ako ne želiš kreirati dump fajl, možeš direktno pipe-ovati:

```bash
pg_dump $DATABASE_URL | psql $DATABASE_URL_PROD
```

**Ili sa progress bar-om:**

```bash
pg_dump $DATABASE_URL | pv | psql $DATABASE_URL_PROD
```

---

## 📋 Neon-Specifične Napomene

### 1. Connection String Format
```
postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### 2. Neon UI Export (Alternativa)
Ako ne želiš koristiti komandnu liniju:
1. Idi na **Neon Dashboard**
2. Odaberi svoju bazu
3. Klikni na **"Backups"** ili **"Export"**
4. Download `.sql` ili `.dump` fajl
5. Importuj u production sa `psql` ili `pg_restore`

### 3. Neon Branching (Bonus)
Ako koristiš Neon branching:
```bash
# Export iz specifičnog branch-a
pg_dump "postgresql://...@ep-xxx.region.aws.neon.tech/dbname?options=endpoint%3Dbranch-name" \
  -f export.dump
```

---

## ✅ Verifikacija Nakon Import-a

```sql
-- Provjeri broj redova
SELECT 
  schemaname,
  tablename,
  n_live_tup as row_count
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

-- Provjeri letove po godinama
SELECT 
  EXTRACT(YEAR FROM date) as year,
  COUNT(*) as flights
FROM "Flight"
GROUP BY year
ORDER BY year;

-- Provjeri korisnike
SELECT email, role FROM "User";
```

---

## 🔧 Troubleshooting

### Problem: "pg_dump: command not found"
**Rješenje:** Instaliraj PostgreSQL client tools
```bash
# macOS
brew install postgresql

# Ubuntu/Debian
sudo apt-get install postgresql-client

# Windows
# Download from postgresql.org
```

### Problem: "SSL connection required"
**Rješenje:** Dodaj `?sslmode=require` na kraj connection string-a

### Problem: "permission denied for schema public"
**Rješenje:** Koristi `--no-owner --no-acl` flagove u pg_restore

---

## 📊 Procjena Vremena

- **Export iz Neon-a:** 1-5 min (zavisno od veličine baze)
- **Transfer fajla:** < 1 min (ako je lokalno)
- **Import u Production:** 2-10 min
- **Verifikacija:** 1-2 min

**Ukupno:** ~5-20 minuta

---

## 🎯 TL;DR - Najbrži Način

```bash
# 1. Export
pg_dump $DATABASE_URL -F c -f neon.dump

# 2. Import
pg_restore -d $DATABASE_URL_PROD --no-owner --no-acl neon.dump

# 3. Verify
psql $DATABASE_URL_PROD -c "SELECT COUNT(*) FROM \"Flight\";"
```

**Gotovo!** 🎉
