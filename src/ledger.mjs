// rkuSOL holder ledger rebuilt from on-chain history.
// Input: transactions that touched rkuSOL token accounts, oldest first, each reduced to balance
// changes { account, owner, from, to } in raw units (strings). Points = 1 per rkuSOL held per day,
// accrued continuously between balance changes, for current and former holders alike.

const DAY = 86_400;
const UNITS = 1e9;
const RECENT_DAYS = 35;

const toUi = (raw) => Number(raw) / UNITS;
const dayOf = (time) => new Date(time * 1000).toISOString().slice(0, 10);

export function createLedger() {
  return { version: 1, lastSignature: null, lastSeq: -1, lastTime: null, openDay: null, accounts: {}, owners: {}, daily: [], recent: [], chainBreaks: [] };
}

const nextDay = (date) => new Date(Date.parse(`${date}T00:00:00Z`) + DAY * 1000).toISOString().slice(0, 10);

function ownerOf(ledger, owner) {
  if (!ledger.owners[owner]) {
    ledger.owners[owner] = { balance: '0', points: 0, heldSeconds: 0, lastTime: null, firstTime: null, heldSince: null, exits: 0, lastExit: null, peak: '0' };
  }
  return ledger.owners[owner];
}

// Bring an owner's points and holding time up to `time` at their current balance.
function accrue(o, time) {
  if (o.lastTime != null && time > o.lastTime) {
    const seconds = time - o.lastTime;
    const balance = toUi(o.balance);
    o.points += balance * (seconds / DAY);
    if (balance > 0) o.heldSeconds += seconds;
  }
  o.lastTime = time;
}

function setBalance(ledger, owner, next, time) {
  const o = ownerOf(ledger, owner);
  accrue(o, time);
  const before = BigInt(o.balance);
  if (before === 0n && next > 0n) {
    if (o.firstTime == null) o.firstTime = time;
    o.heldSince = time;
  } else if (before > 0n && next === 0n) {
    o.exits += 1;
    o.lastExit = time;
    o.heldSince = null;
  }
  o.balance = next.toString();
  if (next > BigInt(o.peak)) o.peak = next.toString();
  return before;
}

// Daily series for charts: at the end of each finished UTC day, the wallets holding rkuSOL,
// their supply and their cumulative points. Days with no transactions are recorded too.
function closeDaysBefore(ledger, time, isWallet) {
  const day = dayOf(time);
  if (ledger.openDay == null) ledger.openDay = day;
  while (ledger.openDay < day) {
    const endTime = Date.parse(`${ledger.openDay}T00:00:00Z`) / 1000 + DAY - 1;
    ledger.daily.push(snapshotDay(ledger, ledger.openDay, endTime, isWallet));
    ledger.openDay = nextDay(ledger.openDay);
  }
}

export function closeDaysUntil(ledger, now, { isWallet = () => true } = {}) {
  closeDaysBefore(ledger, now, isWallet);
  return ledger;
}

// points: everything earned so far by all wallets, including wallets that have sold out.
function snapshotDay(ledger, date, endTime, isWallet) {
  let wallets = 0, supply = 0, points = 0;
  for (const [owner, o] of Object.entries(ledger.owners)) {
    if (!isWallet(owner)) continue;
    const balance = toUi(o.balance);
    const extra = o.lastTime != null && endTime > o.lastTime ? balance * ((endTime - o.lastTime) / DAY) : 0;
    points += o.points + extra;
    if (balance > 0) { wallets += 1; supply += balance; }
  }
  return { date, wallets, supply, points };
}

/**
 * Apply transactions (oldest first). Checks that every account's history chains: each change must
 * start from the balance the previous change left. A break means a transaction is missing.
 */
export function applyTransactions(ledger, txs, { isWallet = () => true } = {}) {
  for (const tx of txs) {
    if (tx.seq <= ledger.lastSeq) continue;
    closeDaysBefore(ledger, tx.time, isWallet);
    const changes = new Map();
    for (const ev of tx.events) {
      const acct = ledger.accounts[ev.account];
      const expected = acct ? acct.amount : null;
      if (!continues(ev, expected)) {
        ledger.chainBreaks.push({ sig: tx.sig, account: ev.account, owner: ev.owner, expected, found: ev.from });
      }
      const prevOwner = acct?.owner;
      const prevAmount = BigInt(acct?.amount ?? '0');
      const nextAmount = BigInt(ev.to);
      ledger.accounts[ev.account] = { owner: ev.owner, amount: ev.to };
      if (prevOwner && prevOwner !== ev.owner) {
        changes.set(prevOwner, (changes.get(prevOwner) ?? 0n) - prevAmount);
        changes.set(ev.owner, (changes.get(ev.owner) ?? 0n) + nextAmount);
      } else {
        changes.set(ev.owner, (changes.get(ev.owner) ?? 0n) + nextAmount - prevAmount);
      }
    }
    for (const [owner, delta] of changes) {
      if (delta === 0n) continue;
      const o = ownerOf(ledger, owner);
      const next = BigInt(o.balance) + delta;
      const before = setBalance(ledger, owner, next < 0n ? 0n : next, tx.time);
      ledger.recent.push([tx.time, owner, before.toString(), (next < 0n ? 0n : next).toString()]);
    }
    ledger.lastSeq = tx.seq;
    ledger.lastSignature = tx.sig;
    ledger.lastSlot = tx.slot;
    ledger.lastTime = tx.time;
  }
  const cutoff = (ledger.lastTime ?? 0) - RECENT_DAYS * DAY;
  ledger.recent = ledger.recent.filter(([time]) => time >= cutoff);
  return ledger;
}

const continues = (ev, current) => ev.from === current
  || (ev.from === null && (current == null || current === '0'))
  || (ev.from === '0' && current == null);

/**
 * Chain order for transactions gathered from several signature lists: by slot, and inside a slot in
 * the order that keeps every account's history continuous (`order` breaks remaining ties).
 * `accounts` is the ledger's account state before these transactions; `startSeq` numbers them after it.
 */
export function orderTransactions(txs, accounts = {}, startSeq = -1) {
  const sorted = [...txs].sort((a, b) => a.slot - b.slot || (a.order ?? 0) - (b.order ?? 0));
  const state = new Map(Object.entries(accounts).map(([account, a]) => [account, a.amount]));
  const out = [];
  for (let i = 0; i < sorted.length;) {
    let j = i;
    while (j < sorted.length && sorted[j].slot === sorted[i].slot) j++;
    const group = sorted.slice(i, j);
    while (group.length) {
      let k = group.findIndex((tx) => tx.events.every((ev) => continues(ev, state.get(ev.account))));
      if (k < 0) k = 0;
      const [tx] = group.splice(k, 1);
      for (const ev of tx.events) state.set(ev.account, ev.to);
      out.push(tx);
    }
    i = j;
  }
  return out.map((tx, index) => ({ ...tx, seq: startSeq + 1 + index }));
}

/**
 * Compare ledger balances with the chain's current balances ({ owner: raw string }).
 * Returns the owners whose balances differ.
 */
export function mismatches(ledger, current) {
  const out = [];
  const owners = new Set([...Object.keys(current), ...Object.entries(ledger.owners).filter(([, o]) => o.balance !== '0').map(([owner]) => owner)]);
  for (const owner of owners) {
    const have = ledger.owners[owner]?.balance ?? '0';
    const want = current[owner] ?? '0';
    if (have !== want) out.push({ owner, ledger: have, chain: want });
  }
  return out;
}

/**
 * Per-owner figures as of `now`: balance, points, days held, first buy, exit.
 */
export function ownerSummary(ledger, owner, now) {
  const o = ledger.owners[owner];
  if (!o) return null;
  const balance = toUi(o.balance);
  const since = o.lastTime != null && now > o.lastTime ? now - o.lastTime : 0;
  return {
    owner,
    balance,
    points: o.points + balance * (since / DAY),
    daysHeld: (o.heldSeconds + (balance > 0 ? since : 0)) / DAY,
    firstTime: o.firstTime,
    heldSince: o.heldSince,
    exits: o.exits,
    lastExit: o.lastExit,
    peak: toUi(o.peak),
  };
}

/**
 * Wallet flows over the last `days`: who joined, who fully exited, and the biggest balance changes.
 */
export function flows(ledger, now, days, isWallet = () => true) {
  const start = now - days * DAY;
  const first = new Map();
  for (const [time, owner, before, after] of ledger.recent) {
    if (time < start || !isWallet(owner)) continue;
    if (!first.has(owner)) first.set(owner, { before: toUi(before) });
    first.get(owner).after = toUi(after);
  }
  const rows = [...first.entries()].map(([owner, { before, after }]) => ({ owner, before, after, change: after - before }));
  const joined = rows.filter((r) => r.before === 0 && r.after > 0);
  const exited = rows.filter((r) => r.before > 0 && r.after === 0);
  const net = rows.reduce((sum, r) => sum + r.change, 0);
  const byChange = [...rows].filter((r) => r.change !== 0).sort((a, b) => b.change - a.change);
  return {
    days,
    joined: { count: joined.length, amount: joined.reduce((s, r) => s + r.after, 0) },
    exited: { count: exited.length, amount: exited.reduce((s, r) => s + r.before, 0) },
    net,
    topIn: byChange.filter((r) => r.change > 0).slice(0, 5),
    topOut: byChange.filter((r) => r.change < 0).reverse().slice(0, 5),
  };
}
