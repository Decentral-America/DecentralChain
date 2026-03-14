import { expect, test } from 'vitest';
import { privateKey, publicKey } from '../src';

// Use deterministic seed for reproducible failures in CI
const SEED = 'pub-priv-keys deterministic test seed';

test('Should get public key from private', () => {
  const pk = publicKey(SEED);
  expect(pk).toEqual(publicKey({ privateKey: privateKey(SEED) }));
});
