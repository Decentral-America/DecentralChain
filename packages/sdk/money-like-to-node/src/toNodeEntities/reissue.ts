import { type ReissueTransaction } from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TLong, type TMoney, type TWithPartialFee } from '../types/index.js';
import { emptyError, getAssetId, getCoins, has, ifElse, pipe, prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

export const reissue = factory<TClientReissue, TWithPartialFee<ReissueTransaction<string>>>({
  ...getDefaultTransform(),
  assetId: pipe<TClientReissue, string, string>(
    ifElse<TClientReissue, string, string>(
      has('assetId'),
      // biome-ignore lint/suspicious/noExplicitAny: curried prop() can't infer type param in partial application
      prop<any, 'assetId'>('assetId'),
      ((data: IClientReissueMoney) => getAssetId(data.quantity)) as (
        data: TClientReissue,
      ) => string,
    ),
    emptyError('Has no assetId!'),
  ),
  chainId: prop('chainId'),
  quantity: pipe<TClientReissue, TMoney | TLong, string>(prop('quantity'), getCoins),
  reissuable: prop('reissuable'),
});

export interface IClientReissueMoney extends IDefaultGuiTx<typeof TYPES.REISSUE> {
  quantity: TMoney;
  reissuable: boolean;
  chainId: number;
}

export interface IClientReissueLong extends IDefaultGuiTx<typeof TYPES.REISSUE> {
  assetId: string;
  quantity: TLong;
  reissuable: boolean;
  chainId: number;
}

export type TClientReissue = IClientReissueMoney | IClientReissueLong;
