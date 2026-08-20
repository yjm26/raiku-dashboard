// Verify unfetchable owners with getTokenAccountsByOwner — the reliable way
// to tell "still holding" from "really closed". Caches results so the daily
// pipeline only pays this cost once per new wallet.
import fs from 'node:fs';
import { rpc, sleep } from './rpc.mjs';
import { p } from './paths.mjs';

const MINT = 'rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp';
const CACHE_FILE = p('verified_wallets.json');

export async function verifyUnfetchableOwners(holders) {
  let cache = {};
  try { cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8')); } catch {}
  if (typeof cache !== 'object' || cache === null) cache = {};

  // Owners we flagged as isPda without a known program (i.e. "closed") but which
  // getMultipleAccounts couldn't fetch. getTokenAccountsByOwner is authoritative.
  const toCheck = holders.filter((h) => h.isPda && !h.pdaProgram && cache[h.owner] === undefined);
  console.log(`  verify: ${toCheck.length} unfetchable owners to check via getTokenAccountsByOwner`);

  const CHUNK = 25;
  for (let i = 0; i < toCheck.length; i += CHUNK) {
    const chunk = toCheck.slice(i, i + CHUNK);
    const results = await Promise.all(chunk.map(async (h) => {
      try {
        const res = await rpc('getTokenAccountsByOwner', [h.owner, { mint: MINT }, { encoding: 'jsonParsed' }]);
        const accs = (Array.isArray(res) ? res : res?.value || []);
        const total = accs.reduce((sum, a) => {
          const ui = Number(a?.account?.data?.parsed?.info?.tokenAmount?.uiAmount) || 0;
          return sum + ui;
        }, 0);
        return { owner: h.owner, balance: total };
      } catch (e) {
        return { owner: h.owner, balance: null };
      }
    }));
    for (const r of results) {
      if (r.balance !== null) cache[r.owner] = r.balance;
    }
    await sleep(400);
  }

  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 1));
  console.log(`  verify: cached ${Object.keys(cache).length} owners`);
  return cache;
}

// Apply verification: still-holding owners become real wallets; zero-balance stay closed.
export function applyVerifiedClassification(holders, cache) {
  let reclassed = 0;
  for (const h of holders) {
    if (!h.isPda || h.pdaProgram) continue;
    const bal = cache[h.owner];
    if (bal === undefined) continue;
    if (bal > 0) {
      h.isPda = false;
      h.pdaProgram = undefined;
      reclassed++;
    } else {
      h.verifiedClosed = true;
    }
  }
  return reclassed;
}

// CLI: verify + apply, then write holders_full back.
const isMain = process.argv[1] && import.meta.url.endsWith(process.argv[1].split(/[\\/]/).pop());
if (isMain) {
  const holdersData = JSON.parse(fs.readFileSync(p('holders_full.json'), 'utf8'));
  const cache = await verifyUnfetchableOwners(holdersData.holders);
  const n = applyVerifiedClassification(holdersData.holders, cache);
  console.log(`reclassified ${n} owners → real wallets`);
  fs.writeFileSync(p('holders_full.json'), JSON.stringify(holdersData, null, 1));
}
