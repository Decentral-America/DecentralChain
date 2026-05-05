import { withDecimalsProcessing } from '../../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../../assets';
import { createService } from '../_common/createService';
import { modifyDecimals } from './modifyDecimals';
import { type PaymentTxsRepo } from './repo/types';
import { type PaymentTxsService } from './types';

export default (repo: PaymentTxsRepo, assetsService: AssetsService): PaymentTxsService =>
  withDecimalsProcessing(modifyDecimals(assetsService), createService(repo));
