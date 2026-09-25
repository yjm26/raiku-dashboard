import { describe, expect, it } from 'vitest';
import { epochCountdown, formatDuration } from './epoch.js';

const status = { epoch: 10, slotIndex: 100, slotsInEpoch: 1000, slotSeconds: 0.5, fetchedAt: 0 };

describe('epoch countdown', () => {
  it('starts from the fetched position', () => {
    expect(epochCountdown(status, 0)).toEqual({ epoch: 10, progress: 0.1, secondsLeft: 450, epochHours: 500 / 3600 });
  });
  it('moves forward with time at the measured slot speed', () => {
    const later = epochCountdown(status, 100_000); // 100 s = 200 slots
    expect(later.progress).toBeCloseTo(0.3);
    expect(later.secondsLeft).toBeCloseTo(350);
  });
  it('stops at the epoch end instead of guessing the next epoch', () => {
    expect(epochCountdown(status, 10_000_000)).toMatchObject({ epoch: 10, progress: 1, secondsLeft: 0 });
  });
});

describe('formatDuration', () => {
  it('formats minutes, hours and days', () => {
    expect(formatDuration(59)).toBe('under a minute');
    expect(formatDuration(60)).toBe('1m');
    expect(formatDuration(3660)).toBe('1h 1m');
    expect(formatDuration(18 * 3600 + 20 * 60 + 30)).toBe('18h 20m');
    expect(formatDuration(25 * 3600)).toBe('1d 1h');
  });
});
