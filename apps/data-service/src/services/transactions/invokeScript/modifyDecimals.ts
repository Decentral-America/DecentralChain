import { type Task } from 'folktale/concurrency/task';
import { defaultTo } from 'ramda';
import { type AppError } from '../../../errorHandling';
import { type AssetsService } from '../../assets';
import { type InvokeScriptTx } from './repo/types';

export const modifyDecimals =
  (assetsService: AssetsService) =>
  (txs: InvokeScriptTx[]): Task<AppError, InvokeScriptTx[]> =>
    assetsService
      .precisions({
        ids: txs
          .map((tx) => [defaultTo('WAVES', tx.feeAssetId)].concat(tx.payment.map((p) => p.assetId)))
          .reduce((acc, cur) => acc.concat(cur), []),
      })
      .map((precisions: number[]) =>
        txs.map((tx) => {
          const currentTxValues = precisions.splice(0, 1 + tx.payment.length);
          return {
            ...tx,
            fee: tx.fee.shiftedBy(-currentTxValues[0]),
            payment: tx.payment.map((p, idx) => ({
              ...p,
              amount: p.amount.shiftedBy(-currentTxValues[idx + 1]),
            })),
          };
        }),
      );
