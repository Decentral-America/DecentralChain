import { Option } from 'effect';
import { LRUCache } from 'lru-cache';
import { type CacheSync } from '../../../types';
import { type PairDbResponse } from './transformResult';
import { type PairsGetRequest } from './types';

export const create = (
  size: number,
  ttlMillis: number,
): CacheSync<PairsGetRequest, PairDbResponse> => {
  const cache = new LRUCache<string, PairDbResponse>({ max: size, ttl: ttlMillis });
  const toStringKey = (req: PairsGetRequest): string =>
    req.matcher + req.pair.amountAsset + req.pair.priceAsset;
  return {
    get: (key) => Option.fromNullable(cache.get(toStringKey(key))),
    has: (key) => cache.has(toStringKey(key)),
    set: (key, value) => cache.set(toStringKey(key), value),
  };
};
