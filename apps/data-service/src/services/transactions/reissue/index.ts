import { withDecimalsProcessing } from '../../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../../assets';
import { createService } from '../_common/createService';
import { modifyDecimals } from './modifyDecimals';
import { type ReissueTxsRepo } from './repo/types';
import { type ReissueTxsService } from './types';

export default (repo: ReissueTxsRepo, assetsService: AssetsService): ReissueTxsService =>
  withDecimalsProcessing(modifyDecimals(assetsService), createService(repo));
