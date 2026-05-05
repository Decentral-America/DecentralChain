import { fromNullable } from 'folktale/maybe';
import * as LRU from 'lru-cache';
import { type CacheSync } from '../../../types';
import { type PairDbResponse } from './transformResult';
import { type PairsGetRequest } from './types';

export const create = (
  size: number,
  maxAgeMillis: number,
): CacheSync<PairsGetRequest, PairDbResponse> => {
  const cache = new LRU<string, PairDbResponse>({
    max: size,
    maxAge: maxAgeMillis,
  });

  const toStringKey = (req: PairsGetRequest): string =>
    req.matcher + req.pair.amountAsset + req.pair.priceAsset;

  return {
    get: (key) => {
      const k = toStringKey(key);
      const p = cache.get(k);
      return fromNullable(p);
    },
    has: (key) => cache.has(toStringKey(key)),
    set: (key, value) => cache.set(toStringKey(key), value),
  };
};
