import { Effect, pipe } from 'effect';
import { type AppError } from '../../../errorHandling';
import { type AssetsService } from '../../assets';
import { type BurnTx } from './repo/types';

export const modifyDecimals =
  (assetsService: AssetsService) =>
  (txs: BurnTx[]): Effect.Effect<BurnTx[], AppError> =>
    pipe(
      assetsService.precisions({
        ids: ['WAVES'].concat(txs.map((tx) => tx.assetId)),
      }),
      Effect.map((precisions) => {
        const [feePrecision = 0, ...assetPrecisions] = precisions;
        return txs.map((tx, idx) => ({
          ...tx,
          amount: tx.amount.shiftedBy(-(assetPrecisions[idx] ?? 0)),
          fee: tx.fee.shiftedBy(-feePrecision),
        }));
      }),
    );
