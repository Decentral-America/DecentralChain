import { Option } from 'effect';
import { LRUCache } from 'lru-cache';
import { flip } from '../../data';
import { type AssetPair, type VolumeAwareRateInfo } from '../../RateEstimator';
import { type RateCache } from '../../repo';

export type RateCacheKey = {
  pair: AssetPair;
  matcher: string;
};

const keyFn =
  (matcher: string) =>
  (pair: AssetPair): string =>
    `${matcher}::${pair.amountAsset.id}::${pair.priceAsset.id}`;

export default class RateCacheImpl implements RateCache {
  private readonly lru: LRUCache<string, VolumeAwareRateInfo>;

  constructor(size: number, ttlMillis: number) {
    this.lru = new LRUCache({ max: size, ttl: ttlMillis });
  }

  has(key: RateCacheKey): boolean {
    return this.lru.has(keyFn(key.matcher)(key.pair));
  }

  set(key: RateCacheKey, data: VolumeAwareRateInfo) {
    this.lru.set(keyFn(key.matcher)(key.pair), data);
  }

  get(key: RateCacheKey): Option.Option<VolumeAwareRateInfo> {
    const getKey = keyFn(key.matcher);
    const direct = Option.fromNullable(this.lru.get(getKey(key.pair)));
    return Option.isSome(direct)
      ? direct
      : Option.fromNullable(this.lru.get(getKey(flip(key.pair))));
  }
}
