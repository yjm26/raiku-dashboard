// Solana address checks. A program-derived address (PDA) lies off the ed25519
// curve, so no private key exists for it: it can never be a person's wallet.

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const P = 2n ** 255n - 19n;
const mod = (value) => ((value % P) + P) % P;

function pow(base, exponent) {
  let result = 1n;
  let b = mod(base);
  let e = exponent;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % P;
    b = (b * b) % P;
    e >>= 1n;
  }
  return result;
}

const D = mod(-121665n * pow(121666n, P - 2n));

// Base58 → bytes; null when the text isn't valid base58.
export function decodeBase58(text) {
  if (typeof text !== 'string' || !text) return null;
  let value = 0n;
  for (const char of text) {
    const digit = ALPHABET.indexOf(char);
    if (digit < 0) return null;
    value = value * 58n + BigInt(digit);
  }
  const bytes = [];
  while (value > 0n) {
    bytes.unshift(Number(value & 255n));
    value >>= 8n;
  }
  for (const char of text) {
    if (char !== '1') break;
    bytes.unshift(0);
  }
  return Uint8Array.from(bytes);
}

// Point decompression test: does this 32-byte key encode a point on the curve?
function onCurve(bytes) {
  let y = 0n;
  for (let i = 31; i >= 0; i--) y = (y << 8n) | BigInt(bytes[i]);
  const sign = y >> 255n;
  y &= (1n << 255n) - 1n;
  if (y >= P) return false;
  const y2 = (y * y) % P;
  const x2 = (mod(y2 - 1n) * pow(mod(D * y2 + 1n), P - 2n)) % P;
  if (x2 === 0n) return sign === 0n;
  return pow(x2, (P - 1n) / 2n) === 1n;
}

export function isOnCurve(address) {
  const bytes = decodeBase58(address);
  return bytes !== null && bytes.length === 32 && onCurve(bytes);
}

// True only for well-formed addresses that are off-curve (program-controlled).
export function isProgramDerived(address) {
  const bytes = decodeBase58(address);
  return bytes !== null && bytes.length === 32 && !onCurve(bytes);
}
