import assert from 'node:assert/strict';
import { test } from 'node:test';
import Module from 'node:module';
import { getFlightDeletionCutoff } from '../src/lib/flight-deletion';

// Isolate route handlers from the database and authentication infrastructure.
const cutoff = getFlightDeletionCutoff();
let writes = 0;
let past = true;
const prisma = {
  flight: {
    findUnique: async () => ({ isLocked: false, date: new Date(cutoff.getTime() - 86400000) }),
    findFirst: async () => past ? { id: 'past' } : null,
    count: async ({ where }: any) => {
      if (where.date?.gte) assert.ok(where.date.gte >= cutoff);
      return 1;
    },
    delete: async () => { writes++; },
    deleteMany: async ({ where }: any) => {
      assert.ok(where.date.gte >= cutoff);
      writes++;
      return { count: 1 };
    },
  },
  flightDelay: { deleteMany: async () => { writes++; } },
  dailyOperationsVerification: { deleteMany: async () => { writes++; } },
};
const loader = Module as any;
const originalLoad = loader._load;
loader._load = function (id: string, ...args: any[]) {
  if (id === '@/lib/prisma') return { prisma };
  if (id === '@/lib/route-guards') return { requireAdminOrManager: async () => ({ user: {} }) };
  return originalLoad.call(this, id, ...args);
};
const single = require('../src/app/api/flights/[id]/route');
const selected = require('../src/app/api/flights/bulk-delete-selected/route');
const range = require('../src/app/api/flights/bulk-delete/route');
const cancelled = require('../src/app/api/flights/bulk-delete-cancelled/route');
loader._load = originalLoad;
const request = (body: unknown) => ({ json: async () => body });

test('past single, mixed selection and past ranges are rejected without writes', async () => {
  assert.equal((await single.DELETE(request({}), { params: Promise.resolve({ id: 'past' }) })).status, 403);
  assert.equal((await selected.POST(request({ ids: ['past', 'future'] }))).status, 403);
  assert.equal((await range.POST(request({ dateFrom: '2020-01-01', dateTo: '2099-01-01' }))).status, 403);
  assert.equal(writes, 0);
});
test('today selection remains deletable with a database date guard', async () => {
  past = false;
  assert.equal((await selected.POST(request({ ids: ['today'] }))).status, 200);
  assert.equal(writes, 2);
});
test('cancelled preview clamps past input to today without deleting', async () => {
  const before = writes;
  assert.equal((await cancelled.POST(request({ dateFrom: '2020-01-01', preview: true }))).status, 200);
  assert.equal(writes, before);
});
