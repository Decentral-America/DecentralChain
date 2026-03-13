import { expect, test } from 'vitest';
import { crypto } from '../src';

const seed =
  'vast local exotic manage click stone boil analyst various truth swift decade cherry cram innocent';

const { address } = crypto({ output: 'Base58', seed });

test('address from embeded seed', () => {
  expect(address()).toBe('3JxsUjiKZxSjDxLa9m5rQ63ehFXoZNEkCtX');
});
