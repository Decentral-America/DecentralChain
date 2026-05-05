import { Effect, pipe } from 'effect';
import { type AppError } from '../../errorHandling';
import { type CandleInfo } from '../../types';
import { type AssetsService } from '../assets';

export const modifyDecimals =
  <T extends CandleInfo>(assetsService: AssetsService, ids: string[]) =>
  (candles: T[]): Effect.Effect<T[], AppError> =>
    pipe(
      assetsService.precisions({ ids }),
      Effect.map(([amountAssetPrecision, priceAssetPrecision]) => {
        const ap = amountAssetPrecision as number;
        const pp = priceAssetPrecision as number;
        const decimals = -8 - pp + ap;
        return candles.map((candle) =>
          candle.txsCount === 0
            ? candle
            : {
                ...candle,
                close:
                  candle.close === null
                    ? null
                    : candle.close.shiftedBy(decimals).decimalPlaces(-decimals),
                high: candle.high.shiftedBy(decimals).decimalPlaces(-decimals),
                low: candle.low.shiftedBy(decimals).decimalPlaces(-decimals),
                open:
                  candle.open === null
                    ? null
                    : candle.open.shiftedBy(decimals).decimalPlaces(-decimals),
                quoteVolume: candle.quoteVolume.shiftedBy(-ap + decimals).decimalPlaces(pp),
                volume: candle.volume.shiftedBy(-ap).decimalPlaces(ap),
                weightedAveragePrice: candle.weightedAveragePrice
                  .shiftedBy(decimals)
                  .decimalPlaces(-decimals),
              },
        );
      }),
    );
