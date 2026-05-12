import { type Effect, pipe } from 'effect';
import * as EffectLib from 'effect/Effect';
import { type AppError } from '../../../errorHandling';
import { type AssetsService } from '../..//assets';
import { type LeaseTx } from './repo/types';

export const modifyDecimals =
  (assetsService: AssetsService) =>
  (txs: LeaseTx[]): Effect.Effect<LeaseTx[], AppError> =>
    pipe(
      assetsService.precisions({
        ids: ['DCC'],
      }),
      EffectLib.map(([assetPrecision]) =>
        txs.map((tx) => ({
          ...tx,
          amount: tx.amount.shiftedBy(-(assetPrecision ?? 0)),
          fee: tx.fee.shiftedBy(-(assetPrecision ?? 0)),
        })),
      ),
    );
