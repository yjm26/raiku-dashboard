// RPC helper: multi-endpoint, retry with backoff, pacing.
// Public endpoints only — no API keys.
const MINT = 'rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';

const ENDPOINTS = [
  'https://gabriela-n6xhfi-fast-mainnet.helius-rpc.com',
  'https://api.mainnet-beta.solana.com',
  'https://solana-rpc.publicnode.com',
  'https://rpc.mainnet.solana.blaze.com',
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const jitter = (ms) => ms + Math.random() * 400;

export async function rpc(method, params, { attempts = 4, baseDelayMs = 1200 } = {}) {
  let lastErr;
  // cycle endpoints; on any failure (rate-limit or unsupported) move to the next
  for (let round = 0; round < attempts; round++) {
    const url = ENDPOINTS[round % ENDPOINTS.length];
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 120_000);
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: Date.now() % 100000, method, params }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      const j = await r.json();
      if (j.error) {
        lastErr = new Error(`${url} ${method}: ${JSON.stringify(j.error).slice(0, 200)}`);
        await sleep(jitter(baseDelayMs * (round + 1)));
        continue;
      }
      return j.result;
    } catch (e) {
      lastErr = e;
      await sleep(jitter(baseDelayMs));
    }
  }
  throw lastErr || new Error(`${method} failed after retries`);
}

export { MINT, TOKEN_PROGRAM, sleep };
