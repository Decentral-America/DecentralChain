import { concatBytes } from '@noble/hashes/utils.js';

import { initWasm } from './initWasm.js';

/**
 * Derives a 32-byte key from a password and salt using Argon2id (RFC 9106 v0x13)
 * with OWASP interactive-minimum parameters executed in WASM:
 *   m = 19 456 KiB (19 MiB), t = 2 iterations, p = 1 lane.
 *
 * Replaces PBKDF2-SHA-256 (deriveSeedEncryptionKey) — Argon2id is memory-hard
 * and GPU-resistant whereas PBKDF2 is purely time-hard.
 *
 * @param password - UTF-8 encoded password bytes
 * @param salt     - Random salt; RFC 9106 §3.1 minimum is 128-bit (16 bytes).
 *                   Recommended 32 bytes for 256-bit entropy.
 *                   encryptSeed() uses 16-byte salts (valid minimum);
 *                   WalletController uses 32-byte salts (recommended).
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
