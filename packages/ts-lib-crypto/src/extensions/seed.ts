import { type TSeed, type INonceSeed } from '../crypto/interface';
import { _fromRawIn } from '../conversions/param';

/** Seed utilities for type-checking and binary conversion. */
export const Seed = {
  isSeedWithNonce: (val: TSeed): val is INonceSeed =>
    typeof val === 'object' &&
    val !== null &&
    'seed' in val &&
    'nonce' in val &&
    typeof val.nonce === 'number',
  toBinary: (seed: TSeed): INonceSeed =>
    Seed.isSeedWithNonce(seed)
      ? { seed: Seed.toBinary(seed.seed).seed, nonce: seed.nonce }
      : { seed: _fromRawIn(seed), nonce: undefined },
};
