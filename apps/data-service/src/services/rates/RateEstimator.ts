import { type Asset, BigNumber } from '@decentralchain/data-entities';
import { Effect, Option, pipe } from 'effect';
import { splitEvery } from 'ramda';

import { AppError, type DbError, type Timeout } from '../../errorHandling';
import { type RateInfo, type RateMgetParams, type RateWithPairIds } from '../../types';
import { collect } from '../../utils/collection';
import { isEmpty } from '../../utils/fp/optionOps';
import { type AssetsService } from '../assets';
import { type PairsService } from '../pairs';
import { MoneyFormat } from '../types';

import { type AsyncMget, partitionByPreComputed, type RateCache } from './repo';
import { type RateCacheKey } from './repo/impl/RateCache';
import RateInfoLookup from './repo/impl/RateInfoLookup';
import { type IThresholdAssetRateService } from './ThresholdAssetRateService';

type ReqAndRes<TReq, TRes> = {
  req: TReq;
  res: Option.Option<TRes>;
};

export type AssetPair = {
  amountAsset: Asset;
  priceAsset: Asset;
};

export type RateWithPair = RateInfo & AssetPair;
export type VolumeAwareRateInfo = RateWithPair & { volumeWaves: BigNumber };

export default class RateEstimator
  implements AsyncMget<RateMgetParams, ReqAndRes<AssetPair, RateWithPairIds>, AppError>
{
  private readonly baseAssetId: string;
  private readonly cache: RateCache;
  private readonly remoteGet: AsyncMget<RateMgetParams, RateWithPairIds, DbError | Timeout>;
  private readonly pairs: PairsService;
  private readonly pairAcceptanceVolumeThreshold: number;
  private readonly thresholdAssetRateService: IThresholdAssetRateService;
  private readonly assetsService: AssetsService;

  constructor(
    baseAssetId: string,
    cache: RateCache,
    remoteGet: AsyncMget<RateMgetParams, RateWithPairIds, DbError | Timeout>,
    pairs: PairsService,
    pairAcceptanceVolumeThreshold: number,
    thresholdAssetRateService: IThresholdAssetRateService,
    assetsService: AssetsService,
  ) {
    this.baseAssetId = baseAssetId;
    this.cache = cache;
    this.remoteGet = remoteGet;
    this.pairs = pairs;
    this.pairAcceptanceVolumeThreshold = pairAcceptanceVolumeThreshold;
    this.thresholdAssetRateService = thresholdAssetRateService;
    this.assetsService = assetsService;
  }

  mget(
    request: RateMgetParams,
  ): Effect.Effect<ReqAndRes<AssetPair, RateWithPairIds>[], AppError | DbError | Timeout> {
    const { pairs, timestamp, matcher } = request;
    const shouldCache = isEmpty(timestamp);

    const getCacheKey = (pair: AssetPair): RateCacheKey => ({ matcher, pair });

    const cacheUnlessCached = (item: VolumeAwareRateInfo) => {
      const key = getCacheKey(item);
      if (!this.cache.has(key)) this.cache.set(key, item);
    };
    const cacheAllUnlessCached = (items: VolumeAwareRateInfo[]) => items.forEach(cacheUnlessCached);

    const ids = pairs.reduce((acc, cur) => {
      acc.push(cur.amountAsset, cur.priceAsset);
      return acc;
    }, [] as string[]);
    ids.push(this.baseAssetId);

    return pipe(
      this.assetsService.mget({ ids }),
      Effect.flatMap((ms) => {
        // sequence: all assets must exist
        const allAssets = Option.all(ms);
        if (Option.isNone(allAssets)) {
          return Effect.fail(
            AppError.Validation(
              'Some of the assets of specified pairs do not exist in the blockchain',
              {
                ids: collect<Option.Option<Asset>, number>((m, idx) =>
                  isEmpty(m) ? idx : undefined,
                )(ms).map((idx) => ids[idx]),
              },
            ),
          );
        }

        const assets = [...allAssets.value];
        const baseAsset = assets.pop() as Asset;
        const pairsWithAssets = splitEvery(2, assets).map((pair: (Asset | undefined)[]) => ({
          amountAsset: pair[0] as Asset,
          priceAsset: pair[1] as Asset,
        }));

        const assetsMap: Record<string, Asset> = {};
        assetsMap[this.baseAssetId] = baseAsset;
        assets.forEach((asset) => {
          assetsMap[asset.id] = asset;
        });

        const { preComputed, toBeRequested } = partitionByPreComputed(
          this.cache,
          pairsWithAssets,
          getCacheKey,
          shouldCache,
          baseAsset,
        );

        return pipe(
          this.remoteGet.mget({
            matcher,
            pairs: toBeRequested.map((pair) => ({
              amountAsset: pair.amountAsset.id,
              priceAsset: pair.priceAsset.id,
            })),
            timestamp,
          }),
          Effect.flatMap((pairsWithRates) =>
            pipe(
              this.pairs.mget({
                matcher: request.matcher,
                moneyFormat: MoneyFormat.Float,
                pairs: pairsWithRates,
              }),
              Effect.map((foundPairs) =>
                foundPairs.map((itm, idx) =>
                  Option.isSome(itm)
                    ? {
                        amountAsset: assetsMap[itm.value.amountAsset] as Asset,
                        priceAsset: assetsMap[itm.value.priceAsset] as Asset,
                        rate: pairsWithRates[idx]?.rate ?? new BigNumber(0),
                        volumeWaves: itm.value.volumeWaves as BigNumber,
                      }
                    : {
                        amountAsset: assetsMap[pairsWithRates[idx]?.amountAsset ?? ''] as Asset,
                        priceAsset: assetsMap[pairsWithRates[idx]?.priceAsset ?? ''] as Asset,
                        rate: pairsWithRates[idx]?.rate ?? new BigNumber(0),
                        volumeWaves: new BigNumber(0),
                      },
                ),
              ),
            ),
          ),
          Effect.tap((results) =>
            Effect.sync(() => {
              if (shouldCache) cacheAllUnlessCached(results);
            }),
          ),
          Effect.flatMap((data) =>
            pipe(
              this.thresholdAssetRateService.get(),
              Effect.map(
                (mThresholdAssetRate) =>
                  new RateInfoLookup(
                    data.concat(preComputed),
                    Option.map(mThresholdAssetRate, (thresholdAssetRate) =>
                      new BigNumber(this.pairAcceptanceVolumeThreshold).dividedBy(
                        thresholdAssetRate,
                      ),
                    ),
                    baseAsset,
                  ),
              ),
            ),
          ),
          Effect.map((lookup) =>
            pairsWithAssets.map((pair) => ({
              req: pair,
              res: lookup.get({ ...pair, moneyFormat: MoneyFormat.Long }),
            })),
          ),
          Effect.tap((data) =>
            Effect.sync(() => {
              data.forEach((reqAndRes) => {
                if (Option.isSome(reqAndRes.res) && shouldCache) {
                  cacheUnlessCached(reqAndRes.res.value as VolumeAwareRateInfo);
                }
              });
            }),
          ),
          Effect.map((rs) =>
            rs.map((reqAndRes) => ({
              ...reqAndRes,
              res: Option.map(reqAndRes.res, (res) => ({
                ...res,
                amountAsset: res.amountAsset.id,
                priceAsset: res.priceAsset.id,
              })),
            })),
          ),
        );
      }),
    );
  }
}
