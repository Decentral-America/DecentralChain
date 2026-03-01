import { describe, expect, it } from 'vitest';
import { verifyAddress, verifySignature, verifyPublicKey } from '../src/crypto/verification';
import { address, publicKey } from '../src';

const SEED = 'verification edge case test seed';

describe('verifyAddress edge cases', () => {
  it('returns false for address with wrong first byte', () => {
    const addr = new Uint8Array(26);
    addr[0] = 0; // should be 1
    expect(verifyAddress(addr)).toBe(false);
  });

  it('returns false for address with wrong chain ID when chainId is provided', () => {
    const a = address(SEED, 'L');
    // The address is valid for chain L, but we verify against T
    expect(verifyAddress(a, { chainId: 'T' })).toBe(false);
  });

  it('returns true without chainId when address bytes are structurally valid', () => {
    const a = address(SEED, 'L');
    expect(verifyAddress(a)).toBe(true);
  });

  it('returns false when publicKey does not match address', () => {
    const a = address(SEED, 'L');
    const otherPk = publicKey('completely different seed');
    expect(verifyAddress(a, { publicKey: otherPk })).toBe(false);
  });

  it('returns true when publicKey matches address', () => {
    const a = address(SEED, 'L');
    const pk = publicKey(SEED);
    expect(verifyAddress(a, { publicKey: pk, chainId: 'L' })).toBe(true);
  });

  it('returns false for garbage input', () => {
    expect(verifyAddress(new Uint8Array([0, 0, 0]))).toBe(false);
  });

  it('returns false for invalid base58 string', () => {
    // verifyAddress should catch any exception and return false
    expect(verifyAddress('!!!invalid!!!')).toBe(false);
  });
});

describe('verifySignature edge cases', () => {
  it('returns false for invalid signature bytes', () => {
    const pk = publicKey(SEED);
    const msg = Uint8Array.from([1, 2, 3]);
    const badSig = new Uint8Array(64).fill(0);
    expect(verifySignature(pk, msg, badSig)).toBe(false);
  });

  it('returns false for invalid public key', () => {
    const msg = Uint8Array.from([1, 2, 3]);
    const sig = new Uint8Array(64);
    expect(verifySignature(new Uint8Array(32), msg, sig)).toBe(false);
  });
});

describe('verifyPublicKey', () => {
  it('returns true for a 32-byte public key', () => {
    const pk = publicKey(SEED);
    expect(verifyPublicKey(pk)).toBe(true);
  });

  it('returns false for a key with wrong length', () => {
    expect(verifyPublicKey(new Uint8Array(16))).toBe(false);
    expect(verifyPublicKey(new Uint8Array(64))).toBe(false);
  });
});
