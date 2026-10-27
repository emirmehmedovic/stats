import assert from 'node:assert/strict';
import { test } from 'node:test';
import Module from 'node:module';
import { getScheduleImportStartDate } from '../src/lib/schedule-import-policy';

const tomorrow = getScheduleImportStartDate();
let includeFuture = false;
const lookedUp: Date[] = [];
const loader = Module as any;
const originalLoad = loader._load;
loader._load = function (id: string, ...args: any[]) {
  if (id === '@/lib/prisma') return { prisma: { flight: {
    findFirst: async ({ where }: any) => { lookedUp.push(where.date); return null; },
    // No mutation methods: protected-only imports must never attempt a write.
  } } };
  if (id === '@/lib/rate-limit') return { getClientIp: () => 'test', rateLimit: () => ({ ok: true }) };
  if (id === '@/lib/parsers/schedule-changes') return {
    parseScheduleChangesFile: async () => ({
      success: true, totalRules: 3, errors: [], warnings: [],
      expandedFlights: (includeFuture ? [-2, -1, 0] : [-2, -1]).map(offset => ({
        date: new Date(tomorrow.getTime() + offset * 86400000),
        route: 'TZL-BER', departureFlightNumber: 'W6 4275', arrivalFlightNumber: null,
        status: 'SCHEDULED',
      })),
    }),
  };
  return originalLoad.call(this, id, ...args);
};
const { POST } = require('../src/app/api/flights/import-schedule-changes/route');
loader._load = originalLoad;
const request = (dryRun: boolean) => ({ formData: async () => new Map([
  ['file', { name: 'test.txt', size: 1, arrayBuffer: async () => new ArrayBuffer(0) }],
  ['dryRun', String(dryRun)],
] as [string, any][]) });

test('preview includes only tomorrow and later', async () => {
  includeFuture = true;
  const response = await POST(request(true));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.stats.totalFlights, 1);
  assert.equal(result.data[0].date, tomorrow.toISOString());
  assert.match(result.warnings[0], /Preskočeno 2/);
  assert.ok(lookedUp.every(date => date >= tomorrow));
});

test('execution with only protected dates succeeds without database access', async () => {
  includeFuture = false;
  lookedUp.length = 0;
  const response = await POST(request(false));
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.success, true);
  assert.equal(result.created, 0);
  assert.equal(result.updated, 0);
  assert.equal(result.cancelled, 0);
  assert.equal(lookedUp.length, 0);
  assert.match(result.message, /Nema letova za import/);
});
