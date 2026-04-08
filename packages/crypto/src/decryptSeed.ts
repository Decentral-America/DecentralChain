import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';

import { deriveKey } from './deriveKey.js';

/**
 * Decrypts a blob produced by `encryptSeed`.
 *
 * Expected format: [16-byte salt][24-byte nonce][ciphertext + 16-byte Poly1305 tag]
 * Throws if the password is wrong (Poly1305 authentication tag mismatch).
 */
export async function decryptSeed(input: Uint8Array, password: Uint8Array): Promise<Uint8Array> {
  const salt = input.subarray(0, 16);
  const nonce = input.subarray(16, 40);
  const ciphertext = input.subarray(40);

  const key = await deriveKey(password, salt);

  return xchacha20poly1305(key, nonce).decrypt(ciphertext);
}
