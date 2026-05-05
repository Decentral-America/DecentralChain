import { withDecimalsProcessing } from '../../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../../assets';
import { createService } from '../_common/createService';
import { modifyDecimals } from './modifyDecimals';
import { type ExchangeTxsRepo } from './repo/types';
import { type ExchangeTxsService } from './types';

export default (repo: ExchangeTxsRepo, assetsService: AssetsService): ExchangeTxsService =>
  withDecimalsProcessing(modifyDecimals(assetsService), createService(repo));
