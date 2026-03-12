import { type ReissueTransaction } from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TLong, type TMoney, type TWithPartialFee } from '../types/index.js';
import { emptyError, getAssetId, getCoins, has, ifElse, pipe, prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

export const reissue = factory<TDCCGuiReissue, TWithPartialFee<ReissueTransaction<string>>>({
  ...getDefaultTransform(),
  assetId: pipe<TDCCGuiReissue, string, string>(
    ifElse<TDCCGuiReissue, string, string>(
      has('assetId'),
      // biome-ignore lint/suspicious/noExplicitAny: curried prop() can't infer type param in partial application
      prop<any, 'assetId'>('assetId'),
      ((data: IDCCGuiReissueMoney) => getAssetId(data.quantity)) as (
        data: TDCCGuiReissue,
      ) => string,
    ),
    emptyError('Has no assetId!'),
  ),
  quantity: pipe<TDCCGuiReissue, TMoney | TLong, string>(prop('quantity'), getCoins),
  reissuable: prop('reissuable'),
  chainId: prop('chainId'),
});

export interface IDCCGuiReissueMoney extends IDefaultGuiTx<typeof TYPES.REISSUE> {
  quantity: TMoney;
  reissuable: boolean;
  chainId: number;
}

export interface IDCCGuiReissueLong extends IDefaultGuiTx<typeof TYPES.REISSUE> {
  assetId: string;
  quantity: TLong;
  reissuable: boolean;
  chainId: number;
}

export type TDCCGuiReissue = IDCCGuiReissueMoney | IDCCGuiReissueLong;
