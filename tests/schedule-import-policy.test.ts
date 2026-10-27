import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canImportScheduleDate, getScheduleImportStartDate } from '../src/lib/schedule-import-policy';

for (const [now, tomorrow] of [
  ['2026-10-27T12:00:00Z', '2026-10-28'],
  ['2026-10-27T22:59:59Z', '2026-10-28'],
  ['2026-10-27T23:00:00Z', '2026-10-29'],
  ['2026-07-01T22:00:00Z', '2026-07-03'],
  ['2026-03-29T22:00:00Z', '2026-03-31'],
  ['2026-10-25T23:00:00Z', '2026-10-27'],
  ['2026-12-31T23:00:00Z', '2027-01-02'],
]) {
  test(`schedule import starts tomorrow at ${now}`, () => {
    const clock = new Date(now);
    const cutoff = getScheduleImportStartDate(clock);
    assert.equal(cutoff.toISOString(), `${tomorrow}T00:00:00.000Z`);
    for (const offset of [-86400000 * 2, -86400000, -1]) {
      assert.equal(canImportScheduleDate(new Date(cutoff.getTime() + offset), clock), false);
    }
    assert.equal(canImportScheduleDate(cutoff, clock), true);
    assert.equal(canImportScheduleDate(new Date(cutoff.getTime() + 86400000), clock), true);
    assert.equal(canImportScheduleDate(new Date('invalid'), clock), false);
  });
}
