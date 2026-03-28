import { type BurnTransaction } from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TLong, type TMoney, type TWithPartialFee } from '../types/index.js';
import { emptyError, getAssetId, getCoins, has, ifElse, pipe, prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

const burnTransform = {
  ...getDefaultTransform(),
  amount: pipe<TClientBurn, TMoney | TLong, string>(prop('quantity'), getCoins),
  assetId: pipe<TClientBurn, string, string>(
    ifElse<TClientBurn, string, string>(
      has('assetId'),
      // biome-ignore lint/suspicious/noExplicitAny: curried prop() can't infer type param in partial application
      prop<any, 'assetId'>('assetId'),
      ((data: IClientBurnMoney) => getAssetId(data.quantity)) as (data: TClientBurn) => string,
    ),
    emptyError('Has no assetId!'),
  ),
  chainId: prop<TClientBurn, 'chainId'>('chainId'),
};

export const burn = factory<TClientBurn, TWithPartialFee<BurnTransaction<string>>>(burnTransform);

export interface IClientBurnMoney extends IDefaultGuiTx<typeof TYPES.BURN> {
  quantity: TMoney;
  chainId: number;
}

export interface IClientBurnLong extends IDefaultGuiTx<typeof TYPES.BURN> {
  quantity: TLong;
  assetId: string;
  chainId: number;
}

export type TClientBurn = IClientBurnMoney | IClientBurnLong;
