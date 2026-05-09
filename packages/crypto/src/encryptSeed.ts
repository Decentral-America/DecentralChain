import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import { concatBytes } from '@noble/hashes/utils.js';

import { deriveKey } from './deriveKey.js';

const SALT_LENGTH = 32;
const NONCE_LENGTH = 24;

/**
 * Encrypts `input` with an Argon2id-derived key and XChaCha20-Poly1305.
 *
 * Output format: [32-byte salt][24-byte nonce][ciphertext + 16-byte Poly1305 tag]
 *
 * XChaCha20-Poly1305 is the DCC standard cipher:
 * - Fast in pure software (no AES-NI hardware dependency)
 * - 192-bit nonce — eliminates birthday bound concerns for random nonce generation
 * - Matches node-go (chacha20poly1305.NewX) and node-scala (XChaCha20Poly1305 via BC)
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
  const salt = randomBytes(SALT_LENGTH);
  const key = await deriveKey(password, salt, pepper);
  const nonce = randomBytes(NONCE_LENGTH);

  const ciphertext = xchacha20poly1305(key, nonce).encrypt(input);

  return concatBytes(salt, nonce, ciphertext);
}
