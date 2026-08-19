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
      pdaLabel: holder.isPda ? (pdaLabels?.[holder.owner]?.known || 'Pool/Program') : null,
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
    history: Array.isArray(history) ? history : [],
    coverage,
  };
}
