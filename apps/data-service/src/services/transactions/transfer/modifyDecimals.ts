import { type Task } from 'folktale/concurrency/task';
import { defaultTo, splitEvery, zipWith } from 'ramda';
import { type AppError } from '../../../errorHandling';
import { type AssetsService } from '../../assets';
import { type TransferTx } from './repo/types';

export const modifyDecimals =
  (assetsService: AssetsService) =>
  (txs: TransferTx[]): Task<AppError, TransferTx[]> =>
    assetsService
      .precisions({
        ids: txs
          .map((tx) => [defaultTo('WAVES', tx.feeAsset), tx.assetId])
          .reduce((acc, cur) => acc.concat(cur), []),
      })
      .map((v) =>
        zipWith(
          (tx, [feeAssetPrecision, assetPrecision]) => ({
            ...tx,
            amount: tx.amount.shiftedBy(-assetPrecision),
            fee: tx.fee.shiftedBy(-feeAssetPrecision),
          }),
          txs,
          splitEvery(v.length / txs.length, v),
        ),
      );
