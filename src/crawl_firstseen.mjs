import fs from 'node:fs';
import { rpc, sleep } from './rpc.mjs';
import { p } from './paths.mjs';

// FINAL crawler: for ALL real (non-PDA) wallets, find first acquisition by
// querying each of their rkuSOL token accounts' signature history.
// This is more accurate than mint-history scanning (per-account depth is deeper).
const MINT = 'rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp';
const holdersData = JSON.parse(fs.readFileSync(p('holders_full.json'), 'utf8'));
const STATE = p('firstseen_state.json');
const OUT = p('firstseen.json');

const realWallets = holdersData.holders.filter(h => !h.isPda);
console.log('real wallets to crawl:', realWallets.length);

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); }
  catch { return { idx: 0 }; }
}
function saveState(s) { fs.writeFileSync(STATE, JSON.stringify(s, null, 1)); }
function loadData() {
  try { return JSON.parse(fs.readFileSync(OUT, 'utf8')); }
  catch { return {}; }
}
function saveData(d) { fs.writeFileSync(OUT, JSON.stringify(d, null, 1)); }

const state = loadState();
const results = loadData();
console.log('resume idx:', state.idx, 'cached:', Object.keys(results).length);

async function oldestForAccount(account) {
  let before, oldest = null;
  for (let page = 0; page < 8; page++) {
    let sigs;
    try { sigs = await rpc('getSignaturesForAddress', [account, { limit: 1000, ...(before ? { before } : {}) }]); }
    catch { return null; }
    if (!sigs || sigs.length === 0) break;
    oldest = sigs[sigs.length - 1];
    before = oldest.signature;
    if (sigs.length < 1000) break;
    await sleep(120);
  }
  return oldest ? Number(oldest.blockTime ?? 0) || null : null;
}

async function main() {
  const CONC = 4;
  let idx = state.idx;
  const total = realWallets.length;

  async function worker() {
    while (idx < total) {
      const h = realWallets[idx++];
      // Retry wallets whose previous attempt produced no timestamp (null/undefined),
      // so a transient RPC failure is never treated as a permanent "no history".
      if (results[h.owner] !== undefined && results[h.owner] !== null) continue;
      let firstSeen = null;
      try {
        const accs = await rpc('getTokenAccountsByOwner', [h.owner, { mint: MINT }, { encoding: 'jsonParsed' }]);
        const accounts = (accs?.value || []).map(a => a.pubkey);
        for (const acct of accounts) {
          const ts = await oldestForAccount(acct);
          if (ts && (firstSeen === null || ts < firstSeen)) firstSeen = ts;
          await sleep(100);
        }
      } catch (e) { /* skip, retried next run */ }
      results[h.owner] = firstSeen;
      if (idx % 25 === 0) {
        console.log(`processed ${idx}/${total}, found=${Object.values(results).filter(Boolean).length}`);
        saveState({ idx }); saveData(results);
      }
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  saveState({ idx: total }); saveData(results);
  const found = Object.values(results).filter(Boolean).length;
  console.log(`DONE. processed ${total}, found firstSeen for ${found}/${total}`);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
