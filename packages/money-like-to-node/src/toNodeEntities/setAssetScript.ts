import type { ISetAssetScriptTransaction } from '@decentralchain/ts-types';
import type { TWithPartialFee } from '../types/index.js';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type IDefaultGuiTx, getDefaultTransform } from './general.js';
import { prop } from '../utils/index.js';

export const setAssetScript = factory<
  IDCCGuiSetAssetScript,
  TWithPartialFee<ISetAssetScriptTransaction<string>>
>({
  ...getDefaultTransform(),
  assetId: prop('assetId'),
  script: prop('script'),
  chainId: prop('chainId'),
});

export interface IDCCGuiSetAssetScript extends IDefaultGuiTx<typeof TYPES.SET_ASSET_SCRIPT> {
  assetId: string;
  script: string;
  chainId: number;
}
