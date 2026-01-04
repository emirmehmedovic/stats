# Plan Realizacije - Softver za Statistiku Aerodroma Tuzla
**Verzija dokumenta:** 3.0 (prošireno sa naprednom analitikom i multi-language)

## 📋 Pregled Projekta

**Naziv projekta:** Airport Statistics Management System  
**Aerodrom:** Tuzla International Airport  
**Tech Stack:**
- Frontend: React + Next.js 14+ (App Router)
- Backend: Node.js + Next.js API Routes
- Database: PostgreSQL 14+
- ORM: Prisma
- i18n: next-intl (bosanski, engleski, njemački)
- Visualization: Recharts, D3.js, Leaflet
- PDF Export: Puppeteer / jsPDF
- Scheduling: node-schedule
- Hosting: Lokalni server
- File Storage: Lokalni file system

---

## 🎯 Ciljevi Projekta

### Modul 1: Statistika Saobraćaja
- Dnevni unos podataka o letovima (dolasci/odlasci)
- Automatsko generisanje izvještaja
- Pretraga i filtriranje podataka
- **Napredna vizualizacija statistike** (grafikoni, heat maps, sankey, geo maps)
- **Komparativna analitika** (YoY, QoQ, period-to-period)
- **Trend analysis i forecasting**
- **Multi-language export** podataka (Excel, PDF) - bs/en/de

### Modul 2: Upravljanje Radnicima
- Profil radnika sa osnovnim informacijama
- Upravljanje licencama i certifikatima
- Upload dokumentacije vezane za licence
- Notifikacije o isteku licenci
- Pregled historije i status dokumenata

### Modul 3: Advanced Analytics (v2.0)
- Year-over-Year i Quarter-over-Quarter komparacije
- Market share analiza
- Seasonal pattern detection
- Basic forecasting (3-6 mjeseci)
- Benchmark comparison
- Executive dashboards
- Scheduled automated reports

---

## 📊 Analiza Dnevnog Izvještaja

### Struktura Podataka (25 kolona)

#### Osnovne Informacije o Letu
1. **Datum** - Datum operacije
2. **Kompanija** - Naziv aviokompanije (npr. WIZZAIR, PEGASUS)
3. **ICAO kod** - Jedinstveni kod kompanije (WMT, WZZ, PGT, TKJ, SAZ)
4. **Ruta** - Putanja leta (npr. FMM-TZL-FMM)
5. **Tip a/c** - Tip aviona (A320, A321, B738, CL650)
6. **Rasp. mjesta** - Raspoloživa mjesta u avionu
7. **Reg** - Registracija aviona (npr. HA-LYF, TC-NCA)
8. **Tip OPER** - Tip operacije (SCHEDULED, MEDEVAC, CHARTER)
9. **MTOW(kg)** - Maximum Takeoff Weight

#### Podaci o Dolasku (Arrival)
10. **br leta u dol** - Broj leta dolazak
11. **pl vrijeme dol** - Planirano vrijeme dolaska
12. **st vrijeme dol** - Stvarno vrijeme dolaska
13. **Putnici u avionu** - Broj putnika na dolasku
14. **Bebe u naručju** - Broj beba
15. **prtljag dol (kg)** - Težina prtljaga na dolasku
16. **cargo dol (kg)** - Težina cargoa na dolasku
17. **pošta dol (kg)** - Težina pošte na dolasku

#### Podaci o Odlasku (Departure)
18. **br leta u odl** - Broj leta odlazak
19. **pl vrijeme odl** - Planirano vrijeme odlaska
20. **st vrijeme odl** - Stvarno vrijeme odlaska
21. **Putnici u avionu.1** - Broj putnika na odlasku
22. **Bebe u naručju.1** - Broj beba
23. **prtljag odl (kg)** - Težina prtljaga na odlasku
24. **cargo odl (kg)** - Težina cargoa na odlasku
25. **pošta odl (kg)** - Težina pošte na odlasku

### Potrebni Izračunati Podaci
- Kašnjenja (razlika planiranog i stvarnog vremena)
- Popunjenost (\[putnici/raspoloživa mjesta\] * 100%)
- Ukupan promet putnika (dnevno, mjesečno, godišnje)
- Promet tereta i pošte
- Broj operacija po kompanijama
- Analiza najfrekventnijih ruta
- **YoY i QoQ growth rates**
- **Market share metrike**
- **Seasonal indices**

---

## 🏗️ Arhitektura Sistema

### Database Schema (PostgreSQL + Prisma) - Kompletna verzija

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ===============================
// FLIGHT OPERATIONS
// ===============================

// Aviokompanije
model Airline {
  id        String   @id @default(cuid())
  name      String
  icaoCode  String   @unique
  iataCode  String?
  country   String?
  flights   Flight[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Aerodromi
model Airport {
  id         String   @id @default(cuid())
  iataCode   String   @unique
  icaoCode   String?  @unique
  name       String
  city       String?
  country    String
  isEU       Boolean?
  latitude   Float?
  longitude  Float?
  arrivals   Flight[] @relation("ArrivalAirport")
  departures Flight[] @relation("DepartureAirport")
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

// Tipovi aviona
model AircraftType {
  id        String   @id @default(cuid())
  model     String   @unique
  seats     Int
  mtow      Int      // Maximum Takeoff Weight
  flights   Flight[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

enum FlightOperationType {
  SCHEDULED
  MEDEVAC
  CHARTER
}

enum FlightStatus {
  SCHEDULED
  OPERATED
  CANCELLED
  DIVERTED
}

enum DelayPhase {
  ARR
  DEP
}

// Letovi
model Flight {
  id                     String                @id @default(cuid())
  date                   DateTime
  airline                Airline               @relation(fields: [airlineId], references: [id])
  airlineId              String
  aircraftType           AircraftType          @relation(fields: [aircraftTypeId], references: [id])
  aircraftTypeId         String
  registration           String
  route                  String
  operationType          FlightOperationType

  // Kapacitet
  availableSeats         Int           // realni kapacitet po letu

  // Aerodromi
  arrivalAirport         Airport?      @relation("ArrivalAirport", fields: [arrivalAirportId], references: [id])
  arrivalAirportId       String?
  departureAirport       Airport?      @relation("DepartureAirport", fields: [departureAirportId], references: [id])
  departureAirportId     String?

  // Arrival
  arrivalFlightNumber    String?
  arrivalScheduledTime   DateTime?
  arrivalActualTime      DateTime?
  arrivalPassengers      Int?
  arrivalInfants         Int?
  arrivalBaggage         Int?          // kg
  arrivalCargo           Int?          // kg
  arrivalMail            Int?          // kg
  arrivalStatus          FlightStatus  @default(OPERATED)
  arrivalCancelReason    String?

  // Departure
  departureFlightNumber  String?
  departureScheduledTime DateTime?
  departureActualTime    DateTime?
  departurePassengers    Int?
  departureInfants       Int?
  departureBaggage       Int?         // kg
  departureCargo         Int?         // kg
  departureMail          Int?         // kg
  departureStatus        FlightStatus @default(OPERATED)
  departureCancelReason  String?

  // Operativni detalji
  handlingAgent          String?
  stand                  String?
  gate                   String?

  // Meta / kvaliteta podataka
  dataSource             String        @default("MANUAL") // MANUAL, IMPORT_EXCEL, API
  importedFile           String?
  createdByUserId        String?
  updatedByUserId        String?
  isLocked               Boolean       @default(false)

  // Relacije
  delays                 FlightDelay[]

  createdAt              DateTime      @default(now())
  updatedAt              DateTime      @updatedAt

  @@index([date])
  @@index([airlineId])
  @@index([route])
  @@index([arrivalAirportId])
  @@index([departureAirportId])
}

// Delay kodovi (IATA ili interni)
model DelayCode {
  id          String        @id @default(cuid())
  code        String        @unique
  description String
  category    String        // Carrier, ATC, Weather, Reactionary...
  delays      FlightDelay[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

// Kašnjenja po letu
model FlightDelay {
  id          String     @id @default(cuid())
  flight      Flight     @relation(fields: [flightId], references: [id], onDelete: Cascade)
  flightId    String
  phase       DelayPhase
  delayCode   DelayCode  @relation(fields: [delayCodeId], references: [id])
  delayCodeId String
  minutes     Int
  isPrimary   Boolean    @default(true)
  comment     String?

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([flightId])
  @@index([delayCodeId])
}

// ===============================
// EMPLOYEE MANAGEMENT
// ===============================

// Radnici
model Employee {
  id              String            @id @default(cuid())
  employeeNumber  String            @unique
  firstName       String
  lastName        String
  email           String            @unique
  phone           String?
  nationalId      String?
  dateOfBirth     DateTime?
  hireDate        DateTime
  position        String
  department      String?
  photo           String?           // URL to photo
  status          String            @default("ACTIVE") // ACTIVE, INACTIVE, ON_LEAVE
  licenses        License[]
  notifications   LicenseNotification[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

// Licence
model License {
  id                  String              @id @default(cuid())
  employee            Employee            @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  employeeId          String
  licenseType         String              // Tip licence
  licenseNumber       String
  issuedDate          DateTime
  expiryDate          DateTime
  issuer              String?             // Ko je izdao licencu
  status              String              @default("ACTIVE") // ACTIVE, EXPIRED, SUSPENDED
  requiredForPosition String?             // za koju poziciju je ova licenca ključna
  documents           LicenseDocument[]
  notifications       LicenseNotification[]
  createdByUserId     String?
  updatedByUserId     String?
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  @@index([employeeId])
  @@index([expiryDate])
}

// Dokumentacija licence
model LicenseDocument {
  id         String   @id @default(cuid())
  license    License  @relation(fields: [licenseId], references: [id], onDelete: Cascade)
  licenseId  String
  fileName   String
  filePath   String
  fileType   String
  fileSize   Int
  uploadedAt DateTime @default(now())

  @@index([licenseId])
}

// Notifikacije za istek licenci
model LicenseNotification {
  id               String   @id @default(cuid())
  employee         Employee @relation(fields: [employeeId], references: [id])
  employeeId       String
  license          License  @relation(fields: [licenseId], references: [id])
  licenseId        String
  notificationDate DateTime
  sent             Boolean  @default(false)
  sentAt           DateTime?
  createdAt        DateTime @default(now())

  @@index([employeeId])
  @@index([licenseId])
}

// ===============================
// ANALYTICS & REPORTING
// ===============================

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

// Izvještaji
model Report {
  id           String       @id @default(cuid())
  name         String
  type         ReportType
  parameters   Json         // Store filter parameters
  generatedAt  DateTime     @default(now())
  generatedBy  User         @relation(fields: [userId], references: [id])
  userId       String
  language     String       @default("bs") // bs, en, de
  format       String       // pdf, excel, json
  filePath     String?
  status       ReportStatus @default(PENDING)
  isScheduled  Boolean      @default(false)
  schedule     ReportSchedule?

  @@index([userId])
  @@index([generatedAt])
  @@index([type])
}

// Zakazivanje izvještaja
model ReportSchedule {
  id          String   @id @default(cuid())
  report      Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)
  reportId    String   @unique
  frequency   String   // daily, weekly, monthly
  dayOfWeek   Int?     // 1-7 for weekly
  dayOfMonth  Int?     // 1-31 for monthly
  time        String   // HH:mm
  recipients  String[] // email addresses
  isActive    Boolean  @default(true)
  lastRun     DateTime?
  nextRun     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([nextRun])
}

// Benchmark podaci za komparacije
model BenchmarkData {
  id        String   @id @default(cuid())
  date      DateTime
  metric    String   // passengers, flights, load_factor, etc.
  value     Float
  region    String?  // EU, NON_EU, TOTAL
  airline   String?
  route     String?
  createdAt DateTime @default(now())

  @@index([date, metric])
  @@index([airline])
}

// Prognoza i trend podaci
model ForecastData {
  id           String   @id @default(cuid())
  forecastDate DateTime
  metric       String
  predicted    Float
  confidence   Float    // 0-1 confidence interval
  actual       Float?   // popunjava se kada datum prođe
  model        String   // model name used for prediction
  createdAt    DateTime @default(now())

  @@index([forecastDate])
  @@index([metric])
}

// ===============================
// USER MANAGEMENT
// ===============================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  password      String
  role          String    @default("VIEWER") // ADMIN, MANAGER, VIEWER
  isActive      Boolean   @default(true)
  reports       Report[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

---

## 📈 Funkcionalnosti - Modul 1: Statistika Saobraćaja

### 1.1 Dashboard
- **Quick Stats Cards:**
  - Današnji broj letova
  - Ukupan broj putnika danas
  - Broj aktivnih aviolinija
  - Prosječna popunjenost
  
- **Grafikoni:**
  - Broj letova po danima (line chart)
  - Top 5 aviolinija po broju letova (bar chart)
  - Distribucija tipova operacija (pie chart)
  - Promet putnika - trend (area chart)
  - **YoY comparison widget** (current vs previous year)

### 1.2 Upravljanje Letovima
- Lista letova, dodavanje, izmjena, import iz Excela
- **Advanced filtering** po aerodromu, rutu, aviokompaniji
- **Bulk operations**

### 1.3 Izvještaji
- Dnevni, mjesečni, godišnji izvještaji
- Custom izvještaji sa flexible date ranges
- **Multi-language export** (bs, en, de)
- **Scheduled reports** sa email delivery

### 1.4 Basic Analytics
- Load Factor Analysis
- Punctuality Report sa delay code breakdown
- Route profitability

### 1.5 **Advanced Analytics** (Modul 3)
- **Komparativna Analitika:**
  - Year-over-Year (YoY) comparison
  - Quarter-over-Quarter (QoQ) comparison
  - Period-to-period generic comparison
  - Growth rate calculations
  
- **Market Analysis:**
  - Market share po aviokompanijama
  - Route matrix (O&D analysis)
  - Top performers ranking
  
- **Trend Analysis:**
  - Seasonal pattern detection
  - Traffic forecasting (3-6 mjeseci)
  - Confidence intervals
  
- **Benchmark Comparison:**
  - Industry benchmarks
  - Competing airports comparison

### 1.6 **Advanced Visualizations**
- **Heat Maps:**
  - Hourly traffic patterns
  - Day-of-week analysis
  - Seasonal heat maps
  
- **Sankey Diagrams:**
  - Traffic flow visualization
  - Origin-Destination flows
  - Passenger distribution
  
- **Geographical Maps:**
  - Route visualization na mapi
  - Traffic intensity indicators
  - Interactive tooltips
  
- **Multi-Axis Charts:**
  - Combined metrics (passengers + load factor)
  - Composite visualizations

### 1.7 **Executive Dashboards**
- High-level KPI overview
- Real-time operations status
- Performance scorecards
- Print-friendly layouts

---

## 👥 Funkcionalnosti - Modul 2: Upravljanje Radnicima

_(Ostaje nepromijenjeno kao u v2.0)_

### 2.1 Lista Radnika
- Tabela sa filterima, pretraga, sort opcije

### 2.2 Profil Radnika
- Osnovne informacije, fotografija, timeline

### 2.3 Licence i Certifikati
- Lista licenci, dodavanje, status tracking
- Email notifikacije (60, 30, 15 dana prije isteka)

### 2.4 Upravljanje Dokumentima
- Upload, preview, download dokumenata

---

## 🌍 Multi-Language Support (i18n)

### Podržani Jezici

| Kod | Jezik | Opis |
|-----|-------|------|
| bs  | Bosanski | Default jezik sistema |
| en  | English | Engleski (British format) |
| de  | Deutsch | Njemački (formal) |

### Funkcionalnosti
- **UI Translation:** Svi elementi interfacea prevedeni
- **Report Translation:** Izvještaji na odabranom jeziku
- **PDF/Excel Export:** Headers i labels na jeziku izvještaja
- **Date/Number Formatting:** Locale-specific formatiranje
- **Email Notifications:** Jezik prema user preference

### Translation Files Struktura
```
/locales
  /bs
    common.json      # UI elementi
    reports.json     # Izvještaji
    analytics.json   # Analitika terminologija
    emails.json      # Email templates
  /en
    ...
  /de
    ...
```

---

## 📋 API Endpoints (Kompletna Lista)

### Flights
- `GET /api/flights` - Lista letova
- `GET /api/flights/:id` - Detalji leta
- `POST /api/flights` - Kreiranje leta
- `PUT /api/flights/:id` - Ažuriranje leta
- `DELETE /api/flights/:id` - Brisanje leta
- `POST /api/flights/import` - Import iz Excela
- `POST /api/flights/bulk-lock` - Zaključavanje perioda

### Airports & Airlines
- `GET /api/airports` - Lista aerodroma
- `POST /api/airports` - Kreiranje aerodroma
- `GET /api/airlines` - Lista aviolinija
- `POST /api/airlines` - Kreiranje aviolinije

### Delay Codes
- `GET /api/delay-codes` - Lista delay kodova
- `POST /api/delay-codes` - Kreiranje delay koda

### Employees
- `GET /api/employees` - Lista radnika
- `GET /api/employees/:id` - Profil radnika
- `POST /api/employees` - Kreiranje radnika
- `PUT /api/employees/:id` - Ažuriranje radnika
- `DELETE /api/employees/:id` - Brisanje radnika

### Licenses
- `GET /api/employees/:id/licenses` - Licence radnika
- `POST /api/employees/:id/licenses` - Dodavanje licence
- `PUT /api/licenses/:id` - Ažuriranje licence
- `DELETE /api/licenses/:id` - Brisanje licence

### Documents
- `POST /api/licenses/:id/documents` - Upload dokumenta
- `GET /api/documents/:id` - Download dokumenta
- `DELETE /api/documents/:id` - Brisanje dokumenta

### Reports - Basic
- `GET /api/reports/daily?date=YYYY-MM-DD&lang=bs` - Dnevni izvještaj
- `GET /api/reports/monthly?year=YYYY&month=MM&lang=en` - Mjesečni izvještaj
- `GET /api/reports/yearly?year=YYYY&lang=de` - Godišnji izvještaj
- `POST /api/reports/custom` - Custom izvještaj

### Reports - Export
- `POST /api/reports/generate-pdf` - PDF generation (multi-lang)
- `POST /api/reports/generate-excel` - Excel generation (multi-lang)
- `POST /api/reports/generate-csv` - CSV generation

### Reports - Scheduling
- `GET /api/reports/scheduled` - Lista zakazanih izvještaja
- `POST /api/reports/schedule` - Kreiranje scheduled report
- `PUT /api/reports/schedule/:id` - Ažuriranje schedule
- `DELETE /api/reports/schedule/:id` - Cancel scheduled report

### Analytics - Basic
- `GET /api/analytics/load-factor` - Load factor analiza
- `GET /api/analytics/punctuality` - Punctuality report
- `GET /api/analytics/routes` - Route analysis

### Analytics - Advanced (Sprint 12)
- `GET /api/analytics/yoy-comparison` - Year-over-year
- `GET /api/analytics/qoq-comparison` - Quarter-over-quarter
- `POST /api/analytics/compare-periods` - Custom period comparison
- `GET /api/analytics/market-share` - Market share analysis
- `GET /api/analytics/route-matrix` - O&D matrix
- `GET /api/analytics/seasonal-patterns` - Seasonal analysis
- `GET /api/analytics/forecast?months=3` - Traffic forecast
- `GET /api/analytics/benchmark` - Benchmark comparison

### Visualizations
- `GET /api/visualizations/heatmap` - Hourly traffic heat map data
- `GET /api/visualizations/sankey` - Traffic flow data
- `GET /api/visualizations/route-map` - Geographic route data

### Dashboard
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET /api/dashboard/executive` - Executive KPIs
- `GET /api/dashboard/operations` - Today's operations

---

## 🎨 UI/UX Dizajn

### Design System
- **UI Library:** shadcn/ui + Tailwind CSS
- **Ikone:** Lucide React
- **Grafikoni:** Recharts, D3.js, Chart.js
- **Maps:** Leaflet / React Leaflet
- **Tabele:** TanStack Table (React Table v8)
- **Forme:** React Hook Form + Zod validacija
- **Date picker:** react-day-picker
- **i18n:** next-intl

### Responsive Design
- Desktop first approach
- Tablet optimizacija
- Mobile basic view
- Print-friendly layouts za izvještaje

### Tema
- Light/Dark mode toggle
- Moderna, profesionalna paleta boja
- Aviation industry inspired design

### Color Palette
```css
--primary: #0066CC (Blue)
--success: #10B981 (Green)
--warning: #F59E0B (Yellow)
--danger: #EF4444 (Red)
--info: #3B82F6 (Light Blue)
--neutral: #64748B (Slate Gray)
```

---

## 📊 Key Performance Indicators (KPIs)

### Traffic Metrics
- Total Passengers (PAX)
- Total Flights
- Load Factor (%)
- Cargo & Mail (kg)
- Aircraft Movements

### Performance Metrics
- On-Time Performance (OTP) %
- Average Delay (minutes)
- Cancellation Rate (%)
- Diversion Rate (%)

### Commercial Metrics
- Revenue Passenger Kilometers (RPK)
- Available Seat Kilometers (ASK)
- Passengers per Flight
- Market Share by Airline

### Growth Metrics
- YoY Growth (%)
- QoQ Growth (%)
- CAGR (Compound Annual Growth Rate)
- Seasonal Index

---

## 💡 Future Enhancements (v4.0+)

### Modul 1 dodatke:
- Real-time flight tracking API integration
- Weather data integration
- Predictive analytics sa ML models (LSTM, Prophet)
- Anomaly detection
- IATA BSP reporting format
- Eurostat format export

### Modul 2 dodatke:
- Training records module
- Performance reviews
- Leave management
- Shift scheduling

### Generalno:
- Mobile aplikacija (React Native)
- Additional languages (French, Turkish, Arabic)
- SMS notifications
- Push notifications
- Integration sa HR sistemima
- Integration sa accounting sistemima

---

## 📞 Kontakt i Podrška

- **Technical Lead:** [Vaše ime]
- **Project Manager:** [Ime]
- **Issue Tracking:** GitHub Issues / Jira
- **Documentation:** Wiki / Confluence

---

**Verzija dokumenta:** 3.0  
**Datum:** 21.11.2025  
**Status:** Ready for Sprint 12 implementation
