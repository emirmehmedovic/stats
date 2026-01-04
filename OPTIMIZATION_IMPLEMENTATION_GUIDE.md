# Vodič za Implementaciju Prisma Optimizacija

## 📋 PREGLED

Identificirano je **21+ kritičnih problema** u Prisma upitima koji uzrokuju:
- Spore response time-ove (8-18 sekundi)
- N+1 query pattern-e
- Vraćanje hiljade nepotrebnih podataka
- Nedostatak paginacije

**Očekivani rezultat**: 80-95% poboljšanje performansi

---

## 🎯 ŠTA JE URAĐENO

### ✅ Završeno:

1. **Dashboard Stats API** - Optimizovano (72+ upita → 4 upita)
2. **Prisma Client** - Connection pooling i graceful shutdown
3. **Database Indeksi** - Dodani novi indexi
4. **Cache Layer** - In-memory cache sa TTL
5. **Flight Repository** - Centralizovan data access layer
6. **Comparison API** - Optimizovana verzija (eliminisan N+1)
7. **Airlines API** - Optimizovana verzija sa paginacijom
8. **Dokumentacija** - Kompletna audit dokumentacija

### ⏳ Potrebno uraditi:

9. Primijeniti optimizacije na production API rute
10. Dodati paginaciju ostalim CRUD API rutama
11. Optimizovati Analytics APIs
12. Testirati sve izmjene

---

## 🚀 IMPLEMENTACIJA - KORAK PO KORAK

### FAZA 1: Primjena Database Indeksa (5 minuta)

**Status**: ✅ Već primijenjeno sa `npx prisma db push`

Indeksi su dodati na:
- `Flight.operationTypeId`
- `Flight.aircraftTypeId`
- `Flight.[date, airlineId]` (composite)
- `Flight.[date, operationTypeId]` (composite)

**Provjera**:
```sql
-- Pokreni u PostgreSQL
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'Flight';
```

---

### FAZA 2: Primjena Optimizovanih API Ruta (30 minuta)

#### 1. Dashboard Stats API
**Status**: ✅ Već primijenjeno

#### 2. Comparison API

```bash
# Backup stare verzije
cp src/app/api/comparison/route.ts src/app/api/comparison/route.old.ts

# Zamijeni sa optimizovanom verzijom
cp src/app/api/comparison/route.optimized.ts src/app/api/comparison/route.ts
```

**Testiranje**:
```bash
# Test sa 30 dana comparison
time curl "http://localhost:3000/api/comparison?type=airlines&date1From=2024-01-01&date1To=2024-01-31&date2From=2024-02-01&date2To=2024-02-28"

# Očekivano: < 1s (prije: 5-10s)
```

#### 3. Airlines API

```bash
# Backup i zamjena
cp src/app/api/airlines/route.ts src/app/api/airlines/route.old.ts
cp src/app/api/airlines/route.optimized.ts src/app/api/airlines/route.ts
```

**Testiranje**:
```bash
# Test paginacije
curl "http://localhost:3000/api/airlines?page=1&limit=20"

# Test search
curl "http://localhost:3000/api/airlines?search=Emirates&page=1&limit=20"
```

#### 4. Aircraft Types, Operation Types, Delay Codes

Primijeni isti pattern kao za Airlines:

**Template za optimizaciju**:
```typescript
// ✅ Dodaj paginaciju
const page = parseInt(searchParams.get('page') || '1', 10);
const limit = parseInt(searchParams.get('limit') || '50', 10);

// ✅ Paralelni upiti
const [items, total] = await Promise.all([
  prisma.model.findMany({
    where,
    select: { /* samo potrebna polja */ },
    skip: (page - 1) * limit,
    take: limit,
  }),
  prisma.model.count({ where }),
]);

// ✅ Vrati sa pagination meta
return NextResponse.json({
  success: true,
  data: items,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    hasMore: page * limit < total,
  },
});
```

---

### FAZA 3: Optimizacija Analytics APIs (45 minuta)

#### Analytics Load Factor

**Problem**: `findMany()` bez limita

**Riješenje**:
```typescript
// PRIJE: src/app/api/analytics/load-factor/route.ts:58
const flights = await prisma.flight.findMany({
  where: whereClause,
  include: { airline: true, aircraftType: true }
});

// POSLIJE: Koristi repository
import { getFlightsForAnalytics, getAirlineByIcaoCode } from '@/lib/repositories/flight.repository';

// Lookup airline PRIJE glavnog upita
let airlineId: string | undefined;
if (airlineParam) {
  const airline = await getAirlineByIcaoCode(airlineParam);
  airlineId = airline?.id;
}

// Optimizovan upit sa minimal poljima
const flights = await getFlightsForAnalytics({
  dateFrom: startDate,
  dateTo: endDate,
  airlineId,
});
```

#### Analytics Punctuality

Primijeni isti pattern kao Load Factor.

---

### FAZA 4: Frontend Izmjene (30 minuta)

Ažuriraj frontend komponente da koriste paginaciju:

**Primjer - Airlines List**:
```typescript
// PRIJE
const { data: airlines } = await fetch('/api/airlines');

// POSLIJE
const [page, setPage] = useState(1);
const limit = 50;

const { data, pagination } = await fetch(
  `/api/airlines?page=${page}&limit=${limit}`
);

// Dodaj pagination kontrole
<Pagination
  currentPage={pagination.page}
  totalPages={pagination.totalPages}
  onPageChange={setPage}
/>
```

---

### FAZA 5: Testing (1 sat)

#### 1. Unit Tests

```typescript
// __tests__/api/airlines.test.ts
describe('Airlines API', () => {
  it('should return paginated results', async () => {
    const response = await fetch('/api/airlines?page=1&limit=10');
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(10);
    expect(json.pagination).toBeDefined();
    expect(json.pagination.totalPages).toBeGreaterThan(0);
  });

  it('should handle invalid pagination params', async () => {
    const response = await fetch('/api/airlines?page=-1&limit=1000');
    expect(response.status).toBe(400);
  });
});
```

#### 2. Performance Tests

```bash
# Instaliraj Apache Bench ili k6
brew install apache-bench

# Benchmark prije
ab -n 100 -c 10 http://localhost:3000/api/airlines

# Primijeni optimizaciju

# Benchmark poslije
ab -n 100 -c 10 "http://localhost:3000/api/airlines?page=1&limit=50"

# Uporedi rezultate
```

#### 3. Load Testing

```javascript
// k6 load test
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 50, // 50 virtual users
  duration: '30s',
};

export default function() {
  const response = http.get('http://localhost:3000/api/airlines?page=1&limit=50');

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

---

## 📊 OČEKIVANI REZULTATI

### Prije Optimizacije:

| Endpoint | Queries | Response Time | Data Size |
|----------|---------|---------------|-----------|
| Dashboard Stats | 72+ | 8-18s | ~500KB |
| Comparison (30d) | 60+ | 5-10s | ~300KB |
| Airlines List | 1 | 2-3s | ~2MB |
| Load Factor | 1 | 5-8s | ~5MB |

### Poslije Optimizacije:

| Endpoint | Queries | Response Time | Data Size |
|----------|---------|---------------|-----------|
| Dashboard Stats | 4 | 500ms | ~50KB |
| Comparison (30d) | 5 | 800ms | ~30KB |
| Airlines List | 2 | 200ms | ~20KB |
| Load Factor | 1-2 | 1s | ~100KB |

**Ukupno poboljšanje**: 80-95%

---

## 🔍 MONITORING I VALIDACIJA

### 1. Enable Prisma Query Logging

Za development:
```typescript
// src/lib/prisma.ts - već implementirano
new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
})
```

### 2. Performance Monitoring

Dodaj timing u API responses:
```typescript
// Wrapper funkcija
export async function withTiming<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    console.log(`[TIMING] ${name}: ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[TIMING ERROR] ${name}: ${duration}ms`, error);
    throw error;
  }
}

// Upotreba
const flights = await withTiming('getFlights', () =>
  getFlightsForAnalytics(filters)
);
```

### 3. Query Count Tracking

```typescript
// Dev middleware
if (process.env.NODE_ENV === 'development') {
  let queryCount = 0;

  prisma.$use(async (params, next) => {
    queryCount++;
    const result = await next(params);
    console.log(`Query #${queryCount}: ${params.model}.${params.action}`);
    return result;
  });
}
```

---

## 🛡️ BEST PRACTICES - CHECKLIST

Prije svakog novog API endpoint-a, provjeri:

### Read Operations:
- [ ] **Paginacija?** (page, limit parametri)
- [ ] **Select?** (samo potrebna polja)
- [ ] **Filter?** (umjesto findMany bez where)
- [ ] **Sortiranje?** (na indexiranoj koloni)
- [ ] **N+1?** (nema upita u petlji)
- [ ] **Cache?** (za često korišćene podatke)
- [ ] **Limit?** (max broj rezultata)

### Write Operations:
- [ ] **Validacija?** (Zod schema)
- [ ] **Transakcija?** (ako je potrebno)
- [ ] **Batch?** (createMany umjesto loop create)
- [ ] **Where je siguran?** (ID, ne search string)
- [ ] **Error handling?** (P2002, P2025, etc.)

---

## 🐛 TROUBLESHOOTING

### Problem: "Migration failed to apply"

**Riješenje**:
```bash
# Reset shadow database
npx prisma migrate reset

# Ili direktno push schema
npx prisma db push
```

### Problem: "Too many connections"

**Riješenje**:
```bash
# Ažuriraj DATABASE_URL u .env
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=20"

# Restart server
```

### Problem: "Cache ne radi"

**Riješenje**:
```typescript
// Provjeri da li je cache importovan
import { cache, CacheTTL } from '@/lib/cache';

// Provjeri TTL
cache.set('key', data, CacheTTL.FIVE_MINUTES);

// Debug cache
console.log('Cache size:', cache.size());
```

---

## 📚 DODATNI RESURSI

- [Prisma Best Practices](https://www.prisma.io/docs/guides/performance-and-optimization)
- [N+1 Query Problem](https://www.prisma.io/docs/guides/performance-and-optimization/query-optimization-performance#solving-n1-in-graphql-with-findunique-and-prisma-client)
- [Connection Pooling](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)

---

## ✅ FINALNA PROVJERA

Nakon implementacije svih optimizacija:

```bash
# 1. Run all tests
npm test

# 2. Check for errors
npm run lint

# 3. Build project
npm run build

# 4. Performance test
npm run test:perf  # (kreiraj ovaj script)

# 5. Deploy
git add .
git commit -m "feat: optimize Prisma queries - 80-95% performance improvement"
git push
```

---

**Status**: 📈 Spremno za implementaciju
**Estimated Time**: 3-4 sata
**Očekivano poboljšanje**: 80-95%
