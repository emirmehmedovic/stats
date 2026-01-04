// ---------------------------------------------------------
// PRISMA CONFIG
// ---------------------------------------------------------

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ---------------------------------------------------------
// ENUMS
// ---------------------------------------------------------

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

// ---------------------------------------------------------
// MODUL 1 - STATISTIKA SAOBRAĆAJA
// ---------------------------------------------------------

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
  mtow      Int      // Maximum Takeoff Weight (kg)
  flights   Flight[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Letovi
model Flight {
  id             String            @id @default(cuid())
  date           DateTime

  airline        Airline           @relation(fields: [airlineId], references: [id])
  airlineId      String

  aircraftType   AircraftType      @relation(fields: [aircraftTypeId], references: [id])
  aircraftTypeId String

  registration   String
  route          String
  operationType  FlightOperationType

  // Kapacitet (realni kapacitet po letu; može biti null za npr. CL650)
  availableSeats Int?

  // Aerodromi
  arrivalAirport     Airport?       @relation("ArrivalAirport", fields: [arrivalAirportId], references: [id])
  arrivalAirportId   String?
  departureAirport   Airport?       @relation("DepartureAirport", fields: [departureAirportId], references: [id])
  departureAirportId String?

  // Arrival
  arrivalFlightNumber   String?
  arrivalScheduledTime  DateTime?
  arrivalActualTime     DateTime?
  arrivalDelayMinutes   Int?        // razlika planirano - stvarno (min), računato u app-u
  arrivalPassengers     Int?
  arrivalInfants        Int?
  arrivalBaggage        Int?        // kg
  arrivalCargo          Int?        // kg
  arrivalMail           Int?        // kg
  arrivalStatus         FlightStatus @default(OPERATED)
  arrivalCancelReason   String?

  // Departure
  departureFlightNumber   String?
  departureScheduledTime  DateTime?
  departureActualTime     DateTime?
  departureDelayMinutes   Int?       // razlika planirano - stvarno (min), računato u app-u
  departurePassengers     Int?
  departureInfants        Int?
  departureBaggage        Int?       // kg
  departureCargo          Int?       // kg
  departureMail           Int?       // kg
  departureStatus         FlightStatus @default(OPERATED)
  departureCancelReason   String?

  // Operativni detalji
  handlingAgent           String?
  stand                   String?
  gate                    String?

  // Meta / kvaliteta podataka
  dataSource              String      @default("MANUAL") // MANUAL, IMPORT_EXCEL, API...
  importedFile            String?
  createdByUserId         String?
  updatedByUserId         String?
  isLocked                Boolean     @default(false)

  // Relacija na kašnjenja
  delays                  FlightDelay[]

  createdAt               DateTime    @default(now())
  updatedAt               DateTime    @updatedAt

  @@index([date])
  @@index([airlineId])
  @@index([route])
}

// Delay kodovi (IATA ili interni)
model DelayCode {
  id          String       @id @default(cuid())
  code        String       @unique
  description String
  category    String       // npr. Carrier, ATC, Weather, Reactionary...

  delays      FlightDelay[]

  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

// Kašnjenja po letu (više kodova po ARR/DEP ako treba)
model FlightDelay {
  id          String     @id @default(cuid())

  flight      Flight     @relation(fields: [flightId], references: [id])
  flightId    String

  phase       DelayPhase // ARR ili DEP

  delayCode   DelayCode  @relation(fields: [delayCodeId], references: [id])
  delayCodeId String

  minutes     Int        // broj minuta za ovaj razlog
  isPrimary   Boolean    @default(true)
  comment     String?

  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt

  @@index([flightId])
  @@index([delayCodeId])
}

// ---------------------------------------------------------
// MODUL 2 - RADNICI I LICENCE
// ---------------------------------------------------------

// Radnici
model Employee {
  id             String    @id @default(cuid())
  employeeNumber String    @unique
  firstName      String
  lastName       String
  email          String    @unique
  phone          String?
  nationalId     String?
  dateOfBirth    DateTime?
  hireDate       DateTime
  position       String
  department     String?
  photo          String?   // URL to photo
  status         String    @default("ACTIVE") // ACTIVE, INACTIVE, ON_LEAVE

  licenses       License[]

  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
}

// Licence
model License {
  id                  String            @id @default(cuid())

  employee            Employee          @relation(fields: [employeeId], references: [id], onDelete: Cascade)
  employeeId          String

  licenseType         String            // tip licence (npr. follow-me, refuel, ops...)
  licenseNumber       String
  issuedDate          DateTime
  expiryDate          DateTime
  issuer              String?           // ko je izdao licencu
  status              String            @default("ACTIVE") // ACTIVE, EXPIRED, SUSPENDED
  requiredForPosition String?           // za koju poziciju je ključna

  documents           LicenseDocument[]

  createdByUserId     String?
  updatedByUserId     String?

  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

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
  id               String    @id @default(cuid())

  employee         Employee  @relation(fields: [employeeId], references: [id])
  employeeId       String

  license          License   @relation(fields: [licenseId], references: [id])
  licenseId        String

  notificationDate DateTime
  sent             Boolean   @default(false)
  sentAt           DateTime?
  createdAt        DateTime  @default(now())

  @@index([employeeId])
  @@index([licenseId])
}
