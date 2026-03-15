/**
 * Shared Web Crypto API utilities for AES-256-GCM encryption
 *
 * Uses PBKDF2 with 600,000 iterations (OWASP 2024 recommendation)
 * and AES-256-GCM for authenticated encryption.
 *
 * Wire format: base64( salt[16] || iv[12] || ciphertext || authTag[16] )
 */

const PBKDF2_ITERATIONS = 600_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Derive an AES-256-GCM CryptoKey from a password using PBKDF2-SHA256
 */
export const deriveKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey'],
  );

  return crypto.subtle.deriveKey(
    {
      hash: 'SHA-256',
      iterations: PBKDF2_ITERATIONS,
      name: 'PBKDF2',
      salt: salt as BufferSource,
    },
    keyMaterial,
    { length: 256, name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
};

/**
 * Encrypt a plaintext string with AES-256-GCM using a password.
 * Returns a base64-encoded string containing salt + IV + ciphertext + auth tag.
 */
export const encryptString = async (plaintext: string, password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);

  const encrypted = await crypto.subtle.encrypt({ iv, name: 'AES-GCM' }, key, data);

  // Combine: salt(16) + iv(12) + ciphertext+authTag
  const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, SALT_LENGTH);
  combined.set(new Uint8Array(encrypted), SALT_LENGTH + IV_LENGTH);

  return btoa(String.fromCharCode(...combined));
};

/**
 * Decrypt an AES-256-GCM encrypted string produced by encryptString().
 * Throws on wrong password or tampered data.
 */
export const decryptString = async (encryptedBase64: string, password: string): Promise<string> => {
  try {
    const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));

    const salt = combined.slice(0, SALT_LENGTH);
    const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = combined.slice(SALT_LENGTH + IV_LENGTH);

    const key = await deriveKey(password, salt);

    const decrypted = await crypto.subtle.decrypt({ iv, name: 'AES-GCM' }, key, ciphertext);

    return new TextDecoder().decode(decrypted);
  } catch {
    throw new Error('Decryption failed — wrong password or corrupted data');
  }
};
