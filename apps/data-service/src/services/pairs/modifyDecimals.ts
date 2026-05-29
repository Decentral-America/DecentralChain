import { Effect, pipe } from 'effect';
import { type AppError } from '../../errorHandling';
import { type AssetIdsPair, type PairInfo } from '../../types';
import { type AssetsService } from '../assets';

export const modifyDecimals =
  <T extends PairInfo & AssetIdsPair>(assetsService: AssetsService) =>
  (pairs: T[]): Effect.Effect<T[], AppError> =>
    pipe(
      assetsService.precisions({
        ids: pairs.reduce<string[]>(
          (acc, pair) => acc.concat([pair.amountAsset, pair.priceAsset]),
          [],
        ),
      }),
      Effect.map((precisions) =>
        pairs.map((pair, idx) => {
          const amountAssetDecimals = precisions[idx * 2] as number;
          const priceAssetDecimals = precisions[idx * 2 + 1] as number;
          const priceDecimals = -8 - priceAssetDecimals + amountAssetDecimals;
          return {
            ...pair,
            firstPrice: pair.firstPrice.shiftedBy(priceDecimals),
            high: pair.high.shiftedBy(priceDecimals),
            lastPrice: pair.lastPrice.shiftedBy(priceDecimals),
            low: pair.low.shiftedBy(priceDecimals),
            quoteVolume: pair.quoteVolume.shiftedBy(priceDecimals - amountAssetDecimals),
            volume: pair.volume.shiftedBy(-amountAssetDecimals),
            volumeDcc:
              pair.volumeDcc === null
                ? null
                : pair.amountAsset === 'DCC'
                  ? pair.volumeDcc.shiftedBy(-amountAssetDecimals)
                  : pair.priceAsset === 'DCC'
                    ? pair.volumeDcc.shiftedBy(priceDecimals - amountAssetDecimals)
                    : pair.volumeDcc.shiftedBy(priceDecimals - 8 - amountAssetDecimals),
            weightedAveragePrice: pair.weightedAveragePrice.shiftedBy(priceDecimals),
          };
        }),
      ),
    );
