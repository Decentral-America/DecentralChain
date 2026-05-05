import { type BigNumber } from '@decentralchain/data-entities';
import { type Task } from 'folktale/concurrency/task';
import { type AppError } from '../../../errorHandling';
import { type AssetsService } from '../../assets';

export const modifyFeeDecimals =
  <T extends { fee: BigNumber; feeAsset?: string }>(assetsService: AssetsService) =>
  (txs: T[]): Task<AppError, T[]> =>
    assetsService.precisions({ ids: ['WAVES'] }).map(([feeAssetPrecision]) =>
      txs.map((tx) => ({
        ...tx,
        fee: tx.fee.shiftedBy(-feeAssetPrecision),
      })),
    );
