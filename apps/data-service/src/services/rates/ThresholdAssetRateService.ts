import { type BigNumber } from '@decentralchain/data-entities';
import { type Task, of as taskOf } from 'folktale/concurrency/task';
import { empty, type Maybe, of as maybeOf } from 'folktale/maybe';
import * as LRU from 'lru-cache';
import { WavesId } from '../..';
import { type AppError } from '../../errorHandling';
import { type PairsService } from '../pairs';
import { MoneyFormat } from '../types';

type LogRow = {
  message: string;
  data: any;
};

type Logger = (l: LogRow) => void;

export interface IThresholdAssetRateService {
  get(): Task<AppError, Maybe<BigNumber>>;
}

export class ThresholdAssetRateService implements IThresholdAssetRateService {
  private cache: LRU<string, BigNumber>;

  constructor(
    private readonly thresholdAssetId: string,
    private readonly matcherAddress: string,
    private readonly pairsService: PairsService,
    private readonly logger: Logger,
  ) {
    this.cache = new LRU({ maxAge: 60000 });
  }

  get(): Task<AppError, Maybe<BigNumber>> {
    const rate = this.cache.get(this.thresholdAssetId);
    if (rate === undefined) {
      // rate was not set or is stale
      return this.pairsService
        .get({
          matcher: this.matcherAddress,
          moneyFormat: MoneyFormat.Long,
          pair: {
            amountAsset: WavesId,
            priceAsset: this.thresholdAssetId,
          },
        })
        .chain((m) => {
          return m.matchWith({
            Just: ({ value }) => {
              if (value === null) {
                this.logger({
                  data: `Rate for pair WAVES/${this.thresholdAssetId} not found`,
                  message: 'GET_THRESHOLD_RATE',
                });
                return taskOf(empty());
              }
              this.cache.set(this.thresholdAssetId, value.weightedAveragePrice);
              return taskOf(maybeOf(value.weightedAveragePrice));
            },
            Nothing: () => {
              this.logger({
                data: `Pair WAVES/${this.thresholdAssetId} not found`,
                message: 'GET_THRESHOLD_RATE',
              });
              return taskOf(empty());
            },
          });
        });
    } else {
      return taskOf(maybeOf(rate));
    }
  }
}
