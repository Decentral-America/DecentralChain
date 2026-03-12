import { type BurnTransaction } from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TLong, type TMoney, type TWithPartialFee } from '../types/index.js';
import { emptyError, getAssetId, getCoins, has, ifElse, pipe, prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

const burnTransform = {
  ...getDefaultTransform(),
  assetId: pipe<TDCCGuiBurn, string, string>(
    ifElse<TDCCGuiBurn, string, string>(
      has('assetId'),
      // biome-ignore lint/suspicious/noExplicitAny: curried prop() can't infer type param in partial application
      prop<any, 'assetId'>('assetId'),
      ((data: IDCCGuiBurnMoney) => getAssetId(data.quantity)) as (data: TDCCGuiBurn) => string,
    ),
    emptyError('Has no assetId!'),
  ),
  quantity: pipe<TDCCGuiBurn, TMoney | TLong, string>(prop('quantity'), getCoins),
  chainId: prop<TDCCGuiBurn, 'chainId'>('chainId'),
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
