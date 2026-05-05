import { BigNumber } from '@decentralchain/data-entities';
import { Effect, Option, pipe } from 'effect';
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
    pipe(
      estimator.mget(request),
      Effect.map((data) =>
        data.map((item) => ({
          amountAsset: item.req.amountAsset.id,
          priceAsset: item.req.priceAsset.id,
          rate: Option.isSome(item.res) ? item.res.value.rate : new BigNumber(0),
        })),
      ),
      Effect.flatMap((items) => {
        if (request.moneyFormat === MoneyFormat.Long) {
          return Effect.succeed(items.map((r) => ({ ...r, rate: r.rate.decimalPlaces(0) })));
        }
        return pipe(
          assets.precisions({
            ids: items.reduce<string[]>(
              (acc, item) => acc.concat([item.amountAsset, item.priceAsset]),
              [],
            ),
          }),
          Effect.map((precisions) =>
            items.map((item, idx) => ({
              ...item,
              rate: item.rate.shiftedBy(
                -8 - (precisions[idx * 2 + 1] as number) + (precisions[idx * 2] as number),
              ),
            })),
          ),
        );
      }),
    );
}
