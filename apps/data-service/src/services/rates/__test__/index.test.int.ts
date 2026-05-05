import { BigNumber } from '@decentralchain/data-entities';
import { of as taskOf } from 'folktale/concurrency/task';
import { empty } from 'folktale/maybe';

// common
import { createPgDriver } from '../../../db';
import createEventBus from '../../../eventBus';
import { loadConfig } from '../../../loadConfig';
import { isEmpty } from '../../../utils/fp/maybeOps';
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
const pairsNoAsyncValidation = createPairsService(pairsRepo, () => taskOf(undefined), assets);

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
  // Test case:
  // 1. Calculate thresholdWaves in Waves using thresholdAssetRateService and acceptance volume threshold
  // 2. Find pair P with volumeWaves greater or equal to thresholdWaves
  // 3. Get rate R1 for pair P via rateRepo
  // 4. Get rate R2 for pair P via ratesService
  // 5. Compare R1 with R2, it should be equal
  it('should return direct rate', async () => {
    await thresholdAssetRateService
      .get()
      .chain((mRate) => {
        if (isEmpty(mRate)) {
          throw new Error('Cannot calculate threshold rate');
        }
        const rate = mRate.unsafeGet();

        // 1.
        const thresholdWaves = new BigNumber(options.pairAcceptanceVolumeThreshold).dividedBy(rate);

        // 2.
        return pairsNoAsyncValidation
          .search({
            limit: 10,
            matcher: options.matcher.defaultMatcherAddress,
            moneyFormat: MoneyFormat.Float,
            sort: SortOrder.Descending,
          })
          .map((pairs) => {
            return pairs.items
              .filter((pair) => pair.priceAsset != options.rateBaseAssetId)
              .find((pair) => {
                if (pair.volumeWaves == null) {
                  return false;
                }

                return pair.volumeWaves.isGreaterThanOrEqualTo(thresholdWaves);
              });
          });
      })
      .chain((pair) => {
        if (typeof pair === 'undefined') {
          throw new Error('Pair with volume greater then threshold not found');
        }

        const t1 = rateRepo
          .mget({
            matcher: options.matcher.defaultMatcherAddress,
            pairs: [pair],
            timestamp: empty(),
          })
          .map((rates) => {
            if (rates.length === 0) {
              throw new Error(`Rate for pair ${pair.amountAsset}/${pair.priceAsset} not found`);
            }

            return rates[0].rate;
          });

        const t2 = ratesService({
          matcher: options.matcher.defaultMatcherAddress,
          moneyFormat: MoneyFormat.Long,
          pairs: [{ amountAsset: pair.amountAsset, priceAsset: pair.priceAsset }],
          timestamp: empty(),
        }).map((rates) => {
          if (rates.length === 0) {
            throw new Error(`Rate for pair ${pair.amountAsset}/${pair.priceAsset} not found`);
          }

          return rates[0].rate;
        });

        return t1.and(t2).map(([r1, r2]) => {
          expect(r1).toEqual(r2);
        });
      })
      .run()
      .promise();
  });

  // Test case:
  // 1. Calculate thresholdWaves in Waves using thresholdAssetRateService and acceptance volume threshold
  // 2. Find pair P with volumeWaves less than thresholdWaves
  // 3. Get rate R1 for pair P via rateRepo
  // 4. Get rate R2 for pair P via ratesService
  // 5. Compare R1 with R2, it should not be equal
  it('should return rate derived via specified baseAsset', async () => {
    await thresholdAssetRateService
      .get()
      .chain((mRate) => {
        if (isEmpty(mRate)) {
          throw new Error('Cannot calculate threshold rate');
        }

        const rate = mRate.unsafeGet();

        // 1.
        const thresholdWaves = new BigNumber(options.pairAcceptanceVolumeThreshold).dividedBy(rate);

        // 2.
        return pairsNoAsyncValidation
          .search({
            limit: 10,
            matcher: options.matcher.defaultMatcherAddress,
            moneyFormat: MoneyFormat.Float,
            sort: SortOrder.Descending,
          })
          .map((pairs) => {
            return pairs.items
              .filter((pair) => pair.priceAsset != options.rateBaseAssetId)
              .find((pair) => {
                if (pair.volumeWaves == null) {
                  return false;
                }

                return pair.volumeWaves.isLessThan(thresholdWaves);
              });
          });
      })
      .chain((pair) => {
        if (typeof pair === 'undefined') {
          throw new Error('Pair with volume less then threshold not found');
        }

        // 3.
        const t1 = rateRepo
          .mget({
            matcher: options.matcher.defaultMatcherAddress,
            pairs: [pair],
            timestamp: empty(),
          })
          .map((rates) => {
            if (rates.length === 0) {
              throw new Error(`Rate for pair ${pair.amountAsset}/${pair.priceAsset} not found`);
            }

            return rates[0].rate;
          });

        // 4.
        const t2 = ratesService({
          matcher: options.matcher.defaultMatcherAddress,
          moneyFormat: MoneyFormat.Long,
          pairs: [pair],
          timestamp: empty(),
        }).map((rates) => {
          if (rates.length === 0) {
            throw new Error(`Rate for pair ${pair.amountAsset}/${pair.priceAsset} not found`);
          }

          return rates[0].rate;
        });

        return t1.and(t2).map(([r1, r2]) => {
          expect(r1).not.toEqual(r2);
        });
      })
      .run()
      .promise();
  });
});
