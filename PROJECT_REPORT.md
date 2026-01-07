# Airport Statistics Management System – Izvještaj

## 1. Netehnički sažetak
- **Namjena:** Web aplikacija omogućava Aerodromu Tuzla centralizirano unošenje i analizu dnevnog avio-saobraćaja, evidenciju radnika/licenci te naprednu analitiku (YoY, QoQ, forecasting) uz izvoze izvještaja na više jezika (bs/en/de).@docs/PLAN_REALIZACIJE_v3.md#24-48
- **Glavni moduli:**  
  1. Statistika saobraćaja – praćenje letova, putnika, tereta i kašnjenja.  
  2. Upravljanje radnicima – profili zaposlenih, licence, dokumenti i notifikacije o isteku.  
  3. Advanced Analytics – tržišni udjeli, sezonalnost, trendovi i automatski izvještaji.@docs/PLAN_REALIZACIJE_v3.md#24-48
- **Proces implementacije:** Dokumentovani sprintovi (0‑12) pokrivaju ~585 sati rada, s MVP-om u 10‑12 sedmica i dodatnim funkcijama u Sprintovima 11‑12 (4‑6 sedmica).@docs/QUICK_START_GUIDE.md#45-70

## 2. Tehnički pregled
### Stack i arhitektura
- **Frontend:** Next.js 15 (App Router) + React 19, TypeScript, Tailwind, shadcn/ui i Radix UI za dosljedne komponente; Recharts/D3/Leaflet za vizualizacije.@package.json#6-54 @docs/PLAN_REALIZACIJE_v3.md#8-18
- **Backend & API sloj:** Next.js API routes na Node.js-u uz Prisma ORM za komunikaciju s PostgreSQL-om; Prisma klijent se kreira u `src/lib/prisma.ts` i koristi connection pooling optimizacije za razvoj/prod konfiguracije.@src/lib/prisma.ts#1-28
- **Autentikacija:** Login forma na root stranici šalje kredencijale na `/api/auth/login`, implementira rate-limiting feedback i sprema korisničke podatke u `localStorage` za client-side prikaz dashboards.@src/app/page.tsx#1-239

### Baza podataka i modeli
- **Modeli:** Prisma schema obuhvata entitete za letove (Flight, FlightDelay, DelayCode, OperationType), kompanije/aerodrome, tipove aviona, ali i HR modul (Employee, License, Sector, dokumenti) te reporting (Report, ReportSchedule, BenchmarkData itd.).@prisma/schema.prisma#18-400
- **Relacije:** Flight povezuje airline, tip aviona, aerodrome (ARR/DEP), tip operacije i niz metričkih polja (putnici, cargo, statusi, verifikacija). Delay kodovi su normalizovani i vezani za letove i aviokompanije preko M:N tabele `AirlineDelayCode`. HR moduli koriste Cascade brisanje kako bi se dokumenti i licence čistili uz zaposlenog.@prisma/schema.prisma#63-400

## 3. Funkcionalni moduli i tokovi
| Modul | Ključne funkcionalnosti | Status dokumentacije |
| --- | --- | --- |
| Statistika saobraćaja | Ručni unos/uvoz podataka, kalkulacije kašnjenja, popunjenosti, promet putnika/tereta, filtriranje po rutama i kompanijama. | Definisano u PLAN_REALIZACIJE_v3 (poglavlja o strukturi izvještaja i potrebnim metrikama).@docs/PLAN_REALIZACIJE_v3.md#51-96 |
| Upravljanje radnicima/licencama | Evidencija sektora, licenci, dokumenata, notifikacija o isteku i statusima zaposlenih. | Prisma modeli Employee/Sector/License/LicenseNotification.@prisma/schema.prisma#273-399 |
| Advanced Analytics | YoY/QoQ poređenja, market share, sezonski obrasci, forecasting, heat/sankey/geo mape, multi-language exporti i zakazani izvještaji. | Specifikovano u PLAN_REALIZACIJE_v3 i SPRINT_12 dokumentu.@docs/PLAN_REALIZACIJE_v3.md#28-48 @docs/README_PROJEKTNA_DOKUMENTACIJA.md#65-100 |

## 4. Konfiguracija i pokretanje
### Preduvjeti
- Node.js 18+, PostgreSQL 14+, Git okruženje i timske uloge definisane su kao dio početnog checklist-a u dokumentaciji.@docs/README_PROJEKTNA_DOKUMENTACIJA.md#193-214

### Environment varijable
- `.env.example` daje preporučenu `DATABASE_URL` vezu s parametrima za pooling, te URL-ove za Next.js/NEXTAUTH konfiguraciju. Kopirati u `.env` i prilagoditi korisničke podatke i tajne ključeve.@.env.example#1-24

### Instalacija i razvoj
1. Instalacija zavisnosti: `npm install`.  
2. Generisanje Prisma klijenta i migracije: `npx prisma generate` + `npx prisma migrate deploy` (ili `migrate dev` u lokalnom okruženju).  
3. Pokretanje dev servera: `npm run dev`.  
4. Produkcijski build/start: `npm run build` i `npm run start`.  
   (Sve komande osim Prisma migracija su definisane u `package.json`).@package.json#6-13

### Seed podaci
- Skripta `npm run db:seed` (alias `tsx prisma/seed.ts`) kreira airlines, aerodrome, tipove aviona (iz `docs/aircraft.json`), delay kodove (iz `docs/iata_delay_codes.json`), operacione tipove te tri korisnička računa (admin/manager/viewer) s hashovanim lozinkama. Time se osigurava inicijalni skup podataka za testiranje dashboarda i procesa.@package.json#6-15 @prisma/seed.ts#1-395

## 5. Struktura repozitorija i dokumentacija
- **Aplikacioni kod:** `src/app` (Next.js rute/stranice), `src/components` (UI blokovi), `src/lib` (Prisma i pomoćne biblioteke), `src/types` (tipovi).@list_dir[src] 
- **Prisma:** `prisma/schema.prisma` + seed skripte i JSON fajlovi u `docs/`.  
- **Dokumentacija:** folder `docs/` s glavnim vodičima – `README_PROJEKTNA_DOKUMENTACIJA.md` (sveobuhvatni pregled), `PLAN_REALIZACIJE_v3.md` (ciljevi, arhitektura, DB schema), `SPRINTOVI_I_ZADACI_v3_COMPLETE.md` (task breakdown), `QUICK_START_GUIDE.md` (brzi onboarding) i specijalizirani vodiči (i18n, optimizacije, dashboard dizajn).@docs/README_PROJEKTNA_DOKUMENTACIJA.md#9-151

## 6. Sigurnost i autentikacija
- Login forma uključuje osnovnu zaštitu od brute-force pokušaja (rate limit feedback) i jasne poruke korisniku, dok se uspješna autentikacija potvrđuje čuvanjem role/emaila u lokalnoj memoriji radi UI personalizacije. Za produkciju je potrebno konfigurirati `NEXTAUTH_SECRET` i eventualno proširiti server-side session politike prije otvaranja prema internetu.@src/app/page.tsx#21-239 @.env.example#18-24

## 7. Preporuke i naredni koraci
1. **Dokumentovati API sloj:** Na zadacima Sprinta 10 predviđena je izrada OpenAPI/Swagger specifikacije i korisničkog uputstva – preporuka je to prioritetno završiti prije produkcije.@docs/SPRINTOVI_I_ZADACI_v3_COMPLETE.md#1120-1143
2. **Automatizovati izvještaje i i18n testove:** Slijediti `SPRINT_12_ADVANCED_ANALYTICS.md` i `MULTI_LANGUAGE_IMPLEMENTATION_GUIDE.md` za implementaciju multi-language exporta i zakazanih izvještaja kako bi analitika bila potpuna.@docs/README_PROJEKTNA_DOKUMENTACIJA.md#65-131
3. **Operacionalizovati deployment:** Nakon MVP sprintova, slijedi produkcijsko okruženje s connection poolingom ili PgBouncer‑om kako preporučuju env komentari, te postavljanje monitoring/logging sloja.

---
Ovaj izvještaj sumira trenutno stanje aplikacije, definisane module i konkretne korake potrebne da se projekat stabilno podigne i proširi ka punoj produkciji.
