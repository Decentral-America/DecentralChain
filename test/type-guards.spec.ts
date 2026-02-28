import { describe, expect, test } from 'vitest';
import { isPublicKey, isPrivateKey } from '../src/crypto/util';

describe('isPublicKey', () => {
  test('returns true for object with publicKey property', () => {
    expect(isPublicKey({ publicKey: new Uint8Array(32) })).toBe(true);
    expect(isPublicKey({ publicKey: 'abc' })).toBe(true);
  });

  test('returns false for object without publicKey property', () => {
    expect(isPublicKey({ privateKey: new Uint8Array(32) })).toBe(false);
    expect(isPublicKey({})).toBe(false);
  });
});

describe('isPrivateKey', () => {
  test('returns true for object with privateKey property', () => {
    expect(isPrivateKey({ privateKey: new Uint8Array(32) })).toBe(true);
    expect(isPrivateKey({ privateKey: 'abc' })).toBe(true);
  });

  test('returns false for object without privateKey property', () => {
    expect(isPrivateKey({ publicKey: new Uint8Array(32) })).toBe(false);
    expect(isPrivateKey({})).toBe(false);
  });
});
