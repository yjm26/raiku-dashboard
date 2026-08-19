import fs from 'node:fs';
import { sleep } from './rpc.mjs';
import { p } from './paths.mjs';

const MINT = 'rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const SYSTEM_PROGRAM = '11111111111111111111111111111111';
const DECIMALS = 9;

// Hermes found a working Helius free RPC; include it plus public fallbacks.
const RPC_URLS = [
  'https://gabriela-n6xhfi-fast-mainnet.helius-rpc.com',
  'https://solana-rpc.publicnode.com',
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
    if (j.error) throw new Error(`${url} ${method}: ${JSON.stringify(j.error).slice(0, 160)}`);
    return j.result;
  } finally { clearTimeout(t); }
}

async function rpc(method, params, { attempts = 3 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
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
      dataSlice: { offset: 32, length: 40 }, // owner(32) + amount(8)
      filters: [
        { dataSize: 165 },
        { memcmp: { offset: 0, bytes: MINT } },
      ],
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
    await sleep(400);
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
  } catch (e) { console.log('raiku stats ERR', e.message); }
  return {};
}

(async () => {
  console.log('Fetching rkuSOL token accounts via getProgramAccounts...');
  const accounts = await fetchHolderAccounts();
  console.log(`  ${accounts.length} token accounts`);

  // aggregate per owner
  const perOwner = new Map();
  for (const { owner, amount } of accounts) {
    perOwner.set(owner, (perOwner.get(owner) || 0) + amount);
  }
  const supplyRaw = [...perOwner.values()].reduce((a, b) => a + b, 0);
  const supplyUi = supplyRaw / 10 ** DECIMALS;

  let holders = [...perOwner.entries()]
    .map(([owner, amt]) => ({
      owner,
      amountRaw: amt,
      amountUi: amt / 10 ** DECIMALS,
      share: supplyRaw ? amt / supplyRaw : 0,
    }))
    .sort((a, b) => b.amountRaw - a.amountRaw);

  console.log(`  ${holders.length} unique owners, supply ${supplyUi.toFixed(2)}`);

  console.log('  classifying owners (PDA vs wallet)...');
  const { info, unknown } = await fetchOwnerInfo(holders.map(h => h.owner));
  if (unknown) console.log(`  ⚠ ${unknown} owners don't exist on-chain → pool/PDA`);
  for (const h of holders) {
    h.isPda = (info[h.owner]?.program || '') !== SYSTEM_PROGRAM;
  }
  const nPda = holders.filter(h => h.isPda).length;
  console.log(`  ${nPda} program-owned (pool/PDA), ${holders.length - nPda} real wallets`);

  const stats = await fetchRaikuStats();
  console.log('  Raiku official:', JSON.stringify(stats));

  const out = {
    fetchedAt: new Date().toISOString(),
    mint: MINT,
    supplyUi,
    stats,
    holders,
  };
  fs.writeFileSync(p('holders_full.json'), JSON.stringify(out, null, 1));
  console.log('saved holders_full.json');
})();
