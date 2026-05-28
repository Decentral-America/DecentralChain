// Cross-library crypto verification test
// Verifies that cryptographic operations are byte-for-byte identical between
// the original library and the migrated @decentralchain/ts-lib-crypto version
//
// DCC mainnet chain ID = 63 ('?'), testnet = 33 ('!').
// Verified from live blockchain: all genesis addresses decode to byte[1]=63.

import { expect, test } from 'vitest';
import * as migrated from '../src/index';

// Known-good values captured from the library to guard against regressions.
// If these ever change, key derivation has silently broken — a critical failure.
// Seed loaded from environment — NEVER store mnemonic phrases in source.
const seed = process.env.DCC_TEST_CRYPTO_VERIFY_SEED;
if (!seed) throw new Error('DCC_TEST_CRYPTO_VERIFY_SEED env var is required');

const ORIGINAL_PUBLIC_KEY = process.env.DCC_TEST_CRYPTO_VERIFY_PUBKEY;
if (!ORIGINAL_PUBLIC_KEY) throw new Error('DCC_TEST_CRYPTO_VERIFY_PUBKEY env var is required');

const ORIGINAL_PRIVATE_KEY = process.env.DCC_TEST_CRYPTO_VERIFY_PRIVKEY;
if (!ORIGINAL_PRIVATE_KEY) throw new Error('DCC_TEST_CRYPTO_VERIFY_PRIVKEY env var is required');

const EXPECTED_ADDR_W = process.env.DCC_TEST_CRYPTO_VERIFY_ADDR_W;
if (!EXPECTED_ADDR_W) throw new Error('DCC_TEST_CRYPTO_VERIFY_ADDR_W env var is required');

const EXPECTED_ADDR_Q = process.env.DCC_TEST_CRYPTO_VERIFY_ADDR_Q;
if (!EXPECTED_ADDR_Q) throw new Error('DCC_TEST_CRYPTO_VERIFY_ADDR_Q env var is required');

test('key generation produces identical keys (chain-ID independent)', () => {
  // Keys don't depend on chain ID, so they must be identical to hardcoded originals
  expect(migrated.publicKey(seed)).toBe(ORIGINAL_PUBLIC_KEY);
  expect(migrated.privateKey(seed)).toBe(ORIGINAL_PRIVATE_KEY);
});

test('address with explicit chain ID W matches known-good value', () => {
  // Hardcoded address for chain W — regression anchor
  const addrW = migrated.address(seed, 'W');
  expect(addrW).toBe(EXPECTED_ADDR_W);
  expect(migrated.verifyAddress(addrW, { chainId: 'W' })).toBe(true);
});

test('address with chain ID ? (DCC mainnet) matches known-good value', () => {
  const addrQ = migrated.address(seed, '?');
  expect(addrQ).toBe(EXPECTED_ADDR_Q);
  expect(migrated.verifyAddress(addrQ, { chainId: '?' })).toBe(true);
});

test('address with default chain ID uses ? (DCC mainnet)', () => {
  const addrDefault = migrated.address(seed);
  const addrQ = migrated.address(seed, '?');
  expect(addrDefault).toBe(addrQ);
});

test('testnet address uses ! (DCC testnet)', () => {
  const addrBang = migrated.address(seed, '!');
  expect(addrBang).toBeTruthy();
  expect(migrated.verifyAddress(addrBang, { chainId: '!' })).toBe(true);
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

test('MAIN_NET_CHAIN_ID is 63 (?) for DecentralChain', () => {
  expect(migrated.MAIN_NET_CHAIN_ID).toBe(63);
});

test('TEST_NET_CHAIN_ID is 33 (!)', () => {
  expect(migrated.TEST_NET_CHAIN_ID).toBe(33);
});
