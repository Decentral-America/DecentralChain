import { withDecimalsProcessing } from '../../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../../assets';
import { createService } from '../_common/createService';
import { modifyFeeDecimals } from '../_common/modifyFeeDecimals';
import { type UpdateAssetInfoTxsRepo } from './repo/types';
import { type UpdateAssetInfoTxsService } from './types';

export default (
  repo: UpdateAssetInfoTxsRepo,
  assetsService: AssetsService,
): UpdateAssetInfoTxsService =>
  withDecimalsProcessing(modifyFeeDecimals(assetsService), createService(repo));
