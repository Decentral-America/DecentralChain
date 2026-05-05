import { withDecimalsProcessing } from '../../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../../assets';
import { createService } from '../_common/createService';
import { modifyDecimals } from './modifyDecimals';
import { type GenesisTxsRepo } from './repo/types';
import { type GenesisTxsService } from './types';

export default (repo: GenesisTxsRepo, assetsService: AssetsService): GenesisTxsService =>
  withDecimalsProcessing(modifyDecimals(assetsService), createService(repo));
