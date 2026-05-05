import { type BigNumber } from '@decentralchain/data-entities';
import { Effect, Option, pipe } from 'effect';
import { LRUCache } from 'lru-cache';
import { WavesId } from '../..';
import { type AppError } from '../../errorHandling';
import { type PairsService } from '../pairs';
import { MoneyFormat } from '../types';

type LogRow = { message: string; data: any };
type Logger = (l: LogRow) => void;

export interface IThresholdAssetRateService {
  get(): Effect.Effect<Option.Option<BigNumber>, AppError>;
}

export class ThresholdAssetRateService implements IThresholdAssetRateService {
  private cache: LRUCache<string, BigNumber>;
  private readonly thresholdAssetId: string;
  private readonly matcherAddress: string;
  private readonly pairsService: PairsService;
  private readonly logger: Logger;

  constructor(
    thresholdAssetId: string,
    matcherAddress: string,
    pairsService: PairsService,
    logger: Logger,
  ) {
    this.thresholdAssetId = thresholdAssetId;
    this.matcherAddress = matcherAddress;
    this.pairsService = pairsService;
    this.logger = logger;
    this.cache = new LRUCache({ max: 1, ttl: 60_000 });
  }

  get(): Effect.Effect<Option.Option<BigNumber>, AppError> {
    const cached = Option.fromNullable(this.cache.get(this.thresholdAssetId));
    if (Option.isSome(cached)) {
      return Effect.succeed(cached);
    }

    return pipe(
      this.pairsService.get({
        matcher: this.matcherAddress,
        moneyFormat: MoneyFormat.Long,
        pair: { amountAsset: WavesId, priceAsset: this.thresholdAssetId },
      }),
      Effect.map((m) => {
        if (Option.isNone(m)) {
          this.logger({
            data: `Pair WAVES/${this.thresholdAssetId} not found`,
            message: 'GET_THRESHOLD_RATE',
          });
          return Option.none<BigNumber>();
        }
        const value = m.value;
        if (value === null) {
          this.logger({
            data: `Rate for pair WAVES/${this.thresholdAssetId} not found`,
            message: 'GET_THRESHOLD_RATE',
          });
          return Option.none<BigNumber>();
        }
        this.cache.set(this.thresholdAssetId, value.weightedAveragePrice);
        return Option.some(value.weightedAveragePrice);
      }),
    );
  }
}
