// Daily step: bring data/yt_ledger.json up to date and check it against the live YT positions.
import fs from 'node:fs';
import { p } from './paths.mjs';
import { rpc } from './rpc.mjs';
import { encodeBase58 } from './solana_address.mjs';
import { fetchEach, listSignaturesSince } from './ledger_sync.mjs';
import { EXPONENT_CORE, applyYtTransactions, ytEventsOf, ytMismatches } from './yt_ledger.mjs';

const VAULT_DISCRIMINATOR = Buffer.from([211, 8, 232, 43, 2, 152, 117, 119]);
const POSITION_DISCRIMINATOR = encodeBase58(Buffer.from([227, 92, 146, 49, 29, 85, 71, 94]));

// The Exponent vault: its YT mint and escrow, and when its YT matures.
export async function readVault(vault) {
  const account = (await rpc('getAccountInfo', [vault, { encoding: 'base64' }]))?.value;
  if (!account || account.owner !== EXPONENT_CORE) throw new Error(`vault ${vault} not found`);
  const data = Buffer.from(account.data[0], 'base64');
  if (!data.subarray(0, 8).equals(VAULT_DISCRIMINATOR)) throw new Error(`${vault} is not an Exponent vault`);
  const key = (i) => encodeBase58(data.subarray(8 + 32 * i, 8 + 32 * (i + 1)));
  const start = data.readUInt32LE(264);
  return { mintYt: key(2), mintPt: key(3), escrow: key(4), vaultPosition: key(6), start, maturity: start + data.readUInt32LE(268) };
}

// Live YT balance and owner of every position in the vault, and the slot they were read at.
export async function readYtPositions(vault) {
  const res = await rpc('getProgramAccounts', [EXPONENT_CORE, { encoding: 'base64', withContext: true, dataSlice: { offset: 8, length: 72 }, filters: [{ memcmp: { offset: 0, bytes: POSITION_DISCRIMINATOR } }, { memcmp: { offset: 40, bytes: vault } }] }]);
  const balances = {};
  const owners = {};
  for (const { pubkey, account } of res.value) {
    const data = Buffer.from(account.data[0], 'base64');
    owners[pubkey] = encodeBase58(data.subarray(0, 32));
    balances[pubkey] = String(data.readBigUInt64LE(64));
  }
  return { balances, owners, slot: res.context.slot };
}

// Transactions shaped for applyYtTransactions.
export const decodeForLedger = (ledger) => (tx, s) => ({
  sig: s.sig, slot: tx.slot, time: tx.blockTime,
  ...(tx.meta.err ? { events: [], escrowDelta: 0n, eventDelta: 0n } : ytEventsOf(tx, ledger)),
});

// Returns null until the ledger exists (built once from the full history).
export async function updateYtLedger({ now }) {
  const file = p('yt_ledger.json');
  if (!fs.existsSync(file)) return null;
  const ledger = JSON.parse(fs.readFileSync(file, 'utf8'));
  const live = await readYtPositions(ledger.vault);
  const sigs = (await listSignaturesSince(ledger.escrow, ledger.lastSignature)).filter((s) => s.slot <= live.slot);
  const txs = await fetchEach(sigs, decodeForLedger(ledger));
  applyYtTransactions(ledger, txs);
  for (const [position, owner] of Object.entries(live.owners)) if (ledger.positions[position]) ledger.positions[position].owner = owner;
  const mismatched = ytMismatches(ledger, live.balances);
  ledger.lastCheck = { time: now, slot: live.slot, positions: Object.keys(live.balances).length, mismatches: mismatched.length, mismatched: mismatched.slice(0, 50) };
  fs.writeFileSync(file, JSON.stringify(ledger));
  return { ledger, added: txs.length, mismatches: mismatched };
}
