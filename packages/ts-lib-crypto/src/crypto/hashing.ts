import { type TBinaryIn, type TBytes } from './interface';
import { _fromIn } from '../conversions/param';
import { sha256 as nobleSha256 } from '@noble/hashes/sha2.js';
import { blake2b as nobleBlake2b } from '@noble/hashes/blake2.js';
import { keccak_256 } from '@noble/hashes/sha3.js';
import { hmac } from '@noble/hashes/hmac.js';

/** Hash chain: keccak(blake2b(input)). Used internally for address derivation. */
export const _hashChain = (input: TBinaryIn): TBytes => keccak(blake2b(_fromIn(input)));

/** Compute SHA-256 hash of the input. */
export const sha256 = (input: TBinaryIn): TBytes => nobleSha256(_fromIn(input));

/** Compute BLAKE2b-256 hash of the input. */
export const blake2b = (input: TBinaryIn): TBytes => nobleBlake2b(_fromIn(input), { dkLen: 32 });

/** Compute Keccak-256 hash of the input. */
export const keccak = (input: TBinaryIn): TBytes => keccak_256(_fromIn(input));

/** Compute HMAC-SHA-256 of a message with the given key. */
export const hmacSHA256 = (message: TBinaryIn, key: TBinaryIn): TBytes =>
  hmac(nobleSha256, _fromIn(key), _fromIn(message));
