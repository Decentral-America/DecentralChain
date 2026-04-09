import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import { concatBytes } from '@noble/hashes/utils.js';

import { deriveKey } from './deriveKey.js';

/**
 * Encrypts `input` with an Argon2id-derived key and XChaCha20-Poly1305.
 *
 * Output format: [16-byte salt][24-byte nonce][ciphertext + 16-byte Poly1305 tag]
 *
 * RFC 9106 §3.1: 128-bit salt minimum.
 * XChaCha20 uses a 192-bit nonce — safe for random generation (no birthday bound).
 *
 * @param pepper - Optional 32-byte application secret stored separately from the vault
 *                 (see deriveKey for full pepper semantics). Must match the pepper used
 *                 in decryptSeed, or decryption will fail with an authentication error.
 */
export async function encryptSeed(
  input: Uint8Array,
  password: Uint8Array,
  pepper?: Uint8Array,
): Promise<Uint8Array> {
  const salt = randomBytes(16);
  const key = await deriveKey(password, salt, pepper);
  const nonce = randomBytes(24);

  const ciphertext = xchacha20poly1305(key, nonce).encrypt(input);

  return concatBytes(salt, nonce, ciphertext);
}
