import { type UpdateAssetInfoTransaction } from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TWithPartialFee } from '../types/index.js';
import { prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

export const updateAssetInfo = factory<
  IDCCGuiUpdateAssetInfo,
  TWithPartialFee<UpdateAssetInfoTransaction<string>>
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
