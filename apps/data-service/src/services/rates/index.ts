import { BigNumber } from '@decentralchain/data-entities';
import { of as taskOf } from 'folktale/concurrency/task';
import { type RateMgetParams, type RateWithPairIds, type Service } from '../../types';
import { type RateSerivceCreatorDependencies } from '..';
import { MoneyFormat, type WithMoneyFormat } from '../types';
import RateEstimator from './RateEstimator';

export { default as RateCacheImpl } from './repo/impl/RateCache';

export type RatesMgetService = Service<RateMgetParams & WithMoneyFormat, RateWithPairIds[]>;

export default function ({
  repo,
  cache,
  assets,
  pairs,
  baseAssetId,
  pairAcceptanceVolumeThreshold,
  thresholdAssetRateService,
}: RateSerivceCreatorDependencies): RatesMgetService {
  const estimator = new RateEstimator(
    baseAssetId,
    cache,
    repo,
    pairs,
    pairAcceptanceVolumeThreshold,
    thresholdAssetRateService,
    assets,
  );

  return (request: RateMgetParams & WithMoneyFormat) =>
    estimator
      .mget(request)
      .map((data) =>
        data.map((item) => ({
          amountAsset: item.req.amountAsset.id,
          priceAsset: item.req.priceAsset.id,
          rate: item.res.fold(
            () => new BigNumber(0),
            (it) => it.rate,
          ),
        })),
      )
      .chain((items) =>
        request.moneyFormat === MoneyFormat.Long
          ? taskOf(
              items.map((r) => ({
                ...r,
                rate: r.rate.decimalPlaces(0),
              })),
            )
          : assets
              .precisions({
                ids: items.reduce<string[]>(
                  (acc, item) => acc.concat([item.amountAsset, item.priceAsset]),
                  [],
                ),
              })
              .map((precisions) =>
                items.map((item, idx) => ({
                  ...item,
                  rate: item.rate.shiftedBy(-8 - precisions[idx * 2 + 1] + precisions[idx * 2]),
                })),
              ),
      );
}
