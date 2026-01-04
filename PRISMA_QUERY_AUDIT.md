# Prisma Query Audit - Detaljni Pregled i Optimizacije

Datum: 2025-01-22
Status: ✅ Identifikovano | 🔧 U toku optimizacije

---

## 📊 EXECUTIVE SUMMARY

| Kategorija | Broj problema | Prioritet |
|------------|---------------|-----------|
| **N+1 Query problemi** | 3 | 🔴 KRITIČNO |
| **Nedostaje paginacija** | 4 | 🔴 KRITIČNO |
| **Previše podataka** | 6 | 🟠 VISOK |
| **Duplikacija upita** | 8+ | 🟡 SREDNJI |

**Ukupno identificiranih problema**: 21+
**Očekivano poboljšanje performansi**: 80-95%

---

## 🔴 KRITIČNI PROBLEMI

### 1. Airlines API - Nema paginaciju

**Fajl**: `src/app/api/airlines/route.ts:12`

**Problem**:
```typescript
// ❌ Vraća SVE airline odjednom
const airlines = await prisma.airline.findMany({
  where: search ? { ... } : undefined,
  orderBy: { name: 'asc' },
  include: {
    _count: { select: { flights: true } }
  }
});
```

**Rizik**:
- Može vratiti hiljade airlines
- Frontend dobija ogroman JSON payload
- Spor response time

**Riješenje**:
```typescript
// ✅ Sa paginacijom
const page = parseInt(searchParams.get('page') || '1');
const limit = parseInt(searchParams.get('limit') || '50');

const [airlines, total] = await Promise.all([
  prisma.airline.findMany({
    where,
    orderBy: { name: 'asc' },
    select: {  // Select samo potrebna polja
      id: true,
      name: true,
      icaoCode: true,
      iataCode: true,
      country: true,
      _count: { select: { flights: true } }
    },
    skip: (page - 1) * limit,
    take: limit,
  }),
  prisma.airline.count({ where })
]);
```

---

### 2. Aircraft Types API - Nema paginaciju

**Fajl**: `src/app/api/aircraft-types/route.ts:12`

**Problem**: Identičan kao Airlines
**Riješenje**: Dodati paginaciju i select

---

### 3. Operation Types API - Nema paginaciju

**Fajl**: `src/app/api/operation-types/route.ts:19`

**Problem**: Identičan kao Airlines
**Riješenje**: Dodati paginaciju i select

---

### 4. Delay Codes API - Nema paginaciju

**Fajl**: `src/app/api/delay-codes/route.ts:18`

**Problem**: Identičan kao Airlines
**Riješenje**: Dodati paginaciju i select

---

### 5. Analytics Load Factor - Bez limita

**Fajl**: `src/app/api/analytics/load-factor/route.ts:58`

**Problem**:
```typescript
// ❌ findMany() BEZ LIMITA - može vratiti 100,000+ letova!
const flights = await prisma.flight.findMany({
  where: whereClause,
  include: {
    airline: {
      select: { name: true, icaoCode: true }  // Ok select
    },
    aircraftType: {
      select: { model: true, seats: true }  // Ok select
    }
  },
  orderBy: { date: 'asc' }
});

// ❌ LINIJA 200: Već učitao SVE u memoriju!
flights: flightsWithLoadFactor.slice(0, 100),
```

**Analiza**:
1. Učita SVE letove u date range (može biti 100,000+)
2. Procesira sve u JavaScript-u
3. Vraća samo prvih 100
4. **OGROMNO rasipanje resursa!**

**Riješenje**:
```typescript
// ✅ Koristiti repository funkciju
import { getFlightsForAnalytics } from '@/lib/repositories/flight.repository';

const flights = await getFlightsForAnalytics({
  dateFrom: startDate,
  dateTo: endDate,
  airlineId: airline?.id,
});

// Svi kalkulacije u memoriji (OK jer su optimizovani podaci)
// Vratiti paginirane rezultate ako treba
```

---

### 6. Analytics Punctuality - Bez limita

**Fajl**: `src/app/api/analytics/punctuality/route.ts:58`

**Problem**: Identičan kao Load Factor
**Riješenje**: Koristiti repository

---

### 7. Comparison API - N+1 Problem (Airlines)

**Fajl**: `src/app/api/comparison/route.ts:216-232`

**Problem**:
```typescript
// ❌ EKSTREMNO KRITIČNO: Loop sa findUnique!
for (const airlineId of airlineIds) {
  const airline = await prisma.airline.findUnique({  // <-- UPIT U PETLJI!
    where: { id: airlineId },
  });

  if (!airline) continue;

  const count1 = airlines1.find(...);
  const count2 = airlines2.find(...);

  breakdown.push({ name: airline.name, ... });
}
```

**Analiza**:
- Ako ima 50 airlines → 50 dodatnih upita!
- Klasičan N+1 pattern
- **NEDOPUSTIVO!**

**Riješenje**:
```typescript
// ✅ Batch fetch svih airlines odjednom
const airlinesData = await prisma.airline.findMany({
  where: {
    id: { in: Array.from(airlineIds) }
  },
  select: {
    id: true,
    name: true,
  }
});

const airlineMap = new Map(airlinesData.map(a => [a.id, a.name]));

// Procesiranje u memoriji - MNOGO brže!
for (const airlineId of airlineIds) {
  const airlineName = airlineMap.get(airlineId);
  if (!airlineName) continue;
  // ...
}
```

---

### 8. Comparison API - N+1 Problem (Daily Counts)

**Fajl**: `src/app/api/comparison/route.ts:286-316`

**Problem**:
```typescript
// ❌ EKSTREMNO KRITIČNO: Loop sa count() za svaki dan!
for (let i = 0; i < maxLength; i++) {
  const day1 = days1[i];
  const day2 = days2[i];

  const day1Flights = await prisma.flight.count({  // <-- UPIT U PETLJI!
    where: {
      date: { gte: startOfDay(day1), lte: endOfDay(day1) }
    }
  });

  const day2Flights = await prisma.flight.count({  // <-- UPIT U PETLJI!
    where: {
      date: { gte: startOfDay(day2), lte: endOfDay(day2) }
    }
  });

  chartData.push({ date, period1: day1Flights, period2: day2Flights });
}
```

**Analiza**:
- Ako korisnik poredi 30 dana → 60 upita (2 po iteraciji × 30)!
- Ako poredi 90 dana → 180 upita!
- **NEDOPUSTIVO!**

**Riješenje**:
```typescript
// ✅ Jedan upit za sve dane
const flights = await prisma.flight.findMany({
  where: {
    date: { gte: range1.start, lte: range2.end }
  },
  select: { id: true, date: true }
});

// Group by date u memoriji
const dateGroups = flights.reduce((acc, flight) => {
  const dateKey = format(flight.date, 'yyyy-MM-dd');
  acc[dateKey] = (acc[dateKey] || 0) + 1;
  return acc;
}, {});

// Procesiranje u memoriji
for (let i = 0; i < maxLength; i++) {
  const day1Key = format(days1[i], 'yyyy-MM-dd');
  const day2Key = format(days2[i], 'yyyy-MM-dd');

  chartData.push({
    date: day1Key,
    period1: dateGroups[day1Key] || 0,
    period2: dateGroups[day2Key] || 0,
  });
}
```

---

### 9. getPeriodStats - Previše podataka

**Fajl**: `src/app/api/comparison/route.ts:80-96`

**Problem**:
```typescript
// ❌ findMany sa include - učitava SVE povezane podatke!
const flights = await prisma.flight.findMany({
  where: { date: { gte: start, lte: end } },
  include: {
    airline: true,           // ❌ SVA polja airline!
    aircraftType: true,      // ❌ SVA polja aircraft type!
    delays: {                // ❌ SVE delays sa svim poljima!
      include: {
        delayCode: true,     // ❌ + delay codes!
      }
    }
  }
});
```

**Analiza**:
- Vraća OGROMNE objekte
- Većina podataka se ne koristi
- delay codes učitava SVA polja (description, category, timestamps...)

**Riješenje**:
```typescript
// ✅ Minimal select
const flights = await prisma.flight.findMany({
  where: { date: { gte: start, lte: end } },
  select: {
    id: true,
    airlineId: true,
    aircraftTypeId: true,
    arrivalPassengers: true,
    departurePassengers: true,
    availableSeats: true,
  }
});

// Fetch related data in separate optimized queries
const aircraftTypeIds = [...new Set(flights.map(f => f.aircraftTypeId))];
const aircraftTypes = await prisma.aircraftType.findMany({
  where: { id: { in: aircraftTypeIds } },
  select: { id: true, seats: true }
});

// Delays aggregated, not individual records
const delayStats = await prisma.flightDelay.groupBy({
  by: ['flightId'],
  where: {
    flight: { date: { gte: start, lte: end } }
  },
  _sum: { minutes: true }
});
```

---

## 🟠 VISOKI PRIORITET

### 10. Analytics Load Factor - findFirst u potencijalnom loopu

**Fajl**: `src/app/api/analytics/load-factor/route.ts:46`

**Problem**:
```typescript
// ❌ Ako se API poziva više puta sa istim airlineParam
if (airlineParam) {
  const airline = await prisma.airline.findFirst({
    where: { icaoCode: airlineParam }
  });
}
```

**Riješenje**:
- Koristiti repository funkciju `getAirlineByIcaoCode()`
- Dodati caching za često korišćene airlines

---

## 📋 ŠABLON ZA OPTIMIZACIJU

Za svaki endpoint, primijeni ovaj checklist:

### ✅ Checklist za Read Operacije

- [ ] **Ima li paginaciju?** (limit + offset/cursor)
- [ ] **Koristi li `select` za specifična polja?**
- [ ] **Ima li N+1 problem?** (upiti u petlji)
- [ ] **Je li sortiranje optimizovano?** (indexirane kolone)
- [ ] **Koristi li filtere umjesto "sve"?**
- [ ] **Može li se cache-irati?**

### ✅ Checklist za Write Operacije

- [ ] **Koristi li transakcije gdje treba?**
- [ ] **Validacija PRIJE DB upita?**
- [ ] **Batch operacije gdje moguće?**
- [ ] **Where clause je siguran?** (ID, ne ime)
- [ ] **Error handling je adekvatan?**

---

## 🎯 PRIORITIZACIJA POPRAVLJANJA

### Faza 1: KRITIČNO (odmah)
1. ✅ Dashboard stats API (već optimizovano)
2. ⏳ Comparison API - eliminisati N+1
3. ⏳ Analytics APIs - dodati limite
4. ⏳ CRUD APIs - dodati paginaciju

### Faza 2: VISOKO (ova sedmica)
5. Kreirati repository pattern za sve modele
6. Dodati caching layer gdje ima smisla
7. Refaktorisati duplicate upite

### Faza 3: SREDNJE (slijedeća sedmica)
8. Optimizovati Reports APIs
9. Optimizovati Employees/Licenses APIs
10. Performance monitoring i alerting

---

## 📈 OČEKIVANI REZULTATI

| API Route | Prije | Poslije | Poboljšanje |
|-----------|-------|---------|-------------|
| Dashboard Stats | 72+ upita / 8-18s | 4 upita / 500ms | 95%+ |
| Comparison (30 dana) | 60+ upita / 5-10s | 5 upita / 800ms | 90%+ |
| Analytics Load Factor | 1 upit / hiljade redova | 1 upit / minimal podaci | 80%+ |
| Airlines List | 1 upit / svi podaci | 2 upita / paginirano | 70%+ |

---

## 🔧 IMPLEMENTIRANI ALATI

### 1. Flight Repository
**Fajl**: `src/lib/repositories/flight.repository.ts`

Centralizovane funkcije:
- `getFlightsPaginated()` - Sa paginacijom i select
- `getFlightsForAnalytics()` - Minimal polja za analytics
- `getFlightsCount()` - Brzi count
- `getPassengerAggregates()` - Agregacije
- `getAirlinesByIds()` - Batch fetch (anti-N+1)

### 2. Cache Layer
**Fajl**: `src/lib/cache.ts`

- In-memory cache sa TTL
- Automatsko čišćenje
- Cache TTL presets

---

## 📝 PLAN IMPLEMENTACIJE

### Dan 1-2:
- [x] Audit svih Prisma upita
- [x] Kreirati Flight repository
- [x] Optimizovati Dashboard Stats
- [ ] Optimizovati Comparison API
- [ ] Optimizovati Analytics APIs

### Dan 3-4:
- [ ] Dodati paginaciju svim CRUD APIs
- [ ] Kreirati repositories za Airline, AircraftType, etc.
- [ ] Testirati sve optimizacije

### Dan 5:
- [ ] Code review
- [ ] Performance testing
- [ ] Dokumentacija

---

## 🚀 KAKO TESTIRATI

```bash
# 1. Benchmark prije optimizacije
time curl http://localhost:3000/api/comparison?type=airlines&date1From=2024-01-01&date1To=2024-01-31&date2From=2024-02-01&date2To=2024-02-28

# 2. Primijeni optimizaciju
# 3. Benchmark poslije

# 4. Uporedi rezultate
```

**Očekivano poboljšanje**: 80-95% za većinu endpointa

---

**Zaključak**: Identificirano 21+ kritičnih i visokih problema. Implementacija optimizacija traje 3-5 dana. Očekivano poboljšanje performansi 80-95%.
