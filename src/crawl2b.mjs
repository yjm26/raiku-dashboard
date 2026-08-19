import fs from 'node:fs';
import { rpc, sleep } from './rpc.mjs';
import { p } from './paths.mjs';

// Second pass (fixed): for holders missing firstSeen (never seen in mint tx history),
// find first acquisition via getSignaturesForAddress on their token accounts.
// Uses helius primary (publicnode hides signature history for these accounts).

const MINT = 'rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp';
const holdersData = JSON.parse(fs.readFileSync(p('holders_full.json'), 'utf8'));
const crawl = JSON.parse(fs.readFileSync(p('crawl2_data.json'), 'utf8'));
const STATE = p('crawl2b_state.json');
const OUT = p('crawl2b_data.json');

const crawlOwners = new Set(Object.keys(crawl.owners));
const missing = holdersData.holders.filter(h => !crawlOwners.has(h.owner));
console.log('holders missing firstSeen:', missing.length);

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
console.log('resume idx:', state.idx, 'results:', Object.keys(results).length);

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
    await sleep(150);
  }
  return oldest ? Number(oldest.blockTime ?? 0) || null : null;
}

async function main() {
  const CONC = 4;
  let idx = state.idx;
  const total = missing.length;

  async function worker() {
    while (idx < total) {
      const h = missing[idx++];
      if (results[h.owner] !== undefined) continue;
      let firstSeen = null;
      try {
        const accs = await rpc('getTokenAccountsByOwner', [h.owner, { mint: MINT }, { encoding: 'jsonParsed' }]);
        const accounts = (accs?.value || []).map(a => a.pubkey);
        for (const acct of accounts) {
          const ts = await oldestForAccount(acct);
          if (ts && (firstSeen === null || ts < firstSeen)) firstSeen = ts;
          await sleep(120);
        }
      } catch (e) { /* skip */ }
      results[h.owner] = firstSeen;
      if (idx % 20 === 0) {
        console.log(`processed ${idx}/${total}, found=${Object.values(results).filter(Boolean).length}`);
        saveState({ idx }); saveData(results);
      }
      await sleep(100);
    }
  }
  await Promise.all(Array.from({ length: CONC }, worker));
  saveState({ idx: total }); saveData(results);
  const found = Object.values(results).filter(Boolean).length;
  console.log(`DONE. processed ${total}, found firstSeen for ${found}`);
}

main().catch((e) => { console.error('FATAL', e); process.exit(1); });
