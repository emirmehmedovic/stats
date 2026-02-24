import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { prisma } from '@/lib/prisma';
import { syncPayloadSchema } from '@/lib/validators/access-control';

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

// Simple in-memory rate limiting (može se zamijeniti sa Redis za production)
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

// POST /api/access-control/sync - Sync data from access control system
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
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 10 requests per minute.' },
        { status: 429 }
      );
    }

    // Parse and validate payload
    const body = await request.json();
    const validatedData = syncPayloadSchema.parse(body);

    let insertedUsers = 0;
    let updatedUsers = 0;
    let insertedPlaces = 0;
    let updatedPlaces = 0;
    let insertedEvents = 0;
    let updatedEvents = 0;
    const errors: string[] = [];

    const batchSize = 200;
    const now = new Date();

    // 1. Bulk upsert Users
    if (validatedData.users.length > 0) {
      const userRows = validatedData.users.map((user) => Prisma.sql`(
        ${randomUUID()},
        ${user.externalUserId},
        ${user.firstname},
        ${user.lastname},
        ${user.card},
        ${user.deleted},
        ${now},
        ${now},
        ${now}
      )`);

      try {
        await prisma.$executeRaw(Prisma.sql`
          INSERT INTO "access_control_users"
            ("id", "externalUserId", "firstname", "lastname", "card", "deleted", "createdAt", "updatedAt", "lastSyncAt")
          VALUES ${Prisma.join(userRows)}
          ON CONFLICT ("externalUserId") DO UPDATE SET
            "firstname" = EXCLUDED."firstname",
            "lastname" = EXCLUDED."lastname",
            "card" = EXCLUDED."card",
            "deleted" = EXCLUDED."deleted",
            "lastSyncAt" = ${now},
            "updatedAt" = ${now}
        `);
        insertedUsers += validatedData.users.length;
      } catch (error: any) {
        errors.push(`Users bulk upsert: ${error.message}`);
      }
    }

    // 2. Bulk upsert Places
    if (validatedData.places.length > 0) {
      const placeRows = validatedData.places.map((place) => Prisma.sql`(
        ${randomUUID()},
        ${place.externalPlaceId},
        ${place.placeName},
        ${now},
        ${now},
        ${now}
      )`);

      try {
        await prisma.$executeRaw(Prisma.sql`
          INSERT INTO "access_control_places"
            ("id", "externalPlaceId", "placeName", "createdAt", "updatedAt", "lastSyncAt")
          VALUES ${Prisma.join(placeRows)}
          ON CONFLICT ("externalPlaceId") DO UPDATE SET
            "placeName" = EXCLUDED."placeName",
            "lastSyncAt" = ${now},
            "updatedAt" = ${now}
        `);
        insertedPlaces += validatedData.places.length;
      } catch (error: any) {
        errors.push(`Places bulk upsert: ${error.message}`);
      }
    }

    // 2. Upsert Events in smaller batches, with preloaded id maps
    for (let i = 0; i < validatedData.events.length; i += batchSize) {
      const eventsBatch = validatedData.events.slice(i, i + batchSize);

      const userIds = Array.from(
        new Set(eventsBatch.map((event) => event.userId).filter((id): id is number => id !== null))
      );
      const placeIds = Array.from(
        new Set(eventsBatch.map((event) => event.placeId).filter((id): id is number => id !== null))
      );

      const users = userIds.length > 0
        ? await prisma.accessControlUser.findMany({
            where: { externalUserId: { in: userIds } },
            select: { id: true, externalUserId: true },
          })
        : [];

      const places = placeIds.length > 0
        ? await prisma.accessControlPlace.findMany({
            where: { externalPlaceId: { in: placeIds } },
            select: { id: true, externalPlaceId: true },
          })
        : [];

      const userMap = new Map(users.map((u) => [u.externalUserId, u.id]));
      const placeMap = new Map(places.map((p) => [p.externalPlaceId, p.id]));

      const eventRows = eventsBatch.map((event) => {
        const userId = event.userId !== null ? userMap.get(event.userId) || null : null;
        const placeId = event.placeId !== null ? placeMap.get(event.placeId) || null : null;

        return Prisma.sql`(
          ${randomUUID()},
          ${event.externalEventId},
          ${userId},
          ${placeId},
          ${event.eventTime},
          ${event.eventId},
          ${event.controllerId},
          ${event.reader},
          ${event.userToken},
          ${event.username},
          ${event.userLastname},
          ${event.rawData || null},
          ${now}
        )`;
      });

      try {
        await prisma.$executeRaw(Prisma.sql`
          INSERT INTO "access_control_events"
            ("id", "externalEventId", "userId", "placeId", "eventTime", "eventId", "controllerId", "reader",
             "userToken", "username", "userLastname", "rawData", "syncedAt")
          VALUES ${Prisma.join(eventRows)}
          ON CONFLICT ("externalEventId") DO UPDATE SET
            "userId" = EXCLUDED."userId",
            "placeId" = EXCLUDED."placeId",
            "eventTime" = EXCLUDED."eventTime",
            "eventId" = EXCLUDED."eventId",
            "controllerId" = EXCLUDED."controllerId",
            "reader" = EXCLUDED."reader",
            "userToken" = EXCLUDED."userToken",
            "username" = EXCLUDED."username",
            "userLastname" = EXCLUDED."userLastname",
            "rawData" = EXCLUDED."rawData",
            "syncedAt" = EXCLUDED."syncedAt"
        `);
        insertedEvents += eventsBatch.length;
      } catch (error: any) {
        errors.push(`Events batch ${i + 1}-${i + eventsBatch.length}: ${error.message}`);
      }
    }

    // Log sync operation
    const duration = Date.now() - startTime;
    const lastEventTime =
      validatedData.events.length > 0
        ? validatedData.events[validatedData.events.length - 1].eventTime
        : null;

    await prisma.accessControlSyncLog.create({
      data: {
        status: errors.length > 0 ? 'PARTIAL' : 'SUCCESS',
        recordsSynced: validatedData.events.length,
        recordsInserted: insertedEvents,
        recordsUpdated: updatedEvents,
        recordsFailed: errors.length,
        errorMessage: errors.length > 0 ? errors.join('; ') : null,
        syncDuration: duration,
        lastEventTime: lastEventTime,
      },
    });

    return NextResponse.json({
      success: true,
      inserted: insertedUsers + insertedPlaces + insertedEvents,
      updated: updatedUsers + updatedPlaces + updatedEvents,
      details: {
        users: { inserted: insertedUsers, updated: updatedUsers },
        places: { inserted: insertedPlaces, updated: updatedPlaces },
        events: { inserted: insertedEvents, updated: updatedEvents },
      },
      errors: errors.length > 0 ? errors : undefined,
      duration,
    });
  } catch (error: any) {
    console.error('Sync API error:', error);

    // Log failed sync
    const duration = Date.now() - startTime;
    try {
      await prisma.accessControlSyncLog.create({
        data: {
          status: 'ERROR',
          recordsSynced: 0,
          recordsInserted: 0,
          recordsUpdated: 0,
          recordsFailed: 0,
          errorMessage: error.message,
          syncDuration: duration,
        },
      });
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}

// GET /api/access-control/sync - Health check endpoint
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
        lastEventTime: true,
      },
    });

    const stats = await prisma.accessControlEvent.aggregate({
      _count: { id: true },
      _max: { eventTime: true },
    });

    const userCount = await prisma.accessControlUser.count();
    const placeCount = await prisma.accessControlPlace.count();

    return NextResponse.json({
      status: 'ok',
      lastSync,
      stats: {
        totalUsers: userCount,
        totalPlaces: placeCount,
        totalEvents: stats._count.id,
        latestEventTime: stats._max.eventTime,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: 'error', message: error.message },
      { status: 500 }
    );
  }
}
