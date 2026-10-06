// Rebuild data/ledger.json from every rkuSOL transaction since launch, with the pool rate at each
// moment, so points follow SOL value (rkuSOL × rate). Only needed when the way points accrue changes.
// usage: node src/rebuild_ledger.mjs <cache.json> [--fetch-only] [--write]
//   Fetches each transaction once into <cache.json> (resumable), fills gaps from token-account
//   histories, replays at a fixed rate of 1 to check it reproduces the current ledger, then replays
//   with the pool rates. --write saves the rebuilt ledger only if that check passes.
import fs from 'node:fs';
import { p } from './paths.mjs';
import { addRates, applyTransactions, closeDaysUntil, createLedger, orderTransactions } from './ledger.mjs';
import { extractEvents, extractRate, listAccountSignatures, listSignaturesSince } from './ledger_sync.mjs';

const MINT = 'rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp';
const RESERVE = '9BannfeCfdp8c9TMAAaoN3w66NsbpyZEi393QBsPB4W6';
// Parallel lanes for the one-off crawl (the daily job paces itself through ledger_sync instead).
const HELIUS = 'https://gabriela-n6xhfi-fast-mainnet.helius-rpc.com';
const LANES = [HELIUS, HELIUS, HELIUS, 'https://api.mainnet-beta.solana.com'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getTransaction(url, sig) {
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getTransaction', params: [sig, { encoding: 'json', maxSupportedTransactionVersion: 1, commitment: 'confirmed' }] }), signal: AbortSignal.timeout(30000) });
      const j = await r.json();
      if (j.result) return j.result;
    } catch { /* retry below */ }
    await sleep(700 * (attempt + 1));
  }
  return null;
}
const [cacheFile, ...flags] = process.argv.slice(2);
if (!cacheFile) throw new Error('usage: node src/rebuild_ledger.mjs <cache.json> [--fetch-only] [--write]');

const base = JSON.parse(fs.readFileSync(p('ledger.json'), 'utf8'));
const cache = fs.existsSync(cacheFile) ? JSON.parse(fs.readFileSync(cacheFile, 'utf8')) : { txs: {}, extraSigs: [] };
const save = () => fs.writeFileSync(cacheFile, JSON.stringify(cache));

// Fetch what the cache lacks across the lanes, saving every 500 so a crash keeps the progress.
async function fetchMissing(sigs, label) {
  const queue = sigs.filter((s) => !s.err && !cache.txs[s.sig]).map((s) => s.sig);
  const total = queue.length;
  console.log(`${label}: ${sigs.length} signatures, ${total} to fetch`);
  let done = 0, sinceSave = 0, failed = 0;
  const lane = async (url) => {
    while (queue.length) {
      const sig = queue.shift();
      const tx = await getTransaction(url, sig);
      if (!tx) { failed += 1; if (failed < 2000) queue.push(sig); continue; }
      cache.txs[sig] = { slot: tx.slot, time: tx.blockTime, events: tx.meta.err ? [] : extractEvents(tx, MINT), rate: tx.meta.err ? null : extractRate(tx, MINT, RESERVE) };
      done += 1;
      if (++sinceSave >= 500) { sinceSave = 0; save(); console.log(`  ${done}/${total} ${new Date().toISOString().slice(11, 19)}`); }
    }
  };
  await Promise.all(LANES.map(lane));
  save();
  console.log(`  ${done}/${total} done, ${failed} retried`);
  if (done < total) throw new Error(`${total - done} transactions could not be fetched`);
}

// The mint's own transaction list, up to where the current ledger stops.
if (!cache.mintSigs) {
  cache.mintSigs = (await listSignaturesSince(MINT, null)).filter((s) => s.slot <= base.lastSlot);
  save();
}
await fetchMissing(cache.mintSigs, 'mint');
if (flags.includes('--fetch-only')) process.exit(0);

const programs = new Set(base.programs || []);
const isWallet = (owner) => !programs.has(owner);

function replay(withRates) {
  const seen = new Set();
  const sigs = [...cache.mintSigs, ...cache.extraSigs].filter((s) => !s.err && cache.txs[s.sig] && !seen.has(s.sig) && seen.add(s.sig));
  const txs = sigs.map((s, order) => ({ sig: s.sig, ...cache.txs[s.sig], order }));
  const ledger = createLedger();
  ledger.programs = [...programs].sort();
  if (withRates) addRates(ledger, txs.filter((t) => t.rate).map((t) => ({ time: t.time, slot: t.slot, rate: t.rate })));
  applyTransactions(ledger, orderTransactions(txs, {}, -1), { isWallet });
  closeDaysUntil(ledger, base.lastCheck.time, { isWallet });
  return ledger;
}

// Owners whose replay differs from the current ledger. Wallets must match exactly (balance, points at
// a rate of 1, days held, exits); program accounts earn no points, so only their balances count.
const EMPTY = { balance: '0', points: 0, heldSeconds: 0, exits: 0 };
function differences(ledger) {
  const out = [];
  for (const owner of new Set([...Object.keys(base.owners), ...Object.keys(ledger.owners)])) {
    const a = base.owners[owner] ?? EMPTY, b = ledger.owners[owner] ?? EMPTY;
    if (a.balance !== b.balance) out.push(owner);
    else if (isWallet(owner) && (Math.abs(a.points - b.points) > 1e-6 * Math.max(1, Math.abs(a.points)) || a.heldSeconds !== b.heldSeconds || a.exits !== b.exits)) out.push(owner);
  }
  return out;
}

// Fill gaps: read the token-account histories of wallets that differ or whose history has a break
// (a missing transaction), until nothing new turns up.
for (let round = 1; ; round++) {
  const replayed = replay(false);
  const diff = differences(replayed);
  const broken = replayed.chainBreaks.map((b) => b.owner).filter(isWallet);
  console.log(`round ${round}: ${diff.length} owners differ from the current ledger (${diff.filter(isWallet).length} wallets), ${new Set(broken).size} wallets with breaks`);
  const owners = new Set([...diff.filter(isWallet), ...broken]);
  if (!owners.size) break;
  const known = new Set([...cache.mintSigs, ...cache.extraSigs].map((s) => s.sig));
  const fresh = [];
  for (const [account, a] of Object.entries(base.accounts)) {
    if (!owners.has(a.owner)) continue;
    for (const s of await listAccountSignatures(account, 0, base.lastSlot)) if (!known.has(s.sig)) { known.add(s.sig); fresh.push(s); }
  }
  console.log(`  ${fresh.length} transactions found outside the mint's list`);
  if (!fresh.length) break;
  cache.extraSigs.push(...fresh);
  save();
  await fetchMissing(fresh, 'extra');
}

const check = replay(false);
const diff = differences(check);
const sameDays = check.daily.length === base.daily.length && check.daily.every((d, i) => d.date === base.daily[i].date && Math.abs(d.points - base.daily[i].points) < 1e-3 * Math.max(1, d.points));
const walletDiff = diff.filter(isWallet);
console.log(`check at rate 1: ${check.lastSeq + 1} transactions (current ledger ${base.lastSeq + 1}), ${walletDiff.length} wallets and ${diff.length - walletDiff.length} program balances differ, daily series ${sameDays ? 'identical' : 'DIFFERENT'}, chain breaks ${check.chainBreaks.length} (current ${base.chainBreaks.length})`);
if (diff.length) console.log('  differ:', diff.slice(0, 10).join(', '));

const rebuilt = replay(true);
rebuilt.lastMintSignature = base.lastMintSignature;
rebuilt.lastCheck = base.lastCheck;
const wallets = Object.entries(rebuilt.owners).filter(([owner]) => isWallet(owner));
const total = (l) => Object.entries(l.owners).filter(([owner]) => isWallet(owner)).reduce((s, [, o]) => s + o.points, 0);
console.log(`rates: ${rebuilt.rates.length} epochs, ${rebuilt.rates[0]?.[1]} -> ${rebuilt.rates.at(-1)?.[1]}`);
console.log(`points to each owner's last change: ${total(base).toFixed(0)} at rate 1 -> ${total(rebuilt).toFixed(0)} with rates (${wallets.length} wallets)`);

if (flags.includes('--write')) {
  if (walletDiff.length || !sameDays) throw new Error('replay does not reproduce the current ledger; not writing');
  fs.writeFileSync(p('ledger.json'), JSON.stringify(rebuilt));
  console.log('wrote data/ledger.json');
}
