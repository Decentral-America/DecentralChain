import { type SetAssetScriptTransaction } from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TWithPartialFee } from '../types/index.js';
import { prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

export const setAssetScript = factory<
  IDCCGuiSetAssetScript,
  TWithPartialFee<SetAssetScriptTransaction<string>>
>({
  ...getDefaultTransform(),
  assetId: prop('assetId'),
  chainId: prop('chainId'),
  script: prop('script'),
});

export interface IDCCGuiSetAssetScript extends IDefaultGuiTx<typeof TYPES.SET_ASSET_SCRIPT> {
  assetId: string;
  script: string;
  chainId: number;
}
