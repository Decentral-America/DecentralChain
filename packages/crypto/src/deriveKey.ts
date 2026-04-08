import { initWasm } from './initWasm.js';

/**
 * Derives a 32-byte key from a password and salt using Argon2id (RFC 9106 v0x13)
 * with OWASP 2024 interactive-minimum parameters executed in WASM:
 *   m = 19 456 KiB (19 MiB), t = 2 iterations, p = 1 lane.
 *
 * Replaces PBKDF2-SHA-256 (deriveSeedEncryptionKey) — Argon2id is memory-hard
 * and GPU-resistant whereas PBKDF2 is purely time-hard.
 *
 * @param password - UTF-8 encoded password bytes
 * @param salt     - 16-byte random salt (128-bit minimum per RFC 9106 §3.1)
 * @returns        - 32-byte raw key material (Uint8Array)
 */
export async function deriveKey(password: Uint8Array, salt: Uint8Array): Promise<Uint8Array> {
  const wasm = await initWasm();
  return new Uint8Array(wasm.derive_key(password, salt, 32));
}
