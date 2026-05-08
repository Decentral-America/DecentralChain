import { type BigNumber } from '@decentralchain/data-entities';
import { Effect, pipe } from 'effect';
import { type AppError } from '../../../errorHandling';
import { type AssetsService } from '../../assets';

export const modifyFeeDecimals =
  <T extends { fee: BigNumber; feeAsset?: string }>(assetsService: AssetsService) =>
  (txs: T[]): Effect.Effect<T[], AppError> =>
    pipe(
      assetsService.precisions({ ids: ['WAVES'] }),
      Effect.map(([feeAssetPrecision = 0]) =>
        txs.map((tx) => ({
          ...tx,
          fee: tx.fee.shiftedBy(-feeAssetPrecision),
        })),
      ),
    );
