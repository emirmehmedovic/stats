# Sprintovi i Zadaci - Airport Stats System
**Verzija:** 3.0 (Complete - sa Advanced Analytics)

## 📅 Timeline Pregled - Kompletna Implementacija

### Osnovni Sistem (MVP)
- **Sprint 0:** Setup i inicijalizacija (1 sedmica)
- **Sprint 1-2:** Backend osnova i Database (2 sedmice)
- **Sprint 3-4:** Modul 1 - Letovi Core Features (2 sedmice)
- **Sprint 5-6:** Modul 1 - Izvještaji i Analytics (2 sedmice)
- **Sprint 7-8:** Modul 2 - Radnici i Licence (2 sedmice)
- **Sprint 9:** Testing, Bug fixing, Polish (1 sedmica)
- **Sprint 10:** Deployment i Dokumentacija (1 sedmica)

**MVP Trajanje:** ~10-12 sedmica (415 sati)

### Napredne Funkcionalnosti (v2.0)
- **Sprint 11:** Delay kodovi, Aerodromi i Data Governance (1-2 sedmice)
- **Sprint 12:** Advanced Analytics, Komparacije, Multi-Language Export (2-3 sedmice)

**Kompletno Trajanje:** ~14-17 sedmica (585+ sati)

---

## 📊 Ukupna Procjena - Svi Sprintovi

| Sprint | Fokus | Sati | Status |
|--------|-------|------|--------|
| Sprint 0 | Setup | 12h | MVP |
| Sprint 1 | Database & API | 25h | MVP |
| Sprint 2 | Import & List | 38h | MVP |
| Sprint 3 | Forms & Details | 33h | MVP |
| Sprint 4 | Dashboard & Reports | 35h | MVP |
| Sprint 5 | Advanced Reports | 42h | MVP |
| Sprint 6 | Analytics | 34h | MVP |
| Sprint 7 | Employees Core | 36h | MVP |
| Sprint 8 | Licenses | 49h | MVP |
| Sprint 9 | Testing & Polish | 60h | MVP |
| Sprint 10 | Deploy & Docs | 51h | MVP |
| **MVP Subtotal** | | **415h** | |
| Sprint 11 | Delay Codes & Airports | 50h | v2.0 |
| Sprint 12 | Advanced Analytics & i18n | 120h | v2.0 |
| **UKUPNO** | | **585h** | |

**Sa bufferom od 20%:** ~700 sati

**Realistična procjena:**
- MVP: 10-12 sedmica (full-time)
- Full system: 15-18 sedmica (full-time)

---

---

## Sprint 0: Inicijalizacija Projekta (Sedmica 1) ✅ COMPLETED

### Setup i Konfiguracija

- [x] **Task 0.1:** Inicijalizacija Next.js projekta ✅
  - [x] Manual project setup (package.json, tsconfig.json, next.config.ts)
  - [x] Konfiguracija TypeScript (strict mode)
  - [x] Setup ESLint
  - [x] Created layout.tsx, page.tsx, globals.css
  - **Procjena:** 2h | **Stvarno:** ~1.5h

- [x] **Task 0.2:** Instalacija osnovnih dependencies ✅
  ```bash
  # Core
  ✅ npm install prisma @prisma/client
  ✅ npm install zod react-hook-form @hookform/resolvers

  # UI
  ✅ npm install @radix-ui/react-* (dialog, dropdown-menu, label, select, slot, toast, tabs)
  ✅ npm install lucide-react
  ✅ npm install tailwindcss-animate
  ✅ npm install class-variance-authority clsx tailwind-merge

  # Data & Charts
  ✅ npm install recharts
  ✅ npm install @tanstack/react-table
  ✅ npm install date-fns

  # Excel
  ✅ npm install xlsx
  ```
  - **Procjena:** 1h | **Stvarno:** ~1h

- [x] **Task 0.3:** Setup PostgreSQL baze ✅
  - [x] Neon PostgreSQL cloud baza konfigurirana
  - [x] Connection string dodat u .env
  - [x] Testirana konekcija
  - **Procjena:** 2h | **Stvarno:** ~0.5h

- [x] **Task 0.4:** Prisma inicijalizacija ✅
  - [x] Kompletan Prisma schema kreiran (svih 12 modela)
  - [x] Konfiguracija `.env` fajla sa DATABASE_URL
  - [x] `npx prisma generate` - Prisma Client generisan
  - [x] `npx prisma migrate dev --name init` - Inicijalna migracija aplicirana
  - [x] lib/prisma.ts singleton kreiran
  - **Procjena:** 1h | **Stvarno:** ~1.5h

- [x] **Task 0.5:** Folder struktura ✅
  - [x] Kreirana kompletna folder struktura:
    - src/app (sa api podfoldovima)
    - src/components (ui, forms, charts, tables, layouts)
    - src/lib (utils.ts, prisma.ts, validators, formatters, email)
    - src/types (index.ts, models.ts, api.ts)
    - src/hooks
    - prisma/ (sa migrations/)
    - public/
  - [x] Setup `tsconfig paths` aliasa (@/*)
  - [x] Kreiranje osnovnih layout fajlova
  - **Procjena:** 2h | **Stvarno:** ~1h

- [x] **Task 0.6:** Tailwind i shadcn/ui setup ✅
  - [x] Tailwind CSS konfiguracija (tailwind.config.ts, postcss.config.mjs)
  - [x] globals.css sa CSS variables i Tailwind directives
  - [x] lib/utils.ts sa cn() helper funkcijom
  - [x] Osnovne shadcn/ui komponente kreirane:
    - Button ✅
    - Card ✅
    - Input ✅
    - Label ✅
  - **Procjena:** 3h | **Stvarno:** ~1.5h

- [ ] **Task 0.7:** Git setup 🔄 IN PROGRESS
  - [x] .gitignore kreiran
  - [ ] Initialize Git repository
  - [ ] Initial commit
  - [ ] Setup remote repository
  - **Procjena:** 1h | **Stvarno:** ~0.5h (do sada)

**Sprint 0 Status:** 6/7 taskova završeno (85.7%)
**Sprint 0 Ukupno:** ~12 sati | **Stvarno utrošeno:** ~7.5h

---

## Sprint 1: Database Schema i Osnovni API (Sedmica 2-3) ✅ COMPLETED

### Prisma Schema Development

- [x] **Task 1.1:** Kreiranje Prisma schema - Airline model ✅
  - [x] Definisanje `Airline` modela (urađeno u Sprint 0)
  - [x] Relacije
  - [x] Migracija aplicirana sa init migracijom
  - **Procjena:** 2h | **Stvarno:** 0h (Sprint 0)

- [x] **Task 1.2:** Kreiranje Prisma schema - AircraftType model ✅
  - [x] Definisanje `AircraftType` modela (urađeno u Sprint 0)
  - [x] Relacije
  - [x] Migracija aplicirana
  - **Procjena:** 2h | **Stvarno:** 0h (Sprint 0)

- [x] **Task 1.3:** Kreiranje Prisma schema - Flight model ✅
  - [x] Definisanje kompletnog `Flight` modela (urađeno u Sprint 0)
  - [x] Sve kolone (arrival/departure, airports, delays)
  - [x] Indexi za performanse (date, airlineId, route, airports)
  - [x] Migracija aplicirana
  - **Procjena:** 4h | **Stvarno:** 0h (Sprint 0)

- [x] **Task 1.4:** Kreiranje seed data ✅
  - [x] Seed skript za 5 aviolinija (Wizzair, Pegasus, AJet, Turkish, Ryanair)
  - [x] Seed skript za 5 tipova aviona (A320, A321, B738, CL650, A320neo)
  - [x] Seed za 6 aerodroma (TZL, FMM, BVA, SAW, IST, AYT)
  - [x] Seed za 9 delay kodova (Carrier, Weather, ATC, Reactionary)
  - [x] Seed za default user-a
  - [x] `prisma/seed.ts` kreiran
  - [x] tsx instaliran i konfigurisan
  - [x] Run seed: `npx prisma db seed` ✅
  - **Procjena:** 3h | **Stvarno:** ~2h

### Basic API Routes

- [x] **Task 1.5:** Prisma Client singleton ✅
  - [x] `lib/prisma.ts` kreiran (urađeno u Sprint 0)
  - [x] Konfiguracija client-a sa logging
  - [x] Singleton pattern za dev/prod
  - **Procjena:** 1h | **Stvarno:** 0h (Sprint 0)

- [x] **Task 1.6:** API: Airlines endpoints ✅
  - [x] GET `/api/airlines` - Lista sa search filter-om
  - [x] GET `/api/airlines/[id]` - Single sa flight count
  - [x] POST `/api/airlines` - Create
  - [x] PUT `/api/airlines/[id]` - Update
  - [x] DELETE `/api/airlines/[id]` - Delete (sa provjerom letova)
  - [x] Zod validacija schema (lib/validators/airline.ts)
  - [x] Error handling i validacija
  - **Procjena:** 4h | **Stvarno:** ~2h

- [x] **Task 1.7:** API: Aircraft types endpoints ✅
  - [x] GET `/api/aircraft-types` - Lista sa search filter-om
  - [x] GET `/api/aircraft-types/[id]` - Single sa flight count
  - [x] POST `/api/aircraft-types` - Create
  - [x] PUT `/api/aircraft-types/[id]` - Update
  - [x] DELETE `/api/aircraft-types/[id]` - Delete (sa provjerom letova)
  - [x] Zod validacija schema (lib/validators/aircraft-type.ts)
  - **Procjena:** 3h | **Stvarno:** ~1.5h

- [x] **Task 1.8:** API: Flights basic CRUD ✅
  - [x] GET `/api/flights` - List sa paginacijom i advanced filterima
  - [x] GET `/api/flights/[id]` - Single sa svim relacijama i delays
  - [x] POST `/api/flights` - Create sa svim poljima
  - [x] PUT `/api/flights/[id]` - Update (sa lock provjerom)
  - [x] DELETE `/api/flights/[id]` - Delete (sa lock provjerom)
  - [x] Kompleksna Zod validacija (lib/validators/flight.ts)
  - [x] Query param validacija za filtering
  - [x] Pagination support (page, limit, totalPages)
  - **Procjena:** 6h | **Stvarno:** ~3h

**Sprint 1 Status:** 8/8 taskova završeno (100%) ✅
**Sprint 1 Ukupno:** ~25 sati | **Stvarno utrošeno:** ~8.5h (brže zbog Prism schema iz Sprint 0!)

---

## Sprint 2: Flights Lista i Import (Sedmica 3-4)

> **NAPOMENA:** Import funkcionalnost (Excel/CSV) je sekundarna - primarna je forma za unos letova (Sprint 3).
> Međutim, import je koristan za bulk operacije i historijskih podataka.

### File Import Feature (Excel & CSV)

- [x] **Task 2.1:** Excel & CSV parser utility ✅
  - [x] `lib/parsers/excel.ts` - funkcije za parsiranje Excel fajlova
  - [x] `lib/parsers/csv.ts` - funkcije za parsiranje CSV fajlova
  - [x] Auto-detection tipa fajla (xlsx, xls, csv)
  - [x] Parsiranje 25+ kolona iz Excel strukture
  - [x] CSV delimiter detection (comma, semicolon, tab, pipe)
  - [x] Error handling za invalid data
  - [x] Quote handling u CSV-u
  - [x] Date/Number parsing sa validation
  - **Procjena:** 8h | **Stvarno:** ~2.5h

- [x] **Task 2.2:** Import API endpoint ✅
  - [x] POST `/api/flights/import`
  - [x] Upload Excel ili CSV fajla (formidable)
  - [x] Parsiranje i validacija
  - [x] Auto-create airlines/aircraft types
  - [x] Bulk insert u bazu (row-by-row sa error handling)
  - [x] Return success/error report (po redu)
  - [x] Support za različite formate datuma
  - [x] Dry-run mode (preview bez inserta - prvi 10 redova)
  - [x] dataSource tracking (IMPORT_EXCEL / IMPORT_CSV)
  - **Procjena:** 8h | **Stvarno:** ~2h

- [x] **Task 2.3:** Import UI - Upload component ✅
  - [x] File upload komponenta (FileUpload.tsx)
  - [x] Drag & drop za .xlsx, .xls, .csv
  - [x] Progress bar (loading state)
  - [x] Preview podataka prije importa (prvih 10 redova - ImportPreview.tsx)
  - [x] Auto format detection (Excel/CSV)
  - [x] File validation (size, format)
  - [x] 3-step wizard (upload → preview → results)
  - [x] Stats display (total, valid, invalid rows)
  - **Procjena:** 7h | **Stvarno:** ~3.5h

- [x] **Task 2.4:** Import UI - Validation errors display ✅
  - [x] Prikaz grešaka validacije po redu (ImportResults.tsx)
  - [x] Inline prikaz grešaka (tooltip on hover)
  - [x] Retry mechanizam (dugme "Pokušaj ponovo")
  - [x] Download error report (CSV format)
  - [x] Skip invalid rows opcija (automatski preskače)
  - [x] Success/Error visual indicators
  - [x] Error details sa row numbers
  - **Procjena:** 4h | **Stvarno:** ~2.5h

### Flights List Page

- [x] **Task 2.5:** GET `/api/flights` - sa paginacijom ✅
  - [x] Query params: page, limit, date, airline (već urađeno u Sprint 1)
  - [x] Sortiranje
  - [x] Return format sa metadata (total, pages)
  - [x] Advanced filteri (dateFrom, dateTo, route, operationType, search)
  - **Procjena:** 4h | **Stvarno:** 0h (Sprint 1)

- [x] **Task 2.6:** Flights list UI - Tabela ✅
  - [x] TanStack Table setup
  - [x] Kolone definition (date, airline, route, flight numbers, passengers, status)
  - [x] Responsive dizajn
  - [x] Row actions (view, edit, delete)
  - [x] Sorting po kolonama
  - [x] Loading states
  - [x] Stats cards (ukupno letova, stranica, prikazano, po stranici)
  - [x] Error state sa retry button
  - [x] Empty state handling
  - **Procjena:** 8h | **Stvarno:** ~3h

- [x] **Task 2.7:** Flights list UI - Filteri ✅
  - [x] Date range picker (from-to sa HTML5 date inputs)
  - [x] Airline filter dropdown (sa API fetch)
  - [x] Route search input
  - [x] Operation type filter (SCHEDULED/MEDEVAC/CHARTER)
  - [x] General search filter
  - [x] Clear filters button
  - [x] Active filters display sa individual remove buttons
  - [x] Filter pills sa visual indicators
  - **Procjena:** 6h | **Stvarno:** ~2.5h

- [x] **Task 2.8:** Pagination komponenta ✅
  - [x] Previous/Next buttons
  - [x] Page numbers (sa ellipsis za veliki broj stranica)
  - [x] Items per page selector (10, 20, 50, 100)
  - [x] Jump to page input sa Enter key support
  - [x] Total count display
  - [x] Responsive design
  - [x] Clean dashboard design (rounded-3xl, shadow-soft)
  - **Procjena:** 4h | **Stvarno:** ~1.5h

**Sprint 2 Status:** 8/8 taskova završeno (100%) ✅✅✅
**Sprint 2 Ukupno:** ~45 sati | **Stvarno utrošeno:** ~18h (svi taskovi završeni!)
**Komponente kreirane:**
- `lib/parsers/excel.ts` - Excel parser sa XLSX bibliotekom
- `lib/parsers/csv.ts` - CSV parser sa auto-delimiter detection
- `api/flights/import/route.ts` - Import API endpoint
- `components/flights/FlightsTable.tsx` - TanStack Table sa 9 kolona
- `components/flights/FlightsFilters.tsx` - Kompletan filter UI
- `components/ui/pagination.tsx` - Reusable pagination komponenta
- `components/import/FileUpload.tsx` - Drag & drop upload
- `components/import/ImportPreview.tsx` - Preview prije importa
- `components/import/ImportResults.tsx` - Results sa error reportom
- `app/flights/page.tsx` - Glavna lista letova
- `app/flights/import/page.tsx` - Import wizard stranica

---

## Sprint 3: Flight Details i Forms (Sedmica 5)

> **PRIORITET:** Forma za unos/izmjenu letova je PRIMARNA funkcionalnost!
> Većina unosa će biti kroz formu, import (Sprint 2) je samo za bulk operacije.

### Single Flight View

- [x] **Task 3.1:** Flight detail page ✅
  - [x] `/flights/[id]/page.tsx`
  - [x] Layout dizajn sa dashboard-ui.md smjernicama
  - [x] Prikaz svih informacija
  - [x] Akcije (Edit, Delete)
  - [x] Lock status warning
  - **Procjena:** 4h | **Stvarno:** ~2.5h

- [x] **Task 3.2:** Flight detail - Arrival section ✅
  - [x] Card komponenta sa arrival podacima
  - [x] Prikaz svih arrival podataka (flight number, times, passengers, baggage, cargo, mail)
  - [x] Delay calculation i prikaz sa color coding
  - [x] Status badge (OPERATED/CANCELLED/DIVERTED)
  - **Procjena:** 3h | **Stvarno:** ~1.5h (uključeno u 3.1)

- [x] **Task 3.3:** Flight detail - Departure section ✅
  - [x] Card komponenta sa departure podacima
  - [x] Departure podaci (identično kao arrival)
  - [x] Delay calculation sa color coding
  - [x] Status badge
  - **Procjena:** 3h | **Stvarno:** ~1h (uključeno u 3.1)

### Flight Forms

- [x] **Task 3.4:** Flight form - Setup React Hook Form ✅
  - [x] Zod schema za validaciju (koristi postojeći createFlightSchema)
  - [x] React Hook Form setup sa @hookform/resolvers/zod
  - [x] Form structure sa 4 sekcije
  - [x] Default values handling
  - [x] Error display za svako polje
  - **Procjena:** 4h | **Stvarno:** ~2h

- [x] **Task 3.5:** Flight form - Basic info fields ✅
  - [x] Date picker (HTML5 date input)
  - [x] Airline select (sa API fetch)
  - [x] Aircraft type select (sa API fetch)
  - [x] Route input
  - [x] Registration input
  - [x] Operation type select
  - [x] Available seats input
  - **Procjena:** 5h | **Stvarno:** ~2h (uključeno u 3.4)

- [x] **Task 3.6:** Flight form - Arrival fields ✅
  - [x] Flight number
  - [x] Scheduled time (datetime-local)
  - [x] Actual time (datetime-local)
  - [x] Passengers count
  - [x] Infants count
  - [x] Baggage, cargo, mail weights
  - [x] Status select
  - **Procjena:** 4h | **Stvarno:** ~1.5h (uključeno u 3.4)

- [x] **Task 3.7:** Flight form - Departure fields ✅
  - [x] Sva departure polja (identično kao arrival)
  - [x] Validacija za sve numerical fields
  - [x] Error messages sa Zod
  - [x] Operational details (handling agent, stand, gate)
  - **Procjena:** 4h | **Stvarno:** ~1h (uključeno u 3.4)

- [x] **Task 3.8:** Create flight page ✅
  - [x] `/flights/new/page.tsx`
  - [x] Integracija FlightForm komponente
  - [x] Submit handling sa POST /api/flights
  - [x] Success redirect na /flights
  - [x] Error notifications
  - [x] Loading states
  - **Procjena:** 3h | **Stvarno:** ~1.5h

- [x] **Task 3.9:** Edit flight page ✅
  - [x] `/flights/[id]/edit/page.tsx`
  - [x] Load existing data sa GET /api/flights/[id]
  - [x] Populate forme sa postojećim podacima
  - [x] Update functionality sa PUT /api/flights/[id]
  - [x] Loading states
  - [x] Error handling
  - **Procjena:** 3h | **Stvarno:** ~2h

**Sprint 3 Status:** 9/9 taskova završeno (100%) ✅✅✅
**Sprint 3 Ukupno:** ~33 sata | **Stvarno utrošeno:** ~14h (58% brže!)
**Komponente kreirane:**
- `components/flights/FlightForm.tsx` - Kompletan form sa 40+ polja
- `app/flights/new/page.tsx` - Create flight stranica
- `app/flights/[id]/edit/page.tsx` - Edit flight stranica
- `app/flights/[id]/page.tsx` - Flight detail view
- Ažurirano: `components/flights/FlightsTable.tsx` - Funkcionalne akcije
- Ažurirano: `app/flights/page.tsx` - Link ka "Dodaj let"

---

## Sprint 4: Dashboard i Basic Reports (Sedmica 6)

### Dashboard

- [x] **Task 4.1:** Dashboard layout ✅
  - [x] `/dashboard/page.tsx`
  - [x] Grid layout za stats cards (4 cards)
  - [x] Responsive design (1 col mobile → 4 col desktop)
  - **Procjena:** 3h | **Stvarno:** ~2h

- [x] **Task 4.2:** Stats cards komponente ✅
  - [x] Today's flights card
  - [x] Total passengers today
  - [x] Active airlines (last 30 days)
  - [x] Average load factor
  - **Procjena:** 4h | **Stvarno:** ~1.5h (uključeno u 4.1)

- [x] **Task 4.3:** API: Dashboard statistics ✅
  - [x] GET `/api/dashboard/stats`
  - [x] Aggregacija podataka (today, 30 days)
  - [x] Optimizacija query-ja sa groupBy
  - [x] Flights per day data
  - [x] Top airlines data
  - [x] Operation types distribution
  - **Procjena:** 5h | **Stvarno:** ~2.5h

- [x] **Task 4.4:** Flights per day chart ✅
  - [x] Recharts Line chart
  - [x] Last 30 days data
  - [x] Tooltip formatting sa datumom
  - [x] Custom styling (brand primary color)
  - **Procjena:** 4h | **Stvarno:** ~1.5h (uključeno u 4.1)

- [x] **Task 4.5:** Top airlines bar chart ✅
  - [x] Recharts Bar chart
  - [x] Top 5 airlines by flight count
  - [x] Colors i styling (brand colors)
  - [x] Custom tooltip sa punim imenom
  - **Procjena:** 3h | **Stvarno:** ~1h (uključeno u 4.1)

- [x] **Task 4.6:** Operation types pie chart ✅
  - [x] Recharts Pie chart
  - [x] SCHEDULED vs MEDEVAC vs CHARTER
  - [x] Percentage labels
  - [x] Custom legend sa prevedenim nazivima
  - **Procjena:** 3h | **Stvarno:** ~1.5h (uključeno u 4.1)

### Daily Report

- [x] **Task 4.7:** API: Daily report ✅
  - [x] GET `/api/reports/daily?date=YYYY-MM-DD`
  - [x] Aggregacija svih letova za dan
  - [x] Totals calculation (arrival, departure, combined)
  - [x] By airline statistics
  - **Procjena:** 4h | **Stvarno:** ~2h

- [x] **Task 4.8:** Daily report page ✅
  - [x] `/reports/daily/page.tsx`
  - [x] Date picker za odabir datuma
  - [x] Tabela sa svim letovima
  - [x] Summary cards (4 cards)
  - [x] Detailed totals (arrival/departure)
  - [x] By airline table
  - **Procjena:** 5h | **Stvarno:** ~3h

- [x] **Task 4.9:** Export to Excel functionality ✅
  - [x] Export button
  - [x] Generisanje Excel fajla (xlsx library)
  - [x] 3 sheets (Summary, Flights, By Airline)
  - [x] Download funkcionalnost
  - [x] Formatirani naziv fajla sa datumom
  - **Procjena:** 4h | **Stvarno:** ~1.5h (uključeno u 4.8)

**Sprint 4 Status:** 9/9 taskova završeno (100%) ✅✅✅
**Sprint 4 Ukupno:** ~35 sati | **Stvarno utrošeno:** ~15h (57% brže!)
**Komponente kreirane:**
- `api/dashboard/stats/route.ts` - Dashboard statistics API
- `api/reports/daily/route.ts` - Daily report API
- `app/dashboard/page.tsx` - Dashboard sa 3 Recharts grafika
- `app/reports/daily/page.tsx` - Daily report sa Excel exportom

---

## Sprint 5: Advanced Reports (Sedmica 7) ✅ COMPLETED

### Monthly Report

- [x] **Task 5.1:** API: Monthly report ✅
  - [x] GET `/api/reports/monthly?year=YYYY&month=MM`
  - [x] Daily breakdown (eachDayOfInterval)
  - [x] Monthly totals (arrival, departure, combined)
  - [x] By airline statistics (sorted by flight count)
  - [x] Top 10 routes analysis
  - **Procjena:** 6h | **Stvarno:** ~2.5h

- [x] **Task 5.2:** Monthly report page ✅
  - [x] `/reports/monthly/page.tsx`
  - [x] Month/Year picker (dropdown + number input)
  - [x] Daily stats table (all days in month)
  - [x] Charts (trend line chart, by airline bar chart)
  - [x] Summary cards (4 cards)
  - [x] Excel export sa 4 sheets
  - **Procjena:** 6h | **Stvarno:** ~3h

- [x] **Task 5.3:** Top routes analysis ✅
  - [x] Calculation logic (uključeno u API)
  - [x] Visualization (tabla sa top 10)
  - [x] Sortiranje po broju letova
  - **Procjena:** 4h | **Stvarno:** ~0.5h (integrisano u 5.1 i 5.2)

### Yearly Report

- [x] **Task 5.4:** API: Yearly report ✅
  - [x] GET `/api/reports/yearly?year=YYYY`
  - [x] Monthly breakdown (all 12 months)
  - [x] YoY comparison sa growth % (flights, passengers, cargo)
  - [x] Totals (arrival, departure, combined)
  - [x] Seasonal analysis (quarterly aggregation)
  - [x] By airline statistics
  - **Procjena:** 5h | **Stvarno:** ~2.5h

- [x] **Task 5.5:** Yearly report page ✅
  - [x] `/reports/yearly/page.tsx`
  - [x] Year selector (number input)
  - [x] Monthly comparison table sa totals row
  - [x] Seasonal analysis bar chart (kvartali)
  - [x] Monthly trend line chart
  - [x] YoY comparison cards (3 cards sa growth %)
  - [x] Excel export sa 5 sheets (uključujući YoY)
  - **Procjena:** 5h | **Stvarno:** ~3.5h

### Custom Report

- [x] **Task 5.6:** API: Custom report ✅
  - [x] POST `/api/reports/custom`
  - [x] Flexible filters (date range, airlines array, routes array, operationType)
  - [x] Dynamic aggregations (groupBy: day, airline, route, operationType)
  - [x] WHERE clause builder sa Prisma
  - [x] Returns first 100 flights + totals + grouped data
  - **Procjena:** 6h | **Stvarno:** ~2.5h

- [x] **Task 5.7:** Custom report page ✅
  - [x] `/reports/custom/page.tsx`
  - [x] Filter builder UI (comprehensive)
  - [x] Date range picker (from - to)
  - [x] Multiple selection filters (airlines chips, routes scrollable)
  - [x] Operation type dropdown
  - [x] Group by selector
  - [x] Generate report button
  - [x] Clear all filters buttons
  - **Procjena:** 6h | **Stvarno:** ~4h

- [x] **Task 5.8:** Custom report results display ✅
  - [x] Results table (grouped data)
  - [x] Dynamic charts based on groupBy selection:
    - Line chart za daily grouping
    - Pie chart za operationType grouping
    - Bar chart za airline/route grouping
  - [x] Export options (Excel sa 2 sheets)
  - [x] Summary cards (4 cards)
  - **Procjena:** 4h | **Stvarno:** ~3h (integrisano u 5.7)

**Sprint 5 Status:** 8/8 taskova završeno (100%) ✅✅✅
**Sprint 5 Ukupno:** ~42 sata | **Stvarno utrošeno:** ~21h (50% brže!)
**Komponente kreirane:**
- `api/reports/monthly/route.ts` - Monthly report API sa top routes
- `api/reports/yearly/route.ts` - Yearly report API sa YoY i seasonal
- `api/reports/custom/route.ts` - Custom report API sa dynamic grouping
- `app/reports/monthly/page.tsx` - Monthly report sa charts i Excel export
- `app/reports/yearly/page.tsx` - Yearly report sa seasonal analysis
- `app/reports/custom/page.tsx` - Custom report sa filter builder

---

## Sprint 6: Analytics Features (Sedmica 8) ✅ COMPLETED

### Load Factor Analysis

- [x] **Task 6.1:** API: Load factor calculation ✅
  - [x] GET `/api/analytics/load-factor`
  - [x] Per flight calculation
  - [x] Average by airline
  - [x] Trend over time
  - [x] Daily breakdown
  - [x] Summary statistics
  - **Procjena:** 5h | **Stvarno:** ~2h

- [x] **Task 6.2:** Load factor page ✅
  - [x] `/analytics/load-factor/page.tsx`
  - [x] Filters (date range, airline)
  - [x] Visualization (line chart + bar chart)
  - [x] Table with details
  - [x] Summary cards (4 cards)
  - [x] Excel export (3 sheets)
  - [x] Color coding za load factor
  - **Procjena:** 6h | **Stvarno:** ~3h

### Punctuality Analysis

- [x] **Task 6.3:** API: Punctuality metrics ✅
  - [x] GET `/api/analytics/punctuality`
  - [x] Delay calculation (arrival & departure)
  - [x] On-time performance percentage (OTP)
  - [x] By airline breakdown
  - [x] Delay distribution (0-15, 15-30, 30-60, 60+ min)
  - [x] Daily trend
  - **Procjena:** 6h | **Stvarno:** ~2.5h

- [x] **Task 6.4:** Punctuality page ✅
  - [x] `/analytics/punctuality/page.tsx`
  - [x] Filters (date range, airline)
  - [x] Charts (delays distribution, on-time % trend, by airline)
  - [x] Worst performers table
  - [x] Summary cards (4 cards)
  - [x] Excel export (4 sheets)
  - **Procjena:** 6h | **Stvarno:** ~3.5h

### Route Analysis

- [x] **Task 6.5:** API: Route statistics ✅
  - [x] GET `/api/analytics/routes`
  - [x] Frequency by route
  - [x] Average passengers per route
  - [x] Most profitable routes (by passenger count)
  - [x] Load factor per route
  - [x] Average delays per route
  - [x] By destination aggregation
  - [x] Airlines per route count
  - **Procjena:** 5h | **Stvarno:** ~2h

- [x] **Task 6.6:** Route analysis page ✅
  - [x] `/analytics/routes/page.tsx`
  - [x] Top routes table (detailed)
  - [x] Bar chart (frequency + passengers)
  - [x] Pie chart (destinations)
  - [x] Filters (date range, airline, limit)
  - [x] Summary cards (4 cards)
  - [x] Best/Worst route highlights
  - [x] Excel export (3 sheets)
  - **Procjena:** 6h | **Stvarno:** ~3h

### Bonus Features (Dodato)

- [x] **Task 6.7:** Navigation & Landing Pages ✅
  - [x] `/analytics/page.tsx` - Analytics hub sa 3 modula
  - [x] Konzistentna navigacija kroz sve stranice
  - **Procjena:** N/A | **Stvarno:** ~1h

### Dashboard Layout & UI Infrastructure (Dodatno uradio)

- [x] **Task 6.8:** Sidebar Navigation Component ✅
  - [x] `components/layouts/Sidebar.tsx` - Fiksni sidebar (w-64)
  - [x] Hijerarhijska navigacija sa expand/collapse
  - [x] HOME sekcija: Dashboard, Analytics, Izvještaji, Letovi
  - [x] MANAGEMENT sekcija: Aviokompanije, Radnici
  - [x] Active state highlighting (plava pozadina)
  - [x] Smooth hover efekti i transitions
  - [x] Logo i branding na vrhu
  - [x] "Trebate pomoć?" sekcija
  - [x] Postavke u footer-u
  - **Procjena:** N/A | **Stvarno:** ~3h

- [x] **Task 6.9:** Header Component ✅
  - [x] `components/layouts/Header.tsx` - Fiksni header (h-20)
  - [x] Search bar sa ikonom
  - [x] Notification bell sa indicator-om
  - [x] Date display card
  - [x] Calendar button
  - [x] User profile dropdown menu
  - [x] Logout funkcionalnost
  - [x] Dynamic user name display
  - **Procjena:** N/A | **Stvarno:** ~2h

- [x] **Task 6.10:** Dashboard Layout Wrapper ✅
  - [x] `components/layouts/DashboardLayout.tsx`
  - [x] Kombinacija Sidebar + Header + Content
  - [x] Auth check integracija
  - [x] Layout fajlovi za sve sekcije:
    - `/dashboard/layout.tsx`
    - `/analytics/layout.tsx`
    - `/reports/layout.tsx`
    - `/flights/layout.tsx`
  - **Procjena:** N/A | **Stvarno:** ~1h

- [x] **Task 6.11:** Authentication System ✅
  - [x] Login page (`/page.tsx`) - moderan dizajn
  - [x] Email + Password forma sa validacijom
  - [x] Show/Hide password toggle
  - [x] Loading states sa spinner-om
  - [x] Demo mode (prihvaća bilo koji email/password)
  - [x] localStorage session management
  - [x] `components/AuthCheck.tsx` - Route protection
  - [x] `middleware.ts` - Server-side protection (priprema)
  - [x] Logout funkcionalnost u Header dropdown-u
  - [x] Automatic redirect na `/dashboard` nakon logina
  - **Procjena:** N/A | **Stvarno:** ~2.5h

- [x] **Task 6.12:** Dashboard Page Redesign ✅
  - [x] Novi moderan dizajn dashboard-a
  - [x] Stats cards sa trend indicators (+12%, +8%)
  - [x] Ikone za svaku karticu (Plane, Users, Building2, Activity)
  - [x] Poboljšani charts sa boljim styling-om
  - [x] Breadcrumb navigacija
  - [x] Donut pie chart umjesto regular pie
  - [x] Responsive grid layout
  - **Procjena:** N/A | **Stvarno:** ~2h

- [x] **Task 6.13:** Bug Fixes & Encoding Issues ✅
  - [x] Ispravljeni svi specijalni karakteri (č, ć, š, ž)
  - [x] Fixed unterminated strings u više fajlova
  - [x] Tipfeleri ispravljeni (aviokkompanije → aviokompanije)
  - [x] Reports pages encoding fixes
  - **Procjena:** N/A | **Stvarno:** ~1h

**Sprint 6 Status:** 13/13 taskova završeno (100%) ✅✅✅
**Sprint 6 Ukupno (sa dodatkom):** ~34 sata + ~11.5h dodatno = **45.5h** | **Stvarno utrošeno:** ~28.5h
**Komponente kreirane:**

**Analytics API & UI:**
- `api/analytics/load-factor/route.ts` - Load Factor API (215 linija)
- `api/analytics/punctuality/route.ts` - Punctuality API (272 linije)
- `api/analytics/routes/route.ts` - Routes API (250+ linija)
- `app/analytics/load-factor/page.tsx` - Load Factor UI (390 linija)
- `app/analytics/punctuality/page.tsx` - Punctuality UI (442 linije)
- `app/analytics/routes/page.tsx` - Routes UI (400+ linija)
- `app/analytics/page.tsx` - Analytics landing page (150+ linija)

**Layout Infrastructure:**
- `components/layouts/Sidebar.tsx` - Sidebar navigacija (180+ linija)
- `components/layouts/Header.tsx` - Header komponenta (120+ linija)
- `components/layouts/DashboardLayout.tsx` - Layout wrapper
- `components/AuthCheck.tsx` - Auth protection komponenta
- `middleware.ts` - Server-side middleware

**Authentication:**
- `app/page.tsx` - Login page (170+ linija)
- Logout funkcionalnost u Header-u

**Pages Updated:**
- `app/dashboard/page.tsx` - Redizajniran dashboard
- `app/reports/daily/page.tsx` - Layout i encoding fixes
- Layout fajlovi za sve glavne sekcije

**Ukupno linija koda u Sprint 6:** ~3,500+ linija

**Design Improvements:**
- Konzistentan design system (rounded-2xl, shadow-sm, border-slate-200)
- Moderna color palette (blue, green, purple, orange)
- Hover efekti i transitions na svim komponentama
- Active state highlighting u navigaciji
- Responsive grid layouts

---

## Sprint 7: Employee Module - Core (Sedmica 9) ✅ COMPLETED

### Database Schema - Employees

- [x] **Task 7.1-7.3:** Prisma schema - Employee, License, LicenseDocument modeli ✅
  - [x] Employee model (već kreiran u Sprint 0)
  - [x] License model sa relacijama
  - [x] LicenseDocument model
  - [x] LicenseNotification model
  - [x] Svi indexi i relacije
  - **Procjena:** 6h | **Stvarno:** 0h (već urađeno u Sprint 0)

### Employee API

- [x] **Task 7.4:** API: Employees CRUD ✅
  - [x] GET `/api/employees` - List sa filterima (search, status, department)
  - [x] GET `/api/employees/[id]` - Single sa licencama i statistikama
  - [x] POST `/api/employees` - Create sa validacijom
  - [x] PUT `/api/employees/[id]` - Update sa provjerom duplikata
  - [x] DELETE `/api/employees/[id]` - Soft delete (status INACTIVE)
  - [x] Zod validacija schema (`lib/validators/employee.ts`)
  - [x] Pagination support
  - [x] License statistics calculation
  - **Procjena:** 6h | **Stvarno:** ~3h

- [ ] **Task 7.5-7.6:** File upload & Photo upload ⏸️
  - [ ] File upload setup (odgođeno - nije prioritet)
  - [ ] Photo upload API
  - [ ] Image processing
  - **Procjena:** 8h | **Status:** SKIP za sada (koristimo inicijale za avatar)

### Employee List Page

- [x] **Task 7.7:** Employees list UI ✅
  - [x] `/employees/page.tsx` - moderna card-based lista
  - [x] Card layout (umjesto tabele) - pregledniji dizajn
  - [x] Filtering po department-u i statusu
  - [x] Search po imenu, email-u, broju radnika
  - [x] Real-time filtering
  - [x] Stats cards (4 kartice):
    - Ukupno radnika
    - Aktivnih
    - Na odsustvu
    - Ukupno licenci
  - **Procjena:** 6h | **Stvarno:** ~3.5h

- [x] **Task 7.8:** Employee card component ✅
  - [x] Avatar sa inicijalima (gradijent pozadina)
  - [x] Ime, prezime, pozicija
  - [x] Status badge sa ikonom (Aktivan/Neaktivan/Na odsustvu)
  - [x] Email, telefon, department info
  - [x] License statistics (X/Y aktivnih)
  - [x] Expiring licenses warning (narandžasti badge)
  - [x] Hover efekti i smooth transitions
  - [x] Click to details (navigacija na `/employees/[id]`)
  - **Procjena:** 4h | **Stvarno:** ~1.5h (uključeno u 7.7)

- [x] **Task 7.9:** Add employee form ✅
  - [x] `/employees/new/page.tsx` - kreiranje novog radnika
  - [x] 2 sekcije forma:
    - Osnovne informacije (broj, ime, prezime, email, telefon, JMBG, datum rođenja, status)
    - Informacije o zaposlenju (datum zaposlenja, pozicija, odjel)
  - [x] All required fields sa validacijom
  - [x] Status selector dropdown
  - [x] Department selector dropdown
  - [x] Submit handling sa POST /api/employees
  - [x] Loading states sa spinner-om
  - [x] Error handling i display
  - [x] Success redirect na employees list
  - [x] Cancel button (back navigation)
  - **Procjena:** 6h | **Stvarno:** ~2.5h

**Sprint 7 Status:** 6/9 taskova završeno (67%) - Photo upload preskočen za sada ✅
**Sprint 7 Ukupno:** ~36 sati | **Stvarno utrošeno:** ~10.5h (bez photo upload-a)
**Komponente kreirane:**
- `lib/validators/employee.ts` - Zod validation schemas
- `api/employees/route.ts` - List & Create endpoints (160+ linija)
- `api/employees/[id]/route.ts` - Get, Update, Delete endpoints (170+ linija)
- `app/employees/layout.tsx` - Layout wrapper
- `app/employees/page.tsx` - Employees list sa cards (280+ linija)
- `app/employees/new/page.tsx` - Add employee form (240+ linija)

**Design Features:**
- Card-based UI umjesto table (moderniji pristup)
- Avatar sa gradijentom i inicijalima
- Status badges sa ikonama i color coding
- Real-time search i filtering
- Stats cards sa ikonama
- Responsive grid layout (1 → 2 → 3 kolone)
- Smooth hover transitions

---

## Sprint 8: Licenses Module (Sedmica 10) ✅ COMPLETED (MVP)

### License Management

- [x] **Task 8.1:** API: Licenses CRUD ✅
  - [x] GET `/api/employees/[id]/licenses` - Lista licenci za radnika
  - [x] POST `/api/employees/[id]/licenses` - Kreiranje nove licence
  - [x] GET `/api/licenses/[id]` - Detalji licence
  - [x] PUT `/api/licenses/[id]` - Ažuriranje licence
  - [x] DELETE `/api/licenses/[id]` - Brisanje licence
  - [x] Zod validacija (`lib/validators/license.ts`)
  - **Procjena:** 5h | **Stvarno:** ~2.5h

- [x] **Task 8.2:** API: License documents ✅
  - [x] POST `/api/licenses/[id]/documents` - Upload sa validacijom (PDF, JPG, PNG, max 10MB)
  - [x] GET `/api/licenses/[id]/documents` - Lista dokumenata za licencu
  - [x] GET `/api/documents/[id]` - Download dokumenta sa proper headers
  - [x] DELETE `/api/documents/[id]` - Delete dokumenta (fajl + database record)
  - [x] File storage u `public/uploads/documents/`
  - [x] Unique filename generation (timestamp + sanitized name)
  - [x] File type i size validation
  - **Procjena:** 4h | **Stvarno:** ~2.5h

- [x] **Task 8.3:** Employee profile page ✅
  - [x] `/employees/[id]/page.tsx` - Kompletan profil
  - [x] Tabs: Overview, Licenses
  - [x] Avatar sa inicijalima
  - [x] Basic info (email, telefon, department, datum zaposlenja)
  - [x] Edit button (navigacija na edit page)
  - [x] Stats cards (aktivne licence, ističu, ukupno)
  - **Procjena:** 6h | **Stvarno:** ~3h

- [x] **Task 8.4:** Licenses tab ✅
  - [x] License cards sa svim informacijama
  - [x] Status indicators (active, expiring, expired) sa color coding
  - [x] Add license button (otvara modal)
  - [x] Edit button na svakoj licenci (otvara Edit modal)
  - [x] Delete functionality (u Edit modal-u sa confirmation)
  - [x] Datumi izdavanja i isteka
  - [x] Izdavač i pozicija info
  - [x] **LicenseDocuments komponenta** - Upload, prikaz, download, delete dokumenata
  - [x] File upload sa drag & drop support
  - [x] Document list sa ikonama i file size
  - [x] Download i Delete buttons za svaki dokument
  - [x] Toast notifications za sve akcije
  - **Procjena:** 6h | **Stvarno:** ~4h

- [x] **Task 8.5:** Add/Edit license form ✅
  - [x] Add License Modal (`components/employees/AddLicenseModal.tsx`)
  - [x] Edit License Modal (`components/employees/EditLicenseModal.tsx`)
  - [x] All fields (tip, broj, datumi, izdavač, status, pozicija)
  - [x] Date pickers (HTML5 date inputs)
  - [x] Validacija i error handling
  - [x] Auto-refresh nakon kreiranja/ažuriranja
  - [x] Status selector dropdown
  - [x] Delete functionality u Edit modal-u
  - [x] Toast notifications za success/error
  - **Procjena:** 6h | **Stvarno:** ~4h

- [x] **Task 8.6:** License detail view ✅
  - [x] Full license information prikazano u card-u
  - [x] Edit button na svakoj licenci
  - [x] Delete button u Edit modal-u
  - [x] Sve informacije vidljive (izdato, ističe, izdavač, pozicija)
  - [x] **Dokumenti sekcija** sa upload, list, download, delete funkcionalnostima
  - [x] File preview sa ikonama (PDF, image)
  - [x] File size i upload date display
  - [x] Status badges sa color coding
  - **Procjena:** 5h | **Stvarno:** ~2h (uključeno u 8.4)

### Notifications System

- [x] **Task 8.7:** Cron job za provjeru isteka ✅
  - [x] API endpoint `/api/cron/check-licenses` (za pozivanje iz cron job-a)
  - [x] API endpoint `/api/notifications/check-expiring` (za ručno pozivanje)
  - [x] Automatska provjera licenci koje ističu (60, 30, 15 dana)
  - [x] Kreiranje notification records u bazi
  - [x] Authorization sa CRON_SECRET za sigurnost
  - **Procjena:** 4h | **Stvarno:** ~2h

- [ ] **Task 8.8:** Email service setup ⏸️
  - [ ] Nodemailer configuration
  - [ ] Email template za license expiry
  - [ ] Sending logic
  - **Procjena:** 5h | **Status:** Preskočeno za sada (može se dodati kasnije)

- [x] **Task 8.9:** In-app notifications ✅
  - [x] NotificationsDropdown komponenta (`components/notifications/NotificationsDropdown.tsx`)
  - [x] Notification bell u Header-u sa unread count
  - [x] Dropdown sa listom notifikacija
  - [x] Mark as read functionality (PUT `/api/notifications/[id]`)
  - [x] Click na notifikaciju → navigacija na employee profile
  - [x] Auto-refresh svakih 30 sekundi
  - [x] Color coding po urgency (crveno ≤7 dana, narandžasto ≤15, žuto >15)
  - [x] GET `/api/notifications` - Lista sa filterima
  - **Procjena:** 5h | **Stvarno:** ~3h

- [x] **Task 8.10:** Expiring licenses dashboard widget ✅
  - [x] ExpiringLicensesWidget komponenta (`components/dashboard/ExpiringLicensesWidget.tsx`)
  - [x] Widget na dashboard-u (desna kolona)
  - [x] Lista top 5 licenci koje ističu
  - [x] Link na employee profile
  - [x] "Vidi sve" link na employees page
  - [x] Empty state kada nema licenci koje ističu
  - [x] Urgency indicators (color coding)
  - **Procjena:** 3h | **Stvarno:** ~2h

**Sprint 8 Status:** 9/10 taskova završeno (90% - sve osim email servisa) ✅✅✅
**Sprint 8 Ukupno:** ~49 sati | **Stvarno utrošeno:** ~24.5h
**Komponente kreirane:**
- `lib/validators/license.ts` - Zod validation schemas
- `api/employees/[id]/licenses/route.ts` - List & Create endpoints (120+ linija)
- `api/licenses/[id]/route.ts` - Get, Update, Delete endpoints (150+ linija)
- `api/licenses/[id]/documents/route.ts` - Upload & List documents (140+ linija)
- `api/documents/[id]/route.ts` - Download & Delete documents (80+ linija)
- `app/employees/[id]/page.tsx` - Employee profile sa tabs (450+ linija)
- `components/employees/AddLicenseModal.tsx` - Add license modal (200+ linija)
- `components/employees/EditLicenseModal.tsx` - Edit & Delete license modal (250+ linija)
- `components/employees/LicenseDocuments.tsx` - Document upload/list/download/delete (200+ linija)
- `api/notifications/check-expiring/route.ts` - Check expiring licenses (100+ linija)
- `api/notifications/route.ts` - List notifications (80+ linija)
- `api/notifications/[id]/route.ts` - Mark as read & Delete (60+ linija)
- `api/cron/check-licenses/route.ts` - Cron job endpoint (120+ linija)
- `components/notifications/NotificationsDropdown.tsx` - Notification dropdown (200+ linija)
- `components/dashboard/ExpiringLicensesWidget.tsx` - Dashboard widget (150+ linija)

**File Storage:**
- `public/uploads/documents/` - Direktorij za čuvanje dokumenata
- Unique filename generation (timestamp + sanitized name)
- File validation (type, size)

**Notifications System:**
- Automatska provjera licenci koje ističu (60, 30, 15 dana prije)
- In-app notifications sa dropdown-om
- Dashboard widget sa expiring licenses
- Mark as read funkcionalnost
- Auto-refresh svakih 30 sekundi

**Preskočeno:**
- Task 8.8: Email service setup (može se dodati kasnije)

---

## Sprint 9: Testing, Polish & Bug Fixing (Sedmica 11) 🔄 IN PROGRESS

### Testing ⏸️ (Preskočeno - radit će se kasnije)

- [ ] **Task 9.1-9.3:** Testing ⏸️
  - [ ] Unit testovi - Utility funkcije
  - [ ] API Integration tests
  - [ ] E2E testovi - Critical flows
  - **Procjena:** 22h | **Status:** Preskočeno - radit će se kasnije

### UI Polish

- [x] **Task 9.4:** Responsive design fixes ✅
  - [x] Mobile view adjustments (grid layouts responsive)
  - [x] Tablet optimization
  - [x] Sidebar i header responsive (fixed za desktop)
  - **Procjena:** 6h | **Stvarno:** ~1h (već responsive u većini komponenti)

- [x] **Task 9.5:** Loading states ✅
  - [x] Reusable LoadingSpinner komponenta (`components/ui/loading.tsx`)
  - [x] LoadingSkeleton komponenta
  - [x] Konzistentni loading states kroz aplikaciju
  - [x] Proper async handling
  - **Procjena:** 4h | **Stvarno:** ~1.5h

- [x] **Task 9.6:** Error handling i messages ✅
  - [x] Reusable ErrorDisplay komponenta (`components/ui/error.tsx`)
  - [x] Toast notification sistem (`components/ui/toast.tsx`)
  - [x] ToastContainer integrisan u DashboardLayout
  - [x] User-friendly error messages
  - [x] Retry i Back buttons u error display-u
  - **Procjena:** 4h | **Stvarno:** ~2h

- [ ] **Task 9.7:** Accessibility improvements ⏸️
  - [ ] Keyboard navigation
  - [ ] ARIA labels
  - [ ] Focus management
  - **Procjena:** 4h | **Status:** Preskočeno za sada (može se dodati kasnije)

### Bug Fixing

- [ ] **Task 9.8:** Bug fixing session 1
  - [ ] Fix reported bugs
  - [ ] Edge case handling
  - **Procjena:** 8h

- [ ] **Task 9.9:** Bug fixing session 2
  - [ ] Additional fixes
  - [ ] Performance optimizations
  - **Procjena:** 8h

- [ ] **Task 9.10:** Final QA
  - [ ] Full system test
  - [ ] User acceptance testing
  - **Procjena:** 4h

**Sprint 9 Ukupno:** ~60 sati

---

## Sprint 10: Deployment & Documentation (Sedmica 12)

### Authentication

- [ ] **Task 10.1:** NextAuth.js setup
  - [ ] Configuration
  - [ ] Credentials provider
  - [ ] Session handling
  - **Procjena:** 4h

- [ ] **Task 10.2:** User management
  - [ ] User model u bazi
  - [ ] Admin panel za usere (basic)
  - **Procjena:** 4h

- [ ] **Task 10.3:** Route protection
  - [ ] Middleware za protected routes
  - [ ] Role-based access control
  - **Procjena:** 3h

### Deployment

- [ ] **Task 10.4:** Production environment setup
  - [ ] Server provisioning
  - [ ] PostgreSQL production setup
  - [ ] Environment variables
  - **Procjena:** 4h

- [ ] **Task 10.5:** Build i deploy aplikacije
  - [ ] Production build
  - [ ] Deploy na server
  - [ ] Nginx configuration
  - [ ] SSL setup
  - **Procjena:** 6h

- [ ] **Task 10.6:** Backup setup
  - [ ] Database backup script
  - [ ] File backup script
  - [ ] Cron jobs za automatic backups
  - **Procjena:** 3h

- [ ] **Task 10.7:** Monitoring setup
  - [ ] Log setup
  - [ ] Error tracking (opciono)
  - [ ] Uptime monitoring
  - **Procjena:** 3h

### Documentation

- [ ] **Task 10.8:** API dokumentacija
  - [ ] OpenAPI/Swagger documentation
  - [ ] Postman collection
  - **Procjena:** 4h

- [ ] **Task 10.9:** User manual
  - [ ] How to use guide
  - [ ] Screenshots
  - [ ] Common workflows
  - **Procjena:** 6h

- [ ] **Task 10.10:** Technical documentation
  - [ ] Architecture overview
  - [ ] Database schema diagram
  - [ ] Deployment guide
  - [ ] Development setup guide
  - **Procjena:** 6h

- [ ] **Task 10.11:** README.md
  - [ ] Project description
  - [ ] Installation instructions
  - [ ] Usage examples
  - **Procjena:** 2h

### Final Steps

- [ ] **Task 10.12:** Training session
  - [ ] Demo aplikacije
  - [ ] Q&A
  - [ ] Feedback collection
  - **Procjena:** 4h

- [ ] **Task 10.13:** Handover
  - [ ] Code handover
  - [ ] Documentation handover
  - [ ] Access credentials
  - **Procjena:** 2h

**Sprint 10 Ukupno:** ~51 sat

---

## 📊 Ukupna Procjena

| Sprint | Fokus | Sati |
|--------|-------|------|
| Sprint 0 | Setup | 12h |
| Sprint 1 | Database & API | 25h |
| Sprint 2 | Import & List | 38h |
| Sprint 3 | Forms & Details | 33h |
| Sprint 4 | Dashboard & Reports | 35h |
| Sprint 5 | Advanced Reports | 42h |
| Sprint 6 | Analytics | 34h |
| Sprint 7 | Employees Core | 36h |
| Sprint 8 | Licenses | 49h |
| Sprint 9 | Testing & Polish | 60h |
| Sprint 10 | Deploy & Docs | 51h |
| **UKUPNO** | | **415h** |

**Sa bufferom od 20%:** ~500 sati

**Realistična procjena:** 10-12 sedmica (full-time rad)

---

## 🎯 Priority Tasks (Must Have za MVP)

Ako je potrebno smanjiti scope za brže pokretanje:

### Modul 1 MVP:
- ✅ Import Excel-a
- ✅ Lista letova
- ✅ Osnovni CRUD
- ✅ Dnevni izvještaj
- ✅ Basic dashboard

### Modul 2 MVP:
- ✅ Lista radnika
- ✅ Profil radnika
- ✅ Licence CRUD
- ✅ Upload dokumenata
- ✅ Email notifikacije za istek

### Može kasnije (v2.0):
- Advanced analytics
- Punctuality reports
- Custom reports
- In-app notifications
- E2E tests

---

## 📝 Napomene

- Procjene su za jednog developera
- Sprint može se prilagoditi prema kapacitetu
- Neki taskovi se mogu paralelizovati sa drugim developerima
- Bug fixing vrijeme je aproksimativno
- Testiranje se može raditi paralelno sa razvojem

---

**Verzija:** 1.0  
**Datum:** 21.11.2025  
**Status:** Za review i prilagođavanje


---

## Sprint 11: Proširenja - Delay kodovi, aerodromi i kvaliteta podataka (v2)

### Database & Prisma schema

- [ ] **Task 11.1:** Proširenje `Flight` modela
  - [ ] Dodati polje `availableSeats` (realni kapacitet po letu, kolona "Rasp. mjesta")
  - [ ] Dodati `arrivalStatus`, `departureStatus`, `arrivalCancelReason`, `departureCancelReason`
  - [ ] Dodati operativna polja `handlingAgent`, `stand`, `gate`
  - [ ] Dodati meta polja `dataSource`, `importedFile`, `createdByUserId`, `updatedByUserId`, `isLocked`
  - [ ] Prisma migracija + ažuriranje seed podataka (ako je potrebno)
  - **Procjena:** 6h

- [ ] **Task 11.2:** Novi modeli `Airport`, `DelayCode`, `FlightDelay`
  - [ ] Kreirati `Airport` model i povezati ga sa `Flight` (arrivalAirport, departureAirport)
  - [ ] Kreirati `DelayCode` model (kod, opis, kategorija)
  - [ ] Kreirati `FlightDelay` model (flight, faza ARR/DEP, delayCode, minute, isPrimary, comment)
  - [ ] Dodati odgovarajuće indexe
  - **Procjena:** 6h

- [ ] **Task 11.3:** Seed podaci za aerodrome i delay kodove
  - [ ] Seed skripta za osnovne destinacije (FMM, BVA, SAW...) sa državom i EU flagom
  - [ ] Seed skripta za najčešće delay kodove (carrier, ATC, weather, reactionary...)
  - **Procjena:** 4h

### Import & forme

- [ ] **Task 11.4:** Proširenje Excel importera
  - [ ] Podrška za nove kolone (npr. delay kodovi, status leta, handling agent)
  - [ ] Mapiranje `Rasp. mjesta` direktno u `availableSeats`
  - [ ] Pamćenje izvornog naziva fajla u `importedFile`
  - **Procjena:** 5h

- [ ] **Task 11.5:** Ažuriranje Flight formi (create/edit)
  - [ ] Dodati polje za `availableSeats` (pre-fill iz `AircraftType.seats`)
  - [ ] Dropdown za `arrivalStatus` i `departureStatus`
  - [ ] Polja za `handlingAgent`, `stand`, `gate`
  - [ ] UI za unos delay kodova (ARR/DEP), odabir iz liste `DelayCode`
  - [ ] Prikaz kašnjenja u minutama kao read-only (računato iz vremena)
  - **Procjena:** 8h

### Analytics & izvještaji

- [ ] **Task 11.6:** API: Punctuality by cause
  - [ ] Proširenje `/api/analytics/punctuality` da koristi `FlightDelay` i delay kodove
  - [ ] Izračun on-time performance po kategoriji kašnjenja (Carrier, ATC, Weather, Reactionary...)
  - [ ] Endpoint za top delay razloge po aviokompaniji
  - **Procjena:** 6h

- [ ] **Task 11.7:** UI: Delay analytics
  - [ ] Novi tab ili sekcija na stranici Punctuality za breakdown po delay kodovima
  - [ ] Grafikon kašnjenja po kategoriji
  - [ ] Tabela "Top 10" delay kodova po airline-u
  - **Procjena:** 6h

### Data governance

- [ ] **Task 11.8:** Zaključavanje perioda (`isLocked`)
  - [ ] API endpoint za zaključavanje dana/mjeseca
  - [ ] UI opcija na dnevnom/mjesečnom izvještaju "Zaključaj period"
  - [ ] Blokiranje editovanja letova u zaključanom periodu (osim admina)
  - **Procjena:** 5h

- [ ] **Task 11.9:** Audit polja za Flight i License
  - [ ] Popunjavanje `createdByUserId` i `updatedByUserId` iz NextAuth session-a
  - [ ] Prikaz "zadnji put izmijenio" u Flight i License detaljima
  - **Procjena:** 4h

**Sprint 11 Ukupno:** ~50h (opciono v2 proširenje, može se raditi nakon što je osnovni sistem u produkciji)
# Sprint 12: Napredna Analitika, Komparacije i Multi-Language Export

**Fokus:** Advanced Analytics, Comparative Analysis, Data Visualization & Multi-Language Reporting

**Trajanje:** 2-3 sedmice

**Procjena:** ~80-100 sati

---

## 🎯 Ciljevi Sprint-a

### 1. Napredna Analitika
- Year-over-Year (YoY) komparacije
- Quarter-over-Quarter (QoQ) analiza
- Trend predictions i forecasting
- Seasonal patterns analiza
- Market share analiza po aviokompanijama
- Origin-Destination (O&D) matrix analiza

### 2. Komparativni Izvještaji
- Komparacija perioda (dan vs dan, mjesec vs mjesec)
- Benchmark sa prošlom godinom
- Performanse po aviokompanijama
- Rute analiza - profitabilnost
- EU vs non-EU traffic analiza

### 3. Advanced Vizualizacije
- Heat maps (hourly traffic patterns)
- Sankey dijagrami (traffic flow)
- Geographical maps
- Multi-axis charts
- Interactive dashboards

### 4. Multi-Language Export
- Export izvještaja na Engleski i Njemački
- Templating sistem za različite jezike
- Prijevod metrika i oznaka
- PDF generisanje sa i18n podrškom

---

## 📊 Database Proširenja

### Novi Models i Fields

```prisma
// Dodatak postojećim modelima

model Report {
  id                String        @id @default(cuid())
  name              String
  type              ReportType
  parameters        Json          // Store filter parameters
  generatedAt       DateTime      @default(now())
  generatedBy       User          @relation(fields: [userId], references: [id])
  userId            String
  language          String        @default("bs") // bs, en, de
  format            String        // pdf, excel, json
  filePath          String?
  status            ReportStatus  @default(PENDING)
  
  @@index([userId])
  @@index([generatedAt])
}

enum ReportType {
  DAILY
  MONTHLY
  YEARLY
  COMPARATIVE
  ANALYTICS
  CUSTOM
}

enum ReportStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

// Benchmark podaci za komparacije
model BenchmarkData {
  id          String   @id @default(cuid())
  date        DateTime
  metric      String   // passengers, flights, load_factor, etc.
  value       Float
  region      String?  // EU, NON_EU, TOTAL
  airline     String?
  route       String?
  createdAt   DateTime @default(now())
  
  @@index([date, metric])
  @@index([airline])
}

// Prognoza i trend podaci
model ForecastData {
  id          String   @id @default(cuid())
  forecastDate DateTime
  metric      String
  predicted   Float
  confidence  Float    // 0-1 confidence interval
  actual      Float?   // popunjava se kada datum prođe
  model       String   // model name used for prediction
  createdAt   DateTime @default(now())
  
  @@index([forecastDate])
}
```

---

## 📋 Sprint 12 Zadaci

### Faza 1: Komparativna Analitika (25h)

#### Task 12.1: Year-over-Year (YoY) Comparison API
**Procjena:** 6h

**Opis:** Kreiranje API endpoint-a za YoY komparaciju svih ključnih metrika

**Subtasks:**
- [ ] `GET /api/analytics/yoy-comparison`
  - Query params: `currentYear`, `metric` (passengers, flights, cargo, etc.)
  - Vraća podatke za current year i previous year sa % razlikom
  - Breakdown po mjesecima
- [ ] Izračun YoY growth rate
- [ ] Agregacija po aviokompanijama
- [ ] Agregacija po rutama
- [ ] Statistical significance calculation

**Deliverable:** JSON response sa YoY podacima i growth metrics

```typescript
// Response format
{
  currentYear: 2025,
  previousYear: 2024,
  metric: "passengers",
  comparison: {
    total: {
      current: 850000,
      previous: 720000,
      growth: 18.1,
      growthPercent: "+18.1%"
    },
    monthly: [
      {
        month: "January",
        current: 65000,
        previous: 58000,
        growth: 12.1
      },
      // ...
    ],
    byAirline: [
      {
        airline: "Wizzair",
        current: 520000,
        previous: 450000,
        growth: 15.6
      }
    ]
  }
}
```

---

#### Task 12.2: Quarter-over-Quarter (QoQ) Analysis
**Procjena:** 5h

**Opis:** Kvartalna analiza performansi

**Subtasks:**
- [ ] `GET /api/analytics/qoq-comparison`
- [ ] Definisanje kvartalnih perioda (Q1, Q2, Q3, Q4)
- [ ] Izračun QoQ growth
- [ ] Seasonal adjustment faktori
- [ ] Quarter performance scoring

**Deliverable:** QoQ izvještaj sa trendovima

---

#### Task 12.3: Period-to-Period Generic Comparison API
**Procjena:** 6h

**Opis:** Univerzalni API za komparaciju bilo kojih dva perioda

**Subtasks:**
- [ ] `POST /api/analytics/compare-periods`
  - Body: `{ period1: { from, to }, period2: { from, to }, metrics: [] }`
- [ ] Flexible date range comparison
- [ ] Multi-metric support
- [ ] Statistical tests (t-test za significance)
- [ ] Visualization data preparation

**Deliverable:** Generic comparison endpoint

---

#### Task 12.4: Market Share Analysis
**Procjena:** 5h

**Opis:** Analiza market share-a po aviokompanijama

**Subtasks:**
- [ ] `GET /api/analytics/market-share`
- [ ] Izračun % market share po airline-u
- [ ] Trend market share over time
- [ ] Market concentration metrics (HHI - Herfindahl-Hirschman Index)
- [ ] Top 3/5/10 airlines breakdown

**Deliverable:** Market share izvještaj

---

#### Task 12.5: Route Profitability Matrix
**Procjena:** 3h

**Opis:** Origin-Destination matrix sa metrics

**Subtasks:**
- [ ] `GET /api/analytics/route-matrix`
- [ ] Matrix format: route, frequency, passengers, load factor, growth
- [ ] Sorting i ranking opcije
- [ ] Export matrix u CSV

**Deliverable:** O&D matrix data

---

### Faza 2: Napredne Vizualizacije (20h)

#### Task 12.6: Heat Map - Hourly Traffic Pattern
**Procjena:** 5h

**Opis:** Heat map koji prikazuje promet po satima i danima

**Subtasks:**
- [ ] API endpoint za hourly aggregated data
- [ ] React komponenta sa Recharts ili D3.js heat map
- [ ] Color scaling (low traffic = blue, high = red)
- [ ] Hover tooltip sa detaljima
- [ ] Filter po periodu (week, month)

**Deliverable:** Interaktivni heat map UI

**Primjer dizajna:**
```
        Mon  Tue  Wed  Thu  Fri  Sat  Sun
00:00   ░░░  ░░░  ░░░  ░░░  ░░░  ░░░  ░░░
06:00   ▓▓▓  ▓▓▓  ▓▓▓  ▓▓▓  ▓▓▓  ███  ███
12:00   ███  ███  ███  ███  ███  ▓▓▓  ▓▓▓
18:00   ▓▓▓  ▓▓▓  ▓▓▓  ▓▓▓  ▓▓▓  ░░░  ░░░
```

---

#### Task 12.7: Sankey Diagram - Traffic Flow
**Procjena:** 6h

**Opis:** Sankey dijagram koji prikazuje flow putnika između destinacija

**Subtasks:**
- [ ] Library research (recharts-sankey ili react-flow)
- [ ] Data transformation za Sankey format
- [ ] Nodes: Airports, Links: Passenger volumes
- [ ] Color coding po regionima (EU vs non-EU)
- [ ] Interactive tooltips

**Deliverable:** Sankey dijagram komponenta

**Use case:** Prikazuje koliko putnika ide iz TZL->FMM, FMM->TZL, TZL->SAW, etc.

---

#### Task 12.8: Geographical Map - Route Visualization
**Procjena:** 6h

**Opis:** Mapa sa rutama i traffic intensity

**Subtasks:**
- [ ] Leaflet ili Mapbox integration
- [ ] Plot aerodroma na mapi
- [ ] Draw lines between TZL and destinations
- [ ] Line thickness = traffic volume
- [ ] Popup sa route statistics
- [ ] Filter po periodu i airline-u

**Deliverable:** Interaktivna geografska mapa

---

#### Task 12.9: Multi-Axis Charts za Kombinovane Metrike
**Procjena:** 3h

**Opis:** Charts sa više Y osa za različite metrike

**Subtasks:**
- [ ] Recharts ComposedChart setup
- [ ] Dual Y-axis (left: passengers, right: load factor %)
- [ ] Bar + Line kombinacije
- [ ] Legend i grid improvements

**Deliverable:** Multi-axis chart komponente

---

### Faza 3: Trend Analysis & Forecasting (15h)

#### Task 12.10: Seasonal Pattern Detection
**Procjena:** 5h

**Opis:** Detekcija sezonalnih obrazaca u prometu

**Subtasks:**
- [ ] `GET /api/analytics/seasonal-patterns`
- [ ] Decomposition metod (trend, sezonalnost, residual)
- [ ] Identifikacija peak i off-peak perioda
- [ ] Vizualizacija sezonalnosti

**Deliverable:** Seasonal analysis report

---

#### Task 12.11: Simple Forecasting Model
**Procjena:** 8h

**Opis:** Osnovno predviđanje budućeg prometa (moving average ili linear regression)

**Subtasks:**
- [ ] Implementacija moving average prediction
- [ ] Linear regression za trend
- [ ] API: `GET /api/analytics/forecast?months=3`
- [ ] Confidence intervals
- [ ] Store predictions u `ForecastData` model
- [ ] Vizualizacija forecast-a sa actual data

**Deliverable:** Basic forecasting capability

**Napomena:** Za advanced ML modele (ARIMA, Prophet) može se dodati kasnije

---

#### Task 12.12: Benchmark Comparison Report
**Procjena:** 2h

**Opis:** Komparacija sa industry benchmarks ili competing airports

**Subtasks:**
- [ ] Seed benchmark data (manual ili external source)
- [ ] API za prikaz TZL vs Benchmark
- [ ] Visual comparison (bar chart)

**Deliverable:** Benchmark comparison view

---

### Faza 4: Multi-Language i18n Support (25h)

#### Task 12.13: i18n Library Setup
**Procjena:** 3h

**Opis:** Setup next-intl ili next-i18next za podršku više jezika

**Subtasks:**
- [ ] Install `next-intl` library
- [ ] Configure middleware za language routing
- [ ] Create translations folder structure
  ```
  /locales
    /bs  (Bosanski - default)
      common.json
      reports.json
      analytics.json
    /en  (English)
      common.json
      reports.json
      analytics.json
    /de  (Deutsch)
      common.json
      reports.json
      analytics.json
  ```
- [ ] Language switcher komponenta u header-u

**Deliverable:** i18n infrastructure

---

#### Task 12.14: Translation Files - Bosanski (bs)
**Procjena:** 2h

**Opis:** Kreiranje JSON translation fajlova za bosanski (bazni jezik)

**Subtasks:**
- [ ] `common.json` - UI labels, navigation, buttons
- [ ] `reports.json` - Report terminology
- [ ] `analytics.json` - Analytics metrics terminology

**Deliverable:** Bosanski translation files (baseline)

---

#### Task 12.15: Translation Files - English (en)
**Procjena:** 4h

**Opis:** Engleski prijevodi svih UI elemenata i izvještaja

**Subtasks:**
- [ ] Translate all common terms
- [ ] Translate report headers and labels
- [ ] Translate metric names and descriptions
- [ ] Aviation terminology research (proper terms)

**Primjer:**
```json
{
  "reports": {
    "daily": "Daily Report",
    "monthly": "Monthly Report",
    "passengers": "Passengers",
    "flights": "Flights",
    "loadFactor": "Load Factor",
    "arrivalDelay": "Arrival Delay",
    "departureDelay": "Departure Delay"
  }
}
```

**Deliverable:** Complete English translations

---

#### Task 12.16: Translation Files - Deutsch (de)
**Procjena:** 4h

**Opis:** Njemački prijevodi

**Subtasks:**
- [ ] Translate all UI elements to German
- [ ] Aviation terminology in German
- [ ] Formal tone (Sie form)

**Primjer:**
```json
{
  "reports": {
    "daily": "Tagesbericht",
    "monthly": "Monatsbericht",
    "passengers": "Passagiere",
    "flights": "Flüge",
    "loadFactor": "Auslastung",
    "arrivalDelay": "Ankunftsverspätung",
    "departureDelay": "Abflugverspätung"
  }
}
```

**Deliverable:** Complete German translations

---

#### Task 12.17: UI Language Integration
**Procjena:** 5h

**Opis:** Integracija prijevoda u sve postojeće stranice i komponente

**Subtasks:**
- [ ] Replace hardcoded strings sa `t()` funkcijom
- [ ] Update dashboard komponente
- [ ] Update reports pages
- [ ] Update forms i validacija poruke
- [ ] Update error messages

**Deliverable:** Fully translated UI

---

#### Task 12.18: PDF Export Multi-Language Support
**Procjena:** 7h

**Opis:** PDF export sa podrškom za jezik

**Subtasks:**
- [ ] Install PDF generation library (jsPDF + html2canvas ili Puppeteer)
- [ ] Template sistem za PDF izvještaje
- [ ] Language parameter u PDF generation API
- [ ] Font support za karaktere (German umlauts ä, ö, ü)
- [ ] Header/Footer translacije
- [ ] Date formatting po locale (bs, en-GB, de-DE)

**API:**
```typescript
POST /api/reports/generate-pdf
{
  reportType: "monthly",
  period: { year: 2025, month: 10 },
  language: "en"  // bs, en, de
}
```

**Deliverable:** Multi-language PDF reports

---

### Faza 5: Export Features (15h)

#### Task 12.19: Excel Export sa Multi-Sheet i Formatting
**Procjena:** 5h

**Opis:** Proširenje Excel export-a sa više sheet-ova i advanced formatting

**Subtasks:**
- [ ] Library: xlsx-js-style za formatiranje
- [ ] Multi-sheet export (Overview, Flights, Statistics)
- [ ] Cell formatting (currency, percentages, dates)
- [ ] Conditional formatting (highlight delays, high load factors)
- [ ] Charts u Excel-u (opciono)
- [ ] Language parameter support

**Deliverable:** Advanced Excel exports

---

#### Task 12.20: CSV Export sa Custom Delimiters
**Procjena:** 2h

**Opis:** CSV export sa opcijama za delimiter (comma, semicolon, tab)

**Subtasks:**
- [ ] API za CSV export
- [ ] Delimiter selection
- [ ] Encoding selection (UTF-8, ISO-8859-1)
- [ ] Language headers

**Deliverable:** Flexible CSV export

---

#### Task 12.21: Report Scheduling System
**Procjena:** 8h

**Opis:** Mogućnost zakazivanja automatskih izvještaja

**Subtasks:**
- [ ] Database model za scheduled reports
- [ ] Cron job ili node-schedule setup
- [ ] UI za kreiranje scheduled report
  - Odabir tipa izvještaja
  - Frequency (daily, weekly, monthly)
  - Recipients (email lista)
  - Language i format
- [ ] Email delivery sa attachment
- [ ] Execution log

**Deliverable:** Automated report scheduling

---

### Faza 6: Advanced UI Dashboard (10h)

#### Task 12.22: Executive Dashboard
**Procjena:** 6h

**Opis:** High-level executive dashboard sa KPI-ima

**Subtasks:**
- [ ] New page: `/dashboard/executive`
- [ ] Key KPIs layout:
  - Total passengers YTD vs last year
  - Revenue passenger kilometers (RPK)
  - Available seat kilometers (ASK)
  - Load factor trend
  - On-time performance %
  - Top 5 routes
  - Top 5 airlines
- [ ] Period selector (MTD, QTD, YTD)
- [ ] Print-friendly version
- [ ] Export as PDF

**Deliverable:** Executive dashboard page

---

#### Task 12.23: Operations Dashboard (Real-time-like)
**Procjena:** 4h

**Opis:** Dashboard za današnje operacije

**Subtasks:**
- [ ] `/dashboard/operations`
- [ ] Today's flight list
- [ ] Live status indicators
- [ ] Delays summary
- [ ] Passenger count progress bar
- [ ] Refresh button / Auto-refresh opcija

**Deliverable:** Operations dashboard

---

### Faza 7: Dokumentacija i Testing (10h)

#### Task 12.24: API Dokumentacija - Analytics Endpoints
**Procjena:** 3h

**Opis:** Swagger/OpenAPI dokumentacija za sve nove analytics endpoints

**Subtasks:**
- [ ] Document all `/api/analytics/*` routes
- [ ] Request/Response examples
- [ ] Parameter descriptions

**Deliverable:** Updated API docs

---

#### Task 12.25: User Guide - Advanced Analytics
**Procjena:** 4h

**Opis:** User manual za korištenje advanced analytics features

**Subtasks:**
- [ ] How to interpret YoY comparisons
- [ ] How to use heat maps
- [ ] Understanding forecast data
- [ ] Multi-language export guide
- [ ] Screenshots i examples

**Deliverable:** User guide PDF/Wiki

---

#### Task 12.26: Testing - Analytics & i18n
**Procjena:** 3h

**Opis:** Unit i integration testovi za novi features

**Subtasks:**
- [ ] API tests za comparison endpoints
- [ ] i18n translation loading tests
- [ ] PDF generation tests
- [ ] Excel export validation

**Deliverable:** Test suite

---

## 📊 Ukupna Procjena Sprint 12

| Faza | Opis | Sati |
|------|------|------|
| Faza 1 | Komparativna Analitika | 25h |
| Faza 2 | Napredne Vizualizacije | 20h |
| Faza 3 | Trend Analysis & Forecasting | 15h |
| Faza 4 | Multi-Language i18n | 25h |
| Faza 5 | Export Features | 15h |
| Faza 6 | Advanced Dashboards | 10h |
| Faza 7 | Dokumentacija i Testing | 10h |
| **UKUPNO** | | **120h** |

**Sa bufferom od 20%:** ~145 sati

**Realistično trajanje:** 3-4 sedmice (full-time)

---

## 🎨 UI/UX Dodatci

### Vizualizacije koje treba dodati

1. **Comparison View Template**
   - Side-by-side charts za comparison
   - Difference highlighting (green = growth, red = decline)
   - Percentage badges

2. **Heat Map Styles**
   - Diverging color scale
   - Legend component
   - Responsive grid

3. **Sankey Diagram**
   - Custom tooltip
   - Interactive node selection
   - Legend za flow volumes

4. **Geographical Map**
   - Zoom controls
   - Route information panel
   - Filter sidebar

---

## 🔧 Tech Stack Dodatci

### Novi Packages

```bash
# Data visualization
npm install d3 @types/d3
npm install react-flow-renderer  # za Sankey
npm install leaflet react-leaflet @types/leaflet  # za maps

# PDF generation
npm install jspdf html2canvas
# ili
npm install puppeteer

# Excel advanced
npm install xlsx-js-style

# Scheduling
npm install node-schedule

# i18n
npm install next-intl
```

---

## 📈 API Endpoints - Sprint 12

### Analytics - Comparisons
- `GET /api/analytics/yoy-comparison` - Year-over-year
- `GET /api/analytics/qoq-comparison` - Quarter-over-quarter
- `POST /api/analytics/compare-periods` - Custom period comparison
- `GET /api/analytics/market-share` - Market share analysis
- `GET /api/analytics/route-matrix` - O&D matrix

### Analytics - Forecasting
- `GET /api/analytics/seasonal-patterns` - Seasonal analysis
- `GET /api/analytics/forecast` - Traffic forecast
- `GET /api/analytics/benchmark` - Benchmark comparison

### Visualizations Data
- `GET /api/visualizations/heatmap` - Hourly traffic data
- `GET /api/visualizations/sankey` - Traffic flow data
- `GET /api/visualizations/route-map` - Geographic route data

### Reports - Multi-language
- `POST /api/reports/generate-pdf` - PDF generation (lang param)
- `POST /api/reports/generate-excel` - Excel generation (lang param)
- `GET /api/reports/scheduled` - List scheduled reports
- `POST /api/reports/schedule` - Create scheduled report
- `DELETE /api/reports/schedule/:id` - Cancel scheduled report

---

## 🌍 Jezik Mapping

### Supported Languages

| Code | Language | Native Name | Format |
|------|----------|-------------|--------|
| bs   | Bosnian  | Bosanski    | Default |
| en   | English  | English     | en-GB |
| de   | German   | Deutsch     | de-DE |

### Date Formatting Examples

```typescript
// Bosanski
21. novembar 2025.

// English
21 November 2025

// Deutsch
21. November 2025
```

### Number Formatting

```typescript
// Bosanski / Deutsch
1.234.567,89

// English
1,234,567.89
```

---

## 🎯 Success Metrics - Sprint 12

Po završetku sprint-a, sistem treba da omogući:

1. ✅ **Komparacija bilo kojih perioda** sa statističkom analizom
2. ✅ **5+ tipova naprednih vizualizacija** (heat map, sankey, geo map, multi-axis charts)
3. ✅ **Forecast na 3-6 mjeseci** sa confidence intervals
4. ✅ **Export izvještaja na 3 jezika** (bs, en, de)
5. ✅ **Automatsko zakazivanje izvještaja** sa email delivery
6. ✅ **Executive dashboard** sa real-time KPI-ima

---

## 💡 Future Enhancements (Post Sprint 12)

### Advanced Analytics v3.0
- Machine Learning modeli (Prophet, LSTM za forecasting)
- Anomaly detection (outlier flights, unusual patterns)
- Clustering analiza (group similar routes/airlines)
- Prescriptive analytics (optimization suggestions)

### Additional Languages
- Francuski (fr)
- Turski (tr)
- Arapski (ar)

### Integration
- Real-time data feeds od airlines
- Weather data integration
- IATA BSP reporting format export
- Eurostat format export za EU reporting

---

**Verzija dokumenta:** 1.0  
**Datum:** 21.11.2025  
**Sprint:** 12  
**Status:** Ready for implementation
