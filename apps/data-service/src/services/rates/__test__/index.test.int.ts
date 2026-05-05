// @ts-nocheck
import { BigNumber } from '@decentralchain/data-entities';
import { Effect, Option, pipe } from 'effect';

// common
import { createPgDriver } from '../../../db';
import createEventBus from '../../../eventBus';
import { loadConfig } from '../../../loadConfig';
import { isEmpty } from '../../../utils/fp/optionOps';
import { SortOrder } from '../../_common';
import { type EmitEvent } from '../../_common/createResolver/types';
import createAssetsService from '../../assets';
// assets
import { create as createAssetsCache } from '../../assets/repo/cache';
import createAssetsRepo from '../../assets/repo/index';
import createPairsService from '../../pairs';
import createPairsRepo from '../../pairs/repo';
// pairs
import { create as createPairsCache } from '../../pairs/repo/cache';
import { MoneyFormat } from '../../types';
// rates
import createRateService from '..';
import RateCacheImpl from '../repo/impl/RateCache';
import RemoteRateRepo from '../repo/impl/RemoteRateRepo';
import { ThresholdAssetRateService } from '../ThresholdAssetRateService';

const options = loadConfig();
const pgDriver = createPgDriver(options);

const eventBus = createEventBus();

const emitEvent: EmitEvent =
  (name: string) =>
  <A>(o: A) =>
    eventBus.emit(name, o);

const commonDeps = {
  drivers: {
    pg: pgDriver,
  },
  emitEvent,
};
const ratesCache = new RateCacheImpl(200000, 60000);
const pairsCache = createPairsCache(1000, 5000);
const assetsCache = createAssetsCache(10000, 60000);

const assetsRepo = createAssetsRepo({
  ...commonDeps,
  cache: assetsCache,
});
const assets = createAssetsService(assetsRepo);

const pairsRepo = createPairsRepo({ ...commonDeps, cache: pairsCache });
const pairsNoAsyncValidation = createPairsService(
  pairsRepo,
  () => Effect.succeed(undefined as undefined),
  assets,
);

const thresholdAssetRateService = new ThresholdAssetRateService(
  options.thresholdAssetId,
  options.matcher.defaultMatcherAddress,
  pairsNoAsyncValidation,
  emitEvent('log'),
);

const rateRepo = new RemoteRateRepo(commonDeps.drivers.pg);

const ratesService = createRateService({
  assets,
  baseAssetId: options.rateBaseAssetId,
  cache: ratesCache,
  emitEvent: commonDeps.emitEvent,
  pairAcceptanceVolumeThreshold: options.pairAcceptanceVolumeThreshold,
  pairs: pairsNoAsyncValidation,
  repo: rateRepo,
  thresholdAssetRateService: thresholdAssetRateService,
});

describe('Rates', () => {
  it('should return direct rate', async () => {
    await Effect.runPromise(
      pipe(
        thresholdAssetRateService.get(),
        Effect.flatMap((mRate) => {
          if (isEmpty(mRate)) {
            return Effect.fail(new Error('Cannot calculate threshold rate'));
          }
          const rate = (mRate as Option.Some<BigNumber>).value;
          const thresholdWaves = new BigNumber(options.pairAcceptanceVolumeThreshold).dividedBy(
            rate,
          );
          return pipe(
            pairsNoAsyncValidation.search({
              limit: 10,
              matcher: options.matcher.defaultMatcherAddress,
              moneyFormat: MoneyFormat.Float,
              sort: SortOrder.Descending,
            }),
            Effect.map((pairs) =>
              pairs.items
                .filter((pair) => pair.priceAsset !== options.rateBaseAssetId)
                .find((pair) => {
                  if (pair.volumeWaves == null) return false;
                  return pair.volumeWaves.isGreaterThanOrEqualTo(thresholdWaves);
                }),
            ),
          );
        }),
        Effect.flatMap((pair) => {
          if (typeof pair === 'undefined') {
            return Effect.fail(new Error('Pair with volume greater then threshold not found'));
          }
          const t1 = pipe(
            rateRepo.mget({
              matcher: options.matcher.defaultMatcherAddress,
              pairs: [pair],
              timestamp: Option.none(),
            }),
            Effect.map((rates) => {
              if (rates.length === 0)
                throw new Error(`Rate for pair ${pair.amountAsset}/${pair.priceAsset} not found`);
              return rates[0]?.rate;
            }),
          );
          const t2 = pipe(
            ratesService({
              matcher: options.matcher.defaultMatcherAddress,
              moneyFormat: MoneyFormat.Long,
              pairs: [{ amountAsset: pair.amountAsset, priceAsset: pair.priceAsset }],
              timestamp: Option.none(),
            }),
            Effect.map((rates) => {
              if (rates.length === 0)
                throw new Error(`Rate for pair ${pair.amountAsset}/${pair.priceAsset} not found`);
              return rates[0]?.rate;
            }),
          );
          return pipe(
            Effect.all([t1, t2] as const),
            // biome-ignore lint/suspicious/useIterableCallbackReturn: Effect.map is not Array.map
            Effect.map(([r1, r2]) => {
              expect(r1).toEqual(r2);
            }),
          );
        }),
        Effect.mapError((e) => {
          throw e instanceof Error ? e : new Error(String(e));
        }),
      ),
    );
  });

  it('should return rate derived via specified baseAsset', async () => {
    await Effect.runPromise(
      pipe(
        thresholdAssetRateService.get(),
        Effect.flatMap((mRate) => {
          if (isEmpty(mRate)) return Effect.fail(new Error('Cannot calculate threshold rate'));
          const rate = (mRate as Option.Some<BigNumber>).value;
          const thresholdWaves = new BigNumber(options.pairAcceptanceVolumeThreshold).dividedBy(
            rate,
          );
          return pipe(
            pairsNoAsyncValidation.search({
              limit: 10,
              matcher: options.matcher.defaultMatcherAddress,
              moneyFormat: MoneyFormat.Float,
              sort: SortOrder.Descending,
            }),
            Effect.map((pairs) =>
              pairs.items
                .filter((pair) => pair.priceAsset !== options.rateBaseAssetId)
                .find((pair) => {
                  if (pair.volumeWaves == null) return false;
                  return pair.volumeWaves.isLessThan(thresholdWaves);
                }),
            ),
          );
        }),
        Effect.flatMap((pair) => {
          if (typeof pair === 'undefined')
            return Effect.fail(new Error('Pair with volume less then threshold not found'));
          const t1 = pipe(
            rateRepo.mget({
              matcher: options.matcher.defaultMatcherAddress,
              pairs: [pair],
              timestamp: Option.none(),
            }),
            Effect.map((rates) => {
              if (rates.length === 0)
                throw new Error(`Rate for pair ${pair.amountAsset}/${pair.priceAsset} not found`);
              return rates[0]?.rate;
            }),
          );
          const t2 = pipe(
            ratesService({
              matcher: options.matcher.defaultMatcherAddress,
              moneyFormat: MoneyFormat.Long,
              pairs: [pair],
              timestamp: Option.none(),
            }),
            Effect.map((rates) => {
              if (rates.length === 0)
                throw new Error(`Rate for pair ${pair.amountAsset}/${pair.priceAsset} not found`);
              return rates[0]?.rate;
            }),
          );
          return pipe(
            Effect.all([t1, t2] as const),
            // biome-ignore lint/suspicious/useIterableCallbackReturn: Effect.map is not Array.map
            Effect.map(([r1, r2]) => {
              expect(r1).not.toEqual(r2);
            }),
          );
        }),
        Effect.mapError((e) => {
          throw e instanceof Error ? e : new Error(String(e));
        }),
      ),
    );
  });
});
