const isRecord = (value) => (
  value !== null
  && typeof value === 'object'
  && !Array.isArray(value)
);

const cloneArray = (value) => (Array.isArray(value) ? [...value] : []);

/**
 * Format a dashboard number using the US locale and two decimal places by default.
 * Pass Intl.NumberFormat options to override the defaults.
 */
export function formatNumber(value, options = {}) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return '—';
  }

  const suppliedOptions = options ?? {};
  const formatOptions = {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...suppliedOptions,
  };

  if (
    suppliedOptions.maximumFractionDigits !== undefined
    && suppliedOptions.minimumFractionDigits === undefined
  ) {
    formatOptions.minimumFractionDigits = Math.min(
      2,
      suppliedOptions.maximumFractionDigits,
    );
  }

  if (
    suppliedOptions.minimumFractionDigits !== undefined
    && suppliedOptions.maximumFractionDigits === undefined
  ) {
    formatOptions.maximumFractionDigits = Math.max(
      2,
      suppliedOptions.minimumFractionDigits,
    );
  }

  return new Intl.NumberFormat('en-US', formatOptions).format(number);
}

/**
 * Shorten a wallet address while retaining its beginning and end for recognition.
 */
export function formatAddress(address, head = 5, tail = 5) {
  if (address === null || address === undefined) {
    return '';
  }

  const value = String(address);
  const prefixLength = Math.max(0, head);
  const suffixLength = Math.max(0, tail);

  if (value.length <= prefixLength + suffixLength) {
    return value;
  }

  const suffix = suffixLength === 0 ? '' : value.slice(-suffixLength);
  return `${value.slice(0, prefixLength)}…${suffix}`;
}

/**
 * Normalize data at the application boundary so rendering code can rely on a
 * stable snapshot shape without changing meaningful values such as zero.
 */
export function normalizeSnapshot(raw) {
  if (!isRecord(raw)) {
    throw new TypeError('Dashboard snapshot must be an object.');
  }

  const stats = isRecord(raw.stats) ? { ...raw.stats } : {};
  const pie = isRecord(raw.pie) ? { ...raw.pie } : {};
  const coverage = isRecord(raw.coverage) ? { ...raw.coverage } : {};

  return {
    ...raw,
    stats,
    pie: {
      ...pie,
      labels: cloneArray(pie.labels),
      amounts: cloneArray(pie.amounts),
    },
    topHolders: cloneArray(raw.topHolders),
    holderTimeline: cloneArray(raw.holderTimeline),
    dailyTimeline: cloneArray(raw.dailyTimeline),
    newHolders: cloneArray(raw.newHolders),
    realRows: cloneArray(raw.realRows),
    coverage: {
      ...coverage,
      found: coverage.found ?? 0,
      total: coverage.total ?? 0,
    },
  };
}

/**
 * Fetch and normalize the current dashboard snapshot.
 * On Vercel, `/api/dashboard` serves live on-chain data with CDN caching
 * (24h + stale-while-revalidate). Falls back to the static snapshot so the
 * page still renders on any host without the serverless function.
 */
export async function loadDashboardSnapshot() {
  const urls = ['/api/dashboard', '/data/dashboard.json'];
  let lastError;
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${response.status}`);
      return normalizeSnapshot(await response.json());
    } catch (e) {
      lastError = e;
    }
  }
  throw new Error(`Failed to load dashboard snapshot: ${lastError?.message || 'unknown'}`);
}
