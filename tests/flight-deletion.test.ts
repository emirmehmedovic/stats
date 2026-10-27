import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canDeleteFlightDate, getFlightDeletionCutoff } from '../src/lib/flight-deletion';

for (const [now, today] of [
  ['2026-10-27T12:00:00Z', '2026-10-27'],
  ['2026-10-26T23:00:00Z', '2026-10-27'],
  ['2026-07-01T22:00:00Z', '2026-07-02'],
  ['2026-03-29T22:00:00Z', '2026-03-30'],
  ['2026-10-25T23:00:00Z', '2026-10-26'],
  ['2026-12-31T23:00:00Z', '2027-01-01'],
]) {
  test(`deletion boundary at ${now}`, () => {
    const clock = new Date(now);
    const cutoff = getFlightDeletionCutoff(clock);
    assert.equal(cutoff.toISOString(), `${today}T00:00:00.000Z`);
    assert.equal(canDeleteFlightDate(new Date(cutoff.getTime() - 1), clock), false);
    assert.equal(canDeleteFlightDate(today, clock), true);
    assert.equal(canDeleteFlightDate(new Date(cutoff.getTime() + 86400000), clock), true);
    assert.equal(canDeleteFlightDate('invalid', clock), false);
  });
}
