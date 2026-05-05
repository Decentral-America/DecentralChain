import { withDecimalsProcessing } from '../../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../../assets';
import { createService } from '../_common/createService';
import { modifyFeeDecimals } from '../_common/modifyFeeDecimals';
import { type DataTxsRepo } from './repo/types';
import { type DataTxsService } from './types';

export default (repo: DataTxsRepo, assetsService: AssetsService): DataTxsService =>
  withDecimalsProcessing(modifyFeeDecimals(assetsService), createService(repo));
