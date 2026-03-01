import { bytesToString, stringToBytes } from '../src/conversions/string-bytes';
import { describe, expect, test } from 'vitest';

describe('stringToBytes / bytesToString', () => {
  test('correctly encode and decode utf-8 strings', () => {
    const latinStr = 'decentralchain';
    const ruStr = 'платформа децентралчейн';
    const emStr = '🏂По снегу';

    expect(bytesToString(stringToBytes(latinStr))).toEqual(latinStr);
    expect(bytesToString(stringToBytes(ruStr))).toEqual(ruStr);
    expect(bytesToString(stringToBytes(emStr))).toEqual(emStr);
  });

  test('stringToBytes with raw encoding', () => {
    const raw = 'hello';
    const bytes = stringToBytes(raw, 'raw');
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(Array.from(bytes)).toEqual([104, 101, 108, 108, 111]);
  });

  test('bytesToString with raw encoding', () => {
    const bytes = Uint8Array.from([104, 101, 108, 108, 111]);
    expect(bytesToString(bytes, 'raw')).toBe('hello');
  });

  test('raw encoding roundtrip', () => {
    const str = 'decentralchain';
    expect(bytesToString(stringToBytes(str, 'raw'), 'raw')).toEqual(str);
  });

  test('bytesToString accepts number[] input', () => {
    const arr = [104, 101, 108, 108, 111];
    expect(bytesToString(arr)).toBe('hello');
  });

  test('bytesToString accepts number[] with raw encoding', () => {
    const arr = [72, 105];
    expect(bytesToString(arr, 'raw')).toBe('Hi');
  });

  test('handles empty string', () => {
    const bytes = stringToBytes('');
    expect(bytes).toHaveLength(0);
    expect(bytesToString(bytes)).toBe('');
  });

  test('handles empty string with raw encoding', () => {
    const bytes = stringToBytes('', 'raw');
    expect(bytes).toHaveLength(0);
    expect(bytesToString(bytes, 'raw')).toBe('');
  });
});
