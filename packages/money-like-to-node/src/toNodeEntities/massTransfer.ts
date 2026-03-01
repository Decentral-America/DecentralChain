import type { IMassTransferItem, IMassTransferTransaction } from '@decentralchain/ts-types';
import type { TLong, TMoney, TWithPartialFee } from '../types/index.js';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type IDefaultGuiTx, getDefaultTransform } from './general.js';
import { emptyError, getAssetId, getCoins, has, ifElse, map, pipe, prop } from '../utils/index.js';

const remapTransferItem = factory<
  IDCCGuiMassTransferItem<TMoney | TLong>,
  IMassTransferItem<string>
>({
  recipient: prop('recipient'),
  amount: pipe<IDCCGuiMassTransferItem<TMoney | TLong>, TMoney | TLong, string>(
    prop('amount'),
    getCoins,
  ),
});

const getFirstMassTransferItem = (
  list: IDCCGuiMassTransferItem<TMoney>[],
): IDCCGuiMassTransferItem<TMoney> => {
  if (!list.length) {
    throw new Error('MassTransfer transaction must have one transfer!');
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- length check above guarantees element exists
  return list[0]!;
};

export const massTransfer = factory<
  TDCCGuiMassTransfer,
  TWithPartialFee<IMassTransferTransaction<string>>
>({
  ...getDefaultTransform(),
  transfers: pipe(prop('transfers'), map(remapTransferItem)),
  assetId: pipe<TDCCGuiMassTransfer, string, string>(
    ifElse<TDCCGuiMassTransfer, string, string>(
      has('assetId'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- union type narrowing
      prop<any, 'assetId'>('assetId'),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex pipe type chain
      pipe<any, IDCCGuiMassTransferItem<TMoney>[], IDCCGuiMassTransferItem<TMoney>, TMoney, string>(
        prop<IDCCGuiMassTransferMoney, 'transfers'>('transfers'),
        getFirstMassTransferItem,
        prop<IDCCGuiMassTransferItem<TMoney>, 'amount'>('amount'),
        getAssetId,
      ),
    ),
    emptyError('Has no assetId!'),
  ),
  attachment: prop('attachment'),
});

export interface IDCCGuiMassTransferMoney extends IDefaultGuiTx<typeof TYPES.MASS_TRANSFER> {
  attachment: string;
  transfers: IDCCGuiMassTransferItem<TMoney>[];
}

export interface IDCCGuiMassTransferLong extends IDefaultGuiTx<typeof TYPES.MASS_TRANSFER> {
  attachment: string;
  assetId: string;
  transfers: IDCCGuiMassTransferItem<TLong>[];
}

export type TDCCGuiMassTransfer = IDCCGuiMassTransferMoney | IDCCGuiMassTransferLong;

interface IDCCGuiMassTransferItem<T extends TMoney | TLong> {
  recipient: string;
  amount: T;
}
