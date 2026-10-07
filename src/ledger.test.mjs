import assert from 'node:assert/strict';
import test from 'node:test';
import { applyTransactions, closeDaysUntil, createLedger, flows, mismatches, orderTransactions, ownerSummary } from './ledger.mjs';

const DAY = 86_400;
const T0 = Date.parse('2026-05-12T00:00:00Z') / 1000;
const raw = (ui) => String(BigInt(Math.round(ui * 1e9)));
let seq = 0;
const tx = (time, events) => ({ sig: `sig${seq}`, seq: seq++, time, events });
const ev = (account, owner, from, to) => ({ account, owner, from: from == null ? null : raw(from), to: raw(to) });

function history() {
  seq = 0;
  return [
    tx(T0, [ev('accA', 'alice', null, 10)]), // alice buys 10
    tx(T0 + DAY, [ev('accB', 'bob', null, 5)]), // bob buys 5
    tx(T0 + 2 * DAY, [ev('accA', 'alice', 10, 6), ev('accB', 'bob', 5, 9)]), // alice sends 4 to bob
    tx(T0 + 3 * DAY, [ev('accB', 'bob', 9, 0)]), // bob sells everything
  ];
}

test('points are 1 per rkuSOL per day actually held', () => {
  const ledger = applyTransactions(createLedger(), history());
  const alice = ownerSummary(ledger, 'alice', T0 + 4 * DAY);
  // 10 for 2 days, then 6 for 2 days
  assert.equal(alice.points, 10 * 2 + 6 * 2);
  assert.equal(alice.balance, 6);
  assert.equal(alice.daysHeld, 4);
  assert.equal(alice.firstTime, T0);
});

test('former holders keep the points they earned and stop accruing', () => {
  const ledger = applyTransactions(createLedger(), history());
  const bob = ownerSummary(ledger, 'bob', T0 + 10 * DAY);
  // 5 for 1 day, then 9 for 1 day, then nothing
  assert.equal(bob.points, 5 + 9);
  assert.equal(bob.balance, 0);
  assert.equal(bob.daysHeld, 2);
  assert.equal(bob.exits, 1);
  assert.equal(bob.lastExit, T0 + 3 * DAY);
  assert.equal(bob.peak, 9);
});

test('a missing transaction shows up as a chain break', () => {
  seq = 0;
  const ledger = applyTransactions(createLedger(), [
    tx(T0, [ev('accA', 'alice', null, 10)]),
    tx(T0 + DAY, [ev('accA', 'alice', 7, 12)]), // expected to start from 10
  ]);
  assert.equal(ledger.chainBreaks.length, 1);
  assert.equal(ledger.chainBreaks[0].account, 'accA');
});

test('merged transactions are put back in chain order, even inside one slot', () => {
  // Two lists found these separately; in slot 7 the +5 came before the −3.
  const found = [
    { sig: 'sell', slot: 7, order: 0, time: T0 + DAY, events: [ev('accA', 'alice', 15, 12)] },
    { sig: 'buy1', slot: 3, order: 0, time: T0, events: [ev('accA', 'alice', null, 10)] },
    { sig: 'buy2', slot: 7, order: 1, time: T0 + DAY, events: [ev('accA', 'alice', 10, 15)] },
  ];
  const ordered = orderTransactions(found);
  assert.deepEqual(ordered.map((t) => [t.sig, t.seq]), [['buy1', 0], ['buy2', 1], ['sell', 2]]);
  const ledger = applyTransactions(createLedger(), ordered);
  assert.equal(ledger.chainBreaks.length, 0);
  assert.equal(ledger.owners.alice.balance, raw(12));
});

test('balances are checked against the chain', () => {
  const ledger = applyTransactions(createLedger(), history());
  assert.deepEqual(mismatches(ledger, { alice: raw(6) }), []);
  assert.deepEqual(mismatches(ledger, { alice: raw(5), carol: raw(1) }), [
    { owner: 'alice', ledger: raw(6), chain: raw(5) },
    { owner: 'carol', ledger: '0', chain: raw(1) },
  ]);
});

test('daily series records each finished day for wallets only', () => {
  const ledger = applyTransactions(createLedger(), history(), { isWallet: (owner) => owner !== 'bob' });
  closeDaysUntil(ledger, T0 + 5 * DAY, { isWallet: (owner) => owner !== 'bob' });
  assert.deepEqual(ledger.daily.map((d) => d.date), ['2026-05-12', '2026-05-13', '2026-05-14', '2026-05-15', '2026-05-16']);
  const day2 = ledger.daily[1];
  assert.equal(day2.wallets, 1);
  assert.equal(day2.supply, 10);
  assert.ok(Math.abs(day2.points - 20) < 1e-3); // alice: 10 × ~2 days by the end of May 13
});

test('flows count joins, exits and the biggest changes in the window', () => {
  const ledger = applyTransactions(createLedger(), history());
  // Over the whole week bob bought and sold out again, so he nets to neither joined nor exited.
  const week = flows(ledger, T0 + 3 * DAY, 7);
  assert.deepEqual(week.joined, { count: 1, amount: 6 });
  assert.equal(week.exited.count, 0);
  // From day 1.5: bob went 5 → 0 (exit), alice 10 → 6.
  const recent = flows(ledger, T0 + 3 * DAY, 1.5);
  assert.deepEqual(recent.exited, { count: 1, amount: 5 });
  assert.deepEqual(recent.topOut.map((r) => [r.owner, r.change]), [['bob', -5], ['alice', -4]]);
});
