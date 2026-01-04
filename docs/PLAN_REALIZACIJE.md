# Plan Realizacije - Softver za Statistiku Aerodroma Tuzla

## 📋 Pregled Projekta

**Naziv projekta:** Airport Statistics Management System  
**Aerodrom:** Tuzla International Airport  
**Tech Stack:**
- Frontend: React + Next.js (App Router)
- Backend: Node.js + Next.js API Routes
- Database: PostgreSQL
- ORM: Prisma
- Hosting: Lokalni server
- File Storage: Lokalni file system

---

## 🎯 Ciljevi Projekta

### Modul 1: Statistika Saobraćaja
- Dnevni unos podataka o letovima (dolasci/odlasci)
- Automatsko generisanje izvještaja
- Pretraga i filtriranje podataka
- Vizualizacija statistike (grafikoni, charts)
- Export podataka (Excel, PDF)

### Modul 2: Upravljanje Radnicima
- Profil radnika sa osnovnim informacijama
- Upravljanje licencama i certifikatima
- Upload dokumentacije vezane za licence
- Notifikacije o isteku licenci
- Pregled historije i status dokumenata

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

---

## 🏗️ Arhitektura Sistema

### Database Schema (PostgreSQL + Prisma)

```prisma
// Aviokompanije
model Airline {
  id          String   @id @default(cuid())
  name        String
  icaoCode    String   @unique
  iataCode    String?
  country     String?
  flights     Flight[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Tipovi aviona
model AircraftType {
  id          String   @id @default(cuid())
  model       String   @unique
  seats       Int
  mtow        Int      // Maximum Takeoff Weight
  flights     Flight[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Letovi
model Flight {
  id                    String        @id @default(cuid())
  date                  DateTime
  airline               Airline       @relation(fields: [airlineId], references: [id])
  airlineId             String
  aircraftType          AircraftType  @relation(fields: [aircraftTypeId], references: [id])
  aircraftTypeId        String
  registration          String
  route                 String
  operationType         String        // SCHEDULED, MEDEVAC, CHARTER
  
  // Arrival
  arrivalFlightNumber   String?
  arrivalScheduledTime  DateTime?
  arrivalActualTime     DateTime?
  arrivalPassengers     Int?
  arrivalInfants        Int?
  arrivalBaggage        Int?          // kg
  arrivalCargo          Int?          // kg
  arrivalMail           Int?          // kg
  
  // Departure
  departureFlightNumber String?
  departureScheduledTime DateTime?
  departureActualTime   DateTime?
  departurePassengers   Int?
  departureInfants      Int?
  departureBaggage      Int?         // kg
  departureCargo        Int?         // kg
  departureMail         Int?         // kg
  
  createdAt             DateTime      @default(now())
  updatedAt             DateTime      @updatedAt
  
  @@index([date])
  @@index([airlineId])
  @@index([route])
}

// Radnici
model Employee {
  id              String            @id @default(cuid())
  firstName       String
  lastName        String
  email           String            @unique
  phone           String?
  dateOfBirth     DateTime?
  hireDate        DateTime
  position        String
  department      String?
  photo           String?           // URL to photo
  status          String            @default("ACTIVE") // ACTIVE, INACTIVE, ON_LEAVE
  licenses        License[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
}

// Licence
model License {
  id              String            @id @default(cuid())
  employee        Employee          @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  employeeId      String
  licenseType     String            // Tip licence (pilot, air traffic controller, etc.)
  licenseNumber   String
  issuedDate      DateTime
  expiryDate      DateTime
  issuer          String?           // Ko je izdao licencu
  status          String            @default("ACTIVE") // ACTIVE, EXPIRED, SUSPENDED
  documents       LicenseDocument[]
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt
  
  @@index([employeeId])
  @@index([expiryDate])
}

// Dokumentacija licence
model LicenseDocument {
  id              String   @id @default(cuid())
  license         License  @relation(fields: [licenseId], references: [id], onDelete: Cascade)
  licenseId       String
  fileName        String
  filePath        String
  fileType        String
  fileSize        Int
  uploadedAt      DateTime @default(now())
  
  @@index([licenseId])
}

// Notifikacije za istek licenci
model LicenseNotification {
  id              String   @id @default(cuid())
  employeeId      String
  licenseId       String
  notificationDate DateTime
  sent            Boolean  @default(false)
  sentAt          DateTime?
  createdAt       DateTime @default(now())
}
```

### Folder Struktura

```
airport-stats/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── layout.tsx
│   │   ├── flights/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   ├── new/
│   │   │   └── import/
│   │   ├── employees/
│   │   │   ├── page.tsx
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── licenses/
│   │   │   │   └── documents/
│   │   │   └── new/
│   │   ├── reports/
│   │   │   ├── daily/
│   │   │   ├── monthly/
│   │   │   ├── yearly/
│   │   │   └── custom/
│   │   ├── api/
│   │   │   ├── flights/
│   │   │   ├── employees/
│   │   │   ├── licenses/
│   │   │   ├── reports/
│   │   │   └── upload/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── flights/
│   │   ├── employees/
│   │   ├── reports/
│   │   └── layout/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── utils.ts
│   │   ├── excel.ts
│   │   └── auth.ts
│   ├── hooks/
│   ├── types/
│   └── styles/
├── public/
│   └── uploads/
│       ├── documents/
│       └── photos/
├── .env
├── .env.example
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.js
```

---

## 🔐 Autentifikacija i Sigurnost

### Auth Strategy
- **NextAuth.js** za autentifikaciju
- Role-based access control (RBAC)
  - Admin: Puni pristup
  - Manager: Unos podataka + izvještaji
  - Viewer: Samo pregled

### Sigurnost Fajlova
- File upload validacija (tip, veličina)
- Secure file storage sa hash nazivima
- Access control za downloadovanje dokumenata

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

### 1.2 Upravljanje Letovima
- **Lista letova:**
  - Tabela sa filterima (datum, aviokompanija, ruta)
  - Pagination
  - Sort po kolonama
  - Quick search

- **Dodavanje leta:**
  - Forma sa validacijom
  - Automatsko completion (aviolinije, avioni)
  - Dual entry (arrival + departure)

- **Import iz Excela:**
  - Upload Excel fajla
  - Preview podataka prije importa
  - Validacija podataka
  - Bulk import sa error handlingom

- **Edit i Delete:**
  - Izmjena pojedinačnog leta
  - Soft delete sa mogućnošću restore

### 1.3 Izvještaji
- **Dnevni izvještaj:**
  - Tabela svih letova za odabrani dan
  - Suma putnika, tereta, pošte
  - Export u Excel/PDF

- **Mjesečni izvještaj:**
  - Agregacija po danima
  - Statistika po aviokompanijama
  - Grafikoni trendova
  - Top rute

- **Godišnji izvještaj:**
  - Mjesečna analiza
  - YoY usporedba
  - Sezonalnost

- **Custom izvještaj:**
  - Odabir datumskog raspona
  - Filteri po kompaniji, rutu, tipu operacije
  - Odabir metrika za prikaz

### 1.4 Analytics
- **Load Factor Analysis:**
  - Popunjenost po letovima
  - Popunjenost po aviokompanijama
  - Trend analysis

- **Punctuality Report:**
  - Kašnjenja dolazaka
  - Kašnjenja odlazaka
  - On-time performance %

---

## 👥 Funkcionalnosti - Modul 2: Upravljanje Radnicima

### 2.1 Lista Radnika
- **Tabela sa filterima:**
  - Pretraga po imenu
  - Filter po departmentu/poziciji
  - Filter po statusu (aktivan/neaktivan)
  - Sort opcije

### 2.2 Profil Radnika
- **Osnovne informacije:**
  - Fotografija
  - Ime, prezime, datum rođenja
  - Kontakt (email, telefon)
  - Pozicija i departman
  - Datum zaposlenja
  - Status

- **Social-like features:**
  - Timeline aktivnosti
  - Status updates
  - Quick actions

### 2.3 Licence i Certifikati
- **Lista licenci:**
  - Kartica za svaku licencu
  - Status indicator (aktivna, ističe uskoro, istekla)
  - Datum isteka
  - Quick view dokumentacije

- **Dodavanje licence:**
  - Forma sa svim detaljima
  - Upload dokumenata (multiple files)
  - Automatsko postavljanje notifikacija

- **Notifikacije:**
  - Email notifikacija 60, 30, 15 dana prije isteka
  - In-app notifikacije
  - Dashboard widget sa licencama koje ističu

### 2.4 Upravljanje Dokumentima
- **Document viewer:**
  - PDF preview u browseru
  - Image viewer
  - Download opcija

- **Document management:**
  - Upload multiple files
  - Organizacija po tipovima
  - Version control (opciono)

---

## 🎨 UI/UX Dizajn

### Design System
- **UI Library:** shadcn/ui + Tailwind CSS
- **Ikone:** Lucide React
- **Grafikoni:** Recharts / Chart.js
- **Tabele:** TanStack Table (React Table v8)
- **Forme:** React Hook Form + Zod validacija
- **Date picker:** react-day-picker

### Responsive Design
- Desktop first approach
- Tablet optimizacija
- Mobile basic view

### Tema
- Light/Dark mode toggle
- Moderna, profesionalna paleta boja
- Primjer:
  - Primary: Blue (#0066CC)
  - Success: Green (#10B981)
  - Warning: Yellow (#F59E0B)
  - Danger: Red (#EF4444)

---

## ⚙️ Development Setup

### Prerequisites
```bash
Node.js >= 18.17
PostgreSQL >= 14
```

### Environment Variables
```env
DATABASE_URL="postgresql://user:password@localhost:5432/airport_stats"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
UPLOAD_DIR="/var/airport-stats/uploads"
```

### Installation Steps
```bash
# Clone repo
git clone <repo-url>
cd airport-stats

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate dev

# Seed initial data (opciono)
npm run seed

# Start dev server
npm run dev
```

---

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Server Requirements
- Ubuntu 20.04+ / Debian 11+
- 4GB RAM minimum
- 50GB storage
- Node.js 18+
- PostgreSQL
- Nginx (reverse proxy)

### Backup Strategy
- Automatski backup baze (daily)
- Backup uploaded fajlova (weekly)
- Retention: 30 dana

---

## 📋 API Endpoints (Overview)

### Flights
- `GET /api/flights` - Lista letova
- `GET /api/flights/:id` - Detalji leta
- `POST /api/flights` - Kreiranje leta
- `PUT /api/flights/:id` - Ažuriranje leta
- `DELETE /api/flights/:id` - Brisanje leta
- `POST /api/flights/import` - Import iz Excela

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

### Reports
- `GET /api/reports/daily?date=YYYY-MM-DD` - Dnevni izvještaj
- `GET /api/reports/monthly?year=YYYY&month=MM` - Mjesečni izvještaj
- `GET /api/reports/yearly?year=YYYY` - Godišnji izvještaj
- `POST /api/reports/custom` - Custom izvještaj

---

## 🧪 Testing Strategy

### Unit Tests
- Utility funkcije
- API route handlers
- Business logic

### Integration Tests
- API endpoints
- Database operations
- File uploads

### E2E Tests (opciono)
- Critical user flows
- Playwright / Cypress

---

## 📚 Documentation

### Tehnička dokumentacija
- API dokumentacija (OpenAPI/Swagger)
- Database schema diagram
- Architecture decision records (ADR)

### Korisnička dokumentacija
- User manual
- Admin guide
- FAQ

---

## 🔄 Maintenance

### Regular Tasks
- Database cleanup (stari podaci)
- Log rotation
- Performance monitoring
- Security updates

### Monitoring
- Application logs
- Error tracking (Sentry opciono)
- Performance metrics
- Uptime monitoring

---

## 💡 Future Enhancements (v2.0)

### Modul 1 dodatke:
- Real-time flight tracking
- Weather integration
- Predictive analytics
- API integracija sa aviokompanijama

### Modul 2 dodatke:
- Training records module
- Performance reviews
- Leave management
- Certification courses tracking

### Generalno:
- Mobile aplikacija
- Multi-language support
- Advanced analytics dashboard
- Notification system (SMS/Push)

---

## ⚠️ Pitanja i Odluke

### Za razjasniti sa klijentom:

1. **Broj korisnika:**
   - Koliko ljudi će istovremeno koristiti sistem?
   - Potrebna licence (admin, manager, viewer)?

2. **Historijski podaci:**
   - Da li postoje postojeći podaci za import?
   - Koliko godina historije treba zadržati?

3. **Izvještaji:**
   - Specifični format izvještaja?
   - Frekuencija automatskih izvještaja?
   - Email delivery izvještaja?

4. **Radnici modul:**
   - Koliko ukupno radnika?
   - Koliko tipova licenci postoji?
   - Prosječan broj dokumenata po licenci?

5. **Notifikacije:**
   - Email only ili i SMS?
   - Push notifikacije potrebne?

6. **Integracije:**
   - Postojeći sistemi za integraciju?
   - HR sistem?
   - Accounting sistem?

---

## 📞 Kontakt i Podrška

- **Technical Lead:** [Vaše ime]
- **Project Manager:** [Ime]
- **Issue Tracking:** GitHub Issues / Jira
- **Documentation:** Wiki / Confluence

---

**Verzija dokumenta:** 1.0  
**Datum:** 21.11.2025  
**Status:** Draft - Za review
