import { withDecimalsProcessing } from '../../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../../assets';
import { createService } from '../_common/createService';
import { modifyFeeDecimals } from '../_common/modifyFeeDecimals';
import { type AliasTxsRepo } from './repo/types';
import { type AliasTxsService } from './types';

export default (repo: AliasTxsRepo, assetsService: AssetsService): AliasTxsService =>
  withDecimalsProcessing(modifyFeeDecimals(assetsService), createService(repo));
