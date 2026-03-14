import { type SetScriptTransaction } from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TWithPartialFee } from '../types/index.js';
import { prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

export const setScript = factory<IDCCGuiSetScript, TWithPartialFee<SetScriptTransaction<string>>>({
  ...getDefaultTransform(),
  chainId: prop('chainId'),
  script: prop('script'),
});

export interface IDCCGuiSetScript extends IDefaultGuiTx<typeof TYPES.SET_SCRIPT> {
  script: string | null;
  chainId: number;
}
