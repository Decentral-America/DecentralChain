import { fromNullable } from 'folktale/maybe';
import * as LRU from 'lru-cache';

import { type AssetDbResponse, type AssetsCache } from './types';

export const create = (size: number, maxAgeMillis: number): AssetsCache => {
  const cache = new LRU<string, AssetDbResponse>({
    max: size,
    maxAge: maxAgeMillis,
  });

  return {
    get: (key) => fromNullable(cache.get(key)),
    has: (key) => {
      return cache.has(key);
    },
    set: (key, value) => {
      cache.set(key, value);
    },
  };
};
