// rkuSOL next to the largest SOL liquid-staking tokens, all read the same way: from each stake pool account.
import fs from 'node:fs';
import { p } from './paths.mjs';
import { rpc } from './rpc.mjs';
import { encodeBase58 } from './solana_address.mjs';
import { decodeStakePool } from './stake_pool.mjs';

// Programs that share the SPL stake pool account layout.
export const POOL_PROGRAMS = new Set([
  'SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy', // SPL
  'SP12tWFxD9oJsVWNavTTBZvMbA6gkAmxtVgxdqvyvhY', // Sanctum SPL
  'SPMBzsVUuoHA4Jm6KunbsotaahvVikZs1JyTW6iJvbn', // Sanctum SPL Multi
]);
const YEAR_SECONDS = 365 * 86_400;

const ratio = (lamports, supply) => (supply > 0n ? Number(lamports) / Number(supply) : null);
const round = (value, digits) => Math.round(value * 10 ** digits) / 10 ** digits;

// The largest pools by SOL staked, plus the highlighted one, each with its rank among all pools.
export function pickPools(pools, { highlightMint, top = 5 }) {
  return [...pools]
    .sort((a, b) => (b.totalLamports > a.totalLamports ? 1 : b.totalLamports < a.totalLamports ? -1 : a.mint.localeCompare(b.mint)))
    .map((pool, index) => ({ ...pool, rank: index + 1 }))
    .filter((pool) => pool.rank <= top || pool.mint === highlightMint);
}

// APY: the rate change a pool recorded at its last update (the rewards of the epoch before),
// annualized over that epoch's measured length.
export function lstRows(pools, { currentEpoch, epochSeconds }) {
  return pools.map((pool) => {
    const rate = ratio(pool.totalLamports, pool.poolTokenSupply);
    const previousRate = ratio(pool.lastEpochTotalLamports, pool.lastEpochPoolTokenSupply);
    const epoch = pool.lastUpdateEpoch - 1;
    const seconds = epochSeconds[epoch];
    // Pools not updated this epoch or last have no recent rate change to measure.
    const recent = pool.lastUpdateEpoch >= currentEpoch - 1;
    const apy = recent && rate && previousRate && seconds ? (rate / previousRate) ** (YEAR_SECONDS / seconds) - 1 : null;
    return {
      rank: pool.rank,
      symbol: pool.symbol ?? null,
      name: pool.name ?? null,
      mint: pool.mint,
      pool: pool.address,
      tvlSol: round(Number(pool.totalLamports) / 1e9, 2),
      feePct: round(pool.epochFee, 4),
      rate,
      updatedEpoch: pool.lastUpdateEpoch,
      apyPct: apy == null ? null : round(apy * 100, 4),
      epoch: apy == null ? null : epoch,
    };
  });
}

// Every stake pool on those programs, from a slice of each account: mint and SOL staked.
async function scanPools() {
  const pools = [];
  for (const program of POOL_PROGRAMS) {
    // Account type 1 (stake pool) is '2' in base58.
    const accounts = await rpc('getProgramAccounts', [program, { encoding: 'base64', dataSlice: { offset: 162, length: 112 }, filters: [{ memcmp: { offset: 0, bytes: '2' } }] }]);
    for (const { pubkey, account } of accounts) {
      const data = Buffer.from(account.data[0], 'base64');
      pools.push({ address: pubkey, mint: encodeBase58(data.subarray(0, 32)), totalLamports: data.readBigUInt64LE(96) });
    }
  }
  return pools;
}

// Full accounts for the chosen pools, decoded, with names from the registry.
async function readPools(chosen, names) {
  const res = await rpc('getMultipleAccounts', [chosen.map((pool) => pool.address), { encoding: 'base64' }]);
  return chosen.map((pool, i) => {
    const account = res?.value?.[i];
    if (!account || !POOL_PROGRAMS.has(account.owner)) throw new Error(`pool ${pool.address} not readable`);
    const decoded = decodeStakePool(Buffer.from(account.data[0], 'base64'));
    if (decoded.poolMint !== pool.mint) throw new Error(`pool ${pool.address} mint changed`);
    const entry = names.get(pool.mint);
    return { ...decoded, address: pool.address, mint: pool.mint, rank: pool.rank, symbol: entry?.symbol, name: entry?.name };
  });
}

// Wall-clock length of each epoch, from block times at the epoch boundaries.
async function measureEpochs(epochs) {
  const schedule = await rpc('getEpochSchedule', []);
  const starts = {};
  for (const epoch of new Set(epochs.flatMap((e) => [e, e + 1]))) {
    const slot = schedule.firstNormalSlot + (epoch - schedule.firstNormalEpoch) * schedule.slotsPerEpoch;
    const [block] = await rpc('getBlocksWithLimit', [slot, 1]);
    starts[epoch] = { slot: block, time: await rpc('getBlockTime', [block]) };
  }
  return Object.fromEntries(epochs.map((epoch) => {
    const [a, b] = [starts[epoch], starts[epoch + 1]];
    return [epoch, Math.round((b.time - a.time) * schedule.slotsPerEpoch / (b.slot - a.slot))];
  }));
}

export async function fetchLstComparison({ highlightMint, top = 5 }) {
  const { lsts } = JSON.parse(fs.readFileSync(p('lst_registry.json'), 'utf8'));
  const names = new Map(lsts.map((entry) => [entry.mint, entry]));
  const { epoch: currentEpoch } = await rpc('getEpochInfo', []);
  const all = await scanPools();
  const chosen = pickPools(all, { highlightMint, top });
  if (!chosen.some((pool) => pool.mint === highlightMint)) throw new Error('highlighted pool not found');
  const pools = await readPools(chosen, names);
  const epochSeconds = await measureEpochs([currentEpoch - 2, currentEpoch - 1]);
  return { currentEpoch, poolsScanned: all.length, epochSeconds, rows: lstRows(pools, { currentEpoch, epochSeconds }) };
}
