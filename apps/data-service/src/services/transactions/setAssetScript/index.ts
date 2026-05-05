import { withDecimalsProcessing } from '../../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../../assets';
import { createService } from '../_common/createService';
import { modifyFeeDecimals } from '../_common/modifyFeeDecimals';
import { type SetAssetScriptTxsRepo } from './repo/types';
import { type SetAssetScriptTxsService } from './types';

export default (
  repo: SetAssetScriptTxsRepo,
  assetsService: AssetsService,
): SetAssetScriptTxsService =>
  withDecimalsProcessing(modifyFeeDecimals(assetsService), createService(repo));
