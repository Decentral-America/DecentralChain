import { describe, expect, it } from 'vitest';
import { base16Encode, base64Encode, randomBytes, stringToBytes } from '../src/crypto';

describe('crypto utilities', () => {
  describe('randomBytes', () => {
    it('returns a Uint8Array of the specified length', () => {
      const bytes = randomBytes(16);
      expect(bytes).toBeInstanceOf(Uint8Array);
      expect(bytes.length).toBe(16);
    });

    it('returns different values on successive calls', () => {
      const a = randomBytes(16);
      const b = randomBytes(16);
      expect(a).not.toEqual(b);
    });

    it('throws TypeError for non-positive length', () => {
      expect(() => randomBytes(0)).toThrow(TypeError);
      expect(() => randomBytes(-1)).toThrow(TypeError);
    });

    it('throws TypeError for non-integer length', () => {
      expect(() => randomBytes(1.5)).toThrow(TypeError);
      expect(() => randomBytes(NaN)).toThrow(TypeError);
    });
  });

  describe('base16Encode', () => {
    it('encodes bytes to lowercase hex', () => {
      const bytes = new Uint8Array([0x00, 0x0f, 0xff, 0xab]);
      expect(base16Encode(bytes)).toBe('000fffab');
    });

    it('encodes empty array to empty string', () => {
      expect(base16Encode(new Uint8Array([]))).toBe('');
    });

    it('always produces 2 chars per byte', () => {
      const bytes = new Uint8Array([1]);
      expect(base16Encode(bytes)).toBe('01');
    });
  });

  describe('base64Encode', () => {
    it('encodes bytes to base64', () => {
      // "Hello" in bytes
      const bytes = new Uint8Array([72, 101, 108, 108, 111]);
      expect(base64Encode(bytes)).toBe('SGVsbG8=');
    });

    it('encodes empty array to empty string', () => {
      expect(base64Encode(new Uint8Array([]))).toBe('');
    });
  });

  describe('stringToBytes', () => {
    it('converts ASCII strings correctly', () => {
      const bytes = stringToBytes('abc');
      expect(bytes).toEqual(new Uint8Array([97, 98, 99]));
    });

    it('converts empty string to empty array', () => {
      expect(stringToBytes('')).toEqual(new Uint8Array([]));
    });

    it('handles Unicode strings', () => {
      const bytes = stringToBytes('é');
      // é = U+00E9 → UTF-8: 0xC3, 0xA9
      expect(bytes).toEqual(new Uint8Array([0xc3, 0xa9]));
    });
  });
});
