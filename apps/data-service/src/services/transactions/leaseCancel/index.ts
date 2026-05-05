import { withDecimalsProcessing } from '../../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../../assets';
import { createService } from '../_common/createService';
import { modifyFeeDecimals } from '../_common/modifyFeeDecimals';
import { type LeaseCancelTxsRepo } from './repo/types';
import { type LeaseCancelTxsService } from './types';

export default (repo: LeaseCancelTxsRepo, assetsService: AssetsService): LeaseCancelTxsService =>
  withDecimalsProcessing(modifyFeeDecimals(assetsService), createService(repo));
