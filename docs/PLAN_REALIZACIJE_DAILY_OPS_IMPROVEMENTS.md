# Plan Realizacije - Poboljšanja Daily Operations

**Verzija:** 1.0
**Datum:** 2. decembar 2025.
**Status:** Planiranje

---

## 📋 Pregled Zahtjeva

Ovaj dokument sadrži plan realizacije za poboljšanja dnevnih operacija (Daily Operations) u Airport Statistics Management System.

### Zahtjevane Izmjene

1. **Dodati polje "Vrijeme zatvaranja vrata"** - SAMO za departure (odlazak)
2. **Omogućiti dodavanje više delay kodova** po ARR/DEP
3. **Vezati delay kodove za kompanije** (različite kompanije koriste različite delay kodove)
4. **Dodati validacije kod unosa:**
   - Broj putnika ne može biti veći od kapaciteta
   - Broj putnika ne može biti 4-cifren
   - Upozorenje ako je broj relativno mali u odnosu na kapacitet (npr. 10/239)
5. **Dodati opciju unosa neoficijelnog razloga kašnjenja:**
   - **Oficijelni delay kod:** Dogovoren SA kapetanom, prijavljuje se kompaniji
   - **Neoficijelni razlog:** Samo za internu evidenciju, kapetan NE ZNA
6. **Dodati breakdown putnika:**
   - Male (muškarci)
   - Female (žene)
   - Child (djeca) - spadaju u putnike
   - Infants (bebe) - već postoji, ne računaju se kao putnici

---

## 🏗️ Analiza Trenutnog Stanja

### Postojeća Struktura

#### Schema.prisma - Flight Model
```prisma
model Flight {
  // ... osnovni podaci

  // Arrival
  arrivalPassengers     Int?    // Ukupan broj putnika
  arrivalInfants        Int?    // Bebe

  // Departure
  departurePassengers   Int?    // Ukupan broj putnika
  departureInfants      Int?    // Bebe

  // Delays
  delays FlightDelay[]  // Relacija - više delay kodova po letu
}
```

#### Schema.prisma - FlightDelay Model
```prisma
model FlightDelay {
  id          String     @id @default(cuid())
  flight      Flight     @relation(fields: [flightId], references: [id])
  flightId    String
  phase       DelayPhase // ARR ili DEP
  delayCode   DelayCode  @relation(fields: [delayCodeId], references: [id])
  delayCodeId String
  minutes     Int
  isPrimary   Boolean    @default(true)
  comment     String?    // Postojeći komentar
}
```

#### Schema.prisma - DelayCode Model
```prisma
model DelayCode {
  id          String        @id @default(cuid())
  code        String        @unique
  description String
  category    String
  delays      FlightDelay[]
}
```

### Ograničenja Trenutne Implementacije

1. ❌ Nema polja za vrijeme zatvaranja vrata (door closing time)
2. ✅ Već postoji mogućnost više delay kodova (FlightDelay model)
3. ❌ Delay kodovi nisu vezani za kompanije
4. ❌ Nema validacija za broj putnika
5. ❌ Nema polja za dodatni razlog kašnjenja (pored komentara)
6. ❌ Nema breakdown putnika po polu i godinama

---

## 🎯 Plan Implementacije

### FAZA 1: Database Schema Izmjene (Procjena: 3h)

#### Zadatak 1.1: Dodati nova polja u Flight model
**Procjena:** 1h
**Opis:** Ažurirati schema.prisma sa novim poljima

**Izmjene u Flight model:**
```prisma
model Flight {
  // ... postojeća polja

  // NOVO: Vrijeme zatvaranja vrata (SAMO za departure)
  departureDoorClosingTime  DateTime?

  // NOVO: Breakdown putnika za Arrival
  arrivalMalePassengers     Int?      // Muški putnici
  arrivalFemalePassengers   Int?      // Ženski putnici
  arrivalChildren           Int?      // Djeca (spadaju u arrivalPassengers)
  // arrivalInfants - već postoji, ne spadaju u arrivalPassengers

  // NOVO: Breakdown putnika za Departure
  departureMalePassengers   Int?      // Muški putnici
  departureFemalePassengers Int?      // Ženski putnici
  departureChildren         Int?      // Djeca (spadaju u departurePassengers)
  // departureInfants - već postoji, ne spadaju u departurePassengers
}
```

**Napomena:**
- `arrivalPassengers` = `arrivalMalePassengers` + `arrivalFemalePassengers` + `arrivalChildren`
- `arrivalInfants` se NE računaju u `arrivalPassengers`

---

#### Zadatak 1.2: Dodati vezu delay kodova sa kompanijama
**Procjena:** 1h
**Opis:** Kreirati many-to-many vezu između DelayCode i Airline

**Novi model - AirlineDelayCode:**
```prisma
// Many-to-many veza između Airline i DelayCode
model AirlineDelayCode {
  id          String    @id @default(cuid())

  airline     Airline   @relation(fields: [airlineId], references: [id], onDelete: Cascade)
  airlineId   String

  delayCode   DelayCode @relation(fields: [delayCodeId], references: [id], onDelete: Cascade)
  delayCodeId String

  isActive    Boolean   @default(true)  // Da li kompanija trenutno koristi ovaj kod
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([airlineId, delayCodeId])
  @@index([airlineId])
  @@index([delayCodeId])
}
```

**Ažurirati Airline model:**
```prisma
model Airline {
  // ... postojeća polja
  delayCodes  AirlineDelayCode[]  // NOVO
}
```

**Ažurirati DelayCode model:**
```prisma
model DelayCode {
  // ... postojeća polja
  airlines    AirlineDelayCode[]  // NOVO
}
```

---

#### Zadatak 1.3: Dodati polje za neoficijelno kašnjenje u FlightDelay
**Procjena:** 30min
**Opis:** Dodati polje za neoficijelni razlog kašnjenja pored službenog delay koda

**Napomena:**
- `delayCode` (postojeći) = **Oficijelno kašnjenje** - Dogovoren sa kapetanom i prijavljuje se aviokompaniji
- `unofficialReason` (novi) = **Neoficijelno kašnjenje** - Stvarni uzrok za interno bilježenje, kapetan to NE ZNA

**Izmjene u FlightDelay model:**
```prisma
model FlightDelay {
  // ... postojeća polja
  comment           String?   // Postojeći komentar
  unofficialReason  String?   // NOVO: Neoficijelni/stvarni razlog kašnjenja (samo za internal use)
}
```

---

#### Zadatak 1.4: Generisati i primeniti migracije
**Procjena:** 30min
**Opis:** Kreirati i izvršiti Prisma migracije

**Komande:**
```bash
npx prisma migrate dev --name add_daily_ops_improvements
npx prisma generate
```

**Validacija:**
- Provjeriti da li su migracije uspješno kreirane
- Provjeriti da li Prisma Client generiše nove tipove
- Testirati connection sa bazom

---

### FAZA 2: Backend API Izmjene (Procjena: 4h)

#### Zadatak 2.1: Ažurirati API endpoint za kreiranje/ažuriranje leta
**Procjena:** 1.5h
**Fajl:** `/src/app/api/flights/[id]/route.ts`

**Izmjene:**
1. Dodati validaciju za nova polja
2. Dodati logiku za validaciju broja putnika
3. Implementirati upozorenja za sumnjivu popunjenost

**Validacione pravila:**
```typescript
// Validacija broja putnika
const validatePassengerCount = (
  passengers: number,
  capacity: number
) => {
  // Pravilo 1: Broj putnika ne može biti veći od kapaciteta
  if (passengers > capacity) {
    return {
      error: true,
      message: `Broj putnika (${passengers}) ne može biti veći od kapaciteta (${capacity})`
    };
  }

  // Pravilo 2: Broj putnika ne može biti 4-cifren
  if (passengers >= 1000) {
    return {
      error: true,
      message: `Broj putnika ne može biti 4-cifren ili veći. Uneseno: ${passengers}`
    };
  }

  // Pravilo 3: Upozorenje ako je popunjenost manja od 20%
  const loadFactor = (passengers / capacity) * 100;
  if (loadFactor < 20 && passengers > 0) {
    return {
      warning: true,
      message: `Niska popunjenost: ${passengers}/${capacity} putnika (${loadFactor.toFixed(1)}%). Da li ste sigurni?`,
      requiresConfirmation: true
    };
  }

  return { error: false };
};

// Validacija breakdown-a putnika
const validatePassengerBreakdown = (
  total: number,
  male: number,
  female: number,
  children: number
) => {
  const sum = male + female + children;
  if (sum !== total) {
    return {
      error: true,
      message: `Zbir putnika (M: ${male} + Ž: ${female} + D: ${children} = ${sum}) ne odgovara ukupnom broju (${total})`
    };
  }
  return { error: false };
};
```

---

#### Zadatak 2.2: Kreirati API endpoint za upravljanje AirlineDelayCode
**Procjena:** 1.5h
**Fajl:** `/src/app/api/airline-delay-codes/route.ts`

**Endpoints:**
```typescript
// GET /api/airline-delay-codes?airlineId=xxx
// Vraća delay kodove za određenu kompaniju
export async function GET(request: Request)

// POST /api/airline-delay-codes
// Povezuje delay kod sa kompanijom
export async function POST(request: Request)

// DELETE /api/airline-delay-codes/[id]
// Uklanja vezu između delay koda i kompanije
export async function DELETE(request: Request, { params })
```

---

#### Zadatak 2.3: Ažurirati endpoint za delay kodove
**Procjena:** 30min
**Fajl:** `/src/app/api/delay-codes/route.ts`

**Izmjena:**
- Dodati opcioni parametar `airlineId` za filtriranje delay kodova po kompaniji
- Returnovanje samo aktivnih delay kodova za određenu kompaniju

```typescript
// GET /api/delay-codes?airlineId=xxx
// Vraća delay kodove (ako je airlineId prisutan, filtrira po kompaniji)
```

---

#### Zadatak 2.4: Kreirati endpoint za multiple delays
**Procjena:** 1h
**Fajl:** `/src/app/api/flights/[id]/delays/route.ts`

**Endpoints:**
```typescript
// GET /api/flights/[id]/delays
// Vraća sve delay kodove za određeni let

// POST /api/flights/[id]/delays
// Dodaje novi delay kod za let (ARR ili DEP)

// PUT /api/flights/[id]/delays/[delayId]
// Ažurira postojeći delay

// DELETE /api/flights/[id]/delays/[delayId]
// Briše delay
```

---

### FAZA 3: Frontend - Components (Procjena: 6h)

#### Zadatak 3.1: Kreirati ValidationWarningModal komponentu
**Procjena:** 1.5h
**Fajl:** `/src/components/daily-operations/ValidationWarningModal.tsx`

**Opis:** Modal za prikazivanje upozorenja pri validaciji

**Features:**
- Prikazuje upozorenje o niskoj popunjenosti
- Zahtijeva potvrdu od korisnika
- "Da, siguran sam" i "Ne, ispravi" dugmad

---

#### Zadatak 3.2: Kreirati PassengerBreakdownInput komponentu
**Procjena:** 1.5h
**Fajl:** `/src/components/daily-operations/PassengerBreakdownInput.tsx`

**Opis:** Input grupa za unos breakdown-a putnika

**Features:**
- Input polja za: Male, Female, Children
- Auto-kalkulacija ukupnog broja
- Validacija da zbir odgovara ukupnom broju
- Visual indicator (zeleno/crveno) za validnost

```tsx
<PassengerBreakdownInput
  totalPassengers={formData.arrivalPassengers}
  male={formData.arrivalMalePassengers}
  female={formData.arrivalFemalePassengers}
  children={formData.arrivalChildren}
  onChange={(breakdown) => {
    setFormData(prev => ({
      ...prev,
      arrivalMalePassengers: breakdown.male,
      arrivalFemalePassengers: breakdown.female,
      arrivalChildren: breakdown.children
    }));
  }}
/>
```

---

#### Zadatak 3.3: Kreirati MultipleDelaysInput komponentu
**Procjena:** 2h
**Fajl:** `/src/components/daily-operations/MultipleDelaysInput.tsx`

**Opis:** Komponenta za unos više delay kodova

**Features:**
- Lista delay-a sa mogućnošću dodavanja/brisanja
- Za svaki delay:
  - **Oficijelni delay kod** (dropdown sa IATA kodovima) - Dogovara se sa kapetanom
  - **Minuti kašnjenja** (number input)
  - **Neoficijelni razlog** (text input - opciono) - Internal use only, kapetan NE zna
  - **Komentar** (text input - opciono)
- "Dodaj još jedan delay" dugme
- Indicator za primary delay
- Help text:
  - "**Oficijelni delay kod**: Dogovoren sa kapetanom i prijavljuje se aviokompaniji"
  - "**Neoficijelni razlog**: Samo za internu evidenciju aerodroma (kapetan ne zna)"

```tsx
<MultipleDelaysInput
  phase="ARR" // ili "DEP"
  airlineId={formData.airlineId} // Za filtriranje delay kodova
  delays={arrivalDelays}
  onChange={(delays) => setArrivalDelays(delays)}
/>
```

---

#### Zadatak 3.4: Kreirati DoorClosingTimeInput komponentu
**Procjena:** 45min
**Fajl:** `/src/components/daily-operations/DoorClosingTimeInput.tsx`

**Opis:** Input za vrijeme zatvaranja vrata (SAMO za departure)

**Features:**
- datetime-local input
- Validacija da je vrijeme zatvaranja između scheduled i actual departure vremena
- Info tooltip sa objašnjenjem: "Vrijeme kada su se vrata aviona zatvorila prije odlaska"
- Prikazuje se SAMO u Departure sekciji

---

### FAZA 4: Frontend - Page Updates (Procjena: 5h)

#### Zadatak 4.1: Ažurirati Daily Operations Form Page
**Procjena:** 3h
**Fajl:** `/src/app/daily-operations/[id]/page.tsx`

**Izmjene:**
1. Integracija novih komponenti
2. Dodavanje polja za door closing time
3. Zamjena jednostavnog delay input-a sa MultipleDelaysInput
4. Dodavanje PassengerBreakdownInput komponenti
5. Implementacija validacione logike
6. Prikazivanje ValidationWarningModal-a

**Sekcije za dodati:**
```tsx
// 1. Door Closing Time (SAMO u Departure sekciji)
<DoorClosingTimeInput
  scheduledTime={formData.departureScheduledTime}
  actualTime={formData.departureActualTime}
  doorClosingTime={formData.departureDoorClosingTime}
  onChange={(time) => handleChange('departureDoorClosingTime', time)}
/>

// 2. Passenger Breakdown (zamjena postojećeg passenger input-a)
<div className="space-y-4">
  <div>
    <Label>Ukupan broj putnika</Label>
    <Input
      type="number"
      value={formData.arrivalPassengers}
      onChange={(e) => handleChange('arrivalPassengers', e.target.value)}
    />
  </div>

  <PassengerBreakdownInput
    totalPassengers={parseInt(formData.arrivalPassengers) || 0}
    male={parseInt(formData.arrivalMalePassengers) || 0}
    female={parseInt(formData.arrivalFemalePassengers) || 0}
    children={parseInt(formData.arrivalChildren) || 0}
    onChange={(breakdown) => {
      // update formData
    }}
  />

  <div>
    <Label>Bebe u naručju (ne računaju se u putnike)</Label>
    <Input
      type="number"
      value={formData.arrivalInfants}
      onChange={(e) => handleChange('arrivalInfants', e.target.value)}
    />
  </div>
</div>

// 3. Multiple Delays (zamjena postojećih delay input-a)
<MultipleDelaysInput
  phase="ARR"
  airlineId={formData.airlineId}
  delays={arrivalDelays}
  availableDelayCodes={filteredDelayCodes} // filtrirano po kompaniji
  onChange={setArrivalDelays}
/>
```

---

#### Zadatak 4.2: Dodati validaciju na submit
**Procjena:** 1.5h
**Fajl:** `/src/app/daily-operations/[id]/page.tsx`

**Implementacija:**
```typescript
const validateBeforeSubmit = async () => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validacija Arrival putnika
  if (formData.arrivalPassengers) {
    const count = parseInt(formData.arrivalPassengers);
    const capacity = parseInt(formData.availableSeats);

    const validation = validatePassengerCount(count, capacity);
    if (validation.error) {
      errors.push(`Dolazak: ${validation.message}`);
    }
    if (validation.warning) {
      warnings.push(`Dolazak: ${validation.message}`);
    }

    // Validacija breakdown-a
    const breakdownValidation = validatePassengerBreakdown(
      count,
      parseInt(formData.arrivalMalePassengers) || 0,
      parseInt(formData.arrivalFemalePassengers) || 0,
      parseInt(formData.arrivalChildren) || 0
    );
    if (breakdownValidation.error) {
      errors.push(`Dolazak breakdown: ${breakdownValidation.message}`);
    }
  }

  // Validacija Departure putnika (isto kao za Arrival)
  // ...

  // Ako ima grešaka, prikaži ih i blokiraj submit
  if (errors.length > 0) {
    setValidationErrors(errors);
    return false;
  }

  // Ako ima upozorenja, prikaži modal za potvrdu
  if (warnings.length > 0) {
    const confirmed = await showConfirmationModal(warnings);
    return confirmed;
  }

  return true;
};

const handleSubmit = async (e) => {
  e.preventDefault();

  const isValid = await validateBeforeSubmit();
  if (!isValid) return;

  // Nastavi sa submit-om...
};
```

---

#### Zadatak 4.3: Ažurirati Daily Operations List Page
**Procjena:** 30min
**Fajl:** `/src/app/daily-operations/page.tsx`

**Izmjene:**
- Dodati kolonu za departure door closing time (opciono)
- Dodati indicator za letove sa validacionim upozorenjima
- Dodati filter za letove sa delay kodovima
- Dodati badge za letove sa neoficijelnim razlozima kašnjenja

---

### FAZA 5: UI/UX Poboljšanja (Procjena: 3h)

#### Zadatak 5.1: Dodati tooltips i help text
**Procjena:** 1h

**Gdje dodati:**
- Door closing time - "Vrijeme kada su se vrata aviona zatvorila prije odlaska"
- Passenger breakdown - "Djeca spadaju u putnike, bebe u naručju se ne računaju"
- Oficijelni vs Neoficijelni delay:
  - "**Oficijelni delay kod**: Službeni IATA kod dogovoren sa kapetanom i prijavljen aviokompaniji"
  - "**Neoficijelni razlog**: Stvarni uzrok kašnjenja za internu evidenciju aerodroma (opciono, kapetan ne zna)"
- Validacije - jasno objasniti pravila

---

#### Zadatak 5.2: Dodati indikatore i badges
**Procjena:** 1h

**Features:**
- Badge za letove sa delay kodovima
- Color coding za validacione statuse (zeleno/žuto/crveno)
- Progress indicator za unos breakdown-a putnika

---

#### Zadatak 5.3: Responsive design za nove komponente
**Procjena:** 1h

**Ensure:**
- Svi novi input-i su responzivni
- Modalni prozori rade dobro na mobile uređajima
- Tabele sa multiple delays su scrollable na malom ekranu

---

### FAZA 6: Testing i Dokumentacija (Procjena: 4h)

#### Zadatak 6.1: Unit testovi za validacije
**Procjena:** 1.5h

**Testovi:**
- `validatePassengerCount` funkcija
- `validatePassengerBreakdown` funkcija
- API endpoint validacije

---

#### Zadatak 6.2: Integration testovi
**Procjena:** 1.5h

**Testovi:**
- Kreiranje leta sa novim poljima
- Dodavanje više delay kodova
- Validacija na submit
- AirlineDelayCode operacije

---

#### Zadatak 6.3: Ažurirati dokumentaciju
**Procjena:** 1h

**Fajlovi za ažurirati:**
- `docs/schema.prisma.md` - dodati nove modele i polja
- `docs/PLAN_REALIZACIJE_v3.md` - dodati nove API endpoints
- `docs/QUICK_START_GUIDE.md` - dodati napomene o novim funkcionalnostima
- Kreirati `docs/DAILY_OPS_VALIDATIONS.md` - dokumentacija validacionih pravila

---

## 📊 Sažetak - Bite-Size Zadaci

### Faza 1: Database Schema (3h)
- [ ] **1.1** Dodati nova polja u Flight model (1h)
- [ ] **1.2** Dodati vezu delay kodova sa kompanijama (1h)
- [ ] **1.3** Dodati dodatno polje za razlog kašnjenja (30min)
- [ ] **1.4** Generisati i primeniti migracije (30min)

### Faza 2: Backend API (4h)
- [ ] **2.1** Ažurirati API endpoint za leta sa validacijama (1.5h)
- [ ] **2.2** Kreirati API za AirlineDelayCode (1.5h)
- [ ] **2.3** Ažurirati endpoint za delay kodove (30min)
- [ ] **2.4** Kreirati endpoint za multiple delays (1h)

### Faza 3: Frontend Components (6h)
- [ ] **3.1** Kreirati ValidationWarningModal (1.5h)
- [ ] **3.2** Kreirati PassengerBreakdownInput (1.5h)
- [ ] **3.3** Kreirati MultipleDelaysInput (2h)
- [ ] **3.4** Kreirati DoorClosingTimeInput (1h)

### Faza 4: Frontend Pages (5h)
- [ ] **4.1** Ažurirati Daily Operations Form Page (3h)
- [ ] **4.2** Dodati validaciju na submit (1.5h)
- [ ] **4.3** Ažurirati Daily Operations List Page (30min)

### Faza 5: UI/UX (3h)
- [ ] **5.1** Dodati tooltips i help text (1h)
- [ ] **5.2** Dodati indikatore i badges (1h)
- [ ] **5.3** Responsive design za nove komponente (1h)

### Faza 6: Testing i Dokumentacija (4h)
- [ ] **6.1** Unit testovi za validacije (1.5h)
- [ ] **6.2** Integration testovi (1.5h)
- [ ] **6.3** Ažurirati dokumentaciju (1h)

---

## ⏱️ Ukupna Procjena

| Faza | Trajanje | Kompleksnost |
|------|----------|--------------|
| Faza 1: Database Schema | 3h | Srednja |
| Faza 2: Backend API | 4h | Srednja |
| Faza 3: Frontend Components | 6h | Visoka |
| Faza 4: Frontend Pages | 5h | Visoka |
| Faza 5: UI/UX | 3h | Niska |
| Faza 6: Testing i Dokumentacija | 4h | Srednja |
| **UKUPNO** | **25h** | |

**Sa 20% bufferom:** ~30 sati
**Preporučen timeline:** 4-5 radnih dana (po 6-8h dnevno)

---

## 🚀 Preporuka za Pristup

### Opcija A: Sve odjednom (4-5 dana)
Implementirati sve faze redom, 6-8h dnevno.

**Pros:**
- Sve funkcionalnosti odjednom
- Konzistentan pristup

**Cons:**
- Duže vrijeme bez deploy-a
- Veći rizik

### Opcija B: Po fazama sa deploy-om (2-3 sedmice)
Implementirati i deployovati nakon svake 1-2 faze.

**Pros:**
- Postepeno testiranje u produkciji
- Manji rizik
- Lakše za rollback

**Cons:**
- Duže vrijeme ukupno
- Privremeno nekompatibilne verzije

### ✅ **PREPORUČENO: Opcija B**

**Sprint 1 (Week 1):** Faza 1 + Faza 2 (Database + Backend)
**Sprint 2 (Week 2):** Faza 3 + Faza 4 (Frontend)
**Sprint 3 (Week 3):** Faza 5 + Faza 6 (Polish + Testing)

---

## 📝 Napomene

### Wichtige Bemerkungen

1. **Door Closing Time:**
   - Polje postoji SAMO za departure (ne i za arrival)
   - Predstavlja vrijeme zatvaranja vrata aviona prije odlaska
   - Opciono polje, ne mora biti popunjeno

2. **Passenger Breakdown Logic:**
   ```
   arrivalPassengers = arrivalMalePassengers + arrivalFemalePassengers + arrivalChildren
   arrivalInfants = odvojeno, ne ulaze u arrivalPassengers
   ```

3. **Oficijelno vs Neoficijelno Kašnjenje:**
   - **Delay Code (oficijelno):**
     - Službeni IATA delay kod
     - Dogovara se SA kapetanom
     - Prijavljuje se aviokompaniji
   - **Unofficial Reason (neoficijelno):**
     - Stvarni uzrok kašnjenja za internu evidenciju aerodroma
     - Kapetan to NE ZNA (internal use only)
     - Opciono polje
   - **Primer:**
     - Oficijelno (sa kapetanom): "67 - Passenger Delay"
     - Neoficijelno (interno): "Putnička porodica kasnila zbog saobraćajne gužve na putu do aerodroma"

4. **Delay Kodovi po Kompanijama:**
   - Default: Svi delay kodovi su dostupni svim kompanijama
   - Ako je kreiran AirlineDelayCode zapis, samo ti kodovi se prikazuju
   - Omogućiti admin modu za kreiranje mapiranja

5. **Validacione Poruke:**
   - **Error:** Blokira submit
   - **Warning:** Prikazuje modal, zahtijeva potvrdu
   - **Info:** Samo prikazuje, ne blokira

6. **Backward Compatibility:**
   - Sva nova polja su optional (`?`)
   - Postojeći letovi rade i dalje bez novih podataka
   - Migracije ne smiju obrisati postojeće podatke

---

## 🎯 Prioriteti

### Must Have (Prioritet 1)
- ✅ Vrijeme zatvaranja vrata (SAMO departure)
- ✅ Breakdown putnika (Male/Female/Children)
- ✅ Validacije broja putnika
- ✅ Više delay kodova

### Should Have (Prioritet 2)
- ✅ Delay kodovi po kompanijama
- ✅ Neoficijelni razlog kašnjenja (pored oficijelnog delay koda)
- ✅ Validation warning modal

### Nice to Have (Prioritet 3)
- UI/UX poboljšanja
- Tooltips i help text
- Badges i indikatori

---

## 📞 Pitanja za Stakeholder-e

Prije početka implementacije, trebaju se razjasniti:

1. **Passenger Breakdown:**
   - Da li je obavezan unos breakdown-a ili opcionalan?
   - Šta ako korisnik ne zna breakdown, može li ostaviti prazno?

2. **Door Closing Time:**
   - Da li se validira da je između scheduled i actual vremena?
   - Šta ako nije unešeno?

3. **Delay Kodovi:**
   - Ko održava mapiranje delay kodova za kompanije? (Admin? Svaki korisnik?)
   - Da li se postojeći delay kodovi trebaju automatski mapirati na sve kompanije?

4. **Validacije:**
   - Koliki je threshold za "low load factor" warning? (trenutno 20%)
   - Da li treba dodati dodatne validacije?

---

**Dokument kreirao:** Claude (Anthropic)
**Datum:** 2. decembar 2025.
**Za:** Aerodrom Tuzla - Daily Operations Improvements
