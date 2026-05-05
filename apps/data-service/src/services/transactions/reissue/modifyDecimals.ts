import { type Task } from 'folktale/concurrency/task';
import { zipWith } from 'ramda';
import { type AppError } from '../../../errorHandling';
import { type AssetsService } from '../../assets';
import { type ReissueTx } from './repo/types';

export const modifyDecimals =
  (assetsService: AssetsService) =>
  (txs: ReissueTx[]): Task<AppError, ReissueTx[]> =>
    assetsService
      .precisions({
        ids: ['WAVES'].concat(txs.map((tx) => tx.assetId)),
      })
      .map((precisions) => {
        const feePrecision = precisions.splice(0, 1)[0];
        return zipWith(
          (tx, assetPrecision) => ({
            ...tx,
            fee: tx.fee.shiftedBy(-feePrecision),
            quantity: tx.quantity.shiftedBy(-assetPrecision),
          }),
          txs,
          precisions,
        );
      });
