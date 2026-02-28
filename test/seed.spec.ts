import { describe, expect, test } from 'vitest';
import { Seed } from '../src/extensions/seed';

const SEED_PHRASE = 'bullet proof test seed alpha';

describe('Seed', () => {
  describe('isSeedWithNonce', () => {
    test('returns false for a plain string seed', () => {
      expect(Seed.isSeedWithNonce(SEED_PHRASE)).toBe(false);
    });

    test('returns false for a Uint8Array seed', () => {
      expect(Seed.isSeedWithNonce(new Uint8Array([1, 2, 3]))).toBe(false);
    });

    test('returns true for a seed-with-nonce object', () => {
      expect(Seed.isSeedWithNonce({ seed: SEED_PHRASE, nonce: 0 })).toBe(true);
      expect(Seed.isSeedWithNonce({ seed: SEED_PHRASE, nonce: 42 })).toBe(true);
    });
  });

  describe('toBinary', () => {
    test('converts string seed to INonceSeed with Uint8Array', () => {
      const result = Seed.toBinary(SEED_PHRASE);
      expect(result.seed).toBeInstanceOf(Uint8Array);
      expect(result.seed.length).toBeGreaterThan(0);
      expect(result.nonce).toBeUndefined();
    });

    test('converts Uint8Array seed to INonceSeed', () => {
      const bytes = new Uint8Array([10, 20, 30]);
      const result = Seed.toBinary(bytes);
      expect(result.seed).toBeInstanceOf(Uint8Array);
      expect(result.seed).toEqual(bytes);
      expect(result.nonce).toBeUndefined();
    });

    test('converts nonce seed to binary preserving nonce', () => {
      const result = Seed.toBinary({ seed: SEED_PHRASE, nonce: 5 });
      expect(result.seed).toBeInstanceOf(Uint8Array);
      expect(result.nonce).toBe(5);
    });

    test('produces deterministic output', () => {
      const a = Seed.toBinary(SEED_PHRASE);
      const b = Seed.toBinary(SEED_PHRASE);
      expect(a.seed).toEqual(b.seed);
    });

    test('handles empty string seed', () => {
      const result = Seed.toBinary('');
      expect(result.seed).toBeInstanceOf(Uint8Array);
      expect(result.seed.length).toBe(0);
    });
  });
});
