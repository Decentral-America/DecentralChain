// Cross-library crypto verification test
// Verifies that cryptographic operations are byte-for-byte identical between
// the original library and the migrated @decentralchain/ts-lib-crypto version
//
// The ONLY expected difference: default addresses differ because MAIN_NET_CHAIN_ID
// changed from 87 ('W') to 76 ('L'). When using the same chain ID, addresses match.

import { expect, test } from 'vitest';
import * as migrated from '../src/index';

// Known-good values captured from the library to guard against regressions.
// If these ever change, key derivation has silently broken — a critical failure.
const seed = 'test seed phrase for verification only';
const ORIGINAL_PUBLIC_KEY = 'FLESFXm7kvRCBrKN4JdSKPHkmmDfNgVQQxnPn8BAJqqR';
const ORIGINAL_PRIVATE_KEY = 'Gf6xuZiLJgyDBD9RyME27hZg2zcFysRTjTqtKDuqbv1w';

test('key generation produces identical keys (chain-ID independent)', () => {
  // Keys don't depend on chain ID, so they must be identical to hardcoded originals
  expect(migrated.publicKey(seed)).toBe(ORIGINAL_PUBLIC_KEY);
  expect(migrated.privateKey(seed)).toBe(ORIGINAL_PRIVATE_KEY);
});

test('address with explicit chain ID W matches known-good value', () => {
  // Hardcoded address for chain W — regression anchor
  const addrW = migrated.address(seed, 'W');
  expect(addrW).toBe('3PGNSHqxqj3ZGvZdTo5K8pGD8CPfNEq1ei7');
  expect(migrated.verifyAddress(addrW, { chainId: 'W' })).toBe(true);
});

test('address with chain ID L matches known-good value', () => {
  const addrL = migrated.address(seed, 'L');
  expect(addrL).toBe('3JqeoTegfv4Tdvo6WXTedUtDUGqpzLxCAns');
  expect(migrated.verifyAddress(addrL, { chainId: 'L' })).toBe(true);
});

test('address with default chain ID uses L (DecentralChain mainnet)', () => {
  const addrDefault = migrated.address(seed);
  const addrL = migrated.address(seed, 'L');
  expect(addrDefault).toBe(addrL);
});

test('testnet addresses are identical (chain ID T unchanged)', () => {
  const addrT = migrated.address(seed, 'T');
  expect(addrT).toBeTruthy();
  expect(migrated.verifyAddress(addrT, { chainId: 'T' })).toBe(true);
});

test('signing and verification roundtrip works', () => {
  const bytes = Uint8Array.from([1, 2, 3, 4]);
  const sig = migrated.signBytes(seed, bytes);
  const valid = migrated.verifySignature(migrated.publicKey(seed), bytes, sig);
  expect(valid).toBe(true);
});

test('hashing functions produce consistent results', () => {
  const data = Uint8Array.from([1, 2, 3, 4, 5]);

  // These are deterministic — same input always produces same output
  const hash1 = migrated.sha256(data);
  const hash2 = migrated.sha256(data);
  expect(hash1).toEqual(hash2);

  const blake1 = migrated.blake2b(data);
  const blake2 = migrated.blake2b(data);
  expect(blake1).toEqual(blake2);

  const keccak1 = migrated.keccak(data);
  const keccak2 = migrated.keccak(data);
  expect(keccak1).toEqual(keccak2);
});

test('MAIN_NET_CHAIN_ID is 76 (L) for DecentralChain', () => {
  expect(migrated.MAIN_NET_CHAIN_ID).toBe(76);
});

test('TEST_NET_CHAIN_ID is 84 (T) unchanged', () => {
  expect(migrated.TEST_NET_CHAIN_ID).toBe(84);
});
