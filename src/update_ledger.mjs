// Daily step: bring data/ledger.json up to date and check it against the chain's balances.
import fs from 'node:fs';
import { p } from './paths.mjs';
import { applyTransactions, closeDaysUntil, mismatches, orderTransactions } from './ledger.mjs';
import { classifyOwners, fetchTransactions, listAccountSignatures, listSignaturesSince } from './ledger_sync.mjs';

/**
 * `currentBalances` ({ owner: raw string }) were read at `balancesSlot`. The ledger advances to exactly
 * that slot, so it describes the same moment as the day's balances; later transactions are picked up
 * on the next run. Wallets that still disagree after the mint's own transaction list get their token
 * accounts' histories read too (some swaps move rkuSOL without naming the mint). Returns null until
 * the ledger exists.
 */
export async function updateLedger({ mint, currentBalances, balancesSlot, now }) {
  const file = p('ledger.json');
  if (!fs.existsSync(file)) return null;
  const base = JSON.parse(fs.readFileSync(file, 'utf8'));
  const fromSlot = base.lastSlot ?? 0;

  const mintSigs = (await listSignaturesSince(mint, base.lastMintSignature)).filter((s) => s.slot <= balancesSlot);
  const mintTxs = (await fetchTransactions(mintSigs, mint, -1)).map((tx, i) => ({ ...tx, order: i }));

  const programs = new Set(base.programs || []);
  const build = async (txs) => {
    const known = new Set(Object.keys(base.owners));
    const fresh = [...new Set(txs.flatMap((t) => t.events.map((e) => e.owner)))].filter((o) => !known.has(o) && !programs.has(o));
    for (const [owner, kind] of Object.entries(await classifyOwners(fresh))) if (kind === 'program') programs.add(owner);
    const isWallet = (owner) => !programs.has(owner);
    const ledger = structuredClone(base);
    ledger.programs = [...programs].sort();
    applyTransactions(ledger, orderTransactions(txs, base.accounts, base.lastSeq), { isWallet });
    return { ledger, isWallet };
  };

  let { ledger, isWallet } = await build(mintTxs);
  let diff = mismatches(ledger, currentBalances);
  let extraTxs = [];
  if (diff.length) {
    const seen = new Set(mintTxs.map((t) => t.sig));
    const owners = new Set(diff.map((d) => d.owner));
    const accounts = Object.entries(ledger.accounts).filter(([, a]) => owners.has(a.owner)).map(([account]) => account);
    const extraSigs = [];
    for (const account of accounts) {
      for (const s of await listAccountSignatures(account, fromSlot, balancesSlot)) {
        if (!s.err && !seen.has(s.sig)) { seen.add(s.sig); extraSigs.push(s); }
      }
    }
    extraTxs = await fetchTransactions(extraSigs, mint, -1);
    ({ ledger, isWallet } = await build([...mintTxs, ...extraTxs]));
    diff = mismatches(ledger, currentBalances);
  }

  if (mintSigs.length) ledger.lastMintSignature = mintSigs.at(-1).sig;
  closeDaysUntil(ledger, now, { isWallet });
  ledger.lastCheck = { time: now, slot: balancesSlot, holders: Object.keys(currentBalances).length, mismatches: diff.length, mismatchedOwners: diff.map((d) => d.owner).slice(0, 50) };
  fs.writeFileSync(file, JSON.stringify(ledger));
  return { ledger, mismatches: diff, added: mintTxs.length + extraTxs.length };
}
