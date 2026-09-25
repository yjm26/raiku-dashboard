import assert from 'node:assert/strict';
import test from 'node:test';
import { exchangeRate } from './raiku_api.mjs';

test('exchangeRate prefers the pool rate over TVL ÷ supply', () => {
  assert.equal(exchangeRate({ solValueLamports: 1018183030, tvlLamports: 200e9 }, 100), 1.01818303);
});

test('exchangeRate falls back to TVL ÷ supply, then null', () => {
  assert.equal(exchangeRate({ tvlLamports: 202e9 }, 200), 1.01);
  assert.equal(exchangeRate({}, 200), null);
  assert.equal(exchangeRate({ tvlLamports: 202e9 }, 0), null);
});
