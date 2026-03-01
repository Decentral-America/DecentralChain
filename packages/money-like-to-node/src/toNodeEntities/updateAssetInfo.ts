import type { IUpdateAssetInfoTransaction } from '@decentralchain/ts-types';
import type { TWithPartialFee } from '../types/index.js';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type IDefaultGuiTx, getDefaultTransform } from './general.js';
import { prop } from '../utils/index.js';

export const updateAssetInfo = factory<
  IDCCGuiUpdateAssetInfo,
  TWithPartialFee<IUpdateAssetInfoTransaction<string>>
>({
  ...getDefaultTransform(),
  assetId: prop('assetId'),
  name: prop('name'),
  description: prop('description'),
});

export interface IDCCGuiUpdateAssetInfo extends IDefaultGuiTx<typeof TYPES.UPDATE_ASSET_INFO> {
  assetId: string;
  name: string;
  description: string;
}
