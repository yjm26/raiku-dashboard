// Vercel serverless function — live rkuSOL dashboard data.
// Fetch holders + Raiku stats fresh from public RPC, normalize to the
// dashboard JSON view-model, and serve with CDN caching so the page stays
// fast while data refreshes at most once per day (lazy, via SWR).
import { buildSnapshot } from '../src/build_snapshot.mjs';

const MINT = 'rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const SYSTEM_PROGRAM = '11111111111111111111111111111111';
const DECIMALS = 9;

const RPC_URLS = [
  'https://gabriela-n6xhfi-fast-mainnet.helius-rpc.com',
  'https://api.mainnet-beta.solana.com',
  'https://solana-rpc.publicnode.com',
];

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const BASE = 58n;
function b58encode(raw) {
  let n = 0n;
  for (const b of raw) n = n * 256n + BigInt(b);
  let out = '';
  while (n > 0n) { out = ALPHABET[Number(n % BASE)] + out; n /= BASE; }
  let pad = 0;
  for (const b of raw) { if (b !== 0) break; pad++; }
  return '1'.repeat(pad) + out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function rpcCall(url, method, params) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 90_000);
  try {
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now() % 100000, method, params }),
      signal: ctrl.signal,
    });
    const j = await r.json();
    if (j.error) throw new Error(JSON.stringify(j.error).slice(0, 160));
    return j.result;
  } finally { clearTimeout(t); }
}
async function rpc(method, params) {
  let lastErr;
  for (let i = 0; i < 3; i++) {
    for (const url of RPC_URLS) {
      try { return await rpcCall(url, method, params); }
      catch (e) { lastErr = e; }
      await sleep(400);
    }
  }
  throw lastErr || new Error(`${method} failed`);
}

async function fetchHolderAccounts() {
  const res = await rpc('getProgramAccounts', [
    TOKEN_PROGRAM,
    {
      encoding: 'base64',
      dataSlice: { offset: 32, length: 40 },
      filters: [{ dataSize: 165 }, { memcmp: { offset: 0, bytes: MINT } }],
    },
  ]);
  const out = [];
  for (const item of res) {
    const dataB64 = Array.isArray(item.account.data) ? item.account.data[0] : item.account.data;
    const raw = Buffer.from(dataB64, 'base64');
    const owner = b58encode(raw.subarray(0, 32));
    const amount = Number(raw.readBigUInt64LE(32));
    if (amount > 0) out.push({ tokenAccount: item.pubkey, owner, amount });
  }
  return out;
}

async function fetchOwnerInfo(owners) {
  const info = {};
  let unknown = 0;
  for (let i = 0; i < owners.length; i += 50) {
    const batch = owners.slice(i, i + 50);
    let res;
    try { res = await rpc('getMultipleAccounts', [batch, { encoding: 'jsonParsed' }]); }
    catch { res = []; }
    const arr = Array.isArray(res) ? res : (res?.value || []);
    for (let j = 0; j < batch.length; j++) {
      const acc = arr[j];
      if (!acc || typeof acc === 'string') { unknown++; continue; }
      info[batch[j]] = { program: acc.owner || '', executable: !!acc.executable };
    }
    await sleep(300);
  }
  return { info, unknown };
}

async function fetchRaikuStats() {
  try {
    const r = await fetch('https://staking-api.mainnet.raiku.sh/v1/lsts', {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(30000),
    });
    const data = await r.json();
    for (const lst of data.lsts || []) {
      if (lst.mint === MINT) {
        const pd = lst.provider_data || {};
        return {
          officialHolders: pd.holders,
          tvlLamports: lst.tvl_lamports,
          latestApy: lst.latest_apy,
          avgApy: lst.avg_apy,
          launchDate: pd.launchDate,
        };
      }
    }
  } catch (e) { /* stats are best-effort */ }
  return {};
}

export default async function handler(req, res) {
  // Only GET
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('[api/dashboard] fetching token accounts...');
    const accounts = await fetchHolderAccounts();
    const perOwner = new Map();
    for (const { owner, amount } of accounts) perOwner.set(owner, (perOwner.get(owner) || 0) + amount);
    const supplyRaw = [...perOwner.values()].reduce((a, b) => a + b, 0);
    const supplyUi = supplyRaw / 10 ** DECIMALS;

    console.log(`[api/dashboard] ${perOwner.size} owners, supply ${supplyUi.toFixed(2)}`);

    const { info, unknown } = await fetchOwnerInfo([...perOwner.keys()]);
    if (unknown) console.log(`[api/dashboard] ${unknown} owners unknown → pool/PDA`);
    const holders = [...perOwner.entries()]
      .map(([owner, amt]) => ({
        owner,
        amountRaw: amt,
        amountUi: amt / 10 ** DECIMALS,
        share: supplyRaw ? amt / supplyRaw : 0,
        isPda: (info[owner]?.program || '') !== SYSTEM_PROGRAM,
      }))
      .sort((a, b) => b.amountRaw - a.amountRaw);

    const stats = await fetchRaikuStats();
    console.log('[api/dashboard] Raiku stats:', JSON.stringify(stats));

    const holdersData = { fetchedAt: new Date().toISOString(), mint: MINT, supplyUi, stats, holders };
    // Use committed firstSeen data for accurate days-held estimates; any brand-new
    // wallet missing from it falls back to the launch date (its points ~0 anyway).
    let firstSeenData = {};
    try {
      const fs = await import('node:fs');
      const path = await import('node:path');
      firstSeenData = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data/firstseen.json'), 'utf8'));
    } catch { /* no persisted firstSeen — fall back to launch-date estimates */ }
    const snapshot = buildSnapshot({
      holdersData,
      firstSeenData,
      pdaLabels: {},
    });

    res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(snapshot);
  } catch (e) {
    console.error('[api/dashboard] error:', e.message);
    return res.status(502).json({ error: 'Failed to fetch live data', detail: e.message });
  }
}
