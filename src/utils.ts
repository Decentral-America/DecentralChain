/**
 * Byte-level utility functions for the Ledger integration.
 *
 * All helpers operate on standard `Uint8Array` — no Node.js `Buffer` dependency.
 *
 * @module utils
 */

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

/**
 * Encode a byte array into a Base58 string.
 *
 * Uses the standard Bitcoin alphabet (no check digits).
 *
 * @param buffer - The bytes to encode.
 * @returns The Base58-encoded string, or `''` for an empty buffer.
 */
export function base58Encode(buffer: Uint8Array): string {
  if (buffer.length === 0) return '';

  const digits = [0];

  for (const byte of buffer) {
    for (let j = 0; j < digits.length; j++) {
      digits[j] = (digits[j] ?? 0) << 8;
    }

    digits[0] = (digits[0] ?? 0) + byte;
    let carry = 0;

    for (let k = 0; k < digits.length; k++) {
      const val = (digits[k] ?? 0) + carry;
      carry = (val / 58) | 0;
      digits[k] = val % 58;
    }

    while (carry) {
      digits.push(carry % 58);
      carry = (carry / 58) | 0;
    }
  }

  for (let i = 0; buffer[i] === 0 && i < buffer.length - 1; i++) {
    digits.push(0);
  }

  return digits
    .reverse()
    .map((digit) => ALPHABET[digit] ?? '')
    .join('');
}

/**
 * Concatenate multiple `Uint8Array` instances into one.
 *
 * @param arrays - Arrays to concatenate.
 * @returns A new `Uint8Array` containing all bytes in order.
 */
export function concatBytes(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * Encode a 32-bit unsigned integer as 4 big-endian bytes.
 *
 * @param value - Integer to encode (0 – 0xFFFFFFFF).
 * @returns A 4-byte `Uint8Array` in big-endian order.
 * @throws {RangeError} If `value` is not an integer in [0, 0xFFFFFFFF].
 */
export function uint32ToBytesBE(value: number): Uint8Array {
  if (!Number.isInteger(value) || value < 0 || value > 0xffffffff) {
    throw new RangeError(
      `uint32ToBytesBE: value must be an integer in [0, 4294967295], got ${String(value)}`,
    );
  }
  const buf = new ArrayBuffer(4);
  new DataView(buf).setUint32(0, value, false);
  return new Uint8Array(buf);
}

/**
 * Decode a `Uint8Array` of ASCII code points to a string.
 *
 * @param bytes - ASCII byte values (0x00–0x7F).
 * @returns The decoded string.
 * @throws {RangeError} If any byte is outside the ASCII range (0x00–0x7F).
 */
export function bytesToAscii(bytes: Uint8Array): string {
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b !== undefined && b > 0x7f) {
      throw new RangeError(
        `bytesToAscii: non-ASCII byte 0x${b.toString(16).padStart(2, '0')} at index ${String(i)}`,
      );
    }
  }
  return String.fromCharCode(...bytes);
}

/**
 * Encode a `Uint8Array` as a lowercase hexadecimal string.
 *
 * @param bytes - Bytes to encode.
 * @returns Hex string (e.g. `"9000"`).
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
