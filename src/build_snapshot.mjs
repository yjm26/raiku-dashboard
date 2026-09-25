import { flows, ownerSummary } from './ledger.mjs';
import { isProgramDerived } from './solana_address.mjs';

const DAY_MS = 86_400_000;
const DEFAULT_LAUNCH_DATE = '2026-05-11T21:00:00Z';

const asFiniteNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const toMilliseconds = (value, fallback) => {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.getTime() : fallback;
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : fallback;
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const hasUnixTimestamp = (value) => (
  value !== null
  && value !== undefined
  && Number.isFinite(Number(value))
);

const compareByOwner = (left, right) => left.owner.localeCompare(right.owner);

const compareByScore = (left, right) => (
  right.score - left.score || compareByOwner(left, right)
);

const compareByAmount = (left, right) => (
  right.amount - left.amount || compareByOwner(left, right)
);

const compareByFirstSeenDesc = (left, right) => (
  right.firstMs - left.firstMs || compareByOwner(left, right)
);

/**
 * Build the JSON view model consumed by the React dashboard.
 *
 * All inputs are already loaded source data. Keeping file I/O in the generator
 * makes this function portable and deterministic for fixture-based tests.
 */
// Known program addresses (mainnet) → human label
const PROGRAM_LABELS = {
  'SP12tWFxD9oJsVWNavTTBZvMbA6gkAmxtVgxdqvyvhY': 'Sanctum Pool',
  'SPMBzsVUuoHB4Nb2nTvM5RDNpLwG4P7f3fFfLqVjQqo': 'Sanctum Validator',
  // Exponent Finance: SY wrapper, PT/YT market, vaults (security.txt / shared upgrade authority)
  'XP1BRLn8eCYSygrd8er5P4GKdzqKbC3DLoSsS5UYVZy': 'Exponent',
  'XPC1MM4dYACDfykNuXYZ5una2DsMDWL24CrYubCvarC': 'Exponent',
  'sVau1tXvayVWfotzm9Ahcv2qfnnfRWttt78BCnNC6dD': 'Exponent vault',
  '5ocnV1qiCgaQR8Jb8xWnVbApfaygJ8tNoZfgPwsgx9kx': 'Sanctum',
  '1oopBoJG58DgkUVKkEzKgyG9dvRmpgeEm1AVjoHkF78': 'Pool (1oopBoJ)',
  'T1TANpTeScyeqVzzgNViGDNrkQ6qHz9KrSBS4aNXvGT': 'Titan',
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter',
  'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK': 'Raydium CLMM',
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': 'Whirlpool (DEX)',
  TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: 'Token Program',
  '11111111111111111111111111111111': 'System Program',
};

// Individual accounts identified on-chain (PDA re-derived from its seeds) → human label
const ACCOUNT_LABELS = {
  '2NhLJRL9AeooN1DYv5b2LrcyCqZZbvrPp16N4gAjQEWk': 'Kamino (Raiku Market)',
  'BFvJqKjuWT6CcvRKE4A4ZvbqZFmu1uxYJpcZ5ko8nkgR': 'Exponent vault',
  'H3T2vjWyDKG25JfgpggQrrkCivDa3iFQ7ueS5ifqaT8s': 'Kamino Farms',
  '8JS6XsMPo2u3EyeeY3p2jvzHEhdUtCKgarHpJ3PAonyv': 'Stake pool manager',
  'EngNMbabvVgioqmxtU2VdSZhTEBX431Lf7UC4Q32SYJj': 'Squads multisig',
  '9nBb3ovsUsDcNxdJ3sSFCEAgwTTbuwTiqYe5JUEu3uuN': 'Squads multisig',
  'DheMp3RPekY4sfym67RrvHoCnyS1sMv8D23AR8tqweW7': 'Squads multisig',
  '7fXDVWu2VaD51ipnm1N7C2U19bzWzuxb3Mz9fYEdQnmn': 'Squads multisig',
};

function labelPda(holder, pdaLabels, programDerived) {
  // 1. Identified account
  if (ACCOUNT_LABELS[holder.owner]) return ACCOUNT_LABELS[holder.owner];
  // 2. Known from pda_labels.json
  const known = pdaLabels?.[holder.owner]?.known;
  if (known && known !== 'Unknown program' && known !== 'no-account (uninitialized/PDA)') return known;
  // 3. Program address we captured during classification
  if (holder.pdaProgram && PROGRAM_LABELS[holder.pdaProgram]) return PROGRAM_LABELS[holder.pdaProgram];
  // 4. Unknown program → generic
  if (holder.pdaProgram || programDerived) return 'Program account';
  // 5. No account on chain → closed/uninitialized
  return 'Closed account';
}

export function buildSnapshot({ holdersData, firstSeenData = {}, pdaLabels = {}, now = Date.now(), history = [], ledger = null }) {
  if (!holdersData || !Array.isArray(holdersData.holders)) {
    throw new TypeError('holdersData.holders must be an array');
  }

  const nowMs = toMilliseconds(now, Date.now());
  const nowSec = nowMs / 1000;
  const programs = new Set(ledger?.programs || []);
  const isLedgerWallet = (owner) => !programs.has(owner) && !isProgramDerived(owner);
  // Exact figures from the ledger, only when its balance agrees with today's on-chain balance.
  const fromLedger = (owner, amount) => {
    const summary = ledger ? ownerSummary(ledger, owner, nowSec) : null;
    return summary && Math.abs(summary.balance - amount) < 1e-9 ? summary : null;
  };
  const statsSource = holdersData.stats && typeof holdersData.stats === 'object'
    ? holdersData.stats
    : {};
  const launchDate = statsSource.launchDate || DEFAULT_LAUNCH_DATE;
  const launchMs = toMilliseconds(launchDate, Date.parse(DEFAULT_LAUNCH_DATE));
  const supply = asFiniteNumber(holdersData.supplyUi);

  const firstMsOf = (owner) => {
    const firstSeen = firstSeenData?.[owner];
    return hasUnixTimestamp(firstSeen) ? Number(firstSeen) * 1000 : launchMs;
  };

  const rows = holdersData.holders.map((holder) => {
    const amount = asFiniteNumber(holder.amountUi);
    const sharePct = Number.isFinite(Number(holder.share))
      ? Number(holder.share) * 100
      : (supply ? amount / supply * 100 : 0);
    // Off-curve owners are program-controlled, whatever the input data says.
    const programDerived = isProgramDerived(holder.owner);
    const isPda = Boolean(holder.isPda) || programDerived;
    // Ledger (personal wallets only, whose histories are complete): points for the balance actually
    // held each day. Otherwise an estimate from today's balance.
    const exact = !isPda && isLedgerWallet(holder.owner) ? fromLedger(holder.owner, amount) : null;
    const firstMs = exact?.firstTime != null ? exact.firstTime * 1000 : firstMsOf(holder.owner);
    const daysHeld = exact ? exact.daysHeld : Math.max(0, (nowMs - firstMs) / DAY_MS);

    return {
      owner: holder.owner,
      amount,
      sharePct,
      isPda,
      firstMs,
      daysHeld,
      score: exact ? exact.points : amount * daysHeld,
      pdaLabel: isPda ? labelPda(holder, pdaLabels, programDerived) : null,
      ...(ledger ? { exact: Boolean(exact) } : {}),
    };
  });

  const realRows = rows.filter((row) => !row.isPda).sort(compareByScore);
  const pdaRows = rows.filter((row) => row.isPda);
  const realWallets = realRows.length;
  const pdaSupply = pdaRows.reduce((total, row) => total + row.amount, 0);
  const pdaShare = supply ? pdaSupply / supply * 100 : 0;
  const top10ByAmount = [...rows].sort(compareByAmount).slice(0, 10);
  const top10Share = supply
    ? top10ByAmount.reduce((total, row) => total + row.amount, 0) / supply * 100
    : 0;
  const totalPoints = realRows.reduce((total, row) => total + row.score, 0);
  const dailyPoints = realRows.reduce((total, row) => total + row.amount, 0);

  const pieReal = [...realRows].sort(compareByAmount).slice(0, 10);
  const pieRealOwners = new Set(pieReal.map((row) => row.owner));
  const pieOthers = realRows
    .filter((row) => !pieRealOwners.has(row.owner))
    .reduce((total, row) => total + row.amount, 0);
  const pie = {
    labels: [
      ...pieReal.map((row, index) => `${index + 1}. ${row.owner.slice(0, 5)}…${row.owner.slice(-4)}`),
      'Others',
    ],
    amounts: [...pieReal.map((row) => row.amount), pieOthers],
  };

  const today = new Date(nowMs).toISOString().slice(0, 10);
  const dailyTimeline = [];
  const holderTimeline = [];
  let formerHolders = [];
  if (ledger?.daily?.length) {
    // True history: wallets holding and points earned by all wallets (including those who left), per day.
    formerHolders = Object.keys(ledger.owners)
      .filter((owner) => isLedgerWallet(owner) && ledger.owners[owner].balance === '0')
      .map((owner) => ownerSummary(ledger, owner, nowSec))
      .filter((s) => s.points > 0)
      .sort((a, b) => b.points - a.points || a.owner.localeCompare(b.owner))
      .map((s, index) => ({ owner: s.owner, rank: index + 1, points: s.points, daysHeld: s.daysHeld, peak: s.peak, firstMs: s.firstTime * 1000, exitMs: s.lastExit * 1000 }));
    for (const day of ledger.daily) {
      holderTimeline.push({ label: day.date, holders: day.wallets });
      dailyTimeline.push({ label: day.date, points: day.points });
    }
    holderTimeline.push({ label: today, holders: realWallets });
    // Today's point uses the same figures as the headline total.
    dailyTimeline.push({ label: today, points: totalPoints + formerHolders.reduce((total, row) => total + row.points, 0) });
  } else {
    // No ledger: estimate from today's holders only (balances assumed constant since first buy).
    const dayCount = Math.max(0, Math.floor((nowMs - launchMs) / DAY_MS));
    for (let day = 0; day <= dayCount; day += 3) {
      const cutoff = launchMs + day * DAY_MS;
      const label = new Date(cutoff).toISOString().slice(0, 10);
      dailyTimeline.push({ label, points: realRows.reduce((total, row) => total + row.amount * Math.max(0, (cutoff - row.firstMs) / DAY_MS), 0) });
      holderTimeline.push({ label, holders: realRows.filter((row) => row.firstMs <= cutoff).length });
    }
  }

  const weekAgo = nowMs - 7 * DAY_MS;
  const newHolders = realRows
    .filter((row) => row.firstMs >= weekAgo)
    .sort(compareByFirstSeenDesc);
  const coverage = {
    found: realRows.filter((row) => row.exact || hasUnixTimestamp(firstSeenData?.[row.owner])).length,
    total: realWallets,
  };
  const formerPoints = formerHolders.reduce((total, row) => total + row.points, 0);
  const ledgerInfo = ledger ? {
    since: ledger.daily?.[0]?.date ?? null,
    transactions: ledger.lastSeq + 1,
    walletsEver: Object.keys(ledger.owners).filter(isLedgerWallet).length,
    formerHolders: formerHolders.length,
    formerPoints,
    currentPoints: totalPoints,
    exactRows: realRows.filter((row) => row.exact).length,
    check: ledger.lastCheck ?? null,
    chainBreaks: ledger.chainBreaks?.length ?? 0,
  } : null;
  const walletFlows = ledger ? { d1: flows(ledger, nowSec, 1, isLedgerWallet), d7: flows(ledger, nowSec, 7, isLedgerWallet) } : null;
  const apyPct = statsSource.latestApy
    ? (Number(statsSource.latestApy) * 100).toFixed(2)
    : null;

  const calculatedStats = {
    supply,
    totalOwners: rows.length,
    realWallets,
    pdaWallets: pdaRows.length,
    pdaShare,
    top10Share,
    officialHolders: statsSource.officialHolders,
    launchDate,
    apyPct,
    // With the ledger, points earned since launch by every wallet: sellers keep what they earned.
    totalPoints: ledger ? totalPoints + formerPoints : totalPoints,
    dailyPoints,
    // LST economics (from Raiku API + CoinGecko)
    tvlLamports: statsSource.tvlLamports,
    tvlSol: statsSource.tvlSol,
    tvlUsd: statsSource.tvlUsd,
    rateSolPerRkuSol: statsSource.rateSolPerRkuSol,
    solPriceUsd: statsSource.solPriceUsd ?? holdersData.solPriceUsd,
    avgApy: statsSource.avgApy,
  };

  return {
    ts: holdersData.fetchedAt,
    mint: holdersData.mint,
    ...calculatedStats,
    stats: { ...statsSource, ...calculatedStats },
    pie,
    topHolders: top10ByAmount.map((row, index) => ({ ...row, rank: index + 1 })),
    holderTimeline,
    dailyTimeline,
    newHolders: newHolders.slice(0, 20),
    realRows: realRows.map((row, index) => ({ ...row, rank: index + 1 })),
    allRows: [...realRows.map((row, index) => ({ ...row, rank: index + 1 })), ...pdaRows.map((row, index) => ({ ...row, rank: realRows.length + index + 1, isPda: true }))],
    history: Array.isArray(history) ? history : [],
    coverage,
    stakePool: holdersData.stakePool ?? null,
    formerHolders,
    flows: walletFlows,
    ledger: ledgerInfo,
  };
}
