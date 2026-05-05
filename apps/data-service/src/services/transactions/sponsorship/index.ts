import { withDecimalsProcessing } from '../../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../../assets';
import { createService } from '../_common/createService';
import { modifyDecimals } from './modifyDecimals';
import { type SponsorshipTxsRepo } from './repo/types';
import { type SponsorshipTxsService } from './types';

export default (repo: SponsorshipTxsRepo, assetsService: AssetsService): SponsorshipTxsService =>
  withDecimalsProcessing(modifyDecimals(assetsService), createService(repo));
