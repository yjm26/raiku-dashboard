import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeStakePool, decodeValidatorList, summarizeStakePool } from './stake_pool.mjs';

// Real mainnet data captured in epoch 1042: the rkuSOL pool (first 435 bytes; the rest of the
// account is zero padding) and its validator list (header + the single validator entry).
const POOL = Buffer.from('AWx5DsQHemyL8o97W+i/lc2/qE7uZVlmLWzQRmmf8Uq5PRgH1PoaW6dH6RcZ08ZNaGOAAb+85vaQZ58y+nnoFQ1JbiGorPqKPsY9UlHix7NXWcvzsh4pcaU6103qBFFXpP+hwPcwXDKjTlMZCB2rXPXPq7u1jWtp8qucwdQSbsTd03mTgmQYjUuxQ+9GqSsotYVeTV1jmxaB4ToGbVRNbS4zDL8a9Xgp1dyVQo1XEZhfUVRBwa/t+KNhxDsaD0++Lh9R7lbK9UB8Id2bD0dJkKFi6ZE2mh5/fjy4Sf7igscnpgbd9uHXZaGT2cvhRs7reawctIXtX1s3kTqM9YV+/wCp+WRjTmGkAACyVBrOcaEAABIEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6AMAAAAAAAAZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADoAwAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA6AMAAAAAAAABAAAAAAAAAAAKDINfcKEAAEtpzW5YpAAA', 'base64');
const LIST = Buffer.from('AmQAAAABAAAAq+p5+1+kAAAAAAAAAAAAABIEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACM8xxzMRKatC2sJeaRTT7L4SEpZL86MW8T9AniT/6d3w==', 'base64');
const MINT = 'rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp';
const VOTE = 'AVD61fbwxDGuLGCanPWQPxRjdqYk3icssz5u7JH8kbta';

test('decodes the pool: accounts, fees and rate', () => {
  const pool = decodeStakePool(POOL);
  assert.equal(pool.manager, '8JS6XsMPo2u3EyeeY3p2jvzHEhdUtCKgarHpJ3PAonyv');
  assert.equal(pool.validatorList, 'BtRJM6kHw9hEKZRPtkcNG5F1T5FxZrBwdBzUXzVo8WY2');
  assert.equal(pool.poolMint, MINT);
  assert.equal(pool.lastUpdateEpoch, 1042);
  assert.equal(pool.epochFee, 2.5);
  assert.equal(pool.solDepositFee, 0);
  assert.equal(pool.stakeDepositFee, 0);
  assert.equal(pool.solWithdrawalFee, 0.1);
  assert.equal(pool.stakeWithdrawalFee, 0.1);
  assert.equal(pool.nextEpochFee, null);
  assert.equal(pool.nextSolWithdrawalFee, null);
  assert.equal(pool.nextStakeWithdrawalFee, null);
});

test('rate from the pool account equals the Raiku API sol_value for the same epoch', () => {
  const pool = decodeStakePool(POOL);
  const summary = summarizeStakePool({ address: 'pool', program: 'program', pool, list: decodeValidatorList(LIST), mint: MINT });
  // The API reports lamports per rkuSOL truncated to whole lamports.
  assert.equal(Math.floor(summary.rate * 1e9), 1018183030);
  assert.equal(Math.floor(summary.previousRate * 1e9), 1018003605);
});

test('decodes the validator list and names the Raiku validator', () => {
  const list = decodeValidatorList(LIST);
  assert.equal(list.maxValidators, 100);
  assert.equal(list.validators.length, 1);
  assert.equal(list.validators[0].voteAccount, VOTE);
  assert.equal(list.validators[0].activeStakeLamports, 180732147919531n);
  const summary = summarizeStakePool({
    address: 'pool',
    program: 'program',
    pool: decodeStakePool(POOL),
    list,
    votes: { [VOTE]: { commission: 0, delinquent: false } },
    raikuValidator: { votePubkey: VOTE, name: 'Raiku' },
    mint: MINT,
  });
  assert.deepEqual(summary.validators, [{ voteAccount: VOTE, activeStakeSol: 180732.147919531, sharePct: 100, name: 'Raiku', commissionPct: 0, delinquent: false }]);
  assert.deepEqual(summary.pendingFees, []);
});

test('a scheduled fee change is read and later fields still line up', () => {
  // Replace next_epoch_fee None (offset 346) with One(Fee { denominator: 1000, numerator: 30 }).
  const fee = Buffer.alloc(16);
  fee.writeBigUInt64LE(1000n, 0);
  fee.writeBigUInt64LE(30n, 8);
  const modified = Buffer.concat([POOL.subarray(0, 346), Buffer.from([1]), fee, POOL.subarray(347)]);
  const pool = decodeStakePool(modified);
  assert.deepEqual(pool.nextEpochFee, { pct: 3, epochs: 1 });
  assert.equal(pool.solWithdrawalFee, 0.1);
  assert.equal(pool.lastEpochTotalLamports, decodeStakePool(POOL).lastEpochTotalLamports);
  const summary = summarizeStakePool({ address: 'pool', program: 'program', pool, list: decodeValidatorList(LIST), mint: MINT });
  assert.deepEqual(summary.pendingFees, [{ fee: 'Fee on rewards', pct: 3, epochs: 1 }]);
});

test('refuses accounts that are not this pool', () => {
  assert.throws(() => decodeStakePool(LIST), /not a stake pool/);
  assert.throws(() => decodeValidatorList(POOL), /not a validator list/);
  const pool = decodeStakePool(POOL);
  assert.equal(summarizeStakePool({ address: 'pool', program: 'program', pool, list: decodeValidatorList(LIST), mint: 'someOtherMint' }), null);
});
