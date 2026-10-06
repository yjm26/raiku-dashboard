// Network side of the holder ledger: new rkuSOL transactions since the last one processed,
// reduced to balance changes, plus wallet-vs-program classification for new owners.
import { isOnCurve } from './solana_address.mjs';

// Helius keeps full history; the public node is a slower fallback (strict getTransaction limits).
const ENDPOINTS = [
  { url: 'https://gabriela-n6xhfi-fast-mainnet.helius-rpc.com', perSecond: 8 },
  { url: 'https://api.mainnet-beta.solana.com', perSecond: 3 },
];
const SYSTEM_PROGRAM = '11111111111111111111111111111111';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(method, params, attempts = 8) {
  let last;
  for (let i = 0; i < attempts; i++) {
    const { url } = ENDPOINTS[i % ENDPOINTS.length];
    try {
      const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: AbortSignal.timeout(30000) });
      const j = await r.json();
      if (j.error) throw new Error(JSON.stringify(j.error).slice(0, 120));
      if (j.result == null) throw new Error(`${method}: no result`);
      return j.result;
    } catch (e) { last = e; await sleep(500 * (i + 1)); }
  }
  throw last;
}

// rkuSOL balance changes in one transaction, by token account.
export function extractEvents(tx, mint) {
  const keys = [
    ...tx.transaction.message.accountKeys.map((k) => (typeof k === 'string' ? k : k.pubkey)),
    ...(tx.meta.loadedAddresses?.writable || []),
    ...(tx.meta.loadedAddresses?.readonly || []),
  ];
  const pre = new Map();
  for (const b of tx.meta.preTokenBalances || []) if (b.mint === mint) pre.set(b.accountIndex, b);
  const post = new Map();
  for (const b of tx.meta.postTokenBalances || []) if (b.mint === mint) post.set(b.accountIndex, b);
  const events = [];
  for (const idx of new Set([...pre.keys(), ...post.keys()])) {
    const before = pre.get(idx);
    const after = post.get(idx);
    const from = before ? before.uiTokenAmount.amount : null;
    const to = after ? after.uiTokenAmount.amount : '0';
    if (from === to) continue;
    events.push({ account: keys[idx], owner: (after || before).owner, from, to, closed: !after });
  }
  return events;
}

// Pool rate shown by a SOL deposit or withdrawal: lamports into (or out of) the reserve per rkuSOL
// minted (or burned). Null for anything else (swaps, transfers, epoch updates).
export function extractRate(tx, mint, reserve) {
  const keys = [
    ...tx.transaction.message.accountKeys.map((k) => (typeof k === 'string' ? k : k.pubkey)),
    ...(tx.meta.loadedAddresses?.writable || []),
    ...(tx.meta.loadedAddresses?.readonly || []),
  ];
  const i = keys.indexOf(reserve);
  if (i < 0) return null;
  const lamports = BigInt(tx.meta.postBalances[i]) - BigInt(tx.meta.preBalances[i]);
  let minted = 0n;
  for (const b of tx.meta.postTokenBalances || []) if (b.mint === mint) minted += BigInt(b.uiTokenAmount.amount);
  for (const b of tx.meta.preTokenBalances || []) if (b.mint === mint) minted -= BigInt(b.uiTokenAmount.amount);
  if (lamports === 0n || minted === 0n || (lamports > 0n) !== (minted > 0n)) return null;
  const abs = (v) => (v < 0n ? -v : v);
  if (abs(minted) < 1_000_000n) return null;
  const rate = Number(abs(lamports)) / Number(abs(minted));
  return rate > 0.9 && rate < 1.5 ? rate : null;
}

// Signatures after `until` (exclusive), oldest first.
export async function listSignaturesSince(mint, until) {
  const out = [];
  let before;
  for (;;) {
    const page = await call('getSignaturesForAddress', [mint, { limit: 1000, ...(before ? { before } : {}), ...(until ? { until } : {}) }]);
    out.push(...page.map((s) => ({ sig: s.signature, slot: s.slot, time: s.blockTime, err: Boolean(s.err) })));
    if (page.length < 1000) break;
    before = page[page.length - 1].signature;
  }
  return out.reverse();
}

// An account's own signatures with afterSlot < slot <= untilSlot, oldest first. Every change to a
// token account appears here, including swaps that never name the mint.
export async function listAccountSignatures(account, afterSlot, untilSlot) {
  const out = [];
  let before;
  for (;;) {
    const page = await call('getSignaturesForAddress', [account, { limit: 1000, ...(before ? { before } : {}) }]);
    for (const s of page) if (s.slot > afterSlot && s.slot <= untilSlot) out.push({ sig: s.signature, slot: s.slot, time: s.blockTime, err: Boolean(s.err) });
    if (page.length < 1000 || page[page.length - 1].slot <= afterSlot) break;
    before = page[page.length - 1].signature;
  }
  return out.reverse();
}

// Fetch successful transactions at a steady pace across both endpoints; `handle(tx, sig, i)` shapes each result.
export async function fetchEach(sigs, handle) {
  const ok = sigs.filter((s) => !s.err);
  const results = new Array(ok.length);
  let next = 0;
  const lane = async ({ perSecond }) => {
    while (next < ok.length) {
      const i = next++;
      const tx = await call('getTransaction', [ok[i].sig, { encoding: 'json', maxSupportedTransactionVersion: 1, commitment: 'confirmed' }]);
      results[i] = handle(tx, ok[i], i);
      await sleep(1000 / perSecond);
    }
  };
  await Promise.all(ENDPOINTS.map(lane));
  return results;
}

// rkuSOL balance changes per transaction; each gets a sequence number after `startSeq`.
// With the pool's `reserve`, SOL deposits and withdrawals also carry the pool rate they used.
export async function fetchTransactions(sigs, mint, startSeq, reserve = null) {
  return fetchEach(sigs, (tx, s, i) => ({ sig: s.sig, seq: startSeq + 1 + i, slot: tx.slot, time: tx.blockTime, events: tx.meta.err ? [] : extractEvents(tx, mint), rate: !tx.meta.err && reserve ? extractRate(tx, mint, reserve) : null }));
}

// Wallet = on-curve address whose account is missing or owned by the System Program.
export async function classifyOwners(owners) {
  const kinds = {};
  const candidates = owners.filter((owner) => {
    if (isOnCurve(owner)) return true;
    kinds[owner] = 'program';
    return false;
  });
  for (let i = 0; i < candidates.length; i += 100) {
    const batch = candidates.slice(i, i + 100);
    const res = await call('getMultipleAccounts', [batch, { encoding: 'base64', dataSlice: { offset: 0, length: 0 } }]);
    batch.forEach((owner, j) => {
      const account = res.value[j];
      kinds[owner] = !account || account.owner === SYSTEM_PROGRAM ? 'wallet' : 'program';
    });
    await sleep(150);
  }
  return kinds;
}
