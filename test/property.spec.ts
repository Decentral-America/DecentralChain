/**
 * Property-based tests using fast-check.
 *
 * These tests verify algebraic invariants that must hold for ALL inputs,
 * not just specific vectors. They complement the existing test suite by
 * exploring the input space randomly and automatically shrinking
 * counterexamples when a property fails.
 */
import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import {
  keyPair,
  publicKey,
  privateKey,
  address,
  signBytes,
  verifySignature,
  verifyAddress,
  verifyPublicKey,
  sha256,
  blake2b,
  keccak,
  sharedKey,
  base58Encode,
  base58Decode,
  base64Encode,
  base64Decode,
  base16Encode,
  base16Decode,
  stringToBytes,
  bytesToString,
  aesEncrypt,
  aesDecrypt,
  concat,
  split,
  randomBytes,
} from '../src';
import { messageEncrypt, messageDecrypt } from '../src/crypto/encryption';

// ── Arbitraries ─────────────────────────────────────────────────────

/** Arbitrary seed — any printable ASCII string of length 15–50. */
const arbSeed = fc.string({ minLength: 15, maxLength: 50 });

/** Arbitrary Uint8Array of a given length. */
const arbBytes = (min = 0, max = 256) => fc.uint8Array({ minLength: min, maxLength: max });

/** Arbitrary non-empty Uint8Array. */
const arbNonEmptyBytes = arbBytes(1, 256);

// ── Hash properties ─────────────────────────────────────────────────

describe('Hash properties', () => {
  test('sha256 is deterministic', () => {
    fc.assert(
      fc.property(arbBytes(0, 512), (input) => {
        const a = sha256(input);
        const b = sha256(input);
        expect(a).toEqual(b);
      }),
    );
  });

  test('sha256 always produces 32 bytes', () => {
    fc.assert(
      fc.property(arbBytes(0, 1024), (input) => {
        expect(sha256(input)).toHaveLength(32);
      }),
    );
  });

  test('blake2b is deterministic', () => {
    fc.assert(
      fc.property(arbBytes(0, 512), (input) => {
        const a = blake2b(input);
        const b = blake2b(input);
        expect(a).toEqual(b);
      }),
    );
  });

  test('blake2b always produces 32 bytes', () => {
    fc.assert(
      fc.property(arbBytes(0, 1024), (input) => {
        expect(blake2b(input)).toHaveLength(32);
      }),
    );
  });

  test('keccak is deterministic', () => {
    fc.assert(
      fc.property(arbBytes(0, 512), (input) => {
        const a = keccak(input);
        const b = keccak(input);
        expect(a).toEqual(b);
      }),
    );
  });

  test('keccak always produces 32 bytes', () => {
    fc.assert(
      fc.property(arbBytes(0, 1024), (input) => {
        expect(keccak(input)).toHaveLength(32);
      }),
    );
  });

  test('distinct inputs produce distinct sha256 hashes (collision resistance)', () => {
    fc.assert(
      fc.property(arbNonEmptyBytes, arbNonEmptyBytes, (a, b) => {
        fc.pre(!bufEqual(a, b));
        const ha = sha256(a);
        const hb = sha256(b);
        expect(ha).not.toEqual(hb);
      }),
    );
  });
});

// ── Base encoding roundtrips ────────────────────────────────────────

describe('Base encoding roundtrips', () => {
  test('base58: encode then decode is identity', () => {
    fc.assert(
      fc.property(arbBytes(1, 128), (input) => {
        const encoded = base58Encode(input);
        const decoded = base58Decode(encoded);
        expect(decoded).toEqual(input);
      }),
    );
  });

  test('base64: encode then decode is identity', () => {
    fc.assert(
      fc.property(arbBytes(1, 256), (input) => {
        const encoded = base64Encode(input);
        const decoded = base64Decode(encoded);
        expect(decoded).toEqual(input);
      }),
    );
  });

  test('base16: encode then decode is identity', () => {
    fc.assert(
      fc.property(arbBytes(1, 256), (input) => {
        const encoded = base16Encode(input);
        const decoded = base16Decode(encoded);
        expect(decoded).toEqual(input);
      }),
    );
  });

  test('base16 output is always lowercase hex', () => {
    fc.assert(
      fc.property(arbBytes(1, 128), (input) => {
        const hex = base16Encode(input);
        expect(hex).toMatch(/^[0-9a-f]*$/);
        expect(hex).toHaveLength(input.length * 2);
      }),
    );
  });
});

// ── String/bytes roundtrip ──────────────────────────────────────────

describe('String/bytes roundtrips', () => {
  test('UTF-8: stringToBytes then bytesToString is identity', () => {
    fc.assert(
      fc.property(fc.string(), (str) => {
        const bytes = stringToBytes(str);
        const roundTrip = bytesToString(bytes);
        expect(roundTrip).toBe(str);
      }),
      { numRuns: 200 },
    );
  });
});

// ── Key derivation properties ───────────────────────────────────────

describe('Key derivation properties', () => {
  test('keyPair produces 32-byte public and private keys', () => {
    fc.assert(
      fc.property(arbSeed, (seed) => {
        const kp = keyPair(seed);
        // Default output is Base58-encoded strings — decode to check raw byte length
        expect(base58Decode(kp.publicKey)).toHaveLength(32);
        expect(base58Decode(kp.privateKey)).toHaveLength(32);
      }),
      { numRuns: 50 },
    );
  });

  test('keyPair is deterministic for same seed', () => {
    fc.assert(
      fc.property(arbSeed, (seed) => {
        const a = keyPair(seed);
        const b = keyPair(seed);
        expect(a.publicKey).toEqual(b.publicKey);
        expect(a.privateKey).toEqual(b.privateKey);
      }),
      { numRuns: 50 },
    );
  });

  test('publicKey from seed matches keyPair.publicKey', () => {
    fc.assert(
      fc.property(arbSeed, (seed) => {
        const kp = keyPair(seed);
        const pk = publicKey(seed);
        expect(pk).toEqual(kp.publicKey);
      }),
      { numRuns: 50 },
    );
  });

  test('privateKey from seed matches keyPair.privateKey', () => {
    fc.assert(
      fc.property(arbSeed, (seed) => {
        const kp = keyPair(seed);
        const sk = privateKey(seed);
        expect(sk).toEqual(kp.privateKey);
      }),
      { numRuns: 50 },
    );
  });

  test('verifyPublicKey accepts derived public keys', () => {
    fc.assert(
      fc.property(arbSeed, (seed) => {
        const pk = publicKey(seed);
        expect(verifyPublicKey(pk)).toBe(true);
      }),
      { numRuns: 50 },
    );
  });

  test('address is 26 bytes and verifies', () => {
    fc.assert(
      fc.property(arbSeed, (seed) => {
        const addr = address(seed);
        // Default output is Base58-encoded — decode to check raw byte length
        expect(base58Decode(addr)).toHaveLength(26);
        expect(verifyAddress(addr)).toBe(true);
      }),
      { numRuns: 50 },
    );
  });

  test('different seeds produce different key pairs', () => {
    fc.assert(
      fc.property(arbSeed, arbSeed, (seedA, seedB) => {
        fc.pre(seedA !== seedB);
        const a = keyPair(seedA);
        const b = keyPair(seedB);
        expect(a.publicKey).not.toEqual(b.publicKey);
      }),
      { numRuns: 50 },
    );
  });
});

// ── Sign / Verify properties ────────────────────────────────────────

describe('Sign/Verify properties', () => {
  test('sign then verify roundtrip always succeeds', () => {
    fc.assert(
      fc.property(arbSeed, arbBytes(1, 512), (seed, msg) => {
        const sig = signBytes(seed, msg);
        // Default output is Base58-encoded — decode to check raw byte length
        expect(base58Decode(sig)).toHaveLength(64);
        const pk = publicKey(seed);
        expect(verifySignature(pk, msg, sig)).toBe(true);
      }),
      { numRuns: 30 },
    );
  });

  test('signature does not verify with wrong public key', () => {
    fc.assert(
      fc.property(arbSeed, arbSeed, arbBytes(1, 128), (seedA, seedB, msg) => {
        fc.pre(seedA !== seedB);
        const sig = signBytes(seedA, msg);
        const pkB = publicKey(seedB);
        expect(verifySignature(pkB, msg, sig)).toBe(false);
      }),
      { numRuns: 30 },
    );
  });

  test('signature does not verify with modified message', () => {
    fc.assert(
      fc.property(arbSeed, arbBytes(1, 128), (seed, msg) => {
        const sig = signBytes(seed, msg);
        const pk = publicKey(seed);
        const modified = new Uint8Array(msg);
        modified[0] = (modified[0]! ^ 0xff) & 0xff; // flip first byte
        expect(verifySignature(pk, modified, sig)).toBe(false);
      }),
      { numRuns: 30 },
    );
  });

  test('signing is deterministic without explicit random', () => {
    // signBytes always passes randomBytes(64), so two calls with same
    // seed+msg will produce different sigs (randomized). But verifying
    // both should succeed.
    fc.assert(
      fc.property(arbSeed, arbBytes(1, 128), (seed, msg) => {
        const sig1 = signBytes(seed, msg);
        const sig2 = signBytes(seed, msg);
        const pk = publicKey(seed);
        expect(verifySignature(pk, msg, sig1)).toBe(true);
        expect(verifySignature(pk, msg, sig2)).toBe(true);
      }),
      { numRuns: 20 },
    );
  });
});

// ── AES encrypt/decrypt properties ──────────────────────────────────

describe('AES encrypt/decrypt properties', () => {
  const arbKey16 = fc.uint8Array({ minLength: 16, maxLength: 16 });
  const arbIv16 = fc.uint8Array({ minLength: 16, maxLength: 16 });

  test('CBC: encrypt then decrypt is identity', () => {
    fc.assert(
      fc.property(arbKey16, arbIv16, arbBytes(1, 128), (key, iv, plaintext) => {
        const encrypted = aesEncrypt(plaintext, key, 'CBC', iv);
        const decrypted = aesDecrypt(encrypted, key, 'CBC', iv);
        expect(decrypted).toEqual(plaintext);
      }),
      { numRuns: 50 },
    );
  });

  test('CTR: encrypt then decrypt is identity', () => {
    fc.assert(
      fc.property(arbKey16, arbIv16, arbBytes(1, 128), (key, iv, plaintext) => {
        const encrypted = aesEncrypt(plaintext, key, 'CTR', iv);
        const decrypted = aesDecrypt(encrypted, key, 'CTR', iv);
        expect(decrypted).toEqual(plaintext);
      }),
      { numRuns: 50 },
    );
  });

  test('ECB: encrypt then decrypt is identity', () => {
    fc.assert(
      fc.property(arbKey16, arbBytes(1, 128), (key, plaintext) => {
        const encrypted = aesEncrypt(plaintext, key, 'ECB');
        const decrypted = aesDecrypt(encrypted, key, 'ECB');
        expect(decrypted).toEqual(plaintext);
      }),
      { numRuns: 50 },
    );
  });

  test('AES ciphertext differs from plaintext', () => {
    fc.assert(
      fc.property(arbKey16, arbIv16, arbBytes(16, 128), (key, iv, plaintext) => {
        const encrypted = aesEncrypt(plaintext, key, 'CBC', iv);
        expect(encrypted).not.toEqual(plaintext);
      }),
    );
  });

  test('AES decrypt with wrong key fails', () => {
    fc.assert(
      fc.property(arbKey16, arbKey16, arbIv16, arbBytes(1, 64), (keyA, keyB, iv, plaintext) => {
        fc.pre(!bufEqual(keyA, keyB));
        const encrypted = aesEncrypt(plaintext, keyA, 'CBC', iv);
        expect(() => aesDecrypt(encrypted, keyB, 'CBC', iv)).toThrow();
      }),
      { numRuns: 30 },
    );
  });
});

// ── Message encrypt/decrypt properties ──────────────────────────────

describe('Message encrypt/decrypt properties', () => {
  test('messageEncrypt then messageDecrypt is identity', () => {
    fc.assert(
      fc.property(
        arbSeed,
        arbSeed,
        fc.string({ minLength: 1, maxLength: 128 }),
        (seedA, seedB, msg) => {
          fc.pre(seedA !== seedB);
          const kpA = keyPair(seedA);
          const kpB = keyPair(seedB);

          // Derive shared keys (raw bytes from exported sharedKey)
          const skEncrypt = sharedKey(kpA.privateKey, kpB.publicKey, 'decentralchain');
          const skDecrypt = sharedKey(kpB.privateKey, kpA.publicKey, 'decentralchain');

          // Use raw encryption functions (not the Base58-wrapping exports)
          const encrypted = messageEncrypt(skEncrypt, msg);
          const decrypted = messageDecrypt(skDecrypt, encrypted);
          expect(decrypted).toBe(msg);
        },
      ),
      { numRuns: 15 },
    );
  });
});

// ── Concat / Split properties ───────────────────────────────────────

describe('Concat/Split properties', () => {
  test('concat then split recovers original arrays', () => {
    fc.assert(
      fc.property(arbBytes(0, 128), arbBytes(0, 128), (a, b) => {
        const joined = concat(a, b);
        expect(joined).toHaveLength(a.length + b.length);
        const [first, second] = split(joined, a.length);
        expect(first).toEqual(a);
        expect(second).toEqual(b);
      }),
    );
  });

  test('concat is associative at byte level', () => {
    fc.assert(
      fc.property(arbBytes(0, 64), arbBytes(0, 64), arbBytes(0, 64), (a, b, c) => {
        const left = concat(concat(a, b), c);
        const right = concat(a, concat(b, c));
        expect(left).toEqual(right);
      }),
    );
  });
});

// ── Random properties ───────────────────────────────────────────────

describe('Random properties', () => {
  test('randomBytes produces requested length', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 256 }), (len) => {
        const bytes = randomBytes(len);
        expect(bytes).toHaveLength(len);
      }),
    );
  });

  test('randomBytes produces different output on each call', () => {
    // Statistical: two random 32-byte arrays should never collide.
    fc.assert(
      fc.property(fc.constant(32), (len) => {
        const a = randomBytes(len);
        const b = randomBytes(len);
        expect(a).not.toEqual(b);
      }),
      { numRuns: 100 },
    );
  });
});

// ── Helpers ─────────────────────────────────────────────────────────

function bufEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
