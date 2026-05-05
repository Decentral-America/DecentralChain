import { Option } from 'effect';
import { LRUCache } from 'lru-cache';
import { type AssetDbResponse, type AssetsCache } from './types';

export const create = (size: number, ttlMillis: number): AssetsCache => {
  const cache = new LRUCache<string, AssetDbResponse>({ max: size, ttl: ttlMillis });
  return {
    get: (key) => Option.fromNullable(cache.get(key)),
    has: (key) => cache.has(key),
    set: (key, value) => cache.set(key, value),
  };
};
