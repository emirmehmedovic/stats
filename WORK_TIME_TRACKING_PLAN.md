# Work Time Tracking - Implementation Plan

## 🎯 Ciljevi Sistema

1. **Employee Mapping** - Povezivanje Access Control korisnika sa Employees
2. **Place Configuration** - Definisanje tipova lokacija (ulaz/izlaz vs interno)
3. **Work Time Calculation** - Automatsko računanje radnog vremena
4. **Night Shift Support** - Podrška za noćne smjene (prelazak preko ponoći)
5. **Movement Timeline** - Tracking kretanja radnika kroz zgradu
6. **Reports & Analytics** - Izvještaji o radnom vremenu

---

## 🗂 Database Schema - Novi Modeli

### 1. AccessControlMapping (Employee ↔ AC User veza)

```prisma
model AccessControlMapping {
  id                   String   @id @default(cuid())

  // Employee veza
  employeeId           String
  employee             Employee @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  // Access Control User veza
  accessControlUserId  String
  accessControlUser    AccessControlUser @relation(fields: [accessControlUserId], references: [id])

  // Metadata
  isPrimary            Boolean  @default(true)  // Glavna kartica
  isActive             Boolean  @default(true)  // Aktivna kartica
  assignedAt           DateTime @default(now())

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  @@unique([employeeId, accessControlUserId])
  @@index([employeeId])
  @@index([accessControlUserId])
  @@map("access_control_mappings")
}
```

**Zašto Many-to-Many?**
- Radnik može imati više kartica (glavna, rezervna)
- Jedna kartica može biti promijenjena između radnika

---

### 2. PlaceConfiguration (Tipovi lokacija)

```prisma
enum PlaceType {
  ENTRY_EXIT    // Ulaz/Izlaz - računa se kao check-in/check-out
  INTERNAL      // Interno kretanje - ne računa se u radno vrijeme
  BREAK_ROOM    // Pauza - može se posebno trackati
}

model PlaceConfiguration {
  id              String     @id @default(cuid())
  externalPlaceId Int        @unique  // PlaceId iz Access Control

  // Konfiguracija
  type            PlaceType
  name            String
  description     String?

  // Metadata
  isActive        Boolean    @default(true)

  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  @@index([type])
  @@map("place_configurations")
}
```

**Hardkodiranje:**
```typescript
// Seed data ili migration
const PLACE_CONFIGS = [
  { externalPlaceId: 35, type: 'ENTRY_EXIT', name: 'ULAZ 2' },
  { externalPlaceId: 38, type: 'INTERNAL', name: 'WC ZAKUPNICI' },
  { externalPlaceId: 40, type: 'INTERNAL', name: 'ULAZ KUHINJA 2' },
  { externalPlaceId: 33, type: 'ENTRY_EXIT', name: 'ULAZ ZAKUPNICI' },
  { externalPlaceId: 32, type: 'ENTRY_EXIT', name: 'ULAZ SLUŽBENE PROSTORIJE' },
  // ... ostali
];
```

---

### 3. WorkDay (Evidencija radnog dana)

```prisma
enum WorkDayStatus {
  IN_PROGRESS    // Radnik je trenutno na poslu
  COMPLETED      // Radni dan završen
  INCOMPLETE     // Nedostaje check-out (zaboravio)
  ABSENT         // Nije došao na posao
}

model WorkDay {
  id              String         @id @default(cuid())

  // Employee veza
  employeeId      String
  employee        Employee       @relation(fields: [employeeId], references: [id], onDelete: Cascade)

  // Radni dan info
  date            DateTime       // Datum radnog dana (prema check-in vremenu)
  checkInTime     DateTime       // Prvi ulaz
  checkOutTime    DateTime?      // Posljednji izlaz

  // Računanje vremena
  totalHours      Decimal?       // Ukupno sati (check-out - check-in - pauze)
  breakMinutes    Int?           // Ukupno minuta pauze
  overtimeMinutes Int?           // Prekovremeni rad

  // Smjena
  isNightShift    Boolean        @default(false)  // Da li je noćna smjena
  shiftStart      DateTime?      // Planiran početak smjene
  shiftEnd        DateTime?      // Planiran kraj smjene

  // Status
  status          WorkDayStatus  @default(IN_PROGRESS)

  // Napomene
  notes           String?        @db.Text

  // Relacije
  events          WorkDayEvent[] // Svi eventi tog dana

  // Audit
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
  calculatedAt    DateTime?      // Kada je izračunato radno vrijeme

  @@unique([employeeId, date])
  @@index([employeeId, date])
  @@index([date])
  @@index([status])
  @@map("work_days")
}
```

---

### 4. WorkDayEvent (Detalji svih pristupa)

```prisma
model WorkDayEvent {
  id              String              @id @default(cuid())

  workDayId       String
  workDay         WorkDay             @relation(fields: [workDayId], references: [id], onDelete: Cascade)

  eventId         String
  event           AccessControlEvent  @relation(fields: [eventId], references: [id])

  // Event tip
  isCheckIn       Boolean             @default(false)  // Da li je ovo check-in
  isCheckOut      Boolean             @default(false)  // Da li je ovo check-out
  isInternal      Boolean             @default(true)   // Interno kretanje

  createdAt       DateTime            @default(now())

  @@index([workDayId])
  @@index([eventId])
  @@map("work_day_events")
}
```

---

## 🔄 Processing Logic - Računanje Radnog Vremena

### Algoritam za Kreiranje WorkDay Zapisa

```typescript
/**
 * Process events za radni dan
 * Poziva se nakon svakog sync-a ili na kraju dana
 */
async function processWorkDay(employeeId: string, date: Date) {
  // 1. Dohvati sve evente za tog radnika tog dana
  const events = await getEmployeeEventsForDate(employeeId, date);

  if (events.length === 0) {
    // Nema eventa = absence
    return createWorkDay({
      employeeId,
      date,
      status: 'ABSENT'
    });
  }

  // 2. Filtriraj samo ENTRY_EXIT evente
  const entryExitEvents = events.filter(e =>
    e.place.configuration?.type === 'ENTRY_EXIT'
  );

  if (entryExitEvents.length === 0) {
    // Samo interni eventi (radnik već unutra)
    return null;
  }

  // 3. Sortiraj po vremenu
  const sorted = entryExitEvents.sort((a, b) =>
    a.eventTime.getTime() - b.eventTime.getTime()
  );

  // 4. Prvi event = check-in, Posljednji = check-out
  const checkIn = sorted[0];
  const checkOut = sorted[sorted.length - 1];

  // 5. Detektuj noćnu smjenu
  const isNightShift = detectNightShift(checkIn, checkOut);

  // 6. Izračunaj radno vrijeme
  const totalHours = checkOut.eventTime
    ? calculateHours(checkIn.eventTime, checkOut.eventTime)
    : null;

  // 7. Kreiraj ili update WorkDay
  return upsertWorkDay({
    employeeId,
    date: isNightShift ? checkIn.eventTime : startOfDay(checkIn.eventTime),
    checkInTime: checkIn.eventTime,
    checkOutTime: checkOut.eventTime,
    totalHours,
    isNightShift,
    status: checkOut.eventTime ? 'COMPLETED' : 'IN_PROGRESS',
    events: events.map(e => ({ eventId: e.id }))
  });
}
```

---

### Detekcija Noćne Smjene

```typescript
/**
 * Detektuje da li je noćna smjena
 *
 * Kriterijumi:
 * - Check-in kasno navečer (posle 20h)
 * - Check-out rano ujutro (prije 10h)
 * - Check-out je sljedeći dan od check-in
 */
function detectNightShift(checkIn: Event, checkOut: Event): boolean {
  if (!checkOut.eventTime) return false;

  const checkInHour = checkIn.eventTime.getHours();
  const checkOutHour = checkOut.eventTime.getHours();

  const isDifferentDay = !isSameDay(checkIn.eventTime, checkOut.eventTime);
  const isLateCheckIn = checkInHour >= 20; // nakon 20h
  const isEarlyCheckOut = checkOutHour <= 10; // prije 10h

  return isDifferentDay && isLateCheckIn && isEarlyCheckOut;
}

/**
 * Alternativni pristup: Shift Configuration
 * Ako imate unaprijed definirane smjene
 */
const SHIFTS = [
  { name: 'Jutarnja', start: '06:00', end: '14:00' },
  { name: 'Popodnevna', start: '14:00', end: '22:00' },
  { name: 'Noćna', start: '22:00', end: '06:00' } // prelazi ponoć
];

function assignShift(checkInTime: Date): Shift {
  const hour = checkInTime.getHours();
  return SHIFTS.find(shift => {
    const [startH] = shift.start.split(':').map(Number);
    const [endH] = shift.end.split(':').map(Number);

    if (endH < startH) {
      // Smjena prelazi ponoć
      return hour >= startH || hour < endH;
    }
    return hour >= startH && hour < endH;
  });
}
```

---

## 🎨 UI Components - Potrebne Stranice

### 1. Employee Mapping Interface (`/admin/access-control-mapping`)

```typescript
// Stranica za mapiranje AC korisnika na Employees
// Tabela sa:
// - Employee name
// - Access Control User dropdown (search)
// - isPrimary checkbox
// - Save button

interface MappingRow {
  employeeId: string;
  employeeName: string;
  accessControlUserId: number | null;
  accessControlUserName: string | null;
  isPrimary: boolean;
}
```

**Features:**
- Search/autocomplete za AC korisnike
- Bulk import (CSV sa mapiranjima)
- Validation (jedan AC user ne može biti primary za više employees)

---

### 2. Place Configuration (`/admin/place-configuration`)

```typescript
// Hardkodiranje tipova lokacija
// Tabela sa:
// - Place ID (externalPlaceId)
// - Place Name
// - Type (ENTRY_EXIT / INTERNAL / BREAK_ROOM)
// - Edit button

interface PlaceConfigRow {
  externalPlaceId: number;
  placeName: string;
  type: PlaceType;
  isActive: boolean;
}
```

---

### 3. Work Time Dashboard (`/work-time/dashboard`)

**Metrike:**
- Današnji radnici na poslu (IN_PROGRESS)
- Prekovremeni rad (overtime)
- Absence rate
- Prosječno radno vrijeme

**Tabela sa radnim danima:**
- Employee name
- Date
- Check-in time
- Check-out time
- Total hours
- Status
- Actions (view details, edit)

---

### 4. Employee Work Time Detail (`/work-time/employee/[id]`)

**Timeline View:**
- Vizualni prikaz kretanja kroz dan
- Check-in → Interni eventi → Check-out
- Map sa lokacijama i vremenima

**Calendar View:**
- Mjesečni kalendar sa označenim radnim danima
- Color coding (complete, incomplete, absent, overtime)

**Statistics:**
- Total hours this month
- Average hours per day
- Overtime hours
- Absence days

---

### 5. Daily Work Report (`/work-time/reports/daily`)

**Parametri:**
- Date picker
- Department filter
- Export to Excel/PDF

**Tabela:**
- All employees
- Check-in/out times
- Total hours
- Status

---

## ⚙️ Processing Strategy

### Option A: Real-time Processing (Preferirano)

```typescript
// Poziva se nakon svakog sync-a
// U /api/access-control/sync route.ts

// Nakon uspješnog insert-a eventa:
await processRecentWorkDays(insertedEvents);

async function processRecentWorkDays(events: Event[]) {
  // Group by employee and date
  const groupedByEmployee = groupBy(events, e =>
    `${e.user.employee?.id}_${format(e.eventTime, 'yyyy-MM-dd')}`
  );

  // Process each employee-date combination
  for (const [key, dayEvents] of Object.entries(groupedByEmployee)) {
    const [employeeId, dateStr] = key.split('_');
    await processWorkDay(employeeId, parseISO(dateStr));
  }
}
```

**Prednosti:**
- Podaci uvijek ažurni
- Odmah vidiš ko je na poslu
- Manje batch processing opterećenja

---

### Option B: Batch Processing (End of Day)

```typescript
// Cron job koji se pokreće svaki dan u ponoć

// /api/cron/process-work-days

export async function GET(req: NextRequest) {
  const yesterday = subDays(new Date(), 1);

  // Dohvati sve employees
  const employees = await prisma.employee.findMany({
    where: { status: 'ACTIVE' }
  });

  // Process svaki employee za jučerašnji dan
  for (const employee of employees) {
    await processWorkDay(employee.id, yesterday);
  }

  return NextResponse.json({ success: true });
}
```

**Prednosti:**
- Manje opterećenje tokom dana
- Sigurniji rezultati (svi eventi pristigli)

---

## 🚨 Edge Cases - Scenariji za Pokriti

### 1. Zaboravio Check-out
```typescript
// Na kraju dana, ako nema check-out:
if (workDay.status === 'IN_PROGRESS') {
  // Option 1: Automatski postavi kraj radnog vremena
  workDay.checkOutTime = endOfWorkDay(workDay.checkInTime);
  workDay.status = 'INCOMPLETE';
  workDay.notes = 'Auto check-out - nedostaje stvarni izlaz';

  // Option 2: Označi kao incomplete i zatraži manual korekciju
  workDay.status = 'INCOMPLETE';
  // Šalje notifikaciju menadžeru
}
```

---

### 2. Višestruki Check-in/Check-out (Izlazio na pauzu)
```typescript
// Scenario: 08:00 check-in, 12:00 izlaz (ručak), 13:00 check-in, 17:00 check-out

// Rješenje 1: Računa sve kao jedan radni dan sa pauzom
const entryExits = [
  { time: '08:00', type: 'entry' },
  { time: '12:00', type: 'exit' },  // Pauza start
  { time: '13:00', type: 'entry' }, // Pauza end
  { time: '17:00', type: 'exit' }
];

const checkIn = entryExits[0].time;  // Prvi entry
const checkOut = entryExits[entryExits.length - 1].time;  // Posljednji exit
const breakTime = calculateBreaks(entryExits);  // 1 sat

totalHours = (checkOut - checkIn) - breakTime;  // 8h - 1h = 7h
```

---

### 3. Noćna Smjena - Računanje Datuma

```typescript
// Check-in: 2026-02-11 22:00
// Check-out: 2026-02-12 06:00

// Rješenje: Pripiši radni dan prema check-in datumu
const workDayDate = isNightShift
  ? checkInTime  // 2026-02-11
  : startOfDay(checkInTime);

// Ili prema shift konfiguraciji:
const assignedShift = assignShift(checkInTime);
workDay.shiftStart = assignedShift.start;  // 22:00
workDay.shiftEnd = assignedShift.end;      // 06:00 (sljedeći dan)
```

---

### 4. Radnik Zaboravio Karticu (Nema eventa)
```typescript
// Manual entry interface za HR/menadžera
// /work-time/manual-entry

// Form:
// - Employee select
// - Date
// - Check-in time (manual)
// - Check-out time (manual)
// - Reason (zaboravio karticu, kartice nema)
// - Approved by

// Kreira WorkDay sa flagom:
workDay.isManualEntry = true;
workDay.approvedBy = managerId;
```

---

## 📊 Reports & Analytics

### 1. Monthly Report per Employee
```sql
SELECT
  e.firstName || ' ' || e.lastName as employee,
  COUNT(*) as days_worked,
  SUM(wd.totalHours) as total_hours,
  AVG(wd.totalHours) as avg_hours,
  SUM(wd.overtimeMinutes) / 60.0 as overtime_hours,
  COUNT(CASE WHEN wd.status = 'ABSENT' THEN 1 END) as absent_days
FROM work_days wd
JOIN employees e ON e.id = wd.employeeId
WHERE wd.date >= '2026-02-01' AND wd.date < '2026-03-01'
GROUP BY wd.employeeId, e.firstName, e.lastName
ORDER BY employee
```

---

### 2. Overtime Report
```typescript
// Employees sa više od 8h dnevno
const overtimeEmployees = await prisma.workDay.findMany({
  where: {
    totalHours: { gt: 8 },
    date: { gte: startOfMonth(new Date()) }
  },
  include: { employee: true },
  orderBy: { totalHours: 'desc' }
});
```

---

### 3. Absence Tracking
```typescript
// Employees koji nisu došli na posao
const absences = await prisma.workDay.findMany({
  where: {
    status: 'ABSENT',
    date: { gte: startOfWeek(new Date()) }
  },
  include: { employee: true }
});
```

---

## 🎯 Implementation Steps

### Phase 1: Database Setup
1. ✅ Add PlaceConfiguration model
2. ✅ Add AccessControlMapping model
3. ✅ Add WorkDay model
4. ✅ Add WorkDayEvent model
5. ✅ Add relations to Employee and AccessControlUser
6. ✅ Create migration
7. ✅ Seed place configurations

### Phase 2: Mapping Interface
1. ✅ Create `/admin/access-control-mapping` page
2. ✅ API: GET/POST mapping CRUD
3. ✅ UI: Employee list with AC user dropdown
4. ✅ Validation logic

### Phase 3: Place Configuration
1. ✅ Create `/admin/place-configuration` page
2. ✅ API: CRUD for place configs
3. ✅ Hardcode initial configurations

### Phase 4: Work Time Processing
1. ✅ Implement `processWorkDay()` function
2. ✅ Add to sync API (real-time processing)
3. ✅ Create cron job for end-of-day processing
4. ✅ Handle edge cases (night shifts, incomplete days)

### Phase 5: Work Time Dashboard
1. ✅ Create `/work-time` dashboard
2. ✅ API: Work time stats
3. ✅ Employee work time detail page
4. ✅ Timeline component

### Phase 6: Reports
1. ✅ Daily report
2. ✅ Monthly report
3. ✅ Overtime report
4. ✅ Absence report
5. ✅ Export to Excel/PDF

---

## 🤔 Decision Points

### Q1: Kako tretirati pauze?

**Option A: Automatski detektuj**
- Exit → Entry pattern unutar dana = pauza
- Ako je kraće od 2h, tretraj kao pauzu

**Option B: Ignore**
- Prvi entry → Posljednji exit = radno vrijeme
- Pauze se ne tretiraju posebno

**Option C: Konfiguriši break lokacije**
- PlaceType.BREAK_ROOM
- Eventi na break lokacijama = pauza

**Preporuka:** Option A ili B (jednostavnije)

---

### Q2: Šta sa overtime?

**Calculation:**
```typescript
const expectedHours = 8; // ili iz Employee.workingHours
const overtime = Math.max(0, totalHours - expectedHours);

workDay.overtimeMinutes = overtime * 60;
```

**Approval Workflow:**
- Overtime > 1h zahtijeva manager approval?
- Ili automatski approve?

---

### Q3: Kako prikazati kretanje kroz zgradu?

**Timeline Component:**
```typescript
// Visual timeline sa svim eventima
[08:00 ULAZ 2] -----> [10:30 WC] -----> [12:00 KUHINJA] -----> [17:00 ULAZ 2]
   (Check-in)         (Internal)           (Internal)            (Check-out)
```

**Floor Plan View (advanced):**
- Mapa zgrade sa lokacijama
- Animirana putanja radnika tokom dana

---

## 🔐 Permissions

**Role-based Access:**
- **ADMIN**: Sve
- **MANAGER**: Vidi sve employees, edit mappings, approve manual entries
- **EMPLOYEE**: Vidi samo svoje podatke
- **HR**: Reports, manual entries, edit work days

---

## 📝 Next Steps

Da li želiš da:
1. **Implementiram database modele** (Prisma schema)
2. **Kreiram mapping interface** (Employee ↔ AC User)
3. **Implementiram work time processing logic**
4. **Kreiram dashboard UI**
5. **Sve gore navedeno step-by-step**

Koja opcija ti odgovara?
