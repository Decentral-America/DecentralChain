import { gcm } from '@noble/ciphers/aes.js';

import { deriveKey } from './deriveKey.js';

const SALT_LENGTH = 32;
const NONCE_LENGTH = 12;
/** 32 (salt) + 12 (nonce) + 16 (GCM tag) = 60-byte minimum. */
const DECRYPT_SEED_MIN = SALT_LENGTH + NONCE_LENGTH + 16;

/**
 * Decrypts a blob produced by `encryptSeed`.
 *
 * Expected format: [32-byte salt][12-byte nonce][ciphertext + 16-byte GCM tag]
 * Throws if the password is wrong or the pepper does not match (GCM auth tag mismatch).
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

  return gcm(key, nonce).decrypt(ciphertext);
}
