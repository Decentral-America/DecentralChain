import { type TBinaryIn, type TBytes } from '../crypto/interface';
import { strToUtf8Array, utf8ArrayToStr } from '../libs/Utf8';
import { _fromIn } from './param';

/** Convert a string to bytes using the specified encoding (default: UTF-8). */
export const stringToBytes = (str: string, encoding: 'utf8' | 'raw' = 'utf8'): TBytes => {
  if (encoding === 'utf8') {
    return strToUtf8Array(str);
  }
  return Uint8Array.from([...str].map((c) => c.charCodeAt(0)));
};

/** Convert bytes to a string using the specified encoding (default: UTF-8). */
export const bytesToString = (bytes: TBinaryIn, encoding: 'utf8' | 'raw' = 'utf8'): string => {
  if (encoding === 'utf8') {
    return utf8ArrayToStr(_fromIn(bytes));
  }
  return Array.from(_fromIn(bytes))
    .map((byte) => String.fromCharCode(byte))
    .join('');
};
