import { expect, test } from 'vitest';
import { crypto } from '../src';

// Seed loaded from environment — NEVER store mnemonic phrases in source.
const seed = process.env.DCC_TEST_EMBEDDED_SEED;
if (!seed) throw new Error('DCC_TEST_EMBEDDED_SEED env var is required');

const expectedAddress = process.env.DCC_TEST_EMBEDDED_ADDR;
if (!expectedAddress) throw new Error('DCC_TEST_EMBEDDED_ADDR env var is required');

const { address } = crypto({ output: 'Base58', seed });

test('address from embedded seed', () => {
  expect(address()).toBe(expectedAddress);
});
