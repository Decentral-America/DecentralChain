import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';

/**
 * Decrypts a blob produced by `encryptMessage`.
 *
 * Expected format: [24-byte nonce][ciphertext + 16-byte Poly1305 tag]
 * Throws if the Poly1305 authentication tag is invalid (wrong key or tampered data).
 * Synchronous — noble-ciphers performs no async I/O.
 */
export function decryptMessage(sharedKey: Uint8Array, input: Uint8Array): Uint8Array {
  const nonce = input.subarray(0, 24);
  const ciphertext = input.subarray(24);
  return xchacha20poly1305(sharedKey, nonce).decrypt(ciphertext);
}
