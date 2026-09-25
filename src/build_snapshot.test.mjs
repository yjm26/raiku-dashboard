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

test('buildSnapshot keeps program-derived owners out of real wallets', () => {
  const wallet = 'Ar1HrwURVUrDRdGPpLDf22iG89XuehvMS8G34LRgkUmi';
  const programAccount = '67hSVB3eZkPj2npXKas1xmuCzKAknWyB5PsNj5CmkQ4i';
  const snapshot = buildSnapshot({
    holdersData: {
      fetchedAt: '2026-01-04T00:00:00.000Z',
      supplyUi: 150,
      stats: { launchDate: '2026-01-01T00:00:00.000Z' },
      holders: [
        { owner: wallet, amountUi: 50, share: 50 / 150, isPda: false },
        // Mislabeled upstream as a wallet; off-curve, so it can't be one.
        { owner: programAccount, amountUi: 100, share: 100 / 150, isPda: false },
      ],
    },
    now: Date.parse('2026-01-04T00:00:00.000Z'),
  });

  assert.deepEqual(snapshot.realRows.map((row) => row.owner), [wallet]);
  assert.equal(snapshot.stats.realWallets, 1);
  assert.equal(snapshot.stats.totalPoints, 150);
  const program = snapshot.allRows.find((row) => row.owner === programAccount);
  assert.equal(program.isPda, true);
  assert.equal(program.pdaLabel, 'Program account');
});
