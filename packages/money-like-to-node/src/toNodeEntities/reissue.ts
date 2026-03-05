import type { ReissueTransaction } from '@decentralchain/ts-types';
import type { TLong, TMoney, TWithPartialFee } from '../types/index.js';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type IDefaultGuiTx, getDefaultTransform } from './general.js';
import { emptyError, getAssetId, getCoins, has, ifElse, pipe, prop } from '../utils/index.js';

export const reissue = factory<TDCCGuiReissue, TWithPartialFee<ReissueTransaction<string>>>({
  ...getDefaultTransform(),
  assetId: pipe<TDCCGuiReissue, string, string>(
    ifElse<TDCCGuiReissue, string, string>(
      has('assetId'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- union type narrowing
      prop<any, 'assetId'>('assetId'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access -- runtime-narrowed via has('assetId')
      ((data: any) => getAssetId(data.quantity)) as any,
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
