import { type Asset, BigNumber } from '@decentralchain/data-entities';
import { type Effect } from 'effect';
import { chain, partition, uniqWith } from 'ramda';

import { type CacheSync } from '../../../types';
import { createGeneratePossibleRequestItemsWithAsset, pairIsSymmetric, pairsEq } from '../data';
import { type AssetPair, type VolumeAwareRateInfo } from '../RateEstimator';
import { type RateCacheKey } from './impl/RateCache';

export type RateCache = CacheSync<RateCacheKey, VolumeAwareRateInfo>;

export type AsyncMget<Req, Res, Error> = {
  mget(req: Req): Effect.Effect<Res[], Error>;
};

export type PairsForRequest = {
  preComputed: VolumeAwareRateInfo[];
  toBeRequested: AssetPair[];
};

export const partitionByPreComputed = (
  cache: RateCache,
  pairs: AssetPair[],
  getCacheKey: (pair: AssetPair) => RateCacheKey,
  shouldCache: boolean,
  baseAsset: Asset,
): PairsForRequest => {
  const generatePossibleRequestItems = createGeneratePossibleRequestItemsWithAsset(baseAsset);
  const [symmetric, asymmetric] = partition(pairIsSymmetric, pairs);

  const eqRates: Array<VolumeAwareRateInfo> = symmetric.map((pair) => ({
    rate: new BigNumber(1),
    volumeWaves: new BigNumber(0),
    ...pair,
  }));

  const allPairsToRequest = uniqWith(
    pairsEq,
    chain((it) => generatePossibleRequestItems(it), asymmetric),
  );

  if (shouldCache) {
    const [cached, uncached] = partition((it) => cache.has(getCacheKey(it)), allPairsToRequest);
    // Option.isSome is guaranteed here because cache.has returned true
    const cachedRates = cached.map((pair) => {
      const m = cache.get(getCacheKey(pair));
      if (m._tag !== 'Some') throw new Error('Cache miss after has()');
      return m.value;
    });
    return { preComputed: cachedRates.concat(eqRates), toBeRequested: uncached };
  } else {
    return { preComputed: eqRates, toBeRequested: allPairsToRequest };
  }
};
