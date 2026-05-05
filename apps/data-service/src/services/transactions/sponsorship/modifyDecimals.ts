import { type Task } from 'folktale/concurrency/task';
import { compose, isNil } from 'ramda';
import { type AppError } from '../../../errorHandling';
import { type AssetsService } from '../../assets';
import { type SponsorshipTx } from './repo/types';

export const modifyDecimals =
  (assetsService: AssetsService) =>
  (txs: SponsorshipTx[]): Task<AppError, SponsorshipTx[]> =>
    assetsService
      .precisions({
        ids: txs
          .map((tx) =>
            compose((a: string[]) => (isNil(tx.minSponsoredAssetFee) ? a : a.concat(tx.assetId)))([
              'WAVES',
            ]),
          )
          .reduce((acc, cur) => acc.concat(cur), []),
      })
      .map((v) =>
        txs.map((tx) => {
          const currentTxValues = v.splice(0, isNil(tx.minSponsoredAssetFee) ? 1 : 2);
          return {
            ...tx,
            fee: tx.fee.shiftedBy(-currentTxValues[0]),
            minSponsoredAssetFee: isNil(tx.minSponsoredAssetFee)
              ? null
              : tx.minSponsoredAssetFee.shiftedBy(-currentTxValues[1]),
          };
        }),
      );
