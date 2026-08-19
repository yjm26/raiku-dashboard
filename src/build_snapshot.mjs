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
  'XP1BRLn8eCYSygrd8er5P4GKdzqKbC3DLoSsS5UYVZy': 'Sanctum Pool',
  '5ocnV1qiCgaQR8Jb8xWnVbApfaygJ8tNoZfgPwsgx9kx': 'Sanctum',
  '1oopBoJG58DgkUVKkEzKgyG9dvRmpgeEm1AVjoHkF78': 'Pool (1oopBoJ)',
  'XPC1MM4dYACDfykNuXYZ5una2DsMDWL24CrYubCvarC': 'Jupiter',
  'sVau1tXvayVWfotzm9AhK5rKTLwK6gKsW4QVQHdG2kv': 'Solv/other pool',
  'T1TANpTeScyeqVzzgNVi5cB4Q7C7h8zFJqJtB9kQZmn': 'Titan',
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4': 'Jupiter',
  'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK': 'Raydium CLMM',
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': 'Whirlpool (DEX)',
  TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA: 'Token Program',
  '11111111111111111111111111111111': 'System Program',
};

function labelPda(holder, pdaLabels) {
  // 1. Known from pda_labels.json
  const known = pdaLabels?.[holder.owner]?.known;
  if (known && known !== 'Unknown program' && known !== 'no-account (uninitialized/PDA)') return known;
  // 2. Program address we captured during classification
  if (holder.pdaProgram && PROGRAM_LABELS[holder.pdaProgram]) return PROGRAM_LABELS[holder.pdaProgram];
  // 3. Unknown program → generic
  if (holder.pdaProgram) return 'Pool / Program';
  // 4. No account on chain → closed/uninitialized
  return 'Closed account';
}

export function buildSnapshot({ holdersData, firstSeenData = {}, pdaLabels = {}, now = Date.now(), history = [] }) {
  if (!holdersData || !Array.isArray(holdersData.holders)) {
    throw new TypeError('holdersData.holders must be an array');
  }

  const nowMs = toMilliseconds(now, Date.now());
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
    const firstMs = firstMsOf(holder.owner);
    const daysHeld = Math.max(0, (nowMs - firstMs) / DAY_MS);
    const sharePct = Number.isFinite(Number(holder.share))
      ? Number(holder.share) * 100
      : (supply ? amount / supply * 100 : 0);

    return {
      owner: holder.owner,
      amount,
      sharePct,
      isPda: Boolean(holder.isPda),
      firstMs,
      daysHeld,
      score: amount * daysHeld,
      pdaLabel: holder.isPda ? labelPda(holder, pdaLabels) : null,
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

  const dayCount = Math.max(0, Math.floor((nowMs - launchMs) / DAY_MS));
  const dailyTimeline = [];
  const holderTimeline = [];
  for (let day = 0; day <= dayCount; day += 3) {
    const cutoff = launchMs + day * DAY_MS;
    dailyTimeline.push({
      label: new Date(cutoff).toISOString().slice(0, 10),
      points: dailyPoints * day,
    });
    holderTimeline.push({
      label: new Date(cutoff).toISOString().slice(0, 10),
      holders: realRows.filter((row) => row.firstMs <= cutoff).length,
    });
  }

  const weekAgo = nowMs - 7 * DAY_MS;
  const newHolders = realRows
    .filter((row) => row.firstMs >= weekAgo)
    .sort(compareByFirstSeenDesc);
  const coverage = {
    found: realRows.filter((row) => hasUnixTimestamp(firstSeenData?.[row.owner])).length,
    total: realWallets,
  };
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
    totalPoints,
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
  };
}
