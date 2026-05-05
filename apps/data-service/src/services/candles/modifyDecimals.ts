import { type Task, of as taskOf } from 'folktale/concurrency/task';
import { type AppError } from '../../errorHandling';
import { type CandleInfo } from '../../types';
import { type AssetsService } from '../assets';

export const modifyDecimals =
  <T extends CandleInfo>(assetsService: AssetsService, ids: string[]) =>
  (candles: T[]): Task<AppError, T[]> =>
    assetsService
      .precisions({
        ids,
      })
      .chain(([amountAssetPrecision, priceAssetPrecision]) => {
        const decimals = -8 - priceAssetPrecision + amountAssetPrecision;

        return taskOf(
          candles.map((candle) =>
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
                  quoteVolume: candle.quoteVolume
                    .shiftedBy(-amountAssetPrecision + decimals)
                    .decimalPlaces(priceAssetPrecision),
                  volume: candle.volume
                    .shiftedBy(-amountAssetPrecision)
                    .decimalPlaces(amountAssetPrecision),
                  weightedAveragePrice: candle.weightedAveragePrice
                    .shiftedBy(decimals)
                    .decimalPlaces(-decimals),
                },
          ),
        );
      });
