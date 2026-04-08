import { xchacha20poly1305 } from '@noble/ciphers/chacha.js';
import { randomBytes } from '@noble/ciphers/utils.js';

/**
 * Encrypts `message` with a shared key using XChaCha20-Poly1305 (AEAD).
 *
 * Output format: [24-byte nonce][ciphertext + 16-byte Poly1305 tag]
 *
 * Replaces the bespoke AES-ECB CEK-wrap + AES-CTR + double-HMAC construction.
 * Synchronous — noble-ciphers performs no async I/O.
 */
export function encryptMessage(sharedKey: Uint8Array, message: Uint8Array): Uint8Array {
  const nonce = randomBytes(24);
  const ciphertext = xchacha20poly1305(sharedKey, nonce).encrypt(message);
  return Uint8Array.of(...nonce, ...ciphertext);
}
