import { describe, expect, it } from 'vitest';
import { random, randomBytes, randomSeed } from '../src/crypto/random';

describe('random', () => {
  describe('typed output', () => {
    it('returns a number[] for Array8', () => {
      const result = random(8, 'Array8');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(8);
      result.forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(255);
      });
    });

    it('returns a number[] for Array16', () => {
      const result = random(4, 'Array16');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(4);
      result.forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(0xffff);
      });
    });

    it('returns a number[] for Array32', () => {
      const result = random(4, 'Array32');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(4);
      result.forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(0xffffffff);
      });
    });

    it('returns a Buffer for Buffer type', () => {
      const result = random(16, 'Buffer');
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result).toHaveLength(16);
    });

    it('returns a Uint8Array for Uint8Array type', () => {
      const result = random(12, 'Uint8Array');
      expect(result).toBeInstanceOf(Uint8Array);
      expect(result).toHaveLength(12);
    });

    it('returns a Uint16Array for Uint16Array type', () => {
      const result = random(6, 'Uint16Array');
      expect(result).toBeInstanceOf(Uint16Array);
      expect(result).toHaveLength(6);
      Array.from(result).forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(0xffff);
      });
    });

    it('returns a Uint32Array for Uint32Array type', () => {
      const result = random(6, 'Uint32Array');
      expect(result).toBeInstanceOf(Uint32Array);
      expect(result).toHaveLength(6);
      Array.from(result).forEach((v) => {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(0xffffffff);
      });
    });
  });

  describe('error handling', () => {
    it('throws TypeError for unsupported type', () => {
      expect(() => random(4, 'InvalidType' as any)).toThrow(TypeError);
      expect(() => random(4, 'InvalidType' as any)).toThrow(/Unsupported random type/);
    });
  });
});

describe('randomBytes', () => {
  it('returns Uint8Array of the requested length', () => {
    const result = randomBytes(32);
    expect(result).toBeInstanceOf(Uint8Array);
    expect(result).toHaveLength(32);
  });

  it('returns different values on successive calls', () => {
    const a = randomBytes(32);
    const b = randomBytes(32);
    // Extremely unlikely to be equal
    expect(a).not.toEqual(b);
  });
});

describe('randomSeed', () => {
  it('generates a 15-word seed by default', () => {
    const seed = randomSeed();
    const words = seed.split(' ');
    expect(words).toHaveLength(15);
    words.forEach((w) => expect(w.length).toBeGreaterThan(0));
  });

  it('generates a seed with custom word count', () => {
    const seed = randomSeed(12);
    expect(seed.split(' ')).toHaveLength(12);
  });

  it('generates different seeds on successive calls', () => {
    const a = randomSeed();
    const b = randomSeed();
    expect(a).not.toEqual(b);
  });
});
