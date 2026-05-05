import { type Effect, pipe } from 'effect';
import * as EffectLib from 'effect/Effect';
import { zipWith } from 'ramda';
import { type AppError } from '../../../errorHandling';
import { type AssetsService } from '../../assets';
import { type ReissueTx } from './repo/types';

export const modifyDecimals =
  (assetsService: AssetsService) =>
  (txs: ReissueTx[]): Effect.Effect<ReissueTx[], AppError> =>
    pipe(
      assetsService.precisions({
        ids: ['WAVES'].concat(txs.map((tx) => tx.assetId)),
      }),
      EffectLib.map((precisions) => {
        const feePrecision = precisions.splice(0, 1)[0] ?? 0;
        return zipWith(
          (tx, assetPrecision: number | undefined) => ({
            ...tx,
            fee: tx.fee.shiftedBy(-feePrecision),
            quantity: tx.quantity.shiftedBy(-(assetPrecision ?? 0)),
          }),
          txs,
          precisions,
        );
      }),
    );
