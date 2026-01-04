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
