import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { utf8ToBytes } from '@noble/hashes/utils.js';

import { initWasm } from './initWasm.js';

/** DCC HKDF domain separator — hardcoded to prevent domain confusion. */
const DCC_INFO = utf8ToBytes('decentralchain');

/**
 * Derives a 32-byte shared key via X25519 DH exchange + HKDF-SHA256.
 *
 * The HKDF info parameter is hardcoded to the DCC domain separator
 * "decentralchain" — eliminates the old free-form `prefix` parameter
 * which carried domain-confusion risk.
 *
 * RFC 5869: HKDF with SHA-256.
 */
export async function createSharedKey(
  privateKeyFrom: Uint8Array,
  publicKeyTo: Uint8Array,
): Promise<Uint8Array> {
  const wasm = await initWasm();
  const rawShared = new Uint8Array(wasm.create_shared_key(privateKeyFrom, publicKeyTo));
  return hkdf(sha256, rawShared, undefined, DCC_INFO, 32);
}
