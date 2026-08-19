import fs from 'node:fs';
import { sleep } from './rpc.mjs';
import { p, SRC } from './paths.mjs';

// Daily update: refresh balances (1 RPC call), reuse cached firstSeen (never changes),
// regenerate public/data/dashboard.json. Run: node src/update_daily.mjs

const MINT = 'rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const DECIMALS = 9;

const RPC_URLS = [
  'https://gabriela-n6xhfi-fast-mainnet.helius-rpc.com',
  'https://api.mainnet-beta.solana.com',
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
    if (j.error) throw new Error(JSON.stringify(j.error).slice(0, 150));
    return j.result;
  } finally { clearTimeout(t); }
}
async function rpc(method, params) {
  let lastErr;
  for (let i = 0; i < 3; i++) {
    for (const url of RPC_URLS) {
      try { return await rpcCall(url, method, params); }
      catch (e) { lastErr = e; }
      await sleep(350);
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
    if (amount > 0) out.push({ owner, amount });
  }
  return out;
}

async function fetchRaikuStats() {
  try {
    const r = await fetch('https://staking-api.mainnet.raiku.sh/v1/lsts', { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
    const data = await r.json();
    for (const lst of data.lsts || []) {
      if (lst.mint === MINT) {
        const pd = lst.provider_data || {};
        return { officialHolders: pd.holders, tvlLamports: lst.tvl_lamports, latestApy: lst.latest_apy, launchDate: pd.launchDate };
      }
    }
  } catch (e) { console.log('raiku stats ERR', e.message); }
  return {};
}

(async () => {
  console.log('[1/4] Fetch balances (getProgramAccounts)...');
  const accounts = await fetchHolderAccounts();
  const perOwner = new Map();
  for (const { owner, amount } of accounts) perOwner.set(owner, (perOwner.get(owner) || 0) + amount);
  const supplyRaw = [...perOwner.values()].reduce((a, b) => a + b, 0);
  const supplyUi = supplyRaw / 10 ** DECIMALS;
  console.log(`  ${perOwner.size} owners, supply ${supplyUi.toFixed(2)}`);

  console.log('[2/4] Load cached firstSeen...');
  const firstSeen = JSON.parse(fs.readFileSync(p('firstseen.json'), 'utf8'));

  console.log('[3/4] Classify PDA (fresh owner info)...');
  const SYSTEM_PROGRAM = '11111111111111111111111111111111';
  const owners = [...perOwner.keys()];
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
    await sleep(400);
  }
  if (unknown) console.log(`  ⚠ ${unknown} owners don't exist on-chain → pool/PDA`);
  let pdaLabels = {};
  try { pdaLabels = JSON.parse(fs.readFileSync(p('pda_labels.json'), 'utf8')); } catch {}
  const stats = await fetchRaikuStats();
  const launch = new Date(stats.launchDate || '2026-05-11T21:00:00Z').getTime();

  console.log('[4/4] Build holders_full + regenerate dashboard...');
  const holders = [...perOwner.entries()].map(([owner, amt]) => ({
    owner,
    amountUi: amt / 10 ** DECIMALS,
    share: amt / supplyRaw,
    // Fresh program-owner check each run: system program => real wallet,
    // anything else (new pools/PDAs) is correctly excluded.
    isPda: (info[owner]?.program || '') !== SYSTEM_PROGRAM,
  })).sort((a, b) => b.amountUi - a.amountUi);

  const combined = {
    fetchedAt: new Date().toISOString(),
    mint: MINT,
    supplyUi,
    stats,
    holders,
  };
  fs.writeFileSync(p('holders_full.json'), JSON.stringify(combined, null, 1));

  // regenerate dashboard
  const { execSync } = await import('node:child_process');
  execSync(`node "${SRC}/generate_dashboard3.mjs"`, { stdio: 'inherit' });

  // Append to history (for APY/TVL trend charts). Daily cron appends one point/day.
  try {
    const HISTORY = p('history.json');
    let history = [];
    try { history = JSON.parse(fs.readFileSync(HISTORY, 'utf8')); } catch {}
    if (!Array.isArray(history)) history = [];
    const today = new Date().toISOString().slice(0, 10);
    const tvlLamports = Number(stats.tvlLamports) || 0;
    // Only append once per day (dedupe by date)
    if (!history.some((h) => h.date === today)) {
      history.push({
        date: today,
        tvlSol: tvlLamports / 1e9,
        apy: Number(stats.latestApy ?? stats.latest_apy) || null,
        avgApy: Number(stats.avgApy ?? stats.avg_apy) || null,
        supply: supplyUi,
        holders: perOwner.size,
        realWallets: holders.filter((h) => !h.isPda).length,
      });
      // keep last 180 days
      history = history.slice(-180);
      fs.writeFileSync(HISTORY, JSON.stringify(history, null, 1));
      console.log(`history: appended ${today}, total ${history.length} points`);
    } else {
      console.log(`history: ${today} already recorded, skip`);
    }
  } catch (e) { console.log('history append ERR', e.message); }

  console.log('DONE. dashboard refreshed.');
})();
