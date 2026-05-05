import { type Task, of as taskOf } from 'folktale/concurrency/task';
import { type AppError } from '../../errorHandling';
import { type AssetIdsPair, type PairInfo } from '../../types';
import { type AssetsService } from '../assets';

export const modifyDecimals =
  <T extends PairInfo & AssetIdsPair>(assetsService: AssetsService) =>
  (pairs: T[]): Task<AppError, T[]> =>
    assetsService
      .precisions({
        ids: pairs.reduce<string[]>(
          (acc, pair) => acc.concat([pair.amountAsset, pair.priceAsset]),
          [],
        ),
      })
      .chain((precisions: number[]) => {
        return taskOf(
          pairs.map((pair, idx) => {
            const amountAssetDecimals = precisions[idx * 2];
            const priceAssetDecimals = precisions[idx * 2 + 1];
            const priceDecimals = -8 - priceAssetDecimals + amountAssetDecimals;

            return {
              ...pair,
              firstPrice: pair.firstPrice.shiftedBy(priceDecimals),
              high: pair.high.shiftedBy(priceDecimals),
              lastPrice: pair.lastPrice.shiftedBy(priceDecimals),
              low: pair.low.shiftedBy(priceDecimals),
              quoteVolume: pair.quoteVolume.shiftedBy(priceDecimals - amountAssetDecimals),
              volume: pair.volume.shiftedBy(-amountAssetDecimals),
              volumeWaves:
                pair.volumeWaves === null
                  ? null
                  : pair.amountAsset === 'WAVES'
                    ? pair.volumeWaves.shiftedBy(-amountAssetDecimals)
                    : pair.priceAsset === 'WAVES'
                      ? pair.volumeWaves.shiftedBy(priceDecimals - amountAssetDecimals)
                      : pair.volumeWaves.shiftedBy(priceDecimals - 8 - amountAssetDecimals),
              weightedAveragePrice: pair.weightedAveragePrice.shiftedBy(priceDecimals),
            };
          }),
        );
      });
