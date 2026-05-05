import { withDecimalsProcessing } from '../../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../../assets';
import { createService } from '../_common/createService';
import { modifyDecimals } from './modifyDecimals';
import { type IssueTxsRepo } from './repo/types';
import { type IssueTxsService } from './types';

export default (repo: IssueTxsRepo, assetsService: AssetsService): IssueTxsService =>
  withDecimalsProcessing(modifyDecimals(assetsService), createService(repo));
