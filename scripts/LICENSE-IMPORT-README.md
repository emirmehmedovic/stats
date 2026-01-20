# License Types Bulk Import

Ova skripta omogućava bulk import tipova licenci iz dokumenta **PLAN OBUKA CZOK 2025**.

## Struktura podataka

### Parsiran JSON format
Podaci su ekstrahovani iz Word dokumenta i organizovani u strukturiran JSON format koji sadrži:

- **number**: Redni broj obuke (R/B)
- **name**: Naziv obuke
- **instructors**: Instruktori/predavači (npr. "Interni – 2 predavača", "Eksterni – 1 predavač")
- **programDuration**: Trajanje programa (npr. "5 dana", "1 dan")
- **theoryHours**: Broj sati teorijske nastave
- **practicalHours**: Broj sati praktičnih vježbi
- **workplaceTraining**: Osposobljavanje na radnom mjestu (ako postoji)
- **validityMonths**: Period važenja potvrde u mjesecima (12, 24, ili 36)
- **variants**: Array tipova obuke - kombinacija od:
  - `INITIAL` - Sticanje
  - `RENEWAL` - Obnavljanje
  - `EXTENSION` - Produženje

### Primjer podataka

```json
{
  "number": 1,
  "name": "Održavanje i pregled instalacija i uređaja sistema prilaznih svjetala",
  "instructors": "Interni – 2 predavača",
  "programDuration": "5 dana",
  "theoryHours": 16,
  "practicalHours": 24,
  "workplaceTraining": "",
  "validityMonths": 24,
  "variants": ["INITIAL", "RENEWAL", "EXTENSION"]
}
```

## Proširenje baze podataka

### Novi `TrainingType` enum

```prisma
enum TrainingType {
  INITIAL    // Sticanje
  RENEWAL    // Obnavljanje
  EXTENSION  // Produženje
}
```

### Proširenja `LicenseType` modela

Dodati novi atributi:

| Field | Tip | Opis |
|-------|-----|------|
| `trainingType` | TrainingType? | Tip obuke (INITIAL/RENEWAL/EXTENSION), null za parent |
| `parentLicenseTypeId` | String? | ID roditeljske licence (za varijante) |
| `parentLicenseType` | LicenseType? | Relacija ka parent tipu |
| `variants` | LicenseType[] | Lista varijanti (inverse relacija) |
| `instructors` | String? | Instruktori/predavači |
| `programDuration` | String? | Trajanje programa |
| `theoryHours` | Int? | Teorijska nastava (sati) |
| `practicalHours` | Int? | Praktične vježbe (sati) |
| `workplaceTraining` | String? | Osposobljavanje na radnom mjestu |

## Struktura importa

### Hijerarhija

Svaka obuka se kreira kao:

1. **Parent LicenseType** - osnovni program bez `trainingType`
   - Kod: `TRN-001`, `TRN-002`, itd.
   - Sadrži sve detalje obuke (instructors, hours, duration)
   - `trainingType` = `null`
   - `parentLicenseTypeId` = `null`

2. **Variant LicenseTypes** - specifične varijante (Sticanje, Obnavljanje, Produženje)
   - Kod: `TRN-001-INI`, `TRN-001-REN`, `TRN-001-EXT`
   - Nasljeđuju sve detalje od parent-a
   - `trainingType` = INITIAL / RENEWAL / EXTENSION
   - `parentLicenseTypeId` = ID parent tipa
   - Naziv: `"{Parent Name} - {Sticanje|Obnavljanje|Produženje}"`

### Primjer strukture

```
Parent: "Održavanje i pregled instalacija i uređaja sistema prilaznih svjetala" (TRN-001)
├── Variant: "... - Sticanje" (TRN-001-INI, trainingType: INITIAL)
├── Variant: "... - Obnavljanje" (TRN-001-REN, trainingType: RENEWAL)
└── Variant: "... - Produženje" (TRN-001-EXT, trainingType: EXTENSION)
```

## Korištenje

### 1. Pokretanje migracije

```bash
npx prisma migrate dev
```

Ili manuelno:

```bash
npx prisma db push
```

### 2. Pokretanje import skripte

```bash
npx ts-node scripts/seed-license-types.ts
```

### 3. Provjera rezultata

```bash
npx prisma studio
```

Ili preko SQL-a:

```sql
-- Svi parent programi (osnovna lista)
SELECT * FROM "LicenseType" WHERE "trainingType" IS NULL ORDER BY code;

-- Sve varijante za određeni program
SELECT * FROM "LicenseType"
WHERE "parentLicenseTypeId" = 'parent-id-ovdje'
ORDER BY "trainingType";

-- Statistika importa
SELECT
  COUNT(*) FILTER (WHERE "trainingType" IS NULL) as parents,
  COUNT(*) FILTER (WHERE "trainingType" = 'INITIAL') as initial_trainings,
  COUNT(*) FILTER (WHERE "trainingType" = 'RENEWAL') as renewals,
  COUNT(*) FILTER (WHERE "trainingType" = 'EXTENSION') as extensions,
  COUNT(*) as total
FROM "LicenseType";
```

## Očekivani rezultati

| Metrika | Vrijednost |
|---------|------------|
| Ukupno programa iz dokumenta | 42 |
| Parent license types | 42 |
| Varijante po programu | 2-3 (INITIAL + RENEWAL ili + EXTENSION) |
| Ukupno license types (parent + varijante) | ~105-126 |

## Sigurnosne provjere

Skripta automatski:

- ✅ Preskače duplikate ako licenca sa istim nazivom već postoji
- ✅ Validira sve potrebne podatke prije upisa
- ✅ Kreira transakcijske promjene (rollback na greškama)
- ✅ Loguje sve kreirane zapise za audit

## Napomene

1. **Parent vs Variant**:
   - Parent se koristi za grupiranje i pregled
   - Variant se dodeljuje radnicima preko `License` modela
   - UI trebao bi prikazivati varijante pri dodjeljivanju licenci

2. **Kod generisanje**:
   - Parent: `TRN-{broj}` (npr. `TRN-001`, `TRN-042`)
   - Variant: `TRN-{broj}-{INI|REN|EXT}` (npr. `TRN-001-INI`)

3. **Kategorija**: Sve obuke imaju `category = "Training Program"`

4. **ValidityPeriodMonths**: Automatski se postavlja iz dokumenta (12, 24, ili 36 mjeseci)

## Održavanje i proširenja

### Dodavanje novih programa

1. Ažurirajte `scripts/parsed-license-types.json`
2. Pokrenite seed skriptu ponovo
3. Skripta će automatski detektovati nove zapise

### Brisanje programa

```typescript
// Brisanje parent-a automatski briše i sve varijante (CASCADE)
await prisma.licenseType.delete({
  where: { id: 'parent-id' }
});
```

### Query varijanti

```typescript
// Dobijanje svih varijanti programa
const variants = await prisma.licenseType.findMany({
  where: { parentLicenseTypeId: parentId },
  include: { parentLicenseType: true }
});

// Dobijanje parent-a iz varijante
const variant = await prisma.licenseType.findUnique({
  where: { id: variantId },
  include: { parentLicenseType: true }
});
```
