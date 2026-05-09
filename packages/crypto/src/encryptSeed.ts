import { gcm } from '@noble/ciphers/aes.js';
import { randomBytes } from '@noble/ciphers/utils.js';
import { concatBytes } from '@noble/hashes/utils.js';

import { deriveKey } from './deriveKey.js';

const SALT_LENGTH = 32;
const NONCE_LENGTH = 12;

/**
 * Encrypts `input` with an Argon2id-derived key and AES-256-GCM.
 *
 * Output format: [32-byte salt][12-byte nonce][ciphertext + 16-byte GCM tag]
 *
 * Matches node-go (pkg/wallet/crypt.go) and node-scala (JsonFileStorage).
 * Consistent blob format across the entire DCC ecosystem.
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

  const ciphertext = gcm(key, nonce).encrypt(input);

  return concatBytes(salt, nonce, ciphertext);
}
