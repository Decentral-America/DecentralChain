import { withDecimalsProcessing } from '../../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../../assets';
import { createService } from '../_common/createService';
import { modifyDecimals } from './modifyDecimals';
import { type TransferTxsRepo } from './repo/types';
import { type TransferTxsService } from './types';

export default (repo: TransferTxsRepo, assetsService: AssetsService): TransferTxsService =>
  withDecimalsProcessing(modifyDecimals(assetsService), createService(repo));
