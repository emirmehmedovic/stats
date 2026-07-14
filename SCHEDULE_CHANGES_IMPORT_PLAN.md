# Schedule Changes Import - Plan Implementacije

## 📋 Pregled

Implementacija import sistema za "Schedule Changes TZL" mail format koji dolazi od aviokompanija. Sistem omogućava automatsko generisanje i ažuriranje rasporeda letova na osnovu pravila ponavljanja.

### Ključne karakteristike
- ✅ Upload .txt fajla sa Schedule Changes mail-om
- ✅ Expansion logic: jedno pravilo → mnogo datuma
- ✅ UPSERT: update postojećih, create novih letova
- ✅ UTC → lokalno vrijeme konverzija
- ✅ Preview prije import-a
- ✅ Handling otkazanih letova (Cancel)

---

## 🎯 Zadaci

### FAZA 1: Parser logika
**Fajl:** `/src/lib/parsers/schedule-changes.ts`

#### Zadatak 1.1: Osnovne helper funkcije
```typescript
// Funkcije za implementaciju:
- parseString(value: any): string | null
- parseDate(value: string): Date | null  // M/D/YYYY → Date
- parseTime(dateStr: string, timeStr: string): Date | null  // "6/3/2026" + "7:10 PM" → DateTime
- parseOnDays(onDays: string): number[]  // "1_3_5__" → [0, 2, 4]
- parseLeg(leg: string): { origin: string, destination: string }  // "MSTTZL" → {origin: "MST", destination: "TZL"}
- utcToLocal(date: Date, time: Date): Date  // UTC → Europe/Sarajevo
```

#### Zadatak 1.2: Parse tabelarnog formata
```typescript
// Funkcija: parseScheduleChangesText(text: string): ScheduleChangeRow[]
//
// Input: Tab-separated ili fixed-width tekst iz mail-a
// Output: Array ScheduleChangeRow objekata
//
// Struktura ScheduleChangeRow:
{
  carrier: string;           // W6
  flight: string;            // 4242
  leg: string;               // MSTTZL
  changeType: string;        // None, Cancel
  from: string;              // 6/3/2026
  to: string;                // 6/3/2026
  std: string;               // 7:10 PM
  sta: string;               // 9:15 PM
  acType: string;            // 32Q
  seatConf: string;          // 239
  onDays: string;            // __3____
  season: string;            // S26
  affectedFlights: number;   // 1
}
```

**Logika parsiranja:**
1. Split tekst po novim linijama
2. Pronađi header red (Carrier, Flight, Leg...)
3. Parsaj podatke (tab-separated ili fixed-width)
4. Validiraj svaki red
5. Vraćaj array ScheduleChangeRow objekata

#### Zadatak 1.3: Expansion logic
```typescript
// Funkcija: expandRule(rule: ScheduleChangeRow): ExpandedFlight[]
//
// Input: Jedno pravilo (From/To + On days)
// Output: Array konkretnih letova za sve datume
//
// Logika:
1. Parsaj From i To datume
2. Parsaj On days → lista dana u sedmici [0-6]
3. Iteruj od From do To:
   - Ako weekday() je u listi → kreiraj ExpandedFlight
4. Za svaki let:
   - Parsaj Leg → origin/destination
   - Konvertuj STD/STA iz UTC u lokalno vrijeme
   - Odredi da li je departure (origin=TZL) ili arrival (destination=TZL)
   - Postavi flightNumber, times, aircraft, seats
   - Postavi status (CANCELLED ako changeType='Cancel')
```

**Struktura ExpandedFlight:**
```typescript
{
  date: Date;                      // 2026-06-03
  carrier: string;                 // W6
  flightNumber: string;            // W6 4242
  origin: string;                  // MST
  destination: string;             // TZL
  route: string;                   // MST-TZL

  departureFlightNumber: string | null;
  departureScheduledTime: Date | null;

  arrivalFlightNumber: string | null;
  arrivalScheduledTime: Date | null;

  aircraftType: string;            // 32Q
  availableSeats: number;          // 239

  status: 'SCHEDULED' | 'CANCELLED';
  changeType: string;              // None, Cancel
  season: string;                  // S26
}
```

#### Zadatak 1.4: Glavni parser funkcija
```typescript
// Funkcija: parseScheduleChangesFile(fileBuffer: Buffer)
//
// Orchestrator funkcija koja:
1. Konvertuje Buffer → text
2. Poziva parseScheduleChangesText() → rules
3. Za svaki rule poziva expandRule() → flights
4. Validira rezultate
5. Vraća:
{
  success: boolean;
  rows: ScheduleChangeRow[];
  expandedFlights: ExpandedFlight[];
  totalRules: number;
  totalFlights: number;
  errors: string[];
}
```

**Validacije:**
- ✅ Datum format validan
- ✅ Vrijeme format validan
- ✅ On days ima tačno 7 karaktera
- ✅ Leg ima tačno 6 karaktera
- ✅ From <= To
- ✅ Broj generisanih letova odgovara affectedFlights (upozorenje ako ne)

---

### FAZA 2: API Endpoint
**Fajl:** `/src/app/api/flights/import-schedule-changes/route.ts`

#### Zadatak 2.1: Request handling
```typescript
// POST endpoint sa:
- Body parsing (FormData)
- File validation (.txt, max 10MB)
- Rate limiting (5 req/min)
- dryRun parametar (true/false)
```

#### Zadatak 2.2: Preview mode (dryRun=true)
```typescript
// Logika:
1. Parsaj fajl → expandedFlights
2. Za prvih 10 letova, provjeri u bazi:
   - Da li postoji (WHERE date + flight + route)
   - Ako postoji → action = 'UPDATE'
   - Ako ne postoji → action = 'CREATE'
   - Ako je Cancel → action = 'CANCEL'
3. Statistika:
   - totalRules: broj redova iz mail-a
   - totalFlights: broj generisanih letova
   - toCreate: letovi koji ne postoje u bazi
   - toUpdate: letovi koji postoje i biće update-ovani
   - toCancel: letovi sa Cancel status
4. Return preview data
```

#### Zadatak 2.3: Import mode (dryRun=false)
```typescript
// Logika:
1. Parsaj fajl → expandedFlights
2. Za svaki flight:
   - Pozovi upsertFlight(flight)
   - Track rezultate (created, updated, cancelled, errors)
3. Return rezultate
```

#### Zadatak 2.4: UPSERT funkcija
```typescript
// Funkcija: upsertFlight(flight: ExpandedFlight, results: ImportResults)
//
// Matching strategy:
const existing = await prisma.flight.findFirst({
  where: {
    date: flight.date,
    route: flight.route,
    OR: [
      { arrivalFlightNumber: flight.flightNumber },
      { departureFlightNumber: flight.flightNumber }
    ],
    dataSource: { not: 'MANUAL' }  // Ne update-uj ručne unose
  }
});

if (existing) {
  // UPDATE
  await prisma.flight.update({
    where: { id: existing.id },
    data: buildFlightData(flight)
  });
  results.updated++;
} else {
  // CREATE
  await prisma.flight.create({
    data: {
      ...buildFlightData(flight),
      dataSource: 'IMPORT_SCHEDULE_CHANGES'
    }
  });
  results.created++;
}
```

#### Zadatak 2.5: Helper funkcije
```typescript
// buildFlightData(flight: ExpandedFlight): Prisma.FlightCreateInput
// Kreira data objekt za Prisma:
- Pronađi/kreiraj Airline (findOrCreateAirline)
- Pronađi/kreiraj AircraftType (findOrCreateAircraftType)
- Pronađi OperationType (SCHEDULED)
- Formatiraj vremena (UTC → lokalno)
- Postavi arrivalFlightNumber i departureFlightNumber
- Postavi status (SCHEDULED ili CANCELLED)

// findOrCreateAirline(icaoCode: string): Promise<Airline>
// findOrCreateAircraftType(model: string, seats: number): Promise<AircraftType>
```

---

### FAZA 3: Frontend
**Fajl:** `/src/app/flights/import-schedule-changes/page.tsx`

#### Zadatak 3.1: Glavna stranica struktura
```typescript
// State management:
- step: 'upload' | 'preview' | 'results'
- selectedFile: File | null
- previewData: PreviewData | null
- importResult: ImportResult | null
- isProcessing: boolean
- error: string | null

// Handlers:
- handleFileSelect(file: File)
- handleConfirmImport()
- handleReset()
- handleClose()
```

#### Zadatak 3.2: Hero sekcija
```tsx
// Naslov i opis:
- "Import Schedule Changes (TZL)"
- "Sezonski raspored letova iz email notifikacija aviokompanija"
- Badge: "Format: Schedule Changes TZL"
- Linkovi:
  - "← Nazad" (na /flights)
  - "Kompletan import" (na /flights/import)
```

#### Zadatak 3.3: Upload step
```tsx
// Komponente:
- FileUpload component (reuse postojeći)
- Info sekcija sa uputstvima:
  1. Sačuvajte Schedule Changes mail kao .txt fajl
  2. Upload-ujte fajl
  3. Pregledajte generisane letove
  4. Potvrdite import
```

#### Zadatak 3.4: Preview step
```tsx
// Komponente:
- Statistika kartica:
  - Ukupno pravila
  - Ukupno letova
  - Novi letovi (zeleno)
  - Update letova (plavo)
  - Otkazani letovi (crveno)

- Tabela sa prvih 10 letova:
  Kolone: Datum | Let | Ruta | STD | STA | A/C | Status | Akcija

- Akcije:
  - "Otkaži" → nazad na upload
  - "Importuj X letova" → potvrdi import
```

#### Zadatak 3.5: Results step
```tsx
// Komponente:
- Success/Error header
- Statistika:
  - Ukupno procesovano
  - Kreirano
  - Update-ovano
  - Otkazano
  - Preskočeno (errors)

- Lista grešaka (ako ih ima)
- Akcije:
  - "Preuzmi error report" (CSV)
  - "Pokušaj ponovo"
  - "Zatvori" → nazad na /flights
```

---

### FAZA 4: Komponente (izmjene postojećih)

#### Zadatak 4.1: ImportPreview izmjene
**Fajl:** `/src/components/import/ImportPreview.tsx`

```typescript
// Dodati prikazivanje "Akcija" kolone:
- CREATE (zeleni badge)
- UPDATE (plavi badge)
- CANCEL (crveni badge)

// Props proširiti sa:
stats: {
  totalRules?: number;      // Broj pravila iz mail-a
  totalFlights?: number;    // Ukupno generisanih letova
  toCreate?: number;        // Novi letovi
  toUpdate?: number;        // Update letova
  toCancel?: number;        // Otkazani letovi
}
```

---

### FAZA 5: Navigation i integracija

#### Zadatak 5.1: Dodati link na /flights stranici
**Fajl:** `/src/app/flights/page.tsx`

```tsx
// Dodati button u hero sekciji:
<Button onClick={() => router.push('/flights/import-schedule-changes')}>
  <Calendar className="w-4 h-4 mr-2" />
  Schedule Changes
</Button>
```

---

## 🧪 Testiranje

### Test Case 1: Osnovni import
**Input:**
```
W6  4242  MSTTZL  None  6/1/2026  6/5/2026  7:10 PM  9:15 PM  32Q  239  1_3_5__  S26  3
```

**Očekivani output:**
- 3 leta (1, 3, 5 juni)
- Svi SCHEDULED status
- Route: MST-TZL
- arrivalFlightNumber: W6 4242
- arrivalScheduledTime: 21:15 lokalno (19:10 UTC + 2h)

### Test Case 2: Cancel handling
**Input:**
```
W6  4242  MSTTZL  None    6/1/2026  6/5/2026  7:10 PM  9:15 PM  32Q  239  1_3_5__  S26  3
W6  4242  MSTTZL  Cancel  6/3/2026  6/3/2026  7:10 PM  9:15 PM  32Q  239  __3____  S26  1
```

**Očekivani output:**
- 1.6: CREATE (SCHEDULED)
- 3.6: CREATE pa odmah UPDATE na CANCELLED
- 5.6: CREATE (SCHEDULED)

### Test Case 3: Update postojećeg leta
**Scenario:**
1. Prvo import-uj: W6 4242 MSTTZL za 1.6.2026 sa 32Q/239
2. Zatim import-uj: W6 4242 MSTTZL za 1.6.2026 sa 32N/186

**Očekivani output:**
- Postojeći let update-ovan
- aircraftType: 32Q → 32N
- availableSeats: 239 → 186

### Test Case 4: On days parsing
**Test data:**
```
1______  →  [0]           (ponedjeljak)
_2_4_6_  →  [1, 3, 5]     (utorak, četvrtak, subota)
1_3_5__  →  [0, 2, 4]     (ponedjeljak, srijeda, petak)
______7  →  [6]           (nedjelja)
```

### Test Case 5: UTC → lokalno vrijeme
**Test data:**
```
Datum: 6/1/2026 (ljeto, UTC+2)
STD: 4:00 AM UTC → 06:00 lokalno
STA: 8:05 AM UTC → 10:05 lokalno

Datum: 12/1/2026 (zima, UTC+1)
STD: 4:00 AM UTC → 05:00 lokalno
STA: 8:05 AM UTC → 09:05 lokalno
```

---

## 📝 Checklist prije deployment-a

- [ ] Parser testiran sa stvarnim mail-om
- [ ] Expansion logic vraća tačan broj letova
- [ ] UTC → lokalno vrijeme konverzija tačna (ljeto i zima)
- [ ] UPSERT ne kreira duplikate
- [ ] Cancel redovi postavljaju CANCELLED status
- [ ] Ručni unosi (dataSource=MANUAL) ne bivaju update-ovani
- [ ] Preview prikazuje tačne statistike
- [ ] Error handling za nevažeće fajlove
- [ ] UI responsive na mobilnim uređajima
- [ ] Link na /flights stranici funkcioniše
- [ ] Import history/audit log (opciono)

---

## 🚀 Redoslijed implementacije

1. **Parser** (`schedule-changes.ts`) - Najvažnije, temelj svega
2. **API endpoint** (`/api/flights/import-schedule-changes/route.ts`) - Backend logika
3. **Frontend stranica** (`/app/flights/import-schedule-changes/page.tsx`) - UI
4. **Navigation** - Link na /flights stranici
5. **Testiranje** - Sa stvarnim mail-om
6. **Deployment**

---

## 📌 Napomene

### Timezone handling
- Mail vremena su **uvijek UTC**
- Tuzla ljeti: UTC+2 (CEST)
- Tuzla zimi: UTC+1 (CET)
- Koristiti `zoneinfo` za konverziju: `Europe/Sarajevo`

### Matching strategy
- Ključ: `date + flightNumber + route`
- Razlog: Isti let može imati više varijanata u danu (rijetko ali moguće)
- Ne match-ovati ručne unose (`dataSource != 'MANUAL'`)

### Performance
- Batch insert za velike import-e (500+ letova)
- Transaction za atomičnost
- Progress indicator za korisnika

### Buduća proširenja
- Export mjesečnog rasporeda u PDF
- Email notifikacije za schedule changes
- Diff view (prije/poslije update-a)
- History log svih schedule changes import-a
