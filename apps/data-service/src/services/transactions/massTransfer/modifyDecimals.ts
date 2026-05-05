// @ts-nocheck
import { Effect, pipe } from 'effect';
import { type AppError } from '../../../errorHandling';
import { type AssetsService } from '../../assets';
import { type MassTransferTx } from './repo/types';

export const modifyDecimals =
  (assetsService: AssetsService) =>
  (txs: MassTransferTx[]): Effect.Effect<MassTransferTx[], AppError> =>
    pipe(
      assetsService.precisions({
        ids: ['WAVES'].concat(txs.map((tx) => tx.assetId)),
      }),
      Effect.map((precisions) => {
        const feePrecision = precisions.splice(0, 1)[0];
        return txs.map((tx, idx) => ({
          ...tx,
          fee: tx.fee.shiftedBy(-feePrecision),
          transfers: tx.transfers.map((tr) => ({
            ...tr,
            amount: tr.amount.shiftedBy(-precisions[idx]),
          })),
        }));
      }),
    );
