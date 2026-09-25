import assert from 'node:assert/strict';
import test from 'node:test';
import { lstRows, pickPools } from './lst_compare.mjs';

const RKU = 'rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp';

// The rkuSOL pool as decoded from its account in epoch 1042 (the bytes in stake_pool.test.mjs).
const rkuPool = {
  symbol: 'rkuSOL', name: 'Raiku Staked SOL', mint: RKU, address: 'ERhozr6u9drmAANXGRNP1oh3quSqPKEwioKH5b8v9Kkt',
  totalLamports: 180737833919737n, poolTokenSupply: 177510161208498n,
  lastEpochTotalLamports: 180699723032907n, lastEpochPoolTokenSupply: 177504010832906n,
  lastUpdateEpoch: 1042, epochFee: 2.5,
};

// A pool with `sol` staked whose rate grew from 1 to 1.0002 at its last update.
const pool = (symbol, sol, lastUpdateEpoch = 1042) => ({
  symbol, name: `${symbol} name`, mint: `${symbol}-mint`, address: `${symbol}-pool`,
  totalLamports: BigInt(sol * 10_002) * 100_000n, poolTokenSupply: BigInt(sol) * 1_000_000_000n,
  lastEpochTotalLamports: 1_000_000_000n, lastEpochPoolTokenSupply: 1_000_000_000n,
  lastUpdateEpoch, epochFee: 5,
});

const epochSeconds = { 1040: 114985, 1041: 114837 };

test('keeps the five largest pools by SOL staked, plus rkuSOL with its rank among all pools', () => {
  const pools = [pool('A', 900), pool('B', 5000), rkuPool, pool('C', 3000), pool('D', 2000), pool('E', 1000), pool('F', 4000)];
  const pick = (list) => pickPools(list, { highlightMint: RKU }).map((row) => [row.rank, row.symbol]);
  assert.deepEqual(pick(pools), [[1, 'rkuSOL'], [2, 'B'], [3, 'F'], [4, 'C'], [5, 'D']]);
  assert.deepEqual(pick(pools.map((p) => (p === rkuPool ? { ...rkuPool, totalLamports: 1n } : p))), [[1, 'B'], [2, 'F'], [3, 'C'], [4, 'D'], [5, 'E'], [7, 'rkuSOL']]);
});

test('APY is the rate change recorded at the last update, annualized over that epoch', () => {
  const [row] = lstRows([{ ...rkuPool, rank: 26 }], { currentEpoch: 1042, epochSeconds });
  // Same figure the Raiku staking API reported for this epoch: 4.96%.
  assert.equal(row.apyPct.toFixed(2), '4.96');
  assert.equal(row.epoch, 1041);
  assert.equal(row.rank, 26);
  assert.equal(row.tvlSol, 180737.83);
  assert.equal(row.feePct, 2.5);
  const [synthetic] = lstRows([pool('A', 1000)], { currentEpoch: 1042, epochSeconds: { 1041: 86_400 } });
  assert.ok(Math.abs(synthetic.apyPct - (1.0002 ** 365 - 1) * 100) < 1e-3);
});

test('no APY for a pool not updated this epoch or the one before', () => {
  const rows = lstRows([pool('A', 1000, 1041), pool('B', 900, 1040)], { currentEpoch: 1042, epochSeconds });
  assert.equal(rows[0].epoch, 1040);
  assert.ok(rows[0].apyPct > 0);
  assert.equal(rows[1].apyPct, null);
  assert.equal(rows[1].epoch, null);
});

test('a pool missing from the registry keeps its mint and no name', () => {
  const [row] = lstRows([{ ...pool('X', 10), symbol: undefined, name: undefined, rank: 3 }], { currentEpoch: 1042, epochSeconds });
  assert.equal(row.symbol, null);
  assert.equal(row.name, null);
  assert.equal(row.mint, 'X-mint');
});
