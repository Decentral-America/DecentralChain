import type { ISetScriptTransaction } from '@decentralchain/ts-types';
import type { TWithPartialFee } from '../types/index.js';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type IDefaultGuiTx, getDefaultTransform } from './general.js';
import { prop } from '../utils/index.js';

export const setScript = factory<IDCCGuiSetScript, TWithPartialFee<ISetScriptTransaction<string>>>({
  ...getDefaultTransform(),
  script: prop('script'),
  chainId: prop('chainId'),
});

export interface IDCCGuiSetScript extends IDefaultGuiTx<typeof TYPES.SET_SCRIPT> {
  script: string | null;
  chainId: number;
}
