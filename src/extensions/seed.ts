import { type TSeed, type INonceSeed } from '../crypto/interface';
import { _fromRawIn } from '../conversions/param';
import { bytesToString } from '../conversions/string-bytes';

/** Seed utilities for type-checking and binary conversion. */
export const Seed = {
  isSeedWithNonce: (val: TSeed): val is INonceSeed => (val as INonceSeed).nonce !== undefined,
  toBinary: (seed: TSeed): INonceSeed =>
    Seed.isSeedWithNonce(seed)
      ? { seed: Seed.toBinary(seed.seed).seed, nonce: seed.nonce }
      : { seed: _fromRawIn(seed), nonce: undefined },
  toString: (seed: TSeed): string => bytesToString(Seed.toBinary(seed).seed),
};
