import { deriveSeedEncryptionKey } from './deriveSeedEncryptionKey.js';

/**
 * Encrypts `input` with a PBKDF2-SHA-256 derived key (600k iterations) and AES-GCM-256.
 *
 * Output format: [16-byte salt][12-byte nonce][ciphertext + 16-byte GCM auth tag]
 *
 * NIST SP 800-38D: AES-GCM with 96-bit (12-byte) random IV.
 * NIST SP 800-132: 128-bit (16-byte) minimum salt.
 */
export async function encryptSeed(input: Uint8Array, password: Uint8Array): Promise<Uint8Array> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveSeedEncryptionKey(password, salt);
  const nonce = crypto.getRandomValues(new Uint8Array(12));

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { iv: nonce as Uint8Array<ArrayBuffer>, name: 'AES-GCM' },
      key,
      input as Uint8Array<ArrayBuffer>,
    ),
  );

  return Uint8Array.of(...salt, ...nonce, ...ciphertext);
}
