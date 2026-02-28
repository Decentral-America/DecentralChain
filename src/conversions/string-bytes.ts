import { type TBytes, type TBinaryIn } from '../crypto/interface';
import { _fromIn } from './param';
import { utf8ArrayToStr, strToUtf8Array } from '../libs/Utf8';

/** Convert a string to bytes using the specified encoding (default: UTF-8). */
export const stringToBytes = (str: string, encoding: 'utf8' | 'raw' = 'utf8'): TBytes => {
  if (encoding === 'utf8') {
    return strToUtf8Array(str);
  } else if (encoding === 'raw') {
    return Uint8Array.from([...str].map((c) => c.charCodeAt(0)));
  } else {
    throw new Error(`Unsupported encoding ${encoding}`);
  }
};

/** Convert bytes to a string using the specified encoding (default: UTF-8). */
export const bytesToString = (bytes: TBinaryIn, encoding: 'utf8' | 'raw' = 'utf8'): string => {
  if (encoding === 'utf8') {
    return utf8ArrayToStr(_fromIn(bytes));
  } else if (encoding === 'raw') {
    return Array.from(_fromIn(bytes))
      .map((byte) => String.fromCharCode(byte))
      .join('');
  } else {
    throw new Error(`Unsupported encoding ${encoding}`);
  }
};

/**
 * Converts each character to byte
 */
/** Convert a raw binary string to bytes (each char code becomes one byte). */
export const binaryStringToBytes = (str: string): TBytes =>
  Uint8Array.from([...str].map((c) => c.charCodeAt(0)));

/**
 * Reads each byte as individual character
 */
/** Convert bytes to a raw binary string (each byte becomes one char code). */
export const bytesToBinaryString = (bytes: TBinaryIn): string =>
  Array.from(_fromIn(bytes))
    .map((byte) => String.fromCharCode(byte))
    .join('');
