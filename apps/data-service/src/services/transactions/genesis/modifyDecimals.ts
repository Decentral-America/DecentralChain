import { Effect, pipe } from 'effect';
import { type AppError } from '../../../errorHandling';
import { type AssetsService } from '../../assets';
import { type GenesisTx } from './repo/types';

export const modifyDecimals =
  (assetsService: AssetsService) =>
  (txs: GenesisTx[]): Effect.Effect<GenesisTx[], AppError> =>
    pipe(
      assetsService.precisions({
        ids: ['WAVES'],
      }),
      Effect.map(([assetPrecision = 0]) =>
        txs.map((tx) => ({
          ...tx,
          amount: tx.amount.shiftedBy(-assetPrecision),
          fee: tx.fee.shiftedBy(-assetPrecision),
        })),
      ),
    );
