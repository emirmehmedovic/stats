# Access Control Integration - Implementation Plan

## 📊 Project Overview

Integracija sistema kontrole pristupa sa postojećom Stats aplikacijom. Cilj je automatizovati sync podataka iz SQLite baze access control sistema u PostgreSQL bazu Stats aplikacije, uz kreiranje dashboard-a za vizualizaciju i analizu pristupa.

---

## 🔍 Analiza Postojećih Sistema

### Access Control Database (SQLite)
**Lokacija:** `/Users/emir_mw/radno-vrijeme/database.db`

#### Tabela: Users
```sql
CREATE TABLE Users (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  Deleted BOOL DEFAULT 0,
  Lastname TEXT,
  Firstname TEXT,
  Card TEXT,
  -- ... ostala polja
)
```

**Relevantna polja:**
- `Id` - UserId
- `Firstname`, `Lastname` - Ime i prezime
- `Card` - Broj kartice
- `Deleted` - Status (0 = aktivan)

**Trenutno stanje:**
- Aktivnih korisnika: **202**
- Ukupno korisnika (uključujući deleted): **202+**

#### Tabela: HardwareEvents
```sql
CREATE TABLE HardwareEvents (
  Id INTEGER PRIMARY KEY AUTOINCREMENT,
  UserId INT,
  PlaceName TEXT,
  PlaceId INT,
  EventTime DATETIME,
  UserToken TEXT,
  Username TEXT,
  UserLastname TEXT,
  EventId INT,
  ControllerId INT,
  Reader INT,
  -- ... ostala polja
)
```

**Relevantna polja:**
- `Id` - Event ID
- `UserId` - Foreign key na Users
- `PlaceId`, `PlaceName` - Lokacija čitača
- `EventTime` - Timestamp događaja
- `UserToken` - Token kartice
- `EventId` - Tip događaja (20, 22, 18, etc.)

**Trenutno stanje:**
- Ukupno eventa: **73,044**
- Najnoviji event: **2026-02-11 13:43:20**
- Najaktivnije lokacije:
  1. ULAZ 2 (PlaceId: 35) - 33,665 eventa
  2. WC ZAKUPNICI (PlaceId: 38) - 21,850 eventa
  3. ULAZ KUHINJA 2 (PlaceId: 40) - 7,475 eventa

---

### Stats Application (Next.js 15 + PostgreSQL)
**Lokacija:** `/Users/emir_mw/stats`

**Tech Stack:**
- Next.js 15.5.9 (React 19.2.1)
- TypeScript
- PostgreSQL + Prisma ORM 6.19.0
- TailwindCSS + Radix UI
- Recharts (visualization)
- JWT Auth (jose library)

**Postojeće features:**
- Flight operations tracking
- Employee management
- Dashboard analytics
- Role-based access control
- Audit logging
- Rate limiting
- CSV/Excel import/export
- Report generation

---

## 🏗 Tehnička Arhitektura

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   Access Control System                      │
│                                                               │
│  ┌──────────────┐         ┌─────────────────────┐           │
│  │  Card Reader │────────▶│  SQLite Database    │           │
│  │   Devices    │         │  (database.db)      │           │
│  └──────────────┘         │                     │           │
│                           │  - Users            │           │
│                           │  - HardwareEvents   │           │
│                           └─────────┬───────────┘           │
└─────────────────────────────────────┼─────────────────────────┘
                                      │
                                      │ Read every 10 min
                                      ▼
                            ┌─────────────────┐
                            │   Cron Job      │
                            │   Sync Script   │
                            │                 │
                            │  - Query new    │
                            │  - Transform    │
                            │  - Batch send   │
                            └────────┬────────┘
                                     │
                                     │ HTTPS POST
                                     │ API Key Auth
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                      Stats Application                       │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │  API Endpoint: /api/access-control/sync            │     │
│  │  - Validate API key                                │     │
│  │  - Rate limiting                                   │     │
│  │  - Zod validation                                  │     │
│  │  - Prisma upsert (transaction)                     │     │
│  └──────────────────┬─────────────────────────────────┘     │
│                     │                                        │
│                     ▼                                        │
│  ┌─────────────────────────────────────────┐               │
│  │      PostgreSQL Database                │               │
│  │                                          │               │
│  │  - AccessControlUser                    │               │
│  │  - AccessControlPlace                   │               │
│  │  - AccessControlEvent                   │               │
│  │  - AccessControlSyncLog                 │               │
│  └──────────────────┬──────────────────────┘               │
│                     │                                        │
│                     ▼                                        │
│  ┌─────────────────────────────────────────┐               │
│  │     Dashboard UI (/access-control)      │               │
│  │                                          │               │
│  │  - Real-time metrics                    │               │
│  │  - Event log & filters                  │               │
│  │  - User timeline charts                 │               │
│  │  - Place traffic analysis               │               │
│  │  - Export reports (CSV/Excel)           │               │
│  └──────────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 Implementation Tasks

### Task #1: Prisma Schema - Access Control Models

**Lokacija:** `prisma/schema.prisma`

#### Novi modeli:

```prisma
// Access Control User - sync sa SQLite Users tabele
model AccessControlUser {
  id              Int       @id @default(autoincrement())
  externalUserId  Int       @unique // UserId iz SQLite
  firstname       String?
  lastname        String?
  card            String?
  deleted         Boolean   @default(false)

  // Veze
  events          AccessControlEvent[]

  // Audit
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastSyncAt      DateTime  @default(now())

  @@index([externalUserId])
  @@index([lastname, firstname])
  @@map("access_control_users")
}

// Access Control Place - lokacije čitača
model AccessControlPlace {
  id              Int       @id @default(autoincrement())
  externalPlaceId Int       @unique // PlaceId iz SQLite
  placeName       String

  // Veze
  events          AccessControlEvent[]

  // Audit
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastSyncAt      DateTime  @default(now())

  @@index([externalPlaceId])
  @@map("access_control_places")
}

// Access Control Event - hardware events
model AccessControlEvent {
  id                Int       @id @default(autoincrement())
  externalEventId   Int       @unique // Id iz HardwareEvents

  // Foreign keys
  userId            Int?
  user              AccessControlUser? @relation(fields: [userId], references: [id])
  placeId           Int?
  place             AccessControlPlace? @relation(fields: [placeId], references: [id])

  // Event data
  eventTime         DateTime
  eventId           Int?      // EventId iz HardwareEvents (20, 22, etc.)
  controllerId      Int?
  reader            Int?
  userToken         String?
  username          String?
  userLastname      String?

  // Raw data (JSON za buduće potrebe)
  rawData           Json?

  // Audit
  createdAt         DateTime  @default(now())
  syncedAt          DateTime  @default(now())

  @@index([userId, eventTime])
  @@index([placeId, eventTime])
  @@index([eventTime])
  @@map("access_control_events")
}

// Sync Log - praćenje sinhronizacija
model AccessControlSyncLog {
  id              Int       @id @default(autoincrement())
  status          String    // SUCCESS, ERROR, PARTIAL
  recordsSynced   Int       @default(0)
  recordsInserted Int       @default(0)
  recordsUpdated  Int       @default(0)
  recordsFailed   Int       @default(0)
  errorMessage    String?   @db.Text
  syncDuration    Int?      // u milisekundama

  // Metadata
  sourceDatabase  String?   // Path to SQLite db
  lastEventTime   DateTime? // Posljednji EventTime u batch-u

  createdAt       DateTime  @default(now())

  @@index([createdAt])
  @@index([status])
  @@map("access_control_sync_logs")
}
```

**Akcije:**
1. Dodati modele u `schema.prisma`
2. Kreirati migraciju: `npx prisma migrate dev --name add_access_control_models`
3. Generate Prisma Client: `npx prisma generate`

---

### Task #2: Cron Job Sync Script

**Lokacija:** `/Users/emir_mw/radno-vrijeme/sync-to-stats.js` (ili `.py`)

#### Option A: Node.js Implementation

**Dependencies:**
```bash
npm install better-sqlite3 dotenv node-fetch
```

**Skripta struktura:**

```javascript
// sync-to-stats.js
const Database = require('better-sqlite3');
const fetch = require('node-fetch');
require('dotenv').config();

const CONFIG = {
  DATABASE_PATH: process.env.DATABASE_PATH || '/Users/emir_mw/radno-vrijeme/database.db',
  API_URL: process.env.API_URL || 'http://localhost:3000/api/access-control/sync',
  API_KEY: process.env.API_KEY,
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE) || 100,
  STATE_FILE: process.env.STATE_FILE || './last-sync-state.json'
};

class AccessControlSync {
  constructor() {
    this.db = new Database(CONFIG.DATABASE_PATH, { readonly: true });
    this.lastSyncTime = this.loadLastSyncTime();
  }

  loadLastSyncTime() {
    try {
      const state = require(CONFIG.STATE_FILE);
      return state.lastEventTime || '2000-01-01 00:00:00';
    } catch {
      return '2000-01-01 00:00:00'; // Default start
    }
  }

  saveLastSyncTime(timestamp) {
    fs.writeFileSync(CONFIG.STATE_FILE, JSON.stringify({
      lastEventTime: timestamp,
      lastSyncAt: new Date().toISOString()
    }));
  }

  async syncUsers() {
    const users = this.db.prepare(`
      SELECT Id, Firstname, Lastname, Card, Deleted
      FROM Users
    `).all();

    return users.map(u => ({
      externalUserId: u.Id,
      firstname: u.Firstname,
      lastname: u.Lastname,
      card: u.Card,
      deleted: Boolean(u.Deleted)
    }));
  }

  async syncPlaces() {
    const places = this.db.prepare(`
      SELECT DISTINCT PlaceId, PlaceName
      FROM HardwareEvents
      WHERE PlaceId IS NOT NULL
    `).all();

    return places.map(p => ({
      externalPlaceId: p.PlaceId,
      placeName: p.PlaceName
    }));
  }

  async syncEvents() {
    const events = this.db.prepare(`
      SELECT
        Id, UserId, PlaceId, PlaceName, EventTime, EventId,
        ControllerId, Reader, UserToken, Username, UserLastname
      FROM HardwareEvents
      WHERE EventTime > ?
      ORDER BY EventTime ASC
      LIMIT ?
    `).all(this.lastSyncTime, CONFIG.BATCH_SIZE);

    return events.map(e => ({
      externalEventId: e.Id,
      userId: e.UserId,
      placeId: e.PlaceId,
      eventTime: e.EventTime,
      eventId: e.EventId,
      controllerId: e.ControllerId,
      reader: e.Reader,
      userToken: e.UserToken,
      username: e.Username,
      userLastname: e.UserLastname,
      rawData: e
    }));
  }

  async sendToAPI(payload) {
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${await response.text()}`);
    }

    return await response.json();
  }

  async run() {
    console.log(`[${new Date().toISOString()}] Starting sync...`);

    try {
      const users = await this.syncUsers();
      const places = await this.syncPlaces();
      const events = await this.syncEvents();

      if (events.length === 0) {
        console.log('No new events to sync.');
        return;
      }

      const payload = { users, places, events };
      const result = await this.sendToAPI(payload);

      console.log(`Sync completed: ${result.inserted} inserted, ${result.updated} updated`);

      // Update last sync time
      const lastEventTime = events[events.length - 1].eventTime;
      this.saveLastSyncTime(lastEventTime);

    } catch (error) {
      console.error('Sync failed:', error.message);
      process.exit(1);
    } finally {
      this.db.close();
    }
  }
}

// Run
const sync = new AccessControlSync();
sync.run();
```

**Environment file (`.env`):**
```env
DATABASE_PATH=/Users/emir_mw/radno-vrijeme/database.db
API_URL=https://your-stats-app.com/api/access-control/sync
API_KEY=your-secret-api-key-here
BATCH_SIZE=100
STATE_FILE=./last-sync-state.json
```

#### Option B: Python Implementation

```python
# sync-to-stats.py
import sqlite3
import json
import requests
import os
from datetime import datetime
from pathlib import Path

class AccessControlSync:
    def __init__(self):
        self.db_path = os.getenv('DATABASE_PATH', '/Users/emir_mw/radno-vrijeme/database.db')
        self.api_url = os.getenv('API_URL', 'http://localhost:3000/api/access-control/sync')
        self.api_key = os.getenv('API_KEY')
        self.batch_size = int(os.getenv('BATCH_SIZE', 100))
        self.state_file = os.getenv('STATE_FILE', './last-sync-state.json')

        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.last_sync_time = self.load_last_sync_time()

    def load_last_sync_time(self):
        try:
            with open(self.state_file, 'r') as f:
                state = json.load(f)
                return state.get('lastEventTime', '2000-01-01 00:00:00')
        except FileNotFoundError:
            return '2000-01-01 00:00:00'

    def save_last_sync_time(self, timestamp):
        with open(self.state_file, 'w') as f:
            json.dump({
                'lastEventTime': timestamp,
                'lastSyncAt': datetime.now().isoformat()
            }, f)

    def sync_users(self):
        cursor = self.conn.execute("""
            SELECT Id, Firstname, Lastname, Card, Deleted
            FROM Users
        """)
        return [{
            'externalUserId': row['Id'],
            'firstname': row['Firstname'],
            'lastname': row['Lastname'],
            'card': row['Card'],
            'deleted': bool(row['Deleted'])
        } for row in cursor]

    def sync_places(self):
        cursor = self.conn.execute("""
            SELECT DISTINCT PlaceId, PlaceName
            FROM HardwareEvents
            WHERE PlaceId IS NOT NULL
        """)
        return [{
            'externalPlaceId': row['PlaceId'],
            'placeName': row['PlaceName']
        } for row in cursor]

    def sync_events(self):
        cursor = self.conn.execute("""
            SELECT
                Id, UserId, PlaceId, PlaceName, EventTime, EventId,
                ControllerId, Reader, UserToken, Username, UserLastname
            FROM HardwareEvents
            WHERE EventTime > ?
            ORDER BY EventTime ASC
            LIMIT ?
        """, (self.last_sync_time, self.batch_size))

        return [{
            'externalEventId': row['Id'],
            'userId': row['UserId'],
            'placeId': row['PlaceId'],
            'eventTime': row['EventTime'],
            'eventId': row['EventId'],
            'controllerId': row['ControllerId'],
            'reader': row['Reader'],
            'userToken': row['UserToken'],
            'username': row['Username'],
            'userLastname': row['UserLastname'],
            'rawData': dict(row)
        } for row in cursor]

    def send_to_api(self, payload):
        response = requests.post(
            self.api_url,
            json=payload,
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {self.api_key}'
            },
            timeout=30
        )
        response.raise_for_status()
        return response.json()

    def run(self):
        print(f"[{datetime.now().isoformat()}] Starting sync...")

        try:
            users = self.sync_users()
            places = self.sync_places()
            events = self.sync_events()

            if not events:
                print("No new events to sync.")
                return

            payload = {
                'users': users,
                'places': places,
                'events': events
            }

            result = self.send_to_api(payload)
            print(f"Sync completed: {result['inserted']} inserted, {result['updated']} updated")

            # Update last sync time
            last_event_time = events[-1]['eventTime']
            self.save_last_sync_time(last_event_time)

        except Exception as e:
            print(f"Sync failed: {str(e)}")
            exit(1)
        finally:
            self.conn.close()

if __name__ == '__main__':
    sync = AccessControlSync()
    sync.run()
```

**Crontab konfiguracija:**
```bash
# Edit crontab
crontab -e

# Add line (every 10 minutes)
*/10 * * * * cd /Users/emir_mw/radno-vrijeme && /usr/bin/node sync-to-stats.js >> sync.log 2>&1

# Ili za Python:
*/10 * * * * cd /Users/emir_mw/radno-vrijeme && /usr/bin/python3 sync-to-stats.py >> sync.log 2>&1
```

---

### Task #3: API Endpoint Implementation

**Lokacija:** `src/app/api/access-control/sync/route.ts`

```typescript
// src/app/api/access-control/sync/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import prisma from '@/lib/prisma';

// Zod validation schemas
const UserSchema = z.object({
  externalUserId: z.number(),
  firstname: z.string().nullable(),
  lastname: z.string().nullable(),
  card: z.string().nullable(),
  deleted: z.boolean().default(false)
});

const PlaceSchema = z.object({
  externalPlaceId: z.number(),
  placeName: z.string()
});

const EventSchema = z.object({
  externalEventId: z.number(),
  userId: z.number().nullable(),
  placeId: z.number().nullable(),
  eventTime: z.string().transform(str => new Date(str)),
  eventId: z.number().nullable(),
  controllerId: z.number().nullable(),
  reader: z.number().nullable(),
  userToken: z.string().nullable(),
  username: z.string().nullable(),
  userLastname: z.string().nullable(),
  rawData: z.any().optional()
});

const SyncPayloadSchema = z.object({
  users: z.array(UserSchema),
  places: z.array(PlaceSchema),
  events: z.array(EventSchema)
});

// API Key validation
function validateApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const expectedKey = process.env.ACCESS_CONTROL_API_KEY;

  if (!expectedKey) {
    console.error('ACCESS_CONTROL_API_KEY not configured');
    return false;
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const providedKey = authHeader.substring(7);
  return providedKey === expectedKey;
}

// Rate limiting (simple in-memory, može se koristiti Redis za production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = 10; // 10 requests
  const window = 60 * 1000; // per minute

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + window });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // API Key validation
    if (!validateApiKey(request)) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid API key' },
        { status: 401 }
      );
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 10 requests per minute.' },
        { status: 429 }
      );
    }

    // Parse and validate payload
    const body = await request.json();
    const validatedData = SyncPayloadSchema.parse(body);

    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    // Execute in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Upsert Users
      for (const user of validatedData.users) {
        try {
          const result = await tx.accessControlUser.upsert({
            where: { externalUserId: user.externalUserId },
            update: {
              firstname: user.firstname,
              lastname: user.lastname,
              card: user.card,
              deleted: user.deleted,
              lastSyncAt: new Date()
            },
            create: {
              externalUserId: user.externalUserId,
              firstname: user.firstname,
              lastname: user.lastname,
              card: user.card,
              deleted: user.deleted
            }
          });

          // Check if it was an insert or update
          const existing = await tx.accessControlUser.findUnique({
            where: { externalUserId: user.externalUserId },
            select: { createdAt: true, updatedAt: true }
          });

          if (existing && existing.createdAt.getTime() === existing.updatedAt.getTime()) {
            inserted++;
          } else {
            updated++;
          }
        } catch (error: any) {
          errors.push(`User ${user.externalUserId}: ${error.message}`);
        }
      }

      // 2. Upsert Places
      for (const place of validatedData.places) {
        try {
          await tx.accessControlPlace.upsert({
            where: { externalPlaceId: place.externalPlaceId },
            update: {
              placeName: place.placeName,
              lastSyncAt: new Date()
            },
            create: {
              externalPlaceId: place.externalPlaceId,
              placeName: place.placeName
            }
          });
        } catch (error: any) {
          errors.push(`Place ${place.externalPlaceId}: ${error.message}`);
        }
      }

      // 3. Upsert Events
      for (const event of validatedData.events) {
        try {
          // Get internal userId and placeId
          const user = event.userId ? await tx.accessControlUser.findUnique({
            where: { externalUserId: event.userId },
            select: { id: true }
          }) : null;

          const place = event.placeId ? await tx.accessControlPlace.findUnique({
            where: { externalPlaceId: event.placeId },
            select: { id: true }
          }) : null;

          await tx.accessControlEvent.upsert({
            where: { externalEventId: event.externalEventId },
            update: {
              userId: user?.id,
              placeId: place?.id,
              eventTime: event.eventTime,
              eventId: event.eventId,
              controllerId: event.controllerId,
              reader: event.reader,
              userToken: event.userToken,
              username: event.username,
              userLastname: event.userLastname,
              rawData: event.rawData,
              syncedAt: new Date()
            },
            create: {
              externalEventId: event.externalEventId,
              userId: user?.id,
              placeId: place?.id,
              eventTime: event.eventTime,
              eventId: event.eventId,
              controllerId: event.controllerId,
              reader: event.reader,
              userToken: event.userToken,
              username: event.username,
              userLastname: event.userLastname,
              rawData: event.rawData
            }
          });

          inserted++;
        } catch (error: any) {
          errors.push(`Event ${event.externalEventId}: ${error.message}`);
        }
      }
    });

    // Log sync operation
    const duration = Date.now() - startTime;
    const lastEventTime = validatedData.events.length > 0
      ? validatedData.events[validatedData.events.length - 1].eventTime
      : null;

    await prisma.accessControlSyncLog.create({
      data: {
        status: errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
        recordsSynced: validatedData.events.length,
        recordsInserted: inserted,
        recordsUpdated: updated,
        recordsFailed: errors.length,
        errorMessage: errors.length > 0 ? errors.join('; ') : null,
        syncDuration: duration,
        lastEventTime: lastEventTime
      }
    });

    return NextResponse.json({
      success: true,
      inserted,
      updated,
      errors: errors.length > 0 ? errors : undefined,
      duration
    });

  } catch (error: any) {
    console.error('Sync API error:', error);

    // Log failed sync
    const duration = Date.now() - startTime;
    await prisma.accessControlSyncLog.create({
      data: {
        status: 'ERROR',
        recordsSynced: 0,
        recordsInserted: 0,
        recordsUpdated: 0,
        recordsFailed: 0,
        errorMessage: error.message,
        syncDuration: duration
      }
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET(request: NextRequest) {
  if (!validateApiKey(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const lastSync = await prisma.accessControlSyncLog.findFirst({
      orderBy: { createdAt: 'desc' },
      select: {
        status: true,
        recordsSynced: true,
        createdAt: true,
        lastEventTime: true
      }
    });

    const stats = await prisma.accessControlEvent.aggregate({
      _count: { id: true },
      _max: { eventTime: true }
    });

    return NextResponse.json({
      status: 'ok',
      lastSync,
      stats: {
        totalEvents: stats._count.id,
        latestEventTime: stats._max.eventTime
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
```

**Environment variable:**
Dodati u `.env`:
```env
ACCESS_CONTROL_API_KEY=your-secure-random-api-key-here
```

Generate API key:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

### Task #4: Dashboard & Visualization UI

**Lokacija:** `src/app/access-control/page.tsx`

#### Dashboard Layout Structure:

```
/access-control
├── page.tsx              - Main dashboard
├── users/
│   └── [id]/
│       └── page.tsx      - User detail with timeline
├── places/
│   └── [id]/
│       └── page.tsx      - Place traffic analysis
└── events/
    └── page.tsx          - Event log viewer
```

#### Main Dashboard (`src/app/access-control/page.tsx`):

```typescript
import { Suspense } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getDashboardStats } from '@/lib/access-control-stats';

export default async function AccessControlDashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Access Control Dashboard</h1>

      <Suspense fallback={<LoadingSkeleton />}>
        <DashboardStats />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Suspense fallback={<CardSkeleton />}>
          <TopLocationsChart />
        </Suspense>

        <Suspense fallback={<CardSkeleton />}>
          <ActiveUsersChart />
        </Suspense>
      </div>

      <div className="mt-6">
        <Suspense fallback={<TableSkeleton />}>
          <RecentEventsTable />
        </Suspense>
      </div>
    </div>
  );
}
```

#### API Routes za Dashboard:

**`src/app/api/access-control/stats/route.ts`:**
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || 'today'; // today, week, month

  const now = new Date();
  let startDate: Date;

  switch (period) {
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
  }

  const [totalEvents, uniqueUsers, topPlaces, hourlyDistribution] = await Promise.all([
    // Total events
    prisma.accessControlEvent.count({
      where: { eventTime: { gte: startDate } }
    }),

    // Unique users
    prisma.accessControlEvent.groupBy({
      by: ['userId'],
      where: { eventTime: { gte: startDate }, userId: { not: null } },
      _count: true
    }),

    // Top places
    prisma.accessControlEvent.groupBy({
      by: ['placeId'],
      where: { eventTime: { gte: startDate }, placeId: { not: null } },
      _count: true,
      orderBy: { _count: { placeId: 'desc' } },
      take: 5
    }),

    // Hourly distribution (for today)
    prisma.$queryRaw`
      SELECT
        EXTRACT(HOUR FROM event_time) as hour,
        COUNT(*) as count
      FROM access_control_events
      WHERE event_time >= ${startDate}
      GROUP BY EXTRACT(HOUR FROM event_time)
      ORDER BY hour
    `
  ]);

  return NextResponse.json({
    totalEvents,
    uniqueUsers: uniqueUsers.length,
    topPlaces,
    hourlyDistribution
  });
}
```

**Chart Components (koristi Recharts):**

```typescript
// components/access-control/TopLocationsChart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export function TopLocationsChart({ data }: { data: any[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Lokacija</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart width={500} height={300} data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="placeName" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="eventCount" fill="#8884d8" />
        </BarChart>
      </CardContent>
    </Card>
  );
}
```

#### Event Log Table (`components/access-control/EventLogTable.tsx`):

```typescript
'use client';

import { useState } from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function EventLogTable() {
  const [filters, setFilters] = useState({
    search: '',
    placeId: null,
    dateFrom: null,
    dateTo: null
  });

  // ... fetch events with filters

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Log</CardTitle>
        <div className="flex gap-4 mt-4">
          <Input
            placeholder="Search user..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
          {/* More filters */}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vrijeme</TableHead>
              <TableHead>Korisnik</TableHead>
              <TableHead>Lokacija</TableHead>
              <TableHead>Event ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Map events */}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

---

### Task #5: Production Setup & Configuration

#### Server Setup Checklist:

1. **Install Dependencies:**
```bash
# Node.js (ako koristi Node.js sync script)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Ili Python dependencies
pip3 install requests python-dotenv
```

2. **Setup Sync Script:**
```bash
# Create directory
mkdir -p /opt/access-control-sync
cd /opt/access-control-sync

# Copy script
cp sync-to-stats.js /opt/access-control-sync/
# ili
cp sync-to-stats.py /opt/access-control-sync/

# Install dependencies
npm install
# ili
pip3 install -r requirements.txt

# Create .env file
cat > .env << EOF
DATABASE_PATH=/path/to/database.db
API_URL=https://your-production-domain.com/api/access-control/sync
API_KEY=your-generated-api-key
BATCH_SIZE=100
STATE_FILE=/opt/access-control-sync/last-sync-state.json
EOF

# Set permissions
chmod 600 .env
chmod +x sync-to-stats.js
```

3. **Configure Crontab:**
```bash
sudo crontab -e

# Add (runs every 10 minutes)
*/10 * * * * cd /opt/access-control-sync && /usr/bin/node sync-to-stats.js >> /var/log/access-control-sync.log 2>&1

# Rotate logs weekly
0 0 * * 0 mv /var/log/access-control-sync.log /var/log/access-control-sync.log.old
```

4. **Test Sync:**
```bash
# Dry run (manually)
cd /opt/access-control-sync
node sync-to-stats.js

# Check logs
tail -f /var/log/access-control-sync.log
```

5. **Monitoring Setup:**

Create monitoring script (`monitor-sync.sh`):
```bash
#!/bin/bash
LOG_FILE="/var/log/access-control-sync.log"
STATE_FILE="/opt/access-control-sync/last-sync-state.json"

# Check if sync ran in last 15 minutes
LAST_SYNC=$(jq -r '.lastSyncAt' $STATE_FILE)
NOW=$(date -u +%s)
LAST_SYNC_EPOCH=$(date -d "$LAST_SYNC" +%s)
DIFF=$((NOW - LAST_SYNC_EPOCH))

if [ $DIFF -gt 900 ]; then
  echo "WARNING: Sync hasn't run in $(($DIFF/60)) minutes"
  # Send alert (email, Slack, etc.)
fi

# Check for errors in log
ERRORS=$(tail -100 $LOG_FILE | grep -i "error\|failed" | wc -l)
if [ $ERRORS -gt 0 ]; then
  echo "WARNING: $ERRORS errors found in recent logs"
fi
```

Add to crontab (check every hour):
```bash
0 * * * * /opt/access-control-sync/monitor-sync.sh
```

---

### Task #6: Testing & Documentation

#### Testing Checklist:

**Unit Tests:**
```typescript
// tests/api/access-control/sync.test.ts
import { POST } from '@/app/api/access-control/sync/route';

describe('/api/access-control/sync', () => {
  test('should reject requests without API key', async () => {
    const request = new Request('http://localhost:3000/api/access-control/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const response = await POST(request as any);
    expect(response.status).toBe(401);
  });

  test('should accept valid payload with correct API key', async () => {
    // ... implementation
  });

  test('should handle duplicate events gracefully', async () => {
    // ... implementation
  });
});
```

**Integration Tests:**
```bash
# Test full pipeline
1. Insert test record in SQLite database
2. Run sync script
3. Verify record appears in PostgreSQL
4. Check dashboard displays new data
```

**Load Testing:**
```bash
# Test with 73k existing records
# Measure sync time for initial load
# Test concurrent sync requests (should be rate limited)
```

**Edge Cases:**
- Network timeout during sync
- Duplicate event IDs
- Missing PlaceId/UserId references
- Very old timestamps (before 2000)
- Database lock on SQLite (read-only mode helps)

#### Documentation Files:

**`docs/ACCESS_CONTROL_SETUP.md`:**
- Step-by-step setup guide
- Environment configuration
- Troubleshooting common issues

**`docs/ACCESS_CONTROL_API.md`:**
- API endpoint documentation
- Request/response examples
- Error codes and handling

**`docs/ACCESS_CONTROL_ARCHITECTURE.md`:**
- System architecture diagram
- Data flow explanation
- Security considerations

---

## 🔐 Security Considerations

1. **API Key Management:**
   - Generate strong random keys (32+ bytes)
   - Store in environment variables, never in code
   - Rotate keys periodically
   - Use different keys for dev/staging/production

2. **Rate Limiting:**
   - Implemented at API level (10 req/min)
   - Can be enhanced with Redis for distributed systems
   - Monitor for abuse patterns

3. **Data Privacy:**
   - Access control dashboard restricted to ADMIN/MANAGER roles
   - Audit logging for all dashboard access
   - Personal data (Firstname, Lastname) handled per GDPR if applicable

4. **Database Security:**
   - SQLite opened in read-only mode (prevents accidental writes)
   - PostgreSQL uses connection pooling with timeouts
   - Prisma transactions ensure data consistency

---

## 📊 Performance Optimization

1. **Batch Processing:**
   - Default batch size: 100 events
   - Adjustable via `BATCH_SIZE` env var
   - Prevents memory issues with large datasets

2. **Database Indexes:**
   - `(userId, eventTime)` for user timelines
   - `(placeId, eventTime)` for place analytics
   - `eventTime` for chronological queries
   - `externalEventId`, `externalUserId`, `externalPlaceId` for upserts

3. **Caching:**
   - Dashboard stats cached for 5 minutes
   - Extend stats endpoint with cache headers

4. **Initial Load Strategy:**
   - For 73k existing records, run manual initial sync with larger batch size
   - Then switch to 10-minute incremental sync

```bash
# One-time full sync
BATCH_SIZE=1000 node sync-to-stats.js
```

---

## 🚀 Deployment Timeline

| Phase | Task | Duration | Dependencies |
|-------|------|----------|--------------|
| 1 | Prisma models + migration | 1 hour | - |
| 2 | API endpoint implementation | 2-3 hours | Phase 1 |
| 3 | Sync script development | 2-3 hours | Phase 2 |
| 4 | Dashboard UI components | 4-5 hours | Phase 2 |
| 5 | Server setup & cron config | 1-2 hours | Phase 3 |
| 6 | Testing & documentation | 2-3 hours | All phases |

**Total Estimated Time:** 12-17 hours

---

## 📈 Future Enhancements

1. **Real-time Sync:**
   - Replace cron with file watcher (chokidar, watchdog)
   - Instant event propagation (<1s latency)

2. **Advanced Analytics:**
   - Predictive access patterns
   - Anomaly detection (unusual access times/locations)
   - Access heatmaps

3. **Alerting System:**
   - Email/SMS alerts for specific events
   - Integration with Slack/Teams
   - Configurable alert rules

4. **Mobile App:**
   - Real-time push notifications
   - Mobile dashboard view

5. **Integration Extensions:**
   - Export to BI tools (Tableau, PowerBI)
   - Webhook support for third-party integrations

---

## 🛠 Troubleshooting Guide

### Common Issues:

**1. "Database locked" error:**
```
Solution: SQLite opened in read-only mode (add { readonly: true })
```

**2. "API key invalid":**
```
Solution: Check ACCESS_CONTROL_API_KEY in both .env files matches
```

**3. "Rate limit exceeded":**
```
Solution: Reduce sync frequency or increase rate limit in API code
```

**4. "Foreign key constraint failed":**
```
Solution: Ensure users/places are synced before events
```

**5. "Sync hasn't run in X minutes":**
```
Check crontab: crontab -l
Check logs: tail -f /var/log/access-control-sync.log
Verify cron service: systemctl status cron
```

---

## 📞 Contact & Support

**GitHub Repository:** https://github.com/emirmehmedovic/stats

**Implementation Questions:**
- Check existing patterns in `/src/app/api/flights/` for reference
- Follow Prisma best practices for transactions
- Use existing UI components from `/src/components/ui/`

---

**Last Updated:** 2026-02-11
**Version:** 1.0.0
**Status:** Ready for Implementation
