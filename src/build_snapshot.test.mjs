import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSnapshot } from './build_snapshot.mjs';

test('buildSnapshot calculates wallet scores and first-seen coverage', () => {
  const snapshot = buildSnapshot({
    holdersData: {
      fetchedAt: '2026-01-04T00:00:00.000Z',
      mint: 'fixture-mint',
      supplyUi: 160,
      stats: {
        officialHolders: 3,
        latestApy: 0.05,
        launchDate: '2026-01-01T00:00:00.000Z',
      },
      holders: [
        { owner: 'wallet-one', amountUi: 100, share: 100 / 160, isPda: false },
        { owner: 'wallet-two', amountUi: 10, share: 10 / 160, isPda: false },
        { owner: 'pda-one', amountUi: 50, share: 50 / 160, isPda: true },
      ],
    },
    firstSeenData: {
      'wallet-one': 1767312000,
    },
    pdaLabels: {
      'pda-one': { known: 'Fixture pool' },
    },
    now: Date.parse('2026-01-04T00:00:00.000Z'),
  });

  assert.equal(snapshot.stats.realWallets, 2);
  assert.ok(snapshot.realRows[0].score > 0);
  assert.deepEqual(snapshot.coverage, { found: 1, total: 2 });
});
