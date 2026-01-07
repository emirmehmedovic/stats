# PLAN ZA IMPORT EXCEL STATISTIKA U PRODUKCIJSKU BAZU

**Datum kreiranja**: 2026-01-05
**Status**: Draft
**Autor**: ETL Planning

---

## 📋 SADRŽAJ

1. [Pregled Trenutnog Stanja](#1-pregled-trenutnog-stanja)
2. [Identifikovane Strukture Podataka](#2-identifikovane-strukture-podataka)
3. [Mapiranje Excel → Baza](#3-mapiranje-excel--baza)
4. [Parsiranje Kompleksnih Podataka](#4-parsiranje-kompleksnih-podataka)
5. [Lookup Tabele i Referentni Podaci](#5-lookup-tabele-i-referentni-podaci)
6. [ETL Pipeline Arhitektura](#6-etl-pipeline-arhitektura)
7. [Validacija i Error Handling](#7-validacija-i-error-handling)
8. [Testing Strategija](#8-testing-strategija)
9. [Implementacija Plan](#9-implementacija-plan)
10. [Risk Management](#10-risk-management)

---

## 1. PREGLED TRENUTNOG STANJA

### 1.1 Folder Struktura

```
/Users/emir_mw/stats/STATS/
├── DNEVNI 2008/         # 8 mjeseci (Avgust-Decembar)
├── DNEVNI 2009/         # 18 mjeseci
├── DNEVNI 2010/         # 16 mjeseci
├── DNEVNI 2011/         # 10 mjeseci
├── DNEVNI 2012/         # 12 mjeseci
├── DNEVNI 2013/         # 12 mjeseci
├── DNEVNI 2014/         # 12 mjeseci
├── DNEVNI 2015/         # 12 mjeseci
├── DNEVNI 2016/         # 12 mjeseci
├── DNEVNI 2017/         # 12 mjeseci
├── DNEVNI 2018/         # 12 mjeseci
├── DNEVNI 2019/         # 12 mjeseci
├── DNEVNI 2020/         # 12 mjeseci
├── DNEVNI 2021/         # 12 mjeseci
├── DNEVNI 2022/         # 12 mjeseci
├── 2023/                # Različita struktura
├── 2024/                # 4 mjeseca (Sep-Dec)
├── 2025/                # 7 mjeseci
└── 2026/                # 1 mjesec
```

### 1.2 Procijenjeni Obim Podataka

- **Period**: 2008-2026 (18 godina)
- **Procijenjeni broj mjeseci**: ~200
- **Procijenjeni broj dana**: ~6,000
- **Procijenjeni broj letova**: ~150,000-200,000
- **Veličina podataka**: ~500MB-1GB Excel fajlova

---

## 2. IDENTIFIKOVANE STRUKTURE PODATAKA

### 2.1 Format A: 2008-2022 (DNEVNI XXXX folderi)

**Karakteristike**:
- ✅ Jedan Excel fajl po mjesecu: `01. JANUAR 2022.xlsx`
- ✅ Svaki sheet predstavlja jedan dan (sheet "1" = 1. januar)
- ✅ 31 sheet-ova za mjesece sa 31 danom, 30 za mjesece sa 30 dana, 28/29 za februar
- ✅ Standardizovana struktura sa 21 kolonom
- ✅ Formati: `.xls` i `.xlsx`

**Header (red 1)**:
```
datum | kompanija | ruta | tip a/c | reg | tip OPER. | MTOW(kg) |
br leta u dol | br leta u odl | pl vrijeme dol | st vrijeme dol |
pl vrijeme odl | st vrijeme odl | br putnika DOLAZAK | br putnika ODLAZAK |
prtljag D(kg) | prtljag O(kg) | cargo D(kg) | cargo O(kg) |
pošta D(kg) | pošta O(kg)
```

**Primjer reda (red 2+)**:
```python
(
    datetime.datetime(2022, 1, 1, 0, 0),      # datum
    'WIZZAIR',                                 # kompanija
    'TZL-HHN-TZL',                            # ruta
    'A320',                                    # tip a/c
    'HA-LYS',                                  # reg
    'SCHEDULED',                               # tip OPER.
    70000,                                     # MTOW(kg)
    'W64284',                                  # br leta u dol
    'W64283',                                  # br leta u odl
    datetime.time(12, 5),                      # pl vrijeme dol
    datetime.time(12, 58),                     # st vrijeme dol
    datetime.time(7, 40),                      # pl vrijeme odl
    datetime.time(9, 4),                       # st vrijeme odl
    '110+6 INF',                               # br putnika DOLAZAK
    '153+7 INF',                               # br putnika ODLAZAK
    571,                                       # prtljag D(kg)
    879,                                       # prtljag O(kg)
    0,                                         # cargo D(kg)
    0,                                         # cargo O(kg)
    0,                                         # pošta D(kg)
    0                                          # pošta O(kg)
)
```

### 2.2 Format B: 2023 (Mjesečni izvještaji)

**Karakteristike**:
- ⚠️ DRUGAČIJA STRUKTURA!
- ✅ Jedan fajl po mjesecu: `Dnevni izvještaj o saobraćaju.xlsx`
- ✅ **SAMO JEDAN SHEET** sa svim danima mjeseca
- ✅ Podaci nisu sortirani po datumu (31.01, 30.01, 29.01... nasumično)
- ✅ Različit redoslijed kolona
- ✅ Vremena su **STRING** format ('11:35') umjesto datetime.time
- ✅ Ruta je podijeljena na "Dolazak iz" i "Odlazak za"

**Header (red 1)**:
```
Datum | Kompanija | Tip A/C | AC Reg | MTOW (kg) | Tip oper |
Dolazak iz | Br let u dol | Pl vrijeme dol | St vrijeme dol |
Br putnika dol | Prtljag dol (kg) | Cargo dol (kg) |
Odlazak za | Br let u odl | Pl vrijeme odl | St vrijeme odl |
Br putnika odl | Prtljag odl (kg) | Cargo odl (kg)
```

**Primjer reda**:
```python
(
    datetime.datetime(2023, 1, 31, 0, 0),     # Datum
    'WIZZAIR HUNGARY LTD',                     # Kompanija
    'A320',                                     # Tip A/C
    'HA - LYG',                                 # AC Reg (OBRATITI PAŽNJU: razmak!)
    70000,                                      # MTOW (kg)
    'SCHEDULED (R)',                            # Tip oper
    'EDLW',                                     # Dolazak iz (ICAO kod!)
    'W64298',                                   # Br let u dol
    '11:35',                                    # Pl vrijeme dol (STRING!)
    '11:29',                                    # St vrijeme dol (STRING!)
    '171+6',                                    # Br putnika dol
    846,                                        # Prtljag dol (kg)
    0,                                          # Cargo dol (kg)
    'EDLW',                                     # Odlazak za (ICAO kod!)
    'W64297',                                   # Br let u odl
    '6:40',                                     # Pl vrijeme odl (STRING! može biti '6:40' ili '06:40')
    '7:08',                                     # St vrijeme odl (STRING!)
    '173+6',                                    # Br putnika odl
    757,                                        # Prtljag odl (kg)
    0                                           # Cargo odl (kg)
)
```

**KLJUČNE RAZLIKE 2023**:
1. ❌ NEMA kolone "ruta" - umjesto toga ima "Dolazak iz" i "Odlazak za"
2. ❌ NEMA kolone "pošta" (mail)
3. ⚠️ Koristi **ICAO kodove** ('EDLW', 'EDDN') umjesto IATA ('HHN', 'BER')
4. ⚠️ Vremena su STRING format (može biti '6:40' ili '06:40')
5. ⚠️ Registration može imati razmake ('HA - LYG')
6. ⚠️ Tip oper može imati sufiks ('SCHEDULED (R)')

### 2.3 Format C: 2024-2025

**Karakteristike**:
- ✅ Vraćen format sličan 2008-2022
- ✅ Sheet po danu (31 sheet-ova)
- ✅ Standardizovan header
- ⚠️ MTOW je **decimal** (71.5) umjesto integer (71500)
- ⚠️ Kolona "tip OPER." bez tačke na kraju

**Header (red 1)**:
```
datum | kompanija | ruta | tip a/c | reg | tip OPER | MTOW(kg) |
br leta u dol | br leta u odl | pl vrijeme dol | st vrijeme dol |
pl vrijeme odl | st vrijeme odl | br putnika DOLAZAK | br putnika ODLAZAK |
prtljag D(kg) | prtljag O(kg) | cargo D(kg) | cargo O(kg) |
pošta D(kg) | pošta O(kg)
```

**KLJUČNA RAZLIKA**:
- MTOW: `71.5` (decimal, u tonama?) vs `71500` (integer, u kg)

---

## 3. MAPIRANJE EXCEL → BAZA

### 3.1 Direktno Mapiranje - Format A i C (2008-2022, 2024-2025)

| Excel Kolona (Index) | Tip Podatka | Prisma Polje | Transformacija |
|---------------------|-------------|--------------|----------------|
| 0: `datum` | DateTime | `date` | Direktno |
| 1: `kompanija` | String | `airlineId` | Lookup → Airline.id |
| 2: `ruta` | String | `route` | Direktno + Parse za aerodrome |
| 3: `tip a/c` | String | `aircraftTypeId` | Lookup → AircraftType.id |
| 4: `reg` | String | `registration` | Trim whitespace |
| 5: `tip OPER` | String | `operationTypeId` | Lookup → OperationType.id |
| 6: `MTOW(kg)` | Int/Decimal | - | **IGNORIŠI** (uzima se iz AircraftType) |
| 7: `br leta u dol` | String | `arrivalFlightNumber` | Trim |
| 8: `br leta u odl` | String | `departureFlightNumber` | Trim |
| 9: `pl vrijeme dol` | Time | `arrivalScheduledTime` | Combine(date, time) → DateTime |
| 10: `st vrijeme dol` | Time | `arrivalActualTime` | Combine(date, time) → DateTime |
| 11: `pl vrijeme odl` | Time | `departureScheduledTime` | Combine(date, time) → DateTime |
| 12: `st vrijeme odl` | Time | `departureActualTime` | Combine(date, time) → DateTime |
| 13: `br putnika DOLAZAK` | String | `arrivalPassengers`, `arrivalInfants` | **PARSE** (vidjeti sekciju 4.1) |
| 14: `br putnika ODLAZAK` | String | `departurePassengers`, `departureInfants` | **PARSE** (vidjeti sekciju 4.1) |
| 15: `prtljag D(kg)` | Int/String | `arrivalBaggage` | parseInt ili 0 |
| 16: `prtljag O(kg)` | Int/String | `departureBaggage` | parseInt ili 0 |
| 17: `cargo D(kg)` | Int/String | `arrivalCargo` | parseInt ili 0 |
| 18: `cargo O(kg)` | Int/String | `departureCargo` | parseInt ili 0 |
| 19: `pošta D(kg)` | Int/String | `arrivalMail` | parseInt ili 0 |
| 20: `pošta O(kg)` | Int/String | `departureMail` | parseInt ili 0 |

**Dodatna Ekstrakcija iz "ruta"**:
```typescript
// Primjer: "TZL-HHN-TZL"
const [origin, destination, return_to] = route.split('-');

// departure: HHN (odlazak iz TZL u HHN)
// arrival: HHN (dolazak iz HHN u TZL)

departureAirportId = lookup(destination)  // HHN
arrivalAirportId = lookup(destination)    // HHN
```

### 3.2 Mapiranje - Format B (2023)

| Excel Kolona (Index) | Tip Podatka | Prisma Polje | Transformacija |
|---------------------|-------------|--------------|----------------|
| 0: `Datum` | DateTime | `date` | Direktno |
| 1: `Kompanija` | String | `airlineId` | Lookup → Airline.id |
| 2: `Tip A/C` | String | `aircraftTypeId` | Lookup → AircraftType.id |
| 3: `AC Reg` | String | `registration` | **TRIM SPACES** ('HA - LYG' → 'HA-LYG') |
| 4: `MTOW (kg)` | Int | - | IGNORIŠI |
| 5: `Tip oper` | String | `operationTypeId` | **REMOVE SUFFIX** ('SCHEDULED (R)' → 'SCHEDULED') |
| 6: `Dolazak iz` | String (ICAO) | `arrivalAirportId` | **ICAO → IATA Conversion** + Lookup |
| 7: `Br let u dol` | String | `arrivalFlightNumber` | Trim |
| 8: `Pl vrijeme dol` | String | `arrivalScheduledTime` | **PARSE STRING** + Combine(date, time) |
| 9: `St vrijeme dol` | String | `arrivalActualTime` | **PARSE STRING** + Combine(date, time) |
| 10: `Br putnika dol` | String | `arrivalPassengers`, `arrivalInfants` | **PARSE** (vidjeti sekciju 4.1) |
| 11: `Prtljag dol (kg)` | Int | `arrivalBaggage` | parseInt ili 0 |
| 12: `Cargo dol (kg)` | Int | `arrivalCargo` | parseInt ili 0 |
| 13: `Odlazak za` | String (ICAO) | `departureAirportId` | **ICAO → IATA Conversion** + Lookup |
| 14: `Br let u odl` | String | `departureFlightNumber` | Trim |
| 15: `Pl vrijeme odl` | String | `departureScheduledTime` | **PARSE STRING** + Combine(date, time) |
| 16: `St vrijeme odl` | String | `departureActualTime` | **PARSE STRING** + Combine(date, time) |
| 17: `Br putnika odl` | String | `departurePassengers`, `departureInfants` | **PARSE** (vidjeti sekciju 4.1) |
| 18: `Prtljag odl (kg)` | Int | `departureBaggage` | parseInt ili 0 |
| 19: `Cargo odl (kg)` | Int | `departureCargo` | parseInt ili 0 |

**Generisanje "route"**:
```typescript
// Kombinuj IATA kodove u rutu format
route = `TZL-${departureIATA}-TZL`  // npr. "TZL-HHN-TZL"
```

### 3.3 Metadata Polja

Za SVE letove iz importa, postaviti:
```typescript
{
  dataSource: "IMPORT_EXCEL",
  importedFile: "DNEVNI 2022/01. JANUAR 2022.xlsx",
  isLocked: false,
  isVerified: false,
  arrivalStatus: FlightStatus.OPERATED,    // default
  departureStatus: FlightStatus.OPERATED,  // default
}
```

---

## 4. PARSIRANJE KOMPLEKSNIH PODATAKA

### 4.1 Parsiranje Broja Putnika

**Format**: `"<adults>+<infants> INF"` ili varijacije

#### 4.1.1 Sve Identifikovane Varijacije

| Input String | Adults | Infants | Napomena |
|-------------|--------|---------|----------|
| `"110+6 INF"` | 110 | 6 | Standard format |
| `"153+7 INF"` | 153 | 7 | Standard format |
| `"150 +8 INF"` | 150 | 8 | ⚠️ Razmak prije + |
| `"137+3 INF"` | 137 | 3 | Standard format |
| `"165+6 INF"` | 165 | 6 | Standard format |
| `"171+6"` | 171 | 6 | ⚠️ Bez "INF" |
| `"173+6"` | 173 | 6 | ⚠️ Bez "INF" |
| `"95+0"` | 95 | 0 | ⚠️ Bez "INF", 0 infants |
| `"149+3 INF"` | 149 | 3 | Standard format |
| `"165+7 NF"` | 165 | 7 | ⚠️ Typo: "NF" umjesto "INF" |
| `"-"` | NULL | NULL | ⚠️ Prazan podatak |
| `0` | 0 | 0 | ⚠️ Nema putnika |
| `2` | 2 | 0 | ⚠️ Samo broj (npr. medevac) |
| `"34+0 INF"` | 34 | 0 | Standard format, 0 infants |
| `""` (empty) | NULL | NULL | ⚠️ Prazan string |
| `None/null` | NULL | NULL | ⚠️ Python None |

#### 4.1.2 Regex Pattern

```typescript
const PASSENGER_PATTERNS = [
  // Pattern 1: "110+6 INF" ili "110+6 NF" ili "110 +6 INF"
  /^(\d+)\s*\+\s*(\d+)\s*(INF?|NF)?$/i,

  // Pattern 2: "110+6" (bez INF)
  /^(\d+)\s*\+\s*(\d+)$/,

  // Pattern 3: samo broj "2" ili "0"
  /^(\d+)$/,

  // Pattern 4: "-" ili prazan
  /^-*$/,
];
```

#### 4.1.3 Parsing Function

```typescript
interface PassengerData {
  adults: number | null;
  infants: number | null;
}

function parsePassengers(value: any): PassengerData {
  // Handle null/undefined/None
  if (value === null || value === undefined || value === '') {
    return { adults: null, infants: null };
  }

  // Convert to string
  const str = String(value).trim();

  // Pattern 4: "-" ili prazan
  if (/^-*$/.test(str)) {
    return { adults: null, infants: null };
  }

  // Pattern 1 & 2: "110+6 INF" ili "110+6"
  const match1 = str.match(/^(\d+)\s*\+\s*(\d+)\s*(?:INF?|NF)?$/i);
  if (match1) {
    return {
      adults: parseInt(match1[1], 10),
      infants: parseInt(match1[2], 10),
    };
  }

  // Pattern 3: samo broj "2"
  const match2 = str.match(/^(\d+)$/);
  if (match2) {
    return {
      adults: parseInt(match2[1], 10),
      infants: 0,
    };
  }

  // Ako ništa ne proradi, loguj grešku i vrati null
  console.warn(`[WARN] Cannot parse passengers: "${str}"`);
  return { adults: null, infants: null };
}
```

#### 4.1.4 Test Cases

```typescript
const testCases = [
  { input: "110+6 INF", expected: { adults: 110, infants: 6 } },
  { input: "150 +8 INF", expected: { adults: 150, infants: 8 } },
  { input: "171+6", expected: { adults: 171, infants: 6 } },
  { input: "95+0", expected: { adults: 95, infants: 0 } },
  { input: "165+7 NF", expected: { adults: 165, infants: 7 } },
  { input: "-", expected: { adults: null, infants: null } },
  { input: "0", expected: { adults: 0, infants: 0 } },
  { input: "2", expected: { adults: 2, infants: 0 } },
  { input: "", expected: { adults: null, infants: null } },
  { input: null, expected: { adults: null, infants: null } },
];
```

### 4.2 Parsiranje Rute (Format A i C)

**Format**: `"<ORIGIN>-<DESTINATION>-<RETURN>"`

```typescript
function parseRoute(route: string): {
  origin: string;
  destination: string;
  arrivalFrom: string;
  departureTo: string;
} {
  const parts = route.split('-').map(s => s.trim());

  if (parts.length === 3) {
    // Standardna ruta: "TZL-HHN-TZL"
    return {
      origin: parts[0],           // TZL
      destination: parts[1],      // HHN
      arrivalFrom: parts[1],      // Let dolazi iz HHN
      departureTo: parts[1],      // Let odlazi u HHN
    };
  }

  if (parts.length === 2) {
    // Jednostrana ruta: "TZL-HHN" (ferry out/in)
    return {
      origin: parts[0],
      destination: parts[1],
      arrivalFrom: parts[1],
      departureTo: parts[1],
    };
  }

  console.warn(`[WARN] Cannot parse route: "${route}"`);
  return {
    origin: 'TZL',
    destination: 'UNKNOWN',
    arrivalFrom: 'UNKNOWN',
    departureTo: 'UNKNOWN',
  };
}
```

**Test Cases**:
```typescript
parseRoute("TZL-HHN-TZL")    // { arrivalFrom: "HHN", departureTo: "HHN" }
parseRoute("CGN-TZL-BVA")    // { arrivalFrom: "CGN", departureTo: "BVA" } (positioning)
parseRoute("INN-TZL-INN")    // { arrivalFrom: "INN", departureTo: "INN" }
```

### 4.3 Parsiranje Vremena - Format B (2023)

**Format**: STRING - `"11:35"`, `"6:40"`, `"06:40"`

```typescript
function parseTimeString(timeStr: string): { hours: number; minutes: number } | null {
  if (!timeStr || timeStr === '-') {
    return null;
  }

  // Pattern: "HH:mm" ili "H:mm"
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) {
    console.warn(`[WARN] Cannot parse time: "${timeStr}"`);
    return null;
  }

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  // Validacija
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    console.warn(`[WARN] Invalid time values: "${timeStr}"`);
    return null;
  }

  return { hours, minutes };
}

function combineDateAndTimeString(date: Date, timeStr: string): Date | null {
  const parsed = parseTimeString(timeStr);
  if (!parsed) return null;

  const result = new Date(date);
  result.setHours(parsed.hours, parsed.minutes, 0, 0);
  return result;
}
```

**Test Cases**:
```typescript
parseTimeString("11:35")  // { hours: 11, minutes: 35 }
parseTimeString("6:40")   // { hours: 6, minutes: 40 }
parseTimeString("06:40")  // { hours: 6, minutes: 40 }
parseTimeString("23:59")  // { hours: 23, minutes: 59 }
parseTimeString("-")      // null
```

### 4.4 Normalizacija Registration

```typescript
function normalizeRegistration(reg: string): string {
  if (!reg) return '';

  // Ukloni razmake: "HA - LYG" → "HA-LYG"
  return reg.replace(/\s+/g, '').toUpperCase();
}
```

**Test Cases**:
```typescript
normalizeRegistration("HA - LYG")  // "HA-LYG"
normalizeRegistration("HA-LYS")    // "HA-LYS"
normalizeRegistration("9H-WBY")    // "9H-WBY"
```

### 4.5 Normalizacija Operation Type

```typescript
function normalizeOperationType(opType: string): string {
  if (!opType) return 'SCHEDULED';

  // Ukloni sufiks: "SCHEDULED (R)" → "SCHEDULED"
  const normalized = opType.replace(/\s*\([^)]*\)\s*$/, '').trim().toUpperCase();

  // Mapiranje varijacija
  const mapping: Record<string, string> = {
    'NON-SCHEDULED': 'CHARTER',
    'SCHEDULED': 'SCHEDULED',
    'MEDEVAC': 'MEDEVAC',
    'DIVERTED': 'DIVERTED',
    'CARGO': 'CARGO',
    'MILITARY': 'MILITARY',
    'GENERAL AVIATION': 'GENERAL_AVIATION',
  };

  return mapping[normalized] || normalized;
}
```

### 4.6 Normalizacija Airline Name

**Problem**: Ista kompanija ima različite nazive kroz godine

```typescript
const AIRLINE_NAME_MAPPING: Record<string, string> = {
  'WIZZAIR': 'WIZZAIR',
  'WIZZAIR HUNGARY LTD': 'WIZZAIR',
  'WIZZAIR MALTA LTD': 'WIZZAIR',
  'WIZZ AIR': 'WIZZAIR',

  'RYANAIR': 'RYANAIR',
  'RYANAIR UK': 'RYANAIR',

  'PEGASUS': 'PEGASUS',
  'PEGASUS AIRLINES': 'PEGASUS',

  'TURKISH AIRLINES': 'TURKISH',
  'THY': 'TURKISH',

  // Dodati ostale po potrebi...
};

function normalizeAirlineName(name: string): string {
  const normalized = name.trim().toUpperCase();
  return AIRLINE_NAME_MAPPING[normalized] || normalized;
}
```

---

## 5. LOOKUP TABELE I REFERENTNI PODACI

### 5.1 Airline (Aviokompanije)

#### 5.1.1 Ekstraktovane Kompanije (Preliminarno)

Iz analiziranih fajlova:
```
WIZZAIR / WIZZAIR HUNGARY LTD / WIZZAIR MALTA LTD
RYANAIR / RYANAIR UK
PEGASUS / PEGASUS AIRLINES
TURKISH AIRLINES / THY
AJET
FLYNAS
FLYDUBAI
TYROL AIR AMBULANCE
AUSTRIAN AIRLINES
LUFTHANSA
EUROWINGS
...
```

#### 5.1.2 Seed Strategija

**Opcija 1**: Manual Seed
```typescript
const airlines = [
  {
    name: 'Wizz Air',
    icaoCode: 'WZZ',
    iataCode: 'W6',
    country: 'Hungary',
  },
  {
    name: 'Ryanair',
    icaoCode: 'RYR',
    iataCode: 'FR',
    country: 'Ireland',
  },
  // ...
];
```

**Opcija 2**: Automatska Ekstrakcija
```bash
# Ekstrahovati sve unique airline names iz Excel fajlova
# Koristiti OpenSky Network API ili AviationStack API za detalje
```

### 5.2 Airport (Aerodromi)

#### 5.2.1 Ekstraktovani Kodovi

**IATA Kodovi** (iz ruta 2008-2022, 2024-2025):
```
TZL, HHN, FMM, MLH, BER, GOT, BLL, INN, DXB, CGN, BVA, CPH,
DTM, SAW, NYO, BVA, VIE, NUE, SXF, HAM, MUC, STR, LTN, STN,
CRL, EIN, WMI, KTW, GDN, POZ, WRO, BUD, SOF, OTP, SKP, PRN,
TIA, DBV, SPU, ZAG, BEG, ...
```

**ICAO Kodovi** (iz 2023):
```
EDLW (Dortmund), EDDN (Nürnberg), EDNY (Friedrichshafen),
EDDB (Berlin Brandenburg), ESGG (Göteborg), EDDK (Köln/Bonn),
EDSB (Karlsruhe/Baden-Baden), LOWW (Vienna), EDJA (Memmingen),
...
```

#### 5.2.2 ICAO ↔ IATA Mapping

**Potrebna lookup tabela**:
```typescript
const ICAO_TO_IATA: Record<string, string> = {
  'EDLW': 'DTM',  // Dortmund
  'EDDN': 'NUE',  // Nürnberg
  'EDNY': 'FDH',  // Friedrichshafen
  'EDDB': 'BER',  // Berlin
  'ESGG': 'GOT',  // Göteborg
  'EDDK': 'CGN',  // Köln/Bonn
  'EDSB': 'FKB',  // Karlsruhe
  'LOWW': 'VIE',  // Vienna
  'EDJA': 'FMM',  // Memmingen
  // ... dodati ostale
};
```

#### 5.2.3 Seed Strategija

**Opcija 1**: Koristiti eksternu biblioteku
```bash
npm install airport-codes
```

**Opcija 2**: API poziv
```typescript
// AviationStack ili OpenSky Network
// Fetch airport details by IATA/ICAO
```

**Opcija 3**: Static JSON
```json
[
  {
    "iataCode": "TZL",
    "icaoCode": "LQTZ",
    "name": "Tuzla International Airport",
    "city": "Tuzla",
    "country": "Bosnia and Herzegovina",
    "isEU": false
  },
  // ...
]
```

### 5.3 AircraftType (Tipovi Aviona)

#### 5.3.1 Ekstraktovani Tipovi

```
A320, A321, A319
B737, B738 (Boeing 737-800), B733
Citation Bravo
ATR 72
Embraer 190
...
```

#### 5.3.2 Seed Data

```typescript
const aircraftTypes = [
  {
    model: 'A320',
    seats: 180,
    mtow: 78000,  // kg
  },
  {
    model: 'A321',
    seats: 220,
    mtow: 89000,
  },
  {
    model: 'B737',
    seats: 189,
    mtow: 79015,
  },
  {
    model: 'B738',  // Boeing 737-800
    seats: 189,
    mtow: 79015,
  },
  {
    model: 'Citation Bravo',
    seats: 8,
    mtow: 7000,
  },
  // ...
];
```

### 5.4 OperationType (Tipovi Operacija)

```typescript
const operationTypes = [
  {
    code: 'SCHEDULED',
    name: 'Redovan',
    description: 'Redovni linijski let',
  },
  {
    code: 'CHARTER',
    name: 'Charter',
    description: 'Charter let (NON-SCHEDULED)',
  },
  {
    code: 'MEDEVAC',
    name: 'Medicinska evakuacija',
    description: 'Hitna medicinska evakuacija',
  },
  {
    code: 'DIVERTED',
    name: 'Preusmjeren',
    description: 'Let preusmjeren sa druge destinacije',
  },
  {
    code: 'CARGO',
    name: 'Cargo',
    description: 'Teretni let',
  },
  {
    code: 'MILITARY',
    name: 'Vojni',
    description: 'Vojni let',
  },
  {
    code: 'GENERAL_AVIATION',
    name: 'Generalna avijacija',
    description: 'Privatni/business letovi',
  },
];
```

---

## 6. ETL PIPELINE ARHITEKTURA

### 6.1 Folder Struktura

```
scripts/
├── import/
│   ├── 1-extract-reference-data.ts
│   ├── 2-seed-reference-tables.ts
│   ├── 3-parse-excel-files.ts
│   ├── 4-validate-data.ts
│   ├── 5-import-to-database.ts
│   ├── 6-generate-report.ts
│   │
│   ├── config/
│   │   ├── import-config.ts          # Konfiguracija (batch size, etc.)
│   │   ├── airline-mapping.ts        # Airline name normalization
│   │   ├── icao-iata-mapping.ts      # ICAO ↔ IATA mapping
│   │   └── aircraft-seed.ts          # Aircraft types seed data
│   │
│   ├── utils/
│   │   ├── excel-parser.ts           # Parsiranje Excel fajlova
│   │   ├── format-detector.ts        # Detekcija formata (A/B/C)
│   │   ├── passenger-parser.ts       # Parsiranje "165+6 INF"
│   │   ├── route-parser.ts           # Parsiranje ruta
│   │   ├── time-parser.ts            # Parsiranje vremena (string)
│   │   ├── normalizers.ts            # Normalizacija podataka
│   │   └── validators.ts             # Validacione funkcije
│   │
│   ├── types/
│   │   ├── excel-formats.ts          # TypeScript types za formate
│   │   └── import-result.ts          # Result types
│   │
│   └── test/
│       ├── passenger-parser.test.ts
│       ├── route-parser.test.ts
│       ├── time-parser.test.ts
│       └── normalizers.test.ts
│
├── output/
│   ├── reference-data/
│   │   ├── airlines.json
│   │   ├── airports.json
│   │   ├── aircraft-types.json
│   │   └── operation-types.json
│   │
│   ├── parsed-data/
│   │   ├── 2008/
│   │   ├── 2009/
│   │   ├── ...
│   │   └── 2025/
│   │
│   ├── validation-reports/
│   │   ├── errors.json
│   │   ├── warnings.json
│   │   └── summary.json
│   │
│   └── import-logs/
│       ├── import-2026-01-05.log
│       └── ...
│
└── prisma/
    └── seed-imports.ts               # Prisma seed script
```

### 6.2 Workflow Dijagram

```
┌─────────────────────────────────────────────────────────────┐
│ FAZA 1: EKSTRAKCIJA REFERENTNIH PODATAKA                   │
└─────────────────────────────────────────────────────────────┘
          │
          ├─► Scan all Excel files
          ├─► Extract unique airlines → airlines.json
          ├─► Extract unique airports → airports.json
          ├─► Extract unique aircraft → aircraft-types.json
          └─► Extract unique op types → operation-types.json
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ FAZA 2: SEED LOOKUP TABELE                                  │
└─────────────────────────────────────────────────────────────┘
          │
          ├─► Enrich data (ICAO codes, countries, etc.)
          ├─► Insert into Airline table
          ├─► Insert into Airport table
          ├─► Insert into AircraftType table
          └─► Insert into OperationType table
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ FAZA 3: PARSIRANJE EXCEL FAJLOVA                            │
└─────────────────────────────────────────────────────────────┘
          │
          ├─► For each year (2008-2026)
          │   │
          │   ├─► For each month
          │   │   │
          │   │   ├─► Detect format (A/B/C)
          │   │   ├─► Parse based on format
          │   │   ├─► Transform data
          │   │   └─► Validate
          │   │
          │   └─► Save to JSON (parsed-data/<year>/<month>.json)
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ FAZA 4: VALIDACIJA                                          │
└─────────────────────────────────────────────────────────────┘
          │
          ├─► Check required fields
          ├─► Validate foreign keys (airline, airport, aircraft)
          ├─► Check date ranges
          ├─► Detect duplicates
          └─► Generate validation report
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ FAZA 5: IMPORT U BAZU                                       │
└─────────────────────────────────────────────────────────────┘
          │
          ├─► Batch insert (500-1000 records per transaction)
          ├─► Track progress
          ├─► Handle errors gracefully
          └─► Generate import log
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│ FAZA 6: FINALNI IZVJEŠTAJ                                   │
└─────────────────────────────────────────────────────────────┘
          │
          ├─► Total flights imported
          ├─► Breakdown by year
          ├─► Breakdown by airline
          ├─► Errors summary
          └─► Warnings summary
```

### 6.3 Script Details

#### 6.3.1 `1-extract-reference-data.ts`

**Zadatak**: Skenirati sve Excel fajlove i ekstraktovati unique vrednosti

```typescript
import { scanDirectory } from './utils/file-scanner';
import { ExcelParser } from './utils/excel-parser';

async function extractReferenceData() {
  const statsDir = '/Users/emir_mw/stats/STATS';

  const airlines = new Set<string>();
  const airports = new Set<string>();
  const aircraftTypes = new Set<string>();
  const operationTypes = new Set<string>();

  // Scan all Excel files
  const files = await scanDirectory(statsDir, '**/*.xls*');

  for (const file of files) {
    const data = await ExcelParser.parse(file);

    for (const row of data) {
      if (row.airline) airlines.add(normalizeAirlineName(row.airline));
      if (row.aircraftType) aircraftTypes.add(row.aircraftType);
      if (row.operationType) operationTypes.add(normalizeOperationType(row.operationType));

      // Extract airports from route
      const { arrivalFrom, departureTo } = parseRoute(row.route);
      if (arrivalFrom) airports.add(arrivalFrom);
      if (departureTo) airports.add(departureTo);
    }
  }

  // Save to JSON
  await saveJSON('output/reference-data/airlines.json', Array.from(airlines));
  await saveJSON('output/reference-data/airports.json', Array.from(airports));
  await saveJSON('output/reference-data/aircraft-types.json', Array.from(aircraftTypes));
  await saveJSON('output/reference-data/operation-types.json', Array.from(operationTypes));

  console.log('✅ Reference data extracted');
}
```

#### 6.3.2 `2-seed-reference-tables.ts`

**Zadatak**: Popuniti Airline, Airport, AircraftType, OperationType tabele

```typescript
import { PrismaClient } from '@prisma/client';
import { enrichAirlineData } from './enrichment/airline-enrichment';
import { enrichAirportData } from './enrichment/airport-enrichment';

const prisma = new PrismaClient();

async function seedReferenceTables() {
  // 1. Seed Airlines
  const airlines = await loadJSON('output/reference-data/airlines.json');
  const enrichedAirlines = await enrichAirlineData(airlines);

  for (const airline of enrichedAirlines) {
    await prisma.airline.upsert({
      where: { icaoCode: airline.icaoCode },
      update: {},
      create: {
        name: airline.name,
        icaoCode: airline.icaoCode,
        iataCode: airline.iataCode,
        country: airline.country,
      },
    });
  }

  // 2. Seed Airports
  const airports = await loadJSON('output/reference-data/airports.json');
  const enrichedAirports = await enrichAirportData(airports);

  for (const airport of enrichedAirports) {
    await prisma.airport.upsert({
      where: { iataCode: airport.iataCode },
      update: {},
      create: {
        iataCode: airport.iataCode,
        icaoCode: airport.icaoCode,
        name: airport.name,
        city: airport.city,
        country: airport.country,
        isEU: airport.isEU,
      },
    });
  }

  // 3. Seed Aircraft Types
  // ...

  // 4. Seed Operation Types
  // ...

  console.log('✅ Reference tables seeded');
}
```

#### 6.3.3 `3-parse-excel-files.ts`

**Zadatak**: Parsirati sve Excel fajlove i transformisati u standardni format

```typescript
async function parseExcelFiles() {
  const statsDir = '/Users/emir_mw/stats/STATS';
  const files = await scanDirectory(statsDir, '**/*Dnevni izvještaj*.xls*');

  for (const file of files) {
    const format = detectFormat(file);
    let data: Flight[];

    switch (format) {
      case 'FORMAT_A':
        data = await parseFormatA(file);
        break;
      case 'FORMAT_B':
        data = await parseFormatB(file);
        break;
      case 'FORMAT_C':
        data = await parseFormatC(file);
        break;
    }

    // Transform and normalize
    const normalized = data.map(normalizeFlightData);

    // Save to JSON
    const outputPath = getOutputPath(file);
    await saveJSON(outputPath, normalized);
  }

  console.log('✅ All Excel files parsed');
}
```

#### 6.3.4 `4-validate-data.ts`

**Zadatak**: Validirati parsirane podatke

```typescript
async function validateData() {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const files = await scanDirectory('output/parsed-data', '**/*.json');

  for (const file of files) {
    const flights = await loadJSON(file);

    for (const flight of flights) {
      // Required field validation
      if (!flight.date) {
        errors.push({ file, flight, field: 'date', message: 'Missing date' });
      }

      // Foreign key validation
      const airlineExists = await checkAirlineExists(flight.airlineId);
      if (!airlineExists) {
        errors.push({ file, flight, field: 'airlineId', message: 'Airline not found' });
      }

      // Logical validation
      if (flight.arrivalPassengers < 0) {
        warnings.push({ file, flight, field: 'arrivalPassengers', message: 'Negative passengers' });
      }

      // Date range validation
      if (flight.date > new Date()) {
        warnings.push({ file, flight, field: 'date', message: 'Future date' });
      }
    }
  }

  // Save validation reports
  await saveJSON('output/validation-reports/errors.json', errors);
  await saveJSON('output/validation-reports/warnings.json', warnings);

  console.log(`✅ Validation complete: ${errors.length} errors, ${warnings.length} warnings`);
}
```

#### 6.3.5 `5-import-to-database.ts`

**Zadatak**: Bulk insert podataka u bazu

```typescript
async function importToDatabase() {
  const BATCH_SIZE = 500;
  const files = await scanDirectory('output/parsed-data', '**/*.json');

  let totalImported = 0;

  for (const file of files) {
    const flights = await loadJSON(file);

    // Process in batches
    for (let i = 0; i < flights.length; i += BATCH_SIZE) {
      const batch = flights.slice(i, i + BATCH_SIZE);

      await prisma.$transaction(async (tx) => {
        for (const flight of batch) {
          await tx.flight.create({ data: flight });
        }
      });

      totalImported += batch.length;
      console.log(`Imported ${totalImported} / ${flights.length} flights`);
    }
  }

  console.log(`✅ Import complete: ${totalImported} flights imported`);
}
```

#### 6.3.6 `6-generate-report.ts`

**Zadatak**: Generisati finalni izvještaj

```typescript
async function generateReport() {
  const report = {
    importDate: new Date(),
    totalFlights: await prisma.flight.count(),
    byYear: await getFlightsByYear(),
    byAirline: await getFlightsByAirline(),
    errors: await loadJSON('output/validation-reports/errors.json'),
    warnings: await loadJSON('output/validation-reports/warnings.json'),
  };

  // Save report
  await saveJSON('output/import-reports/final-report.json', report);

  // Generate human-readable report
  const markdown = generateMarkdownReport(report);
  await saveFile('output/import-reports/final-report.md', markdown);

  console.log('✅ Final report generated');
}
```

---

## 7. VALIDACIJA I ERROR HANDLING

### 7.1 Validaciona Pravila

#### 7.1.1 Required Fields

```typescript
const REQUIRED_FIELDS = [
  'date',
  'airlineId',
  'aircraftTypeId',
  'registration',
  'operationTypeId',
];

function validateRequiredFields(flight: any): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (!flight[field]) {
      errors.push({
        field,
        message: `Missing required field: ${field}`,
        severity: 'ERROR',
      });
    }
  }

  return errors;
}
```

#### 7.1.2 Data Type Validation

```typescript
function validateDataTypes(flight: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Date validation
  if (flight.date && !(flight.date instanceof Date)) {
    errors.push({
      field: 'date',
      message: 'Date must be a valid Date object',
      severity: 'ERROR',
    });
  }

  // Passenger validation
  if (flight.arrivalPassengers !== null && flight.arrivalPassengers < 0) {
    errors.push({
      field: 'arrivalPassengers',
      message: 'Passengers cannot be negative',
      severity: 'ERROR',
    });
  }

  // Baggage validation
  if (flight.arrivalBaggage && flight.arrivalBaggage < 0) {
    errors.push({
      field: 'arrivalBaggage',
      message: 'Baggage cannot be negative',
      severity: 'WARNING',
    });
  }

  return errors;
}
```

#### 7.1.3 Foreign Key Validation

```typescript
async function validateForeignKeys(flight: any): Promise<ValidationError[]> {
  const errors: ValidationError[] = [];

  // Airline exists
  const airline = await prisma.airline.findUnique({
    where: { id: flight.airlineId },
  });
  if (!airline) {
    errors.push({
      field: 'airlineId',
      message: `Airline not found: ${flight.airlineId}`,
      severity: 'ERROR',
    });
  }

  // Airport exists
  if (flight.arrivalAirportId) {
    const airport = await prisma.airport.findUnique({
      where: { id: flight.arrivalAirportId },
    });
    if (!airport) {
      errors.push({
        field: 'arrivalAirportId',
        message: `Airport not found: ${flight.arrivalAirportId}`,
        severity: 'ERROR',
      });
    }
  }

  // Aircraft type exists
  const aircraft = await prisma.aircraftType.findUnique({
    where: { id: flight.aircraftTypeId },
  });
  if (!aircraft) {
    errors.push({
      field: 'aircraftTypeId',
      message: `Aircraft type not found: ${flight.aircraftTypeId}`,
      severity: 'ERROR',
    });
  }

  return errors;
}
```

#### 7.1.4 Business Logic Validation

```typescript
function validateBusinessLogic(flight: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Passengers + Infants should not exceed aircraft capacity
  if (flight.aircraftSeats) {
    const totalPax = (flight.arrivalPassengers || 0) + (flight.arrivalInfants || 0);
    if (totalPax > flight.aircraftSeats) {
      errors.push({
        field: 'arrivalPassengers',
        message: `Total passengers (${totalPax}) exceeds aircraft capacity (${flight.aircraftSeats})`,
        severity: 'WARNING',
      });
    }
  }

  // Departure time should be after arrival time (for turnaround)
  if (flight.arrivalActualTime && flight.departureScheduledTime) {
    if (flight.departureScheduledTime < flight.arrivalActualTime) {
      errors.push({
        field: 'departureScheduledTime',
        message: 'Departure time is before arrival time',
        severity: 'WARNING',
      });
    }
  }

  // Date should not be in the future
  if (flight.date > new Date()) {
    errors.push({
      field: 'date',
      message: 'Flight date is in the future',
      severity: 'WARNING',
    });
  }

  return errors;
}
```

### 7.2 Error Handling Strategija

#### 7.2.1 Error Severity Levels

```typescript
enum ErrorSeverity {
  ERROR = 'ERROR',       // Critical - blokira import
  WARNING = 'WARNING',   // Ne blokira, ali loguje
  INFO = 'INFO',         // Informativno
}
```

#### 7.2.2 Error Handling Flow

```typescript
async function processFlightWithErrorHandling(flight: any, context: ImportContext) {
  const errors: ValidationError[] = [];

  try {
    // Validate
    errors.push(...validateRequiredFields(flight));
    errors.push(...validateDataTypes(flight));
    errors.push(...await validateForeignKeys(flight));
    errors.push(...validateBusinessLogic(flight));

    // Filter critical errors
    const criticalErrors = errors.filter(e => e.severity === 'ERROR');

    if (criticalErrors.length > 0) {
      // Log and skip
      context.stats.errors++;
      context.errorLog.push({
        file: context.currentFile,
        flight,
        errors: criticalErrors,
      });
      return null;  // Skip this flight
    }

    // Log warnings
    const warnings = errors.filter(e => e.severity === 'WARNING');
    if (warnings.length > 0) {
      context.stats.warnings++;
      context.warningLog.push({
        file: context.currentFile,
        flight,
        warnings,
      });
    }

    // Import
    return await prisma.flight.create({ data: flight });

  } catch (error) {
    // Unexpected error
    context.stats.fatalErrors++;
    context.fatalErrorLog.push({
      file: context.currentFile,
      flight,
      error: error.message,
      stack: error.stack,
    });
    return null;
  }
}
```

### 7.3 Duplicate Detection

```typescript
async function checkDuplicate(flight: any): Promise<boolean> {
  // Check if flight already exists
  const existing = await prisma.flight.findFirst({
    where: {
      date: flight.date,
      airlineId: flight.airlineId,
      arrivalFlightNumber: flight.arrivalFlightNumber,
      departureFlightNumber: flight.departureFlightNumber,
    },
  });

  return !!existing;
}
```

### 7.4 Rollback Strategija

```typescript
async function importWithRollback(flights: any[]) {
  const BATCH_SIZE = 500;

  for (let i = 0; i < flights.length; i += BATCH_SIZE) {
    const batch = flights.slice(i, i + BATCH_SIZE);

    try {
      await prisma.$transaction(async (tx) => {
        for (const flight of batch) {
          await tx.flight.create({ data: flight });
        }
      });

      console.log(`✅ Batch ${i / BATCH_SIZE + 1} imported`);

    } catch (error) {
      console.error(`❌ Batch ${i / BATCH_SIZE + 1} failed:`, error.message);

      // Rollback automatski kroz transaction
      // Nastavi sa sledećim batch-om
    }
  }
}
```

---

## 8. TESTING STRATEGIJA

### 8.1 Unit Tests

```typescript
// passenger-parser.test.ts
describe('parsePassengers', () => {
  test('should parse standard format "110+6 INF"', () => {
    expect(parsePassengers('110+6 INF')).toEqual({
      adults: 110,
      infants: 6,
    });
  });

  test('should parse format with space "150 +8 INF"', () => {
    expect(parsePassengers('150 +8 INF')).toEqual({
      adults: 150,
      infants: 8,
    });
  });

  test('should parse without INF suffix "171+6"', () => {
    expect(parsePassengers('171+6')).toEqual({
      adults: 171,
      infants: 6,
    });
  });

  test('should parse typo "165+7 NF"', () => {
    expect(parsePassengers('165+7 NF')).toEqual({
      adults: 165,
      infants: 7,
    });
  });

  test('should handle dash "-"', () => {
    expect(parsePassengers('-')).toEqual({
      adults: null,
      infants: null,
    });
  });

  test('should handle single number "2"', () => {
    expect(parsePassengers('2')).toEqual({
      adults: 2,
      infants: 0,
    });
  });
});
```

### 8.2 Integration Tests

```typescript
// format-detection.test.ts
describe('Format Detection', () => {
  test('should detect Format A (2008-2022)', async () => {
    const file = '/Users/emir_mw/stats/STATS/DNEVNI 2022/01. JANUAR 2022.xlsx';
    const format = await detectFormat(file);
    expect(format).toBe('FORMAT_A');
  });

  test('should detect Format B (2023)', async () => {
    const file = '/Users/emir_mw/stats/STATS/2023/Mjesečni izvještaji/01. JANUAR 2023/Dnevni izvještaj o saobraćaju.xlsx';
    const format = await detectFormat(file);
    expect(format).toBe('FORMAT_B');
  });
});
```

### 8.3 E2E Test

```typescript
// import-pipeline.test.ts
describe('Full Import Pipeline', () => {
  test('should import one month successfully', async () => {
    const file = 'test-data/01. JANUAR 2022.xlsx';

    // Extract
    const rawData = await parseExcelFile(file);
    expect(rawData.length).toBeGreaterThan(0);

    // Transform
    const normalized = rawData.map(normalizeFlightData);

    // Validate
    const errors = normalized.flatMap(validateFlight);
    expect(errors.filter(e => e.severity === 'ERROR')).toHaveLength(0);

    // Import
    const imported = await importFlights(normalized);
    expect(imported.count).toBe(normalized.length);
  });
});
```

---

## 9. IMPLEMENTACIJA PLAN

### 9.1 Timeline

| Faza | Trajanje | Zadaci |
|------|----------|--------|
| **Faza 1**: Setup | 1 dan | - Setup projekta<br>- Install dependencies<br>- Create folder structure |
| **Faza 2**: Parseri | 2-3 dana | - Excel parser<br>- Passenger parser<br>- Route parser<br>- Time parser<br>- Unit tests |
| **Faza 3**: Referentni podaci | 1-2 dana | - Extract reference data<br>- Enrich data (API calls)<br>- Seed lookup tables |
| **Faza 4**: ETL Pipeline | 3-4 dana | - Format detection<br>- Parse all formats<br>- Transform & normalize<br>- Validation |
| **Faza 5**: Testing | 2 dana | - Test parseri<br>- Test na sample data<br>- Fix bugs |
| **Faza 6**: Bulk Import | 1 dan | - Import script<br>- Progress tracking<br>- Error handling |
| **Faza 7**: Validacija | 1 dan | - Run validations<br>- Generate reports<br>- Fix critical errors |
| **Faza 8**: Production Import | 1 dan | - Full import<br>- Monitor<br>- Final report |

**Total**: 12-15 dana

### 9.2 Dependencies

```json
{
  "dependencies": {
    "@prisma/client": "^5.x",
    "exceljs": "^4.x",
    "xlsx": "^0.18.x"
  },
  "devDependencies": {
    "@types/node": "^20.x",
    "ts-node": "^10.x",
    "typescript": "^5.x",
    "vitest": "^1.x"
  }
}
```

### 9.3 Execution Plan

#### 9.3.1 Development

```bash
# 1. Setup
npm install
npm run db:push

# 2. Extract reference data
npm run import:extract-reference

# 3. Seed lookup tables
npm run import:seed-reference

# 4. Parse Excel files (dry run)
npm run import:parse -- --dry-run

# 5. Validate
npm run import:validate

# 6. Import (single month test)
npm run import:run -- --year 2022 --month 01

# 7. Import all
npm run import:run -- --all

# 8. Generate report
npm run import:report
```

#### 9.3.2 Scripts (package.json)

```json
{
  "scripts": {
    "import:extract-reference": "ts-node scripts/import/1-extract-reference-data.ts",
    "import:seed-reference": "ts-node scripts/import/2-seed-reference-tables.ts",
    "import:parse": "ts-node scripts/import/3-parse-excel-files.ts",
    "import:validate": "ts-node scripts/import/4-validate-data.ts",
    "import:run": "ts-node scripts/import/5-import-to-database.ts",
    "import:report": "ts-node scripts/import/6-generate-report.ts",
    "import:test": "vitest run"
  }
}
```

### 9.4 Configuration

```typescript
// config/import-config.ts
export const ImportConfig = {
  // Paths
  STATS_DIR: '/Users/emir_mw/stats/STATS',
  OUTPUT_DIR: 'output',

  // Batch settings
  BATCH_SIZE: 500,
  MAX_CONCURRENT_FILES: 5,

  // Validation settings
  SKIP_VALIDATION: false,
  FAIL_ON_ERROR: true,
  FAIL_ON_WARNING: false,

  // Import settings
  DRY_RUN: false,
  IMPORT_ALL: true,
  YEARS: [2008, 2009, 2010, /* ... */ 2025, 2026],

  // Logging
  LOG_LEVEL: 'INFO',
  LOG_FILE: 'output/import-logs/import.log',
};
```

---

## 10. RISK MANAGEMENT

### 10.1 Identified Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Nekonzistentni podaci** | High | High | Ekstenzivna validacija, manual review |
| **Missing lookup data** | Medium | High | Fallback na default vrednosti, manual fix |
| **Performance issues** | Medium | Medium | Batch processing, progress tracking |
| **Data corruption** | Low | Critical | Transaction rollback, backups |
| **ICAO/IATA mapping errors** | Medium | Medium | External API validation |
| **Memory overflow** | Low | Medium | Stream processing umesto load all |
| **Duplicate entries** | Medium | High | Duplicate detection pre-insert |

### 10.2 Contingency Plan

**Scenario 1**: Import fails na pola puta
- **Solution**: Resume od zadnjeg uspješnog batch-a, checkpoint system

**Scenario 2**: Kritične greške u validaciji
- **Solution**: Manual review, popuniti missing data, re-run

**Scenario 3**: Performance degradation
- **Solution**: Optimize batch size, add indexes, parallelize

---

## 11. POST-IMPORT TASKS

### 11.1 Data Verification

```sql
-- Verify total flights by year
SELECT
  EXTRACT(YEAR FROM date) as year,
  COUNT(*) as total_flights,
  COUNT(DISTINCT "airlineId") as unique_airlines,
  SUM(COALESCE("arrivalPassengers", 0) + COALESCE("departurePassengers", 0)) as total_passengers
FROM "Flight"
GROUP BY year
ORDER BY year;

-- Verify top airlines
SELECT
  a.name,
  COUNT(*) as total_flights
FROM "Flight" f
JOIN "Airline" a ON f."airlineId" = a.id
GROUP BY a.name
ORDER BY total_flights DESC
LIMIT 10;

-- Check for missing data
SELECT
  COUNT(*) FILTER (WHERE "arrivalPassengers" IS NULL) as missing_arrival_pax,
  COUNT(*) FILTER (WHERE "departurePassengers" IS NULL) as missing_departure_pax,
  COUNT(*) FILTER (WHERE "arrivalActualTime" IS NULL) as missing_arrival_time,
  COUNT(*) FILTER (WHERE "departureActualTime" IS NULL) as missing_departure_time
FROM "Flight";
```

### 11.2 Index Optimization

```sql
-- Already defined in Prisma schema, but verify:
CREATE INDEX IF NOT EXISTS "Flight_date_idx" ON "Flight"(date);
CREATE INDEX IF NOT EXISTS "Flight_airlineId_idx" ON "Flight"("airlineId");
CREATE INDEX IF NOT EXISTS "Flight_route_idx" ON "Flight"(route);
```

### 11.3 Data Cleanup

```sql
-- Remove duplicate flights (keep first)
DELETE FROM "Flight" f1
USING "Flight" f2
WHERE f1.id > f2.id
  AND f1.date = f2.date
  AND f1."airlineId" = f2."airlineId"
  AND f1."arrivalFlightNumber" = f2."arrivalFlightNumber";
```

---

## 12. ZAKLJUČAK

Ovaj plan pokriva kompletan ETL proces za import Excel statistika u produkcijsku bazu. Ključni aspekti:

✅ **Identifikovane sve varijacije formata** (Format A, B, C)
✅ **Mapiranje svih kolona** na Prisma modele
✅ **Parsiranje kompleksnih podataka** (putnici, rute, vremena)
✅ **Lookup tabele strategija** (Airlines, Airports, Aircraft, OperationTypes)
✅ **Robusna validacija** sa error handling
✅ **Batch import** sa transaction rollback
✅ **Testing strategija** (unit, integration, e2e)
✅ **Risk management** i contingency plan

### Sledeći Koraci

1. **Review ovog plana** - Dodati/modificirati prema potrebi
2. **Approve plan** - Dobiti odobrenje za implementaciju
3. **Start implementation** - Kreirati skripte po fazama
4. **Test na sample data** - Testirati na 1-2 mjeseca prvo
5. **Full import** - Pokrenuti na svim podacima

---

**Verzija**: 1.0
**Zadnje ažurirano**: 2026-01-05
