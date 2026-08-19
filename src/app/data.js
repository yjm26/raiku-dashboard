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
    history: cloneArray(raw.history),
    realRows: cloneArray(raw.realRows),
    allRows: cloneArray(raw.allRows && raw.allRows.length ? raw.allRows : raw.realRows),
    coverage: {
      ...coverage,
      found: coverage.found ?? 0,
      total: coverage.total ?? 0,
    },
  };
}

/**
 * Load the dashboard snapshot from the static file shipped with the build.
 * Data is refreshed daily by GitHub Actions (07:15 WIB) which commits new
 * data + triggers Vercel redeploy — no client-side network dependency.
 */
export async function loadDashboardSnapshot() {
  const response = await fetch('/data/dashboard.json');
  if (!response.ok) {
    const status = response.status ? ` ${response.status}` : '';
    const statusText = response.statusText ? ` ${response.statusText}` : '';
    throw new Error(`Failed to load dashboard snapshot:${status}${statusText}`);
  }
  return normalizeSnapshot(await response.json());
}
