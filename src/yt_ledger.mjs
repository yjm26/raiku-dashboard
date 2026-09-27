// YT-rkuSOL on Exponent: each wallet's staked YT over time. Every deposit and withdraw event from
// Exponent's program carries the position's balance afterwards, so the history can be checked step by step.
import { decodeBase58, encodeBase58 } from './solana_address.mjs';

export const EXPONENT_CORE = 'ExponentnaRg3CQbW6dqQNZKXp7gtZ9DGMp1cwC4HAS7';
// Anchor emits events as a self-call whose data starts with this tag, then the event's discriminator.
const EVENT_TAG = Buffer.from([0xe4, 0x45, 0xa5, 0x2e, 0x51, 0xcb, 0x9a, 0x1d]);
const EVENTS = [
  ['deposit', [78, 226, 18, 115, 161, 164, 137, 112]], // DepositYtEvent
  ['deposit', [24, 10, 201, 118, 79, 178, 237, 243]], // DepositYtEventV2
  ['withdraw', [190, 66, 234, 53, 4, 207, 221, 17]], // WithdrawYtEvent
  ['withdraw', [41, 253, 139, 142, 167, 187, 86, 118]], // WithdrawYtEventV2
  ['init', [114, 53, 131, 31, 90, 57, 208, 196]], // InitializeYieldPositionEvent
].map(([kind, bytes]) => [kind, Buffer.from(bytes)]);

const key = (data, offset) => encodeBase58(data.subarray(offset, offset + 32));

export function decodeYtEvent(data) {
  if (data.length < 16 || !data.subarray(0, 8).equals(EVENT_TAG)) return null;
  const found = EVENTS.find(([, discriminator]) => data.subarray(8, 16).equals(discriminator));
  if (!found) return null;
  const body = data.subarray(16);
  if (found[0] === 'init') return { kind: 'init', owner: key(body, 0), vault: key(body, 32), position: key(body, 64) };
  // signer, vault, user position, vault position, token account, escrow, amount, rate (32 bytes), balance after
  return { kind: found[0], signer: key(body, 0), vault: key(body, 32), position: key(body, 64), amount: body.readBigUInt64LE(192), balanceAfter: body.readBigUInt64LE(232) };
}

// One vault's YT events in a transaction (RPC json encoding), in execution order, and the escrow's change.
export function ytEventsOf(tx, { vault, escrow }) {
  const keys = [
    ...tx.transaction.message.accountKeys.map((k) => (typeof k === 'string' ? k : k.pubkey)),
    ...(tx.meta.loadedAddresses?.writable || []),
    ...(tx.meta.loadedAddresses?.readonly || []),
  ];
  const events = [];
  let eventDelta = 0n;
  for (const group of [...(tx.meta.innerInstructions || [])].sort((a, b) => a.index - b.index)) {
    for (const ix of group.instructions) {
      if (keys[ix.programIdIndex] !== EXPONENT_CORE) continue;
      const event = decodeYtEvent(Buffer.from(decodeBase58(ix.data) || []));
      if (!event || event.vault !== vault) continue;
      events.push(event);
      if (event.kind === 'deposit') eventDelta += event.amount;
      if (event.kind === 'withdraw') eventDelta -= event.amount;
    }
  }
  const index = keys.indexOf(escrow);
  const amount = (list) => BigInt((list || []).find((b) => b.accountIndex === index)?.uiTokenAmount.amount ?? '0');
  const escrowDelta = index < 0 ? 0n : amount(tx.meta.postTokenBalances) - amount(tx.meta.preTokenBalances);
  return { events, escrowDelta, eventDelta };
}

// `vaultPosition` is the vault's own position for unstaked YT: it moves without events and belongs to no one.
export function createYtLedger({ vault, escrow, maturity, vaultPosition = null }) {
  return { vault, escrow, maturity, vaultPosition, lastSignature: null, lastSlot: 0, transactions: 0, positions: {}, breaks: [], txMismatches: [] };
}

// Apply decoded transactions, oldest first: [{ sig, slot, time, events, escrowDelta, eventDelta }].
export function applyYtTransactions(ledger, txs) {
  for (const tx of txs) {
    if (tx.eventDelta !== tx.escrowDelta) ledger.txMismatches.push(tx.sig);
    for (const event of tx.events) {
      const position = ledger.positions[event.position] ??= { owner: null, balance: '0', since: null, ytSeconds: 0, first: null };
      if (event.kind === 'init') { position.owner ??= event.owner; continue; }
      const before = BigInt(position.balance);
      const expected = event.kind === 'deposit' ? before + event.amount : before - event.amount;
      if (expected !== event.balanceAfter) ledger.breaks.push({ position: event.position, sig: tx.sig });
      if (position.since != null) position.ytSeconds += accrued(ledger, before, position.since, tx.time);
      position.balance = String(event.balanceAfter);
      position.since = tx.time;
      position.first ??= tx.time;
      // Withdrawals are signed by the owner; the first deposit's signer stands in until one is seen.
      if (event.kind === 'withdraw' || !position.owner) position.owner = event.signer;
    }
    ledger.lastSignature = tx.sig;
    ledger.lastSlot = tx.slot;
    ledger.transactions += 1;
  }
  return ledger;
}

// YT·seconds for a balance held from `from` to `to`; YT stops earning at maturity.
function accrued(ledger, balance, from, to) {
  const end = ledger.maturity ? Math.min(to, ledger.maturity) : to;
  return end > from ? Number(balance) / 1e9 * (end - from) : 0;
}

// Per owner: staked YT now, YT-days held so far, and when they first staked.
export function ytHolders(ledger, now) {
  const owners = new Map();
  for (const position of Object.values(ledger.positions)) {
    if (!position.owner) continue;
    const seconds = position.ytSeconds + (position.since == null ? 0 : accrued(ledger, BigInt(position.balance), position.since, now));
    const row = owners.get(position.owner) ?? { owner: position.owner, yt: 0, ytDays: 0, first: position.first };
    row.yt += Number(position.balance) / 1e9;
    row.ytDays += seconds / 86_400;
    row.first = Math.min(row.first ?? position.first, position.first ?? row.first);
    owners.set(position.owner, row);
  }
  return [...owners.values()];
}

// Positions whose replayed balance differs from the live account ({ position: raw balance }).
export function ytMismatches(ledger, live) {
  const out = [];
  for (const [position, balance] of Object.entries(live)) if (position !== ledger.vaultPosition && (ledger.positions[position]?.balance ?? '0') !== balance) out.push(position);
  for (const [position, p] of Object.entries(ledger.positions)) if (!(position in live) && p.balance !== '0') out.push(position);
  return out;
}
