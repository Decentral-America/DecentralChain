import { withDecimalsProcessing } from '../../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../../assets';
import { createService } from '../_common/createService';
import { modifyDecimals } from './modifyDecimals';
import { type LeaseTxsRepo } from './repo/types';
import { type LeaseTxsService } from './types';

export default (repo: LeaseTxsRepo, assetsService: AssetsService): LeaseTxsService =>
  withDecimalsProcessing(modifyDecimals(assetsService), createService(repo));
