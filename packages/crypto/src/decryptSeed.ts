import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';

import { deriveKey } from './deriveKey.js';

const SALT_LENGTH = 32;
const NONCE_LENGTH = 24;
/** 32 (salt) + 24 (nonce) + 16 (Poly1305 tag) = 72-byte minimum. */
const DECRYPT_SEED_MIN = SALT_LENGTH + NONCE_LENGTH + 16;

/**
 * Decrypts a blob produced by `encryptSeed`.
 *
 * Expected format: [32-byte salt][24-byte nonce][ciphertext + 16-byte Poly1305 tag]
 * Throws if the password is wrong or the pepper does not match (Poly1305 auth tag mismatch).
 *
 * @param pepper - Must be the same optional pepper passed to `encryptSeed`.
 */
export async function decryptSeed(
  input: Uint8Array,
  password: Uint8Array,
  pepper?: Uint8Array,
): Promise<Uint8Array> {
  if (input.length < DECRYPT_SEED_MIN) {
    throw new Error('decryptSeed: input too short');
  }
  const salt = input.subarray(0, SALT_LENGTH);
  const nonce = input.subarray(SALT_LENGTH, SALT_LENGTH + NONCE_LENGTH);
  const ciphertext = input.subarray(SALT_LENGTH + NONCE_LENGTH);

  const key = await deriveKey(password, salt, pepper);

  return xchacha20poly1305(key, nonce).decrypt(ciphertext);
}
