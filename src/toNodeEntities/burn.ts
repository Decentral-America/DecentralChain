import type { BurnTransaction } from '@decentralchain/ts-types';
import type { TLong, TMoney, TWithPartialFee } from '../types/index.js';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type IDefaultGuiTx, getDefaultTransform } from './general.js';
import { emptyError, getAssetId, getCoins, has, ifElse, pipe, prop } from '../utils/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex spread type with conditional fields
const burnTransform: any = {
  ...getDefaultTransform(),
  assetId: pipe<TDCCGuiBurn, string, string>(
    ifElse<TDCCGuiBurn, string, string>(
      has('assetId'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- union type narrowing
      prop<any, 'assetId'>('assetId'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access -- runtime-narrowed via has('assetId')
      ((data: any) => getAssetId(data.quantity)) as any,
    ),
    emptyError('Has no assetId!'),
  ),
  quantity: pipe<TDCCGuiBurn, TMoney | TLong, string>(prop('quantity'), getCoins),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- prop returns union type
  chainId: (prop as any)('chainId'),
};

export const burn = factory<TDCCGuiBurn, TWithPartialFee<BurnTransaction<string>>>(
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument -- burnTransform is typed as any for complex spread
  burnTransform,
);

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
