import { withDecimalsProcessing } from '../../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../../assets';
import { createService } from '../_common/createService';
import { modifyDecimals } from './modifyDecimals';
import { type BurnTxsRepo } from './repo/types';
import { type BurnTxsService } from './types';

export default (repo: BurnTxsRepo, assetsService: AssetsService): BurnTxsService =>
  withDecimalsProcessing(modifyDecimals(assetsService), createService(repo));
