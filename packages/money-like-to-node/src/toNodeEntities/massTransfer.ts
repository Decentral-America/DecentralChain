import { type MassTransferItem, type MassTransferTransaction } from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TLong, type TMoney, type TWithPartialFee } from '../types/index.js';
import { emptyError, getAssetId, getCoins, has, ifElse, map, pipe, prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

const remapTransferItem = factory<
  IDCCGuiMassTransferItem<TMoney | TLong>,
  MassTransferItem<string>
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
  // biome-ignore lint/style/noNonNullAssertion: asserted safe
  return list[0]!;
};

export const massTransfer = factory<
  TDCCGuiMassTransfer,
  TWithPartialFee<MassTransferTransaction<string>>
>({
  ...getDefaultTransform(),
  transfers: pipe(prop('transfers'), map(remapTransferItem)),
  assetId: pipe<TDCCGuiMassTransfer, string, string>(
    ifElse<TDCCGuiMassTransfer, string, string>(
      has('assetId'),
      // biome-ignore lint/suspicious/noExplicitAny: curried prop() can't infer type param in partial application
      prop<any, 'assetId'>('assetId'),
      // biome-ignore lint/suspicious/noExplicitAny: pipe() first type param can't be inferred from ifElse fallback branch
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
