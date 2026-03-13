import { _fromRawIn } from '../conversions/param';
import { type INonceSeed, type TSeed } from '../crypto/interface';

/** Seed utilities for type-checking and binary conversion. */
export const Seed = {
  isSeedWithNonce: (val: TSeed): val is INonceSeed =>
    typeof val === 'object' && 'seed' in val && 'nonce' in val && typeof val.nonce === 'number',
  toBinary: (seed: TSeed): INonceSeed =>
    Seed.isSeedWithNonce(seed)
      ? { nonce: seed.nonce, seed: Seed.toBinary(seed.seed).seed }
      : { nonce: undefined, seed: _fromRawIn(seed) },
};
