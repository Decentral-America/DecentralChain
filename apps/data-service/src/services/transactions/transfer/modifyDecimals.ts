import { type Effect, pipe } from 'effect';
import * as EffectLib from 'effect/Effect';
import { defaultTo, splitEvery, zipWith } from 'ramda';
import { type AppError } from '../../../errorHandling';
import { type AssetsService } from '../../assets';
import { type TransferTx } from './repo/types';

export const modifyDecimals =
  (assetsService: AssetsService) =>
  (txs: TransferTx[]): Effect.Effect<TransferTx[], AppError> =>
    pipe(
      assetsService.precisions({
        ids: txs
          .map((tx) => [defaultTo('DCC', tx.feeAsset), tx.assetId])
          .reduce((acc, cur) => acc.concat(cur), []),
      }),
      EffectLib.map((v) =>
        zipWith(
          (tx, prec: (number | undefined)[]) => ({
            ...tx,
            amount: tx.amount.shiftedBy(-(prec[1] ?? 0)),
            fee: tx.fee.shiftedBy(-(prec[0] ?? 0)),
          }),
          txs,
          splitEvery(v.length / txs.length, v) as (number | undefined)[][],
        ),
      ),
    );
