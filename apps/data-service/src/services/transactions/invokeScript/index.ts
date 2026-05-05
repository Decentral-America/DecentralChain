import { withDecimalsProcessing } from '../../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../../assets';
import { createService } from '../_common/createService';
import { modifyDecimals } from './modifyDecimals';
import { type InvokeScriptTxsRepo } from './repo/types';
import { type InvokeScriptTxsService } from './types';

export default (repo: InvokeScriptTxsRepo, assetsService: AssetsService): InvokeScriptTxsService =>
  withDecimalsProcessing(modifyDecimals(assetsService), createService(repo));
