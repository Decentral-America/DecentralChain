import { describe, expect, it } from 'vitest';
import { signBytes } from '../src/crypto/sign';
import { publicKey, privateKey, verifySignature } from '../src';
import { randomBytes } from '../src/crypto/random';

const SEED = 'test seed for sign spec coverage';

describe('signBytes', () => {
  const msg = Uint8Array.from([10, 20, 30, 40, 50]);

  it('signs bytes using a seed string', () => {
    const sig = signBytes(SEED, msg);
    expect(sig).toBeInstanceOf(Uint8Array);
    expect(sig).toHaveLength(64);
    expect(verifySignature(publicKey(SEED), msg, sig)).toBe(true);
  });

  it('signs bytes using a private key object', () => {
    const pk = privateKey(SEED);
    const sig = signBytes({ privateKey: pk }, msg);
    expect(sig).toBeInstanceOf(Uint8Array);
    expect(verifySignature(publicKey(SEED), msg, sig)).toBe(true);
  });

  it('signs bytes with explicit random parameter', () => {
    const rnd = randomBytes(64);
    const sig = signBytes(SEED, msg, rnd);
    expect(sig).toBeInstanceOf(Uint8Array);
    expect(sig).toHaveLength(64);
    expect(verifySignature(publicKey(SEED), msg, sig)).toBe(true);
  });

  it('produces deterministic output with same random', () => {
    const rnd = randomBytes(64);
    const sig1 = signBytes(SEED, msg, rnd);
    const sig2 = signBytes(SEED, msg, rnd);
    expect(sig1).toEqual(sig2);
  });

  it('produces different output with different random', () => {
    const sig1 = signBytes(SEED, msg, randomBytes(64));
    const sig2 = signBytes(SEED, msg, randomBytes(64));
    // Signatures with different randomness should differ
    expect(sig1).not.toEqual(sig2);
  });
});
