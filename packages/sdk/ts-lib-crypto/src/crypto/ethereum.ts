// ethereum.ts
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { _fromIn } from '../conversions/param';
import { keccak } from './hashing';
import { type TBinaryIn, type TEthKeyPair, type TEthSignature } from './interface';

/**
 * Generate a fresh secp256k1 key pair, or re-derive the public key from a
 * given private key. Used for Ethereum-format (Type 18 / EIP-155)
 * transaction signing — a different curve from DecentralChain's native
 * Ed25519/Curve25519 keys, so this returns raw bytes only (no Base58
 * wrapping, matching the blsKeyPair/blsPublicKey convention).
 *
 * The public key is the raw 64-byte uncompressed point (no leading 0x04
 * marker byte) — the format the node expects for Ethereum-style address
 * derivation (`keccak256(publicKey).slice(-20)`).
 */
export const ethereumKeyPair = (privateKey?: TBinaryIn): TEthKeyPair => {
  // keygen()'s own `publicKey` field is always COMPRESSED (33 bytes: a
  // marker byte + the X coordinate only) — there is no option to request
  // the uncompressed form directly. Using it as-is here would silently
  // produce a 32-byte X-coordinate-only value instead of the real 64-byte
  // uncompressed key, corrupting every address derived from it. Always
  // derive the public key explicitly via getPublicKey(secretKey, false),
  // the same call the given-privateKey branch below uses, so both paths
  // are provably consistent rather than relying on keygen()'s own field.
  const ethPrivateKey = privateKey != null ? _fromIn(privateKey) : secp256k1.keygen().secretKey;
  return { ethPrivateKey, ethPublicKey: secp256k1.getPublicKey(ethPrivateKey, false).slice(1) };
};

/**
 * Sign a message with a secp256k1 private key using Ethereum's
 * keccak256-then-ECDSA scheme (canonical low-S form per EIP-2 — the noble
 * library's `lowS: true` default, never disabled here). `message` is
 * typically an RLP-encoded, not-yet-hashed transaction payload; this
 * function hashes it internally so callers can never accidentally
 * double-hash or forget to hash before signing.
 */
export const ethereumSign = (privateKey: TBinaryIn, message: TBinaryIn): TEthSignature => {
  const digest = keccak(_fromIn(message));
  const sig = secp256k1.sign(digest, _fromIn(privateKey), { format: 'recovered', prehash: false });
  const parsed = secp256k1.Signature.fromBytes(sig, 'recovered');
  return { r: parsed.r, recovery: parsed.recovery ?? 0, s: parsed.s };
};
