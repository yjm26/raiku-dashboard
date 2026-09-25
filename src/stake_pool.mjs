// rkuSOL stake pool, read on-chain: fees, exchange rate and validators.
// Layout: SPL stake pool program (Sanctum's SPL fork uses the same accounts), Borsh-encoded.
import { rpc } from './rpc.mjs';
import { encodeBase58 } from './solana_address.mjs';

const STAKE_POOL = 1;
const VALIDATOR_LIST = 2;
const VALIDATOR_INFO_SIZE = 73;

class Reader {
  constructor(buffer) { this.buffer = buffer; this.offset = 0; }
  u8() { return this.buffer.readUInt8(this.offset++); }
  u32() { const v = this.buffer.readUInt32LE(this.offset); this.offset += 4; return v; }
  u64() { const v = this.buffer.readBigUInt64LE(this.offset); this.offset += 8; return v; }
  key() { const v = encodeBase58(this.buffer.subarray(this.offset, this.offset + 32)); this.offset += 32; return v; }
  skip(bytes) { this.offset += bytes; }
  // Fee { denominator, numerator }; a zero denominator means no fee.
  fee() { const denominator = this.u64(); const numerator = this.u64(); return denominator ? Number(numerator) / Number(denominator) * 100 : 0; }
  option(read) {
    const tag = this.u8();
    if (tag > 1) throw new Error(`invalid Option tag ${tag}`);
    return tag ? read() : null;
  }
  // FutureEpoch: None, One (applies after the next epoch boundary), Two (after two).
  future(read) {
    const tag = this.u8();
    if (tag > 2) throw new Error(`invalid FutureEpoch tag ${tag}`);
    return tag ? { pct: read(), epochs: tag } : null;
  }
}

export function decodeStakePool(buffer) {
  const r = new Reader(buffer);
  if (r.u8() !== STAKE_POOL) throw new Error('not a stake pool account');
  const pool = { manager: r.key() };
  r.skip(32 + 32 + 1); // staker, stake deposit authority, withdraw bump
  pool.validatorList = r.key();
  pool.reserveStake = r.key();
  pool.poolMint = r.key();
  r.skip(32 + 32); // manager fee account, token program
  pool.totalLamports = r.u64();
  pool.poolTokenSupply = r.u64();
  pool.lastUpdateEpoch = Number(r.u64());
  r.skip(8 + 8 + 32); // lockup
  pool.epochFee = r.fee();
  pool.nextEpochFee = r.future(() => r.fee());
  r.option(() => r.key()); // preferred deposit validator
  r.option(() => r.key()); // preferred withdraw validator
  pool.stakeDepositFee = r.fee();
  pool.stakeWithdrawalFee = r.fee();
  pool.nextStakeWithdrawalFee = r.future(() => r.fee());
  r.u8(); // stake referral fee
  r.option(() => r.key()); // sol deposit authority
  pool.solDepositFee = r.fee();
  r.u8(); // sol referral fee
  r.option(() => r.key()); // sol withdraw authority
  pool.solWithdrawalFee = r.fee();
  pool.nextSolWithdrawalFee = r.future(() => r.fee());
  pool.lastEpochPoolTokenSupply = r.u64();
  pool.lastEpochTotalLamports = r.u64();
  return pool;
}

export function decodeValidatorList(buffer) {
  const r = new Reader(buffer);
  if (r.u8() !== VALIDATOR_LIST) throw new Error('not a validator list account');
  const maxValidators = r.u32();
  const count = r.u32();
  if (buffer.length < r.offset + count * VALIDATOR_INFO_SIZE) throw new Error('validator list truncated');
  const validators = [];
  for (let i = 0; i < count; i++) {
    const activeStakeLamports = r.u64();
    const transientStakeLamports = r.u64();
    r.skip(8 + 8 + 4 + 4); // last update epoch, seed suffixes, unused
    const status = r.u8();
    validators.push({ voteAccount: r.key(), activeStakeLamports, transientStakeLamports, status });
  }
  return { maxValidators, validators };
}

const rate = (lamports, supply) => (supply > 0n ? Number(lamports) / Number(supply) : null);

// Summary for the dashboard. Null when the account doesn't check out, so the page shows nothing rather than guesses.
export function summarizeStakePool({ address, program, pool, list, votes = {}, raikuValidator = null, mint }) {
  if (pool.poolMint !== mint) return null;
  const totalActive = list.validators.reduce((sum, v) => sum + v.activeStakeLamports, 0n);
  const pending = [
    ['Fee on rewards', pool.nextEpochFee],
    ['SOL withdrawal fee', pool.nextSolWithdrawalFee],
    ['Stake withdrawal fee', pool.nextStakeWithdrawalFee],
  ].filter(([, next]) => next).map(([fee, next]) => ({ fee, pct: next.pct, epochs: next.epochs }));
  return {
    address,
    program,
    fees: {
      rewardsPct: pool.epochFee,
      solDepositPct: pool.solDepositFee,
      stakeDepositPct: pool.stakeDepositFee,
      solWithdrawalPct: pool.solWithdrawalFee,
      stakeWithdrawalPct: pool.stakeWithdrawalFee,
    },
    pendingFees: pending,
    rate: rate(pool.totalLamports, pool.poolTokenSupply),
    previousRate: rate(pool.lastEpochTotalLamports, pool.lastEpochPoolTokenSupply),
    lastUpdateEpoch: pool.lastUpdateEpoch,
    maxValidators: list.maxValidators,
    validators: list.validators.map((v) => ({
      voteAccount: v.voteAccount,
      activeStakeSol: Number(v.activeStakeLamports) / 1e9,
      sharePct: totalActive > 0n ? Number(v.activeStakeLamports * 10000n / totalActive) / 100 : null,
      name: raikuValidator && raikuValidator.votePubkey === v.voteAccount ? raikuValidator.name : null,
      commissionPct: votes[v.voteAccount]?.commission ?? null,
      delinquent: votes[v.voteAccount]?.delinquent ?? null,
    })),
  };
}

async function readAccount(address) {
  const value = (await rpc('getAccountInfo', [address, { encoding: 'base64' }]))?.value;
  if (!value) throw new Error(`account ${address} not found`);
  return { owner: value.owner, data: Buffer.from(value.data[0], 'base64') };
}

export async function fetchStakePool({ poolAddress, mint, raikuValidator = null }) {
  const poolAccount = await readAccount(poolAddress);
  const pool = decodeStakePool(poolAccount.data);
  const listAccount = await readAccount(pool.validatorList);
  const list = decodeValidatorList(listAccount.data);
  const votes = {};
  for (const { voteAccount } of list.validators) {
    const res = await rpc('getVoteAccounts', [{ votePubkey: voteAccount }]);
    const current = res?.current?.find((v) => v.votePubkey === voteAccount);
    const delinquent = res?.delinquent?.find((v) => v.votePubkey === voteAccount);
    if (current || delinquent) votes[voteAccount] = { commission: (current || delinquent).commission, delinquent: Boolean(delinquent) };
  }
  return summarizeStakePool({ address: poolAddress, program: poolAccount.owner, pool, list, votes, raikuValidator, mint });
}
