import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSnapshot } from './build_snapshot.mjs';
import { applyTransactions, closeDaysUntil, createLedger } from './ledger.mjs';

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

test('buildSnapshot uses the ledger for exact points, former holders and history', () => {
  const DAY = 86_400;
  const t0 = Date.parse('2026-05-12T00:00:00Z') / 1000;
  const raw = (ui) => String(ui * 1e9);
  const ledger = applyTransactions(createLedger(), [
    { sig: 'a', seq: 0, time: t0, events: [{ account: 'accA', owner: 'alice', from: null, to: raw(10) }] },
    { sig: 'b', seq: 1, time: t0 + DAY, events: [{ account: 'accB', owner: 'bob', from: null, to: raw(4) }] },
    { sig: 'c', seq: 2, time: t0 + 2 * DAY, events: [{ account: 'accA', owner: 'alice', from: raw(10), to: raw(6) }, { account: 'accB', owner: 'bob', from: raw(4), to: raw(0) }] },
  ]);
  const now = t0 + 4 * DAY;
  closeDaysUntil(ledger, now);
  const snapshot = buildSnapshot({
    holdersData: { fetchedAt: new Date(now * 1000).toISOString(), supplyUi: 6, holders: [{ owner: 'alice', amountUi: 6, share: 1, isPda: false }] },
    now: now * 1000,
    ledger,
  });

  const alice = snapshot.realRows[0];
  assert.equal(alice.score, 10 * 2 + 6 * 2); // balance actually held each day, not 6 × 4
  assert.equal(alice.daysHeld, 4);
  assert.equal(alice.exact, true);
  assert.deepEqual(snapshot.formerHolders.map((r) => [r.owner, r.points, r.daysHeld, r.peak]), [['bob', 4, 1, 4]]);
  assert.deepEqual(snapshot.holderTimeline.map((d) => d.holders), [1, 2, 1, 1, 1]); // May 12–15, then today
  assert.equal(snapshot.dailyTimeline.at(-1).points, 32 + 4); // everyone's points, incl. bob's
  assert.equal(snapshot.stats.totalPoints, 32 + 4); // the headline total keeps what bob earned
  assert.equal(snapshot.ledger.currentPoints, 32);
  assert.equal(snapshot.ledger.formerHolders, 1);
  assert.equal(snapshot.ledger.walletsEver, 2);
});

test('buildSnapshot falls back to the estimate when the ledger disagrees with the chain', () => {
  const ledger = applyTransactions(createLedger(), [
    { sig: 'a', seq: 0, time: Date.parse('2026-05-12T00:00:00Z') / 1000, events: [{ account: 'accA', owner: 'alice', from: null, to: String(10e9) }] },
  ]);
  const snapshot = buildSnapshot({
    holdersData: { supplyUi: 7, holders: [{ owner: 'alice', amountUi: 7, share: 1, isPda: false }] },
    firstSeenData: {},
    now: Date.parse('2026-05-14T00:00:00Z'),
    ledger,
  });
  assert.equal(snapshot.realRows[0].exact, false);
  assert.equal(snapshot.realRows[0].score, 7 * snapshot.realRows[0].daysHeld);
});

test('buildSnapshot names identified program accounts', () => {
  const kamino = '2NhLJRL9AeooN1DYv5b2LrcyCqZZbvrPp16N4gAjQEWk';
  const snapshot = buildSnapshot({
    holdersData: { supplyUi: 10, holders: [{ owner: kamino, amountUi: 10, share: 1, isPda: false }] },
    now: Date.parse('2026-01-04T00:00:00.000Z'),
  });
  assert.equal(snapshot.stats.realWallets, 0);
  assert.equal(snapshot.allRows[0].pdaLabel, 'Kamino (Raiku Market)');
});
