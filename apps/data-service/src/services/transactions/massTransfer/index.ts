import { withDecimalsProcessing } from '../../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../../assets';
import { createService } from '../_common/createService';
import { modifyDecimals } from './modifyDecimals';
import { type MassTransferTxsRepo } from './repo/types';
import { type MassTransferTxsService } from './types';

export default (repo: MassTransferTxsRepo, assetsService: AssetsService): MassTransferTxsService =>
  withDecimalsProcessing(modifyDecimals(assetsService), createService(repo));
