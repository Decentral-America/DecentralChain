/**
 * Curve25519 signatures — Trevor Perrin's Curve25519 signature scheme.
 *
 * Public/private keys are X25519 (Montgomery form).
 * Signing converts internally to Ed25519 (Edwards form), signs, then
 * stores the Edwards sign bit in the signature for verification.
 *
 * This module replaces the vendored axlsign.js with audited @noble/curves
 * primitives for all elliptic‑curve and hash operations.
 *
 * @see https://moderncrypto.org/mail-archive/curves/2014/000205.html
 */

import { ed25519, x25519 } from '@noble/curves/ed25519.js';
import { bytesToNumberLE, numberToBytesLE } from '@noble/curves/utils.js';
import { sha512 } from '@noble/hashes/sha2.js';

const L = ed25519.Point.Fn.ORDER;
const BASE = ed25519.Point.BASE;

// ─── helpers ───────────────────────────────────────────────────────

/** Clamp a 32-byte scalar to Curve25519 form (in-place). */
function clamp(k: Uint8Array): Uint8Array {
  k[0]! &= 248;
  k[31]! &= 127;
  k[31]! |= 64;
  return k;
}

/**
 * Derive the Ed25519 public key (compressed Edwards y) from a clamped
 * Curve25519 private key by scalar multiplication of the base point.
 *
 * Noble requires the scalar in [1, n). Since a clamped key can exceed n
 * we reduce mod n first — this yields the same curve point because the
 * base point has order n.
 */
function edwardsPublicKey(clampedSk: Uint8Array): Uint8Array {
  const scalar = bytesToNumberLE(clampedSk) % L;
  return BASE.multiply(scalar).toBytes();
}

/**
 * Montgomery ↔ Edwards public key conversion.
 *
 * Given a Montgomery u-coordinate (X25519 public key) and a sign bit
 * from the signature, recover the full Edwards public key:
 *   y = (u − 1) / (u + 1)  (mod p)
 * then set the top bit of byte 31 to the sign bit.
 */
function montgomeryToEdwards(montPk: Uint8Array, signBit: number): Uint8Array {
  const P = 2n ** 255n - 19n;

  let u = 0n;
  for (let i = 0; i < 32; i++) u |= BigInt(montPk[i]!) << BigInt(8 * i);

  const uMod = ((u % P) + P) % P;
  const num = (((uMod - 1n) % P) + P) % P;
  const den = (uMod + 1n) % P;
  // Fermat inversion: den^(p−2) mod p
  const inv = modPow(den, P - 2n, P);
  const y = (num * inv) % P;

  const out = new Uint8Array(32);
  let tmp = y;
  for (let i = 0; i < 32; i++) {
    out[i]! = Number(tmp & 0xffn);
    tmp >>= 8n;
  }
  out[31]! |= signBit;
  return out;
}

function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  let result = 1n;
  base = ((base % mod) + mod) % mod;
  while (exp > 0n) {
    if (exp & 1n) result = (result * base) % mod;
    exp >>= 1n;
    base = (base * base) % mod;
  }
  return result;
}

// ─── public API ────────────────────────────────────────────────────

export interface KeyPair {
  public: Uint8Array;
  private: Uint8Array;
}

/**
 * Generate a Curve25519 key pair from a 32-byte seed.
 *
 * Public key is a Montgomery u-coordinate (sign bit cleared).
 * Private key is the clamped seed.
 */
export function generateKeyPair(seed: Uint8Array): KeyPair {
  if (seed.length !== 32) throw new Error('wrong seed length');

  const sk = clamp(new Uint8Array(seed));
  const pk = x25519.scalarMultBase(seed);

  // Clear sign bit from public key (Montgomery u-coordinate)
  pk[31]! &= 127;

  return { public: pk, private: sk };
}

/**
 * Compute an X25519 shared secret.
 */
export function sharedKey(secretKey: Uint8Array, publicKey: Uint8Array): Uint8Array {
  if (secretKey.length !== 32) throw new Error('wrong secret key length');
  if (publicKey.length !== 32) throw new Error('wrong public key length');
  return x25519.scalarMult(secretKey, publicKey);
}

/**
 * Sign a message using the Curve25519 signature scheme.
 *
 * When `optRandom` (64 bytes) is provided, a randomized nonce is used;
 * otherwise the nonce is deterministic (SHA-512 of scalar ‖ message).
 *
 * The Ed25519 sign bit of the internal Edwards public key is stored in
 * `signature[63]` so that verification can reconstruct the full key.
 */
export function sign(secretKey: Uint8Array, msg: Uint8Array, optRandom?: Uint8Array): Uint8Array {
  if (secretKey.length !== 32) throw new Error('wrong secret key length');
  if (optRandom !== undefined && optRandom.length !== 64) {
    throw new Error('wrong random data length');
  }

  // 1 ─ clamp & derive Edwards public key
  const sk = clamp(new Uint8Array(secretKey));
  const edPub = edwardsPublicKey(sk);
  const signBit = edPub[31]! & 128;

  // 2 ─ nonce derivation
  let rHash: Uint8Array;
  if (optRandom) {
    // Randomised: SHA-512(0xfe ‖ 0xff×31 ‖ sk ‖ msg ‖ rnd)
    const prefix = new Uint8Array(32);
    prefix[0] = 0xfe;
    prefix.fill(0xff, 1);
    const buf = new Uint8Array(32 + 32 + msg.length + 64);
    buf.set(prefix, 0);
    buf.set(sk, 32);
    buf.set(msg, 64);
    buf.set(optRandom, 64 + msg.length);
    rHash = sha512(buf);
  } else {
    // Deterministic: SHA-512(sk ‖ msg)
    const buf = new Uint8Array(32 + msg.length);
    buf.set(sk, 0);
    buf.set(msg, 32);
    rHash = sha512(buf);
  }

  const r = bytesToNumberLE(rHash) % L;

  // 3 ─ R = r·G
  const R = BASE.multiply(r).toBytes();

  // 4 ─ h = SHA-512(R ‖ edPub ‖ msg)
  const hBuf = new Uint8Array(32 + 32 + msg.length);
  hBuf.set(R, 0);
  hBuf.set(edPub, 32);
  hBuf.set(msg, 64);
  const h = bytesToNumberLE(sha512(hBuf)) % L;

  // 5 ─ S = (r + h·scalar) mod L
  const scalar = bytesToNumberLE(sk);
  const S = (r + h * scalar) % L;

  // 6 ─ pack signature
  const sig = new Uint8Array(64);
  sig.set(R, 0);
  sig.set(numberToBytesLE(S, 32), 32);
  sig[63]! |= signBit;

  return sig;
}

/**
 * Verify a Curve25519 signature.
 *
 * Reconstructs the Edwards public key from the Montgomery public key and
 * the sign bit embedded in the signature, then delegates to noble Ed25519.
 */
export function verify(publicKey: Uint8Array, msg: Uint8Array, signature: Uint8Array): boolean {
  if (signature.length !== 64) throw new Error('wrong signature length');
  if (publicKey.length !== 32) throw new Error('wrong public key length');

  const sig = new Uint8Array(signature);
  const sBit = sig[63]! & 128;
  sig[63]! &= 127; // strip sign bit

  const edPub = montgomeryToEdwards(publicKey, sBit);

  return ed25519.verify(sig, msg, edPub, { zip215: false });
}

// ─── default export (drop-in axlsign compat) ──────────────────────

const curve25519 = { generateKeyPair, sharedKey, sign, verify } as const;
export default curve25519;
