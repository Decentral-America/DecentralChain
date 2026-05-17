import { concatBytes } from '@noble/hashes/utils.js';

import { initWasm } from './initWasm.js';

/**
 * Derives a 32-byte key from a password and salt using Argon2id (RFC 9106 v0x13)
 * with high-security parameters executed in WASM:
 *   m = 65 536 KiB (64 MiB), t = 4 iterations, p = 4 lanes.
 *
 * Matches node-go (pkg/wallet/crypt.go) and node-scala (JsonFileStorage).
 * All wallet encryption across the DCC ecosystem uses identical KDF parameters.
 *
 * @param password - UTF-8 encoded password bytes
 * @param salt     - Random 32-byte random salt (256-bit entropy).
 *                   encryptSeed() generates 32-byte salts.
 * @param pepper   - Optional 32-byte application secret stored separately from the
 *                   vault. Prepended to password before hashing: Argon2id(pepper‖password, salt).
 *                   Eliminates offline cracking if the attacker obtains only the vault
 *                   blob without the pepper. OWASP password storage §pepper.
 *                   Legacy callers (no pepper) derive the same key as before.
 * @returns        - 32-byte raw key material (Uint8Array)
 */
export async function deriveKey(
  password: Uint8Array,
  salt: Uint8Array,
  pepper?: Uint8Array,
): Promise<Uint8Array> {
  const input = pepper != null ? concatBytes(pepper, password) : password;
  const wasm = await initWasm();
  return new Uint8Array(wasm.derive_key(input, salt, 32));
}
