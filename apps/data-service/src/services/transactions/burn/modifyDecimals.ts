import { type Task } from 'folktale/concurrency/task';
import { type AppError } from '../../../errorHandling';
import { type AssetsService } from '../../assets';
import { type BurnTx } from './repo/types';

export const modifyDecimals =
  (assetsService: AssetsService) =>
  (txs: BurnTx[]): Task<AppError, BurnTx[]> =>
    assetsService
      .precisions({
        ids: ['WAVES'].concat(txs.map((tx) => tx.assetId)),
      })
      .map((precisions) => {
        const feePrecision = precisions.splice(0, 1)[0];
        return txs.map((tx, idx) => ({
          ...tx,
          amount: tx.amount.shiftedBy(-precisions[idx]),
          fee: tx.fee.shiftedBy(-feePrecision),
        }));
      });
