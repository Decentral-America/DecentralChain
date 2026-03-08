import { type BurnTransaction } from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TLong, type TMoney, type TWithPartialFee } from '../types/index.js';
import { emptyError, getAssetId, getCoins, has, ifElse, pipe, prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

// biome-ignore lint/suspicious/noExplicitAny: legacy untyped code
const burnTransform: any = {
  ...getDefaultTransform(),
  assetId: pipe<TDCCGuiBurn, string, string>(
    ifElse<TDCCGuiBurn, string, string>(
      has('assetId'),
      // biome-ignore lint/suspicious/noExplicitAny: legacy untyped code
      prop<any, 'assetId'>('assetId'),
      // biome-ignore lint/suspicious/noExplicitAny: legacy untyped code
      ((data: any) => getAssetId(data.quantity)) as any,
    ),
    emptyError('Has no assetId!'),
  ),
  quantity: pipe<TDCCGuiBurn, TMoney | TLong, string>(prop('quantity'), getCoins),
  // biome-ignore lint/suspicious/noExplicitAny: legacy untyped code
  chainId: (prop as any)('chainId'),
};

export const burn = factory<TDCCGuiBurn, TWithPartialFee<BurnTransaction<string>>>(burnTransform);

export interface IDCCGuiBurnMoney extends IDefaultGuiTx<typeof TYPES.BURN> {
  quantity: TMoney;
  chainId: number;
}

export interface IDCCGuiBurnLong extends IDefaultGuiTx<typeof TYPES.BURN> {
  quantity: TLong;
  assetId: string;
  chainId: number;
}

export type TDCCGuiBurn = IDCCGuiBurnMoney | IDCCGuiBurnLong;
