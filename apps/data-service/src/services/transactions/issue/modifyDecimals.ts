// @ts-nocheck
import { Effect, pipe } from 'effect';
import { type AppError } from '../../../errorHandling';
import { type AssetsService } from '../../assets';
import { type IssueTx } from './repo/types';

export const modifyDecimals =
  (assetsService: AssetsService) =>
  (txs: IssueTx[]): Effect.Effect<IssueTx[], AppError> =>
    pipe(
      assetsService.precisions({
        ids: ['WAVES'].concat(txs.map((tx) => tx.assetId)),
      }),
      Effect.map((precisions: number[]) => {
        const feePrecision = precisions.splice(0, 1)[0];
        return txs.map((tx, idx) => ({
          ...tx,
          fee: tx.fee.shiftedBy(-feePrecision),
          quantity: tx.quantity.shiftedBy(-precisions[idx]),
        }));
      }),
    );
