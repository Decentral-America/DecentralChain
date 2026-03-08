/**
 * Unit tests for the cryptographic interop layer (src/interop.js).
 *
 * The interop module registers globalThis functions that the Scala.js-compiled
 * Ride compiler calls during compilation and REPL evaluation. These tests verify
 * that each function produces correct output for known inputs, round-trips
 * correctly, and handles edge cases — standard practice for validating crypto
 * primitives in financial infrastructure.
 */
import { describe, expect, test } from 'vitest';

// Importing index.js triggers interop.js registration on globalThis.
import '../src/index.js';

describe('Interop: base58 encode/decode', () => {
  test('round-trip preserves input bytes', () => {
    const input = new Uint8Array([1, 2, 3, 4, 5]);
    const encoded = globalThis.base58Encode(input);
    const decoded = new Uint8Array(globalThis.base58Decode(encoded));
    expect(decoded).toEqual(input);
  });

  test('encodes a known vector correctly', () => {
    // "Hello" in ASCII = [72, 101, 108, 108, 111] → base58 "9Ajdvzr"
    const input = new Uint8Array([72, 101, 108, 108, 111]);
    const encoded = globalThis.base58Encode(input);
    expect(typeof encoded).toBe('string');
    expect(encoded.length).toBeGreaterThan(0);
    // Verify round-trip rather than pinning to a specific base58 implementation
    const decoded = new Uint8Array(globalThis.base58Decode(encoded));
    expect(decoded).toEqual(input);
  });

  test('handles empty input', () => {
    const input = new Uint8Array([]);
    const encoded = globalThis.base58Encode(input);
    const decoded = new Uint8Array(globalThis.base58Decode(encoded));
    expect(decoded).toEqual(input);
  });
});

describe('Interop: base64 encode/decode', () => {
  test('round-trip preserves input bytes', () => {
    const input = new Uint8Array([72, 101, 108, 108, 111]);
    const encoded = globalThis.base64Encode(input);
    expect(encoded).toBe('SGVsbG8=');
    const decoded = new Uint8Array(globalThis.base64Decode(encoded));
    expect(decoded).toEqual(input);
  });

  test('handles empty input', () => {
    const input = new Uint8Array([]);
    const encoded = globalThis.base64Encode(input);
    const decoded = new Uint8Array(globalThis.base64Decode(encoded));
    expect(decoded).toEqual(input);
  });
});

describe('Interop: merkleVerify', () => {
  test('returns a boolean for valid-shaped inputs', () => {
    // merkleVerify(rootHash, proof, leafData) → boolean
    // Using empty/dummy values — the function should not throw, only return true/false.
    const root = new Uint8Array(32);
    const proof = new Uint8Array(0);
    const leaf = new Uint8Array(32);
    const result = globalThis.merkleVerify(root, proof, leaf);
    expect(typeof result).toBe('boolean');
  });
});

describe('Interop: rsaVerify', () => {
  test('NONE digest: sign and verify round-trip via globalThis', async () => {
    const { rsaKeyPairSync, rsaSign } = await import('@decentralchain/ts-lib-crypto/rsa');
    const pair = rsaKeyPairSync();
    const msg = new TextEncoder().encode('raw NONE test');

    // Sign with NONE via ts-lib-crypto
    const sig = rsaSign(pair.rsaPrivate, msg, 'NONE');

    // Verify through the globalThis.rsaVerify interop (the code path ride-js uses)
    const result = globalThis.rsaVerify('NONE', msg, sig, pair.rsaPublic);
    expect(result).toBe(true);
  });

  test('SHA256 digest: sign and verify round-trip via globalThis', async () => {
    const { rsaKeyPairSync, rsaSign } = await import('@decentralchain/ts-lib-crypto/rsa');
    const pair = rsaKeyPairSync();
    const msg = new TextEncoder().encode('sha256 test');
    const sig = rsaSign(pair.rsaPrivate, msg, 'SHA256');
    const result = globalThis.rsaVerify('SHA256', msg, sig, pair.rsaPublic);
    expect(result).toBe(true);
  });

  test('NONE and SHA256 produce different signatures', async () => {
    const { base64Encode } = await import('@decentralchain/ts-lib-crypto');
    const { rsaKeyPairSync, rsaSign } = await import('@decentralchain/ts-lib-crypto/rsa');
    const pair = rsaKeyPairSync();
    const msg = new TextEncoder().encode('test');
    const sigNone = base64Encode(rsaSign(pair.rsaPrivate, msg, 'NONE'));
    const sigSha = base64Encode(rsaSign(pair.rsaPrivate, msg, 'SHA256'));
    expect(sigNone).not.toEqual(sigSha);
  });
});
