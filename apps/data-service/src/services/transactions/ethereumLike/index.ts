import { withDecimalsProcessing } from '../../_common/transformation/withDecimalsProcessing';
import { type AssetsService } from '../../assets';
import { createService } from '../_common/createService';
import { modifyFeeDecimals } from '../_common/modifyFeeDecimals';
import { type EthereumLikeTxsRepo } from './repo/types';
import { type EthereumLikeTxsService } from './types';

export default (repo: EthereumLikeTxsRepo, assetsService: AssetsService): EthereumLikeTxsService =>
  withDecimalsProcessing(modifyFeeDecimals(assetsService), createService(repo));
