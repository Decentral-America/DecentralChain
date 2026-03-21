/**
 * Derives a 256-bit AES-GCM CryptoKey from a password and salt using
 * PBKDF2-SHA-256 with 600,000 iterations (NIST SP 800-132 §5.3 minimum).
 *
 * @param password - UTF-8 encoded password bytes
 * @param salt     - 16-byte random salt (NIST minimum: 128 bits)
 * @returns        - Extractable AES-GCM-256 CryptoKey for encrypt/decrypt
 */
export async function deriveSeedEncryptionKey(
  password: Uint8Array,
  salt: Uint8Array,
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey(
    'raw',
    password as Uint8Array<ArrayBuffer>,
    'PBKDF2',
    false,
    ['deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      hash: 'SHA-256',
      iterations: 600_000,
      name: 'PBKDF2',
      salt: salt as Uint8Array<ArrayBuffer>,
    },
    baseKey,
    { length: 256, name: 'AES-GCM' },
    true, // extractable: required for session key storage (C-3)
    ['encrypt', 'decrypt'],
  );
}
