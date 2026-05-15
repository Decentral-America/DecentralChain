/**
 * @module @decentralchain/cubensis-connect-provider
 *
 * Lightweight cryptographic utilities using native Web Crypto API.
 * Uses native Web Crypto API (available in all modern browsers and Node.js 22+).
 */

/**
 * Generates cryptographically secure random bytes.
 *
 * @param length - Number of random bytes to generate
 * @returns A Uint8Array of the specified length filled with random bytes
 * @throws {TypeError} If length is not a positive integer
 */
export function randomBytes(length: number): Uint8Array {
  if (!Number.isInteger(length) || length <= 0) {
    throw new TypeError(`Expected a positive integer for length, received: ${String(length)}`);
  }
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Encodes a byte array to a hexadecimal (base16) string.
 *
 * @param bytes - The bytes to encode
 * @returns Lowercase hexadecimal string representation
 */
export function base16Encode(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encodes a byte array to a base64 string.
 *
 * @param bytes - The bytes to encode
 * @returns Base64-encoded string
 */
export function base64Encode(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * Converts a UTF-8 string to a Uint8Array.
 *
 * @param str - The string to convert
 * @returns Uint8Array of UTF-8 encoded bytes
 */
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}
