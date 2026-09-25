import assert from 'node:assert/strict';
import { createHash, generateKeyPairSync } from 'node:crypto';
import test from 'node:test';
import { decodeBase58, isOnCurve, isProgramDerived } from './solana_address.mjs';

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
function encodeBase58(bytes) {
  let value = 0n;
  for (const b of bytes) value = value * 256n + BigInt(b);
  let out = '';
  while (value > 0n) { out = ALPHABET[Number(value % 58n)] + out; value /= 58n; }
  for (const b of bytes) { if (b !== 0) break; out = `1${out}`; }
  return out;
}

// Solana's findProgramAddress, using our curve check to reject on-curve candidates.
function findProgramAddress(seeds, programId) {
  for (let bump = 255; bump >= 0; bump--) {
    const hash = createHash('sha256');
    for (const seed of seeds) hash.update(seed);
    hash.update(Uint8Array.of(bump)).update(decodeBase58(programId)).update('ProgramDerivedAddress');
    const address = encodeBase58(hash.digest());
    if (!isOnCurve(address)) return address;
  }
  throw new Error('no viable bump');
}

// Real mainnet accounts: a wallet and its rkuSOL associated token account (a PDA).
const WALLET = 'Ar1HrwURVUrDRdGPpLDf22iG89XuehvMS8G34LRgkUmi';
const WALLET_ATA = '67hSVB3eZkPj2npXKas1xmuCzKAknWyB5PsNj5CmkQ4i';
const MINT = 'rkubjTrZYioRSeXwDnhwGQzvW3qkcin72JSxUt3WMVp';
const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ATA_PROGRAM = 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL';

test('freshly generated keypairs are on the curve', () => {
  for (let i = 0; i < 50; i++) {
    const der = generateKeyPairSync('ed25519').publicKey.export({ format: 'der', type: 'spki' });
    const address = encodeBase58(der.subarray(der.length - 32));
    assert.equal(isOnCurve(address), true, address);
    assert.equal(isProgramDerived(address), false, address);
  }
});

test('a wallet is on the curve and its token account is program-derived', () => {
  assert.equal(isProgramDerived(WALLET), false);
  assert.equal(isProgramDerived(WALLET_ATA), true);
});

test('deriving the associated token account reproduces the on-chain address', () => {
  const seeds = [decodeBase58(WALLET), decodeBase58(TOKEN_PROGRAM), decodeBase58(MINT)];
  assert.equal(findProgramAddress(seeds, ATA_PROGRAM), WALLET_ATA);
});

test('malformed input is neither a wallet nor program-derived', () => {
  for (const value of ['wallet-one', '', undefined, null, '1111', `${WALLET}x`]) {
    assert.equal(isOnCurve(value), false, String(value));
    assert.equal(isProgramDerived(value), false, String(value));
  }
});
