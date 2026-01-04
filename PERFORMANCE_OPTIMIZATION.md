# Performance Optimization Guide

## 🚀 Optimizacije implementirane

### Prije optimizacije:
- **Dashboard Stats API**: 72+ database upita
- **Response time**: 8-18 sekundi
- **Problem**: N+1 query pattern u loop-ovima

### Nakon optimizacije:
- **Dashboard Stats API**: 4 database upita + in-memory caching
- **Očekivano smanjenje**: 90%+ brže (od ~10s na ~500ms bez cache, ~50ms sa cache)

---

## 📊 Implementirane optimizacije

### 1. ✅ Prisma Client Singleton + Connection Pooling

**Fajl**: `src/lib/prisma.ts`

**Promjene**:
- Implementiran singleton pattern (već postojao)
- Dodat graceful shutdown handling
- Konfigurisan connection pooling preko DATABASE_URL

**Kako koristiti**:
```typescript
import { prisma } from '@/lib/prisma';

// Uvijek koristi ovaj import, nikad ne kreiraj novi PrismaClient()
```

**Database URL sa poolingom** (`.env`):
```bash
# Development
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=10&pool_timeout=20"

# Production
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=50&pool_timeout=20"
```

---

### 2. ✅ Database Indexes

**Fajl**: `prisma/schema.prisma`

**Dodati indeksi**:
```prisma
model Flight {
  // ... fields

  @@index([date])
  @@index([airlineId])
  @@index([route])
  @@index([arrivalAirportId])
  @@index([departureAirportId])
  @@index([operationTypeId])        // ✅ NOVO
  @@index([aircraftTypeId])         // ✅ NOVO
  @@index([date, airlineId])        // ✅ NOVO - Composite index
  @@index([date, operationTypeId])  // ✅ NOVO - Za analytics
}
```

**Primjeni migraciju**:
```bash
npx prisma migrate dev --name add_performance_indexes
```

---

### 3. ✅ Dashboard Stats API - Eliminisan N+1 Problem

**Fajl**: `src/app/api/dashboard/stats/route.ts`

**Stara verzija - PROBLEMA**:
```typescript
// ❌ 30x loop sa 2 upita po iteraciji = 60 upita
for (let i = 29; i >= 0; i--) {
  const count = await prisma.flight.count({ ... });
  const passengersAgg = await prisma.flight.aggregate({ ... });
}

// ❌ 7x loop sa 1 upit po iteraciji = 7 upita
for (let i = 6; i >= 0; i--) {
  const dayFlights = await prisma.flight.findMany({ ... });
}

// ❌ 5x loop za airlines = 5 upita
topAirlinesData.map(async (item) => {
  const airline = await prisma.airline.findUnique({ ... });
});
```

**Nova verzija - OPTIMIZOVANO**:
```typescript
// ✅ 1 upit - učitaj SVE flightove za 30 dana odjednom
const last30DaysFlights = await prisma.flight.findMany({
  where: { date: { gte: thirtyDaysAgo, lte: todayEnd } },
  select: { /* samo potrebna polja */ }
});

// ✅ In-memory processing umjesto DB upita
for (let i = 29; i >= 0; i--) {
  const dayFlights = last30DaysFlights.filter(
    f => f.date >= dayStart && f.date <= dayEnd
  );
  // Procesiranje u memoriji - MNOGO brže!
}

// ✅ Batch fetch svih airline-a odjednom
const airlines = await prisma.airline.findMany({
  where: { id: { in: allAirlineIds } }
});
```

**Rezultat**:
- **Prije**: 72+ upita
- **Poslije**: 4 upita
- **Boost**: ~18x manje upita!

---

### 4. ✅ In-Memory Cache Layer

**Fajl**: `src/lib/cache.ts`

**Kako koristiti**:
```typescript
import { cache, CacheTTL } from '@/lib/cache';

// Čitanje iz cache-a
const data = cache.get<MyDataType>('cache-key');
if (data) {
  return data; // Cache hit!
}

// Ako nema u cache-u, učitaj iz DB-a
const freshData = await fetchFromDatabase();

// Sačuvaj u cache sa TTL
cache.set('cache-key', freshData, CacheTTL.FIVE_MINUTES);
```

**Primjer - Dashboard Stats**:
```typescript
// Provjerimo cache
const cachedData = cache.get('dashboard-stats');
if (cachedData) {
  return NextResponse.json({ data: cachedData, cached: true });
}

// Učitaj iz baze
const data = await fetchDashboardStats();

// Sačuvaj u cache na 5 minuta
cache.set('dashboard-stats', data, CacheTTL.FIVE_MINUTES);
```

**TTL Presets**:
- `CacheTTL.ONE_MINUTE` - 1 minut
- `CacheTTL.FIVE_MINUTES` - 5 minuta *(preporučeno za dashboard)*
- `CacheTTL.TEN_MINUTES` - 10 minuta
- `CacheTTL.THIRTY_MINUTES` - 30 minuta
- `CacheTTL.ONE_HOUR` - 1 sat

---

## 🎯 Best Practices

### 1. Izbjegavaj N+1 Query Pattern

**❌ Loše**:
```typescript
const users = await prisma.user.findMany();
for (const user of users) {
  const posts = await prisma.post.findMany({
    where: { userId: user.id }
  });
}
```

**✅ Dobro**:
```typescript
const users = await prisma.user.findMany({
  include: {
    posts: true  // Eager loading
  }
});
```

**✅ Još bolje (batch fetch)**:
```typescript
const users = await prisma.user.findMany();
const userIds = users.map(u => u.id);

const posts = await prisma.post.findMany({
  where: { userId: { in: userIds } }
});

// Group posts by userId u memoriji
const postsByUser = posts.reduce((acc, post) => {
  if (!acc[post.userId]) acc[post.userId] = [];
  acc[post.userId].push(post);
  return acc;
}, {});
```

### 2. Koristi `select` za specifična polja

**❌ Loše** (učitava SVA polja):
```typescript
const flights = await prisma.flight.findMany();
```

**✅ Dobro** (učitava samo potrebna polja):
```typescript
const flights = await prisma.flight.findMany({
  select: {
    id: true,
    date: true,
    airlineId: true,
    arrivalPassengers: true,
  }
});
```

### 3. Koristi Composite Indexes

Za upite koji kombinuju više uslova:
```prisma
@@index([date, airlineId])  // Za WHERE date=X AND airlineId=Y
@@index([date, operationTypeId])
```

### 4. Batch Operations gdje god je moguće

**❌ Loše**:
```typescript
for (const item of items) {
  await prisma.table.create({ data: item });
}
```

**✅ Dobro**:
```typescript
await prisma.table.createMany({
  data: items
});
```

### 5. Paginacija za velike liste

**✅ Uvijek koristi paginaciju**:
```typescript
const flights = await prisma.flight.findMany({
  take: limit,
  skip: (page - 1) * limit,
  orderBy: { date: 'desc' }
});
```

---

## 📈 Monitoring Performance

### Enable Query Logging (development only)

```typescript
// src/lib/prisma.ts
new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
})
```

### Provjeri response time

```typescript
console.time('API call');
const result = await apiCall();
console.timeEnd('API call');
```

---

## 🔧 Migracija - Primjena Novih Indeksa

**1. Generiši migraciju**:
```bash
npx prisma migrate dev --name add_performance_indexes
```

**2. Primijeni u produkciji**:
```bash
npx prisma migrate deploy
```

**3. Provjeri indekse u bazi** (PostgreSQL):
```sql
-- Vidi sve indekse na Flight tabeli
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Flight';
```

---

## 🚦 Testing Optimizations

### Prije testiranja:

1. Primijeni nove indekse:
   ```bash
   npx prisma migrate dev --name add_performance_indexes
   ```

2. Restart development servera:
   ```bash
   npm run dev
   ```

### Testiranje:

**1. Dashboard Stats API**:
```bash
# Prvi zahtjev (bez cache)
time curl http://localhost:3000/api/dashboard/stats

# Drugi zahtjev (sa cache)
time curl http://localhost:3000/api/dashboard/stats
```

**Očekivani rezultati**:
- Prvi zahtjev: ~500ms - 1s (umjesto 8-18s)
- Drugi zahtjev: ~50-100ms (cache hit)

---

## 📝 Napomene

- **Cache**: Trenutno koristi in-memory cache koji se resetuje sa serverom. Za production, razmisli o Redis-u.
- **Connection Pooling**: Podesi `connection_limit` prema broju konkurentnih zahtjeva.
- **Indexes**: Indeksi ubrzavaju read operacije ali usporavaju write. To je prihvatljiv trade-off za flight tracking sistem.

---

## 🎯 Sljedeći koraci (opciono)

1. **Redis Cache** za production:
   - Perzistentan cache
   - Shared across multiple server instances

2. **Prisma Accelerate**:
   - Managed connection pooling
   - Global cache layer

3. **Read Replicas**:
   - Za analytics/reporting upite
   - Smanji load na primary database

4. **Query Optimization Monitoring**:
   - Prisma Studio
   - Database slow query log
   - APM tools (New Relic, Datadog)
