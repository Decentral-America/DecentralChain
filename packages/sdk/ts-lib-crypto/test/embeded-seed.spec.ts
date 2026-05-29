import { expect, test } from 'vitest';
import { crypto } from '../src';

// Defaults use the well-known local private node seed; override via env vars in CI.
const seed = process.env.DCC_TEST_EMBEDDED_SEED ?? 'dcc private node seed with dcc tokens';

const expectedAddress = process.env.DCC_TEST_EMBEDDED_ADDR ?? '3DRRUWk6x6AVfoLKG4jcccwzsTAa9eyDXf5';

const { address } = crypto({ output: 'Base58', seed });

test('address from embedded seed', () => {
  expect(address()).toBe(expectedAddress);
});
