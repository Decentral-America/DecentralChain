import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';

import { deriveKey } from './deriveKey.js';

/**
 * Decrypts a blob produced by `encryptSeed`.
 *
 * Expected format: [16-byte salt][24-byte nonce][ciphertext + 16-byte Poly1305 tag]
 * Throws if the password is wrong or the pepper does not match (Poly1305 auth tag mismatch).
 *
 * @param pepper - Must be the same optional pepper passed to `encryptSeed`.
 */
/** 16 (salt) + 24 (nonce) + 16 (Poly1305 tag) = 56-byte minimum. */
const DECRYPT_SEED_MIN = 56;

export async function decryptSeed(
  input: Uint8Array,
  password: Uint8Array,
  pepper?: Uint8Array,
): Promise<Uint8Array> {
  if (input.length < DECRYPT_SEED_MIN) {
    throw new Error('decryptSeed: input too short');
  }
  const salt = input.subarray(0, 16);
  const nonce = input.subarray(16, 40);
  const ciphertext = input.subarray(40);

  const key = await deriveKey(password, salt, pepper);

  return xchacha20poly1305(key, nonce).decrypt(ciphertext);
}
