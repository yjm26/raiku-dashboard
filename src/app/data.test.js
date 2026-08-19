import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  formatAddress,
  formatNumber,
  loadDashboardSnapshot,
  normalizeSnapshot,
} from './data.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('dashboard data utilities', () => {
  it('shortens a wallet without changing the full value', () => {
    expect(formatAddress('Ar1HrwURVUrDRdGPpLDf22iG89XuehvMS8G34LRgkUmi'))
      .toBe('Ar1Hr…gkUmi');
  });

  it('supports a zero-length address suffix', () => {
    expect(formatAddress('abcdefghij', 3, 0)).toBe('abc…');
  });

  it('formats numeric dashboard values with tabular-friendly decimals', () => {
    expect(formatNumber(54329.215370439)).toBe('54,329.22');
  });

  it('allows a zero maximum fraction digit override', () => {
    expect(formatNumber(1234.5, { maximumFractionDigits: 0 })).toBe('1,235');
  });

  it('supports an explicit minimum and maximum fraction digit combination', () => {
    expect(formatNumber(1234.567, {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })).toBe('1,234.6');
  });

  it('normalizes a snapshot and supplies empty arrays for optional collections', () => {
    const result = normalizeSnapshot({ stats: { supply: 10 } });
    expect(result.stats.supply).toBe(10);
    expect(result.topHolders).toEqual([]);
    expect(result.coverage).toEqual({ found: 0, total: 0 });
  });

  it('preserves meaningful zero values during normalization', () => {
    const result = normalizeSnapshot({
      stats: { supply: 0 },
      coverage: { found: 0, total: 0 },
    });

    expect(result.stats.supply).toBe(0);
    expect(result.coverage).toEqual({ found: 0, total: 0 });
  });

  it('rejects a snapshot that is not an object', () => {
    expect(() => normalizeSnapshot(null)).toThrow(/dashboard snapshot must be an object/i);
    expect(() => normalizeSnapshot([])).toThrow(/dashboard snapshot must be an object/i);
  });

  it('loads, parses, and normalizes a successful snapshot response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ stats: { supply: 0 } }),
    }));

    await expect(loadDashboardSnapshot()).resolves.toMatchObject({
      stats: { supply: 0 },
      topHolders: [],
    });
    expect(fetch).toHaveBeenCalledWith('/data/dashboard.json');
  });

  it('rejects a non-successful snapshot response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      statusText: 'Service Unavailable',
    }));

    await expect(loadDashboardSnapshot()).rejects.toThrow(/503.*service unavailable/i);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
