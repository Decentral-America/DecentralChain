import { type Asset, BigNumber } from '@decentralchain/data-entities';
import { rejected, type Task } from 'folktale/concurrency/task';
import { type Maybe, of as maybeOf } from 'folktale/maybe';
import { sequence, splitEvery } from 'ramda';

import { AppError, type DbError, type Timeout } from '../../errorHandling';
import { type RateInfo, type RateMgetParams, type RateWithPairIds } from '../../types';
import { collect } from '../../utils/collection';
import { isEmpty } from '../../utils/fp/maybeOps';
import { tap } from '../../utils/tap';
import { type AssetsService } from '../assets';
import { type PairsService } from '../pairs';
import { MoneyFormat } from '../types';

import { type AsyncMget, partitionByPreComputed, type RateCache } from './repo';
import { type RateCacheKey } from './repo/impl/RateCache';
import RateInfoLookup from './repo/impl/RateInfoLookup';
import { type IThresholdAssetRateService } from './ThresholdAssetRateService';

type ReqAndRes<TReq, TRes> = {
  req: TReq;
  res: Maybe<TRes>;
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
  constructor(
    private readonly baseAssetId: string,
    private readonly cache: RateCache,
    private readonly remoteGet: AsyncMget<RateMgetParams, RateWithPairIds, DbError | Timeout>,
    private readonly pairs: PairsService,
    private readonly pairAcceptanceVolumeThreshold: number,
    private readonly thresholdAssetRateService: IThresholdAssetRateService,
    private readonly assetsService: AssetsService,
  ) {}

  mget(
    request: RateMgetParams,
  ): Task<AppError | DbError | Timeout, ReqAndRes<AssetPair, RateWithPairIds>[]> {
    const { pairs, timestamp, matcher } = request;

    const shouldCache = isEmpty(timestamp);

    const getCacheKey = (pair: AssetPair): RateCacheKey => ({
      matcher,
      pair,
    });

    const cacheUnlessCached = (item: VolumeAwareRateInfo) => {
      const key = getCacheKey(item);
      if (!this.cache.has(key)) {
        this.cache.set(key, item);
      }
    };

    const cacheAllUnlessCached = (items: Array<VolumeAwareRateInfo>) =>
      items.forEach((it) => cacheUnlessCached(it));

    const ids = pairs.reduce((acc, cur) => {
      acc.push(cur.amountAsset, cur.priceAsset);
      return acc;
    }, [] as string[]);

    ids.push(this.baseAssetId);

    return this.assetsService.mget({ ids }).chain((ms) =>
      sequence<Maybe<Asset>, Maybe<Asset[]>>(maybeOf, ms).matchWith({
        Just: ({ value: assets }) => {
          const baseAsset = assets.pop() as Asset;

          const pairsWithAssets = splitEvery(2, assets).map(([amountAsset, priceAsset]) => ({
            amountAsset,
            priceAsset,
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

          return this.remoteGet
            .mget({
              matcher,
              pairs: toBeRequested.map((pair) => ({
                amountAsset: pair.amountAsset.id,
                priceAsset: pair.priceAsset.id,
              })),
              timestamp,
            })
            .chain((pairsWithRates) =>
              this.pairs
                .mget({
                  matcher: request.matcher,
                  // NB: affect volumeWaves, that is compared with threshold in RateInfoLookup
                  // should be float mutually with mPairAcceptanceVolumeThreshold, passed to RateInfoLookup
                  moneyFormat: MoneyFormat.Float,
                  pairs: pairsWithRates,
                })
                .map((foundPairs) =>
                  foundPairs.map((itm, idx) =>
                    itm
                      .map((pair) => ({
                        amountAsset: assetsMap[pair.amountAsset],
                        priceAsset: assetsMap[pair.priceAsset],
                        rate: pairsWithRates[idx].rate,
                        volumeWaves: pair.volumeWaves as BigNumber,
                      }))
                      .getOrElse<VolumeAwareRateInfo>({
                        amountAsset: assetsMap[pairsWithRates[idx].amountAsset],
                        priceAsset: assetsMap[pairsWithRates[idx].priceAsset],
                        rate: pairsWithRates[idx].rate,
                        volumeWaves: new BigNumber(0),
                      }),
                  ),
                ),
            )
            .map(
              tap((results: Array<VolumeAwareRateInfo>) => {
                if (shouldCache) cacheAllUnlessCached(results);
              }),
            )
            .chain((data: Array<VolumeAwareRateInfo>) =>
              this.thresholdAssetRateService.get().map(
                (mThresholdAssetRate) =>
                  new RateInfoLookup(
                    data.concat(preComputed),
                    mThresholdAssetRate.map((thresholdAssetRate) =>
                      new BigNumber(this.pairAcceptanceVolumeThreshold).dividedBy(
                        thresholdAssetRate,
                      ),
                    ),
                    baseAsset,
                  ),
              ),
            )
            .map((lookup) =>
              pairsWithAssets.map((pair) => ({
                req: pair,
                res: lookup.get({
                  ...pair,
                  moneyFormat: MoneyFormat.Long,
                }),
              })),
            )
            .map(
              tap((data) => {
                data.forEach((reqAndRes) =>
                  reqAndRes.res.map(
                    tap((res) => {
                      if (shouldCache) {
                        cacheUnlessCached(res);
                      }
                    }),
                  ),
                );
              }),
            )
            .map((rs) =>
              rs.map((reqAndRes) => ({
                ...reqAndRes,
                res: reqAndRes.res.map<RateWithPairIds>((res) => ({
                  ...res,
                  amountAsset: res.amountAsset.id,
                  priceAsset: res.priceAsset.id,
                })),
              })),
            );
        },
        Nothing: () =>
          rejected(
            AppError.Validation(
              'Some of the assets of specified pairs do not exist in the blockchain',
              {
                ids: collect<Maybe<Asset>, number>((m, idx) => (isEmpty(m) ? idx : undefined))(
                  ms,
                ).map((idx) => ids[idx]),
              },
            ),
          ) as any,
      }),
    );
  }
}
