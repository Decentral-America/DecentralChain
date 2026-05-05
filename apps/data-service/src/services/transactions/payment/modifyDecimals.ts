import { type Task } from 'folktale/concurrency/task';
import { type AppError } from '../../../errorHandling';
import { type AssetsService } from '../../assets';
import { type PaymentTx } from './repo/types';

export const modifyDecimals =
  (assetsService: AssetsService) =>
  (txs: PaymentTx[]): Task<AppError, PaymentTx[]> =>
    assetsService
      .precisions({
        ids: ['WAVES'],
      })
      .map(([assetPrecision]) =>
        txs.map((tx) => ({
          ...tx,
          amount: tx.amount.shiftedBy(-assetPrecision),
          fee: tx.fee.shiftedBy(-assetPrecision),
        })),
      );
