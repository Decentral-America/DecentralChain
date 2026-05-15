import { describe, expect, it } from 'vitest';
import {
  base58Encode,
  bytesToAscii,
  bytesToHex,
  concatBytes,
  uint32ToBytesBE,
} from '../src/utils.js';

describe('base58Encode', () => {
  it('returns empty string for empty buffer', () => {
    expect(base58Encode(new Uint8Array([]))).toBe('');
  });

  it('encodes a single zero byte as "1"', () => {
    expect(base58Encode(new Uint8Array([0]))).toBe('1');
  });

  it('encodes leading zeros correctly', () => {
    // Two leading zero bytes → two "1" characters
    expect(base58Encode(new Uint8Array([0, 0, 1]))).toBe('112');
  });

  it('encodes a known byte sequence', () => {
    // "Hello" in ASCII is [72, 101, 108, 108, 111]
    const hello = new Uint8Array([72, 101, 108, 108, 111]);
    const encoded = base58Encode(hello);
    expect(encoded).toBe('9Ajdvzr');
  });

  it('encodes all-zero buffer as all-ones', () => {
    expect(base58Encode(new Uint8Array([0, 0, 0]))).toBe('111');
  });

  it('encodes a single non-zero byte', () => {
    expect(base58Encode(new Uint8Array([1]))).toBe('2');
    expect(base58Encode(new Uint8Array([57]))).toBe('z');
  });

  it('encodes 0xFF correctly', () => {
    expect(base58Encode(new Uint8Array([255]))).toBe('5Q');
  });
});

describe('concatBytes', () => {
  it('returns empty array when given no arguments', () => {
    const result = concatBytes();
    expect(result).toEqual(new Uint8Array([]));
    expect(result.length).toBe(0);
  });

  it('concatenates a single array', () => {
    const a = new Uint8Array([1, 2, 3]);
    expect(concatBytes(a)).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('concatenates multiple arrays', () => {
    const a = new Uint8Array([1, 2]);
    const b = new Uint8Array([3]);
    const c = new Uint8Array([4, 5, 6]);
    expect(concatBytes(a, b, c)).toEqual(new Uint8Array([1, 2, 3, 4, 5, 6]));
  });

  it('handles empty arrays in the mix', () => {
    const a = new Uint8Array([1]);
    const b = new Uint8Array([]);
    const c = new Uint8Array([2]);
    expect(concatBytes(a, b, c)).toEqual(new Uint8Array([1, 2]));
  });
});

describe('uint32ToBytesBE', () => {
  it('encodes zero', () => {
    expect(uint32ToBytesBE(0)).toEqual(new Uint8Array([0, 0, 0, 0]));
  });

  it('encodes one', () => {
    expect(uint32ToBytesBE(1)).toEqual(new Uint8Array([0, 0, 0, 1]));
  });

  it('encodes 256', () => {
    expect(uint32ToBytesBE(256)).toEqual(new Uint8Array([0, 0, 1, 0]));
  });

  it('encodes max uint32', () => {
    expect(uint32ToBytesBE(0xffffffff)).toEqual(new Uint8Array([255, 255, 255, 255]));
  });

  it('encodes 0x01020304 in big-endian order', () => {
    expect(uint32ToBytesBE(0x01020304)).toEqual(new Uint8Array([1, 2, 3, 4]));
  });

  it('throws RangeError on negative value', () => {
    expect(() => uint32ToBytesBE(-1)).toThrow(RangeError);
  });

  it('throws RangeError on value exceeding uint32', () => {
    expect(() => uint32ToBytesBE(0x100000000)).toThrow(RangeError);
  });

  it('throws RangeError on non-integer', () => {
    expect(() => uint32ToBytesBE(1.5)).toThrow(RangeError);
  });

  it('throws RangeError on NaN', () => {
    expect(() => uint32ToBytesBE(NaN)).toThrow(RangeError);
  });
});

describe('bytesToAscii', () => {
  it('converts ASCII bytes to string', () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]);
    expect(bytesToAscii(bytes)).toBe('Hello');
  });

  it('returns empty string for empty input', () => {
    expect(bytesToAscii(new Uint8Array([]))).toBe('');
  });

  it('converts single byte', () => {
    expect(bytesToAscii(new Uint8Array([65]))).toBe('A');
  });

  it('throws RangeError on non-ASCII byte (0x80)', () => {
    expect(() => bytesToAscii(new Uint8Array([0x80]))).toThrow(RangeError);
    expect(() => bytesToAscii(new Uint8Array([0x80]))).toThrow('non-ASCII byte');
  });

  it('throws RangeError on 0xFF byte', () => {
    expect(() => bytesToAscii(new Uint8Array([65, 255, 66]))).toThrow(RangeError);
  });

  it('accepts all valid ASCII bytes (0x00-0x7F)', () => {
    const allAscii = new Uint8Array(128);
    for (let i = 0; i < 128; i++) allAscii[i] = i;
    expect(() => bytesToAscii(allAscii)).not.toThrow();
  });
});

describe('bytesToHex', () => {
  it('converts bytes to hex string', () => {
    expect(bytesToHex(new Uint8Array([0x90, 0x00]))).toBe('9000');
  });

  it('returns empty string for empty input', () => {
    expect(bytesToHex(new Uint8Array([]))).toBe('');
  });

  it('pads single-digit hex values', () => {
    expect(bytesToHex(new Uint8Array([0x0a]))).toBe('0a');
  });

  it('converts all zeros', () => {
    expect(bytesToHex(new Uint8Array([0, 0]))).toBe('0000');
  });

  it('converts 0xFF', () => {
    expect(bytesToHex(new Uint8Array([0xff]))).toBe('ff');
  });
});
