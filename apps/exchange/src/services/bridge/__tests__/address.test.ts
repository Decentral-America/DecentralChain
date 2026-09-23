/**
 * The 26-byte recipient field.
 *
 * The addresses below were generated from throwaway seeds specifically to hit
 * the case that breaks the obvious implementation. They hold nothing.
 */
import { base58Decode } from '@decentralchain/ts-lib-crypto';
import { describe, expect, it } from 'vitest';
import { bytes32ToDccAddressBytes, dccAddressToBytes32 } from '@/services/bridge/address';

/** Checksum ends `… 0x41 0x00`. Roughly one address in 256 looks like this. */
const TRAILING_ZERO = '3DcZCYUNSopwNd13wUTTKaLbYXb5ACLMoYK';

/** Checksum ends `… 0x00 0x00`. One in 65,536. */
const TWO_TRAILING_ZEROS = '3DbNTNSiF3b1GM7ACoKDSpFpUyPUzNvQ3c3';

/** Checksum ends `… 0x7c 0x76`. The case that works by accident. */
const ORDINARY = '3Dfw9hasyUyeRBr8H7NJhcWZLRbVfHzt64D';

describe('dccAddressToBytes32', () => {
  it('produces a 32-byte field with the address in the first 26', () => {
    const field = dccAddressToBytes32(ORDINARY);
    const raw = base58Decode(ORDINARY);

    expect(field).toHaveLength(32);
    expect(field.slice(0, 26)).toEqual(raw);
    expect([...field.slice(26)]).toEqual([0, 0, 0, 0, 0, 0]);
  });

  it('preserves a checksum byte that is legitimately zero', () => {
    // The bug this guards: recovering the address by trimming trailing zeros
    // eats this byte. The result is a different, valid-looking address. The
    // signature still verifies, the mint reverts inside the contract, and the
    // deposit is locked with no automatic recovery.
    const field = dccAddressToBytes32(TRAILING_ZERO);

    expect(field[25]).toBe(0);
    expect(bytes32ToDccAddressBytes(field)).toEqual(base58Decode(TRAILING_ZERO));
  });

  it('preserves two trailing zero bytes', () => {
    const field = dccAddressToBytes32(TWO_TRAILING_ZEROS);

    expect(field[24]).toBe(0);
    expect(field[25]).toBe(0);
    expect(bytes32ToDccAddressBytes(field)).toEqual(base58Decode(TWO_TRAILING_ZEROS));
  });

  it('round-trips every address shape', () => {
    for (const addr of [ORDINARY, TRAILING_ZERO, TWO_TRAILING_ZEROS]) {
      expect(bytes32ToDccAddressBytes(dccAddressToBytes32(addr))).toEqual(base58Decode(addr));
    }
  });

  it('is not fooled by a naive trailing-zero trim', () => {
    // Demonstrates the failure directly: this is what the tempting
    // implementation would recover, and it is not the address.
    const field = dccAddressToBytes32(TRAILING_ZERO);

    let end = field.length;
    while (end > 0 && field[end - 1] === 0) end--;
    const naive = field.slice(0, end);

    expect(naive.length).toBe(25);
    expect(naive).not.toEqual(base58Decode(TRAILING_ZERO));
    expect(bytes32ToDccAddressBytes(field)).toHaveLength(26);
  });

  it('refuses input that does not decode to 26 bytes', () => {
    // A Solana pubkey is 32 bytes and base58 too — pasting one into the DCC
    // recipient field is an easy mistake and must not produce a field.
    expect(() => dccAddressToBytes32('So11111111111111111111111111111111111111112')).toThrow(
      /26 bytes/,
    );
  });

  it('refuses non-base58 input', () => {
    expect(() => dccAddressToBytes32('not an address!')).toThrow();
  });
});

describe('bytes32ToDccAddressBytes', () => {
  it('takes a fixed 26-byte slice regardless of content', () => {
    const allZero = new Uint8Array(32);

    expect(bytes32ToDccAddressBytes(allZero)).toHaveLength(26);
  });

  it('rejects a field of the wrong width', () => {
    expect(() => bytes32ToDccAddressBytes(new Uint8Array(26))).toThrow(/32 bytes/);
  });
});
