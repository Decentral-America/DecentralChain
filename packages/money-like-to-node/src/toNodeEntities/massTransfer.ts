import { type MassTransferItem, type MassTransferTransaction } from '@decentralchain/ts-types';
import { type TYPES } from '../constants/index.js';
import { factory } from '../core/factory.js';
import { type TLong, type TMoney, type TWithPartialFee } from '../types/index.js';
import { emptyError, getAssetId, getCoins, has, ifElse, map, pipe, prop } from '../utils/index.js';
import { getDefaultTransform, type IDefaultGuiTx } from './general.js';

const remapTransferItem = factory<
  IClientMassTransferItem<TMoney | TLong>,
  MassTransferItem<string>
>({
  amount: pipe<IClientMassTransferItem<TMoney | TLong>, TMoney | TLong, string>(
    prop('amount'),
    getCoins,
  ),
  recipient: prop('recipient'),
});

const getFirstMassTransferItem = (
  list: IClientMassTransferItem<TMoney>[],
): IClientMassTransferItem<TMoney> => {
  if (!list.length) {
    throw new Error('MassTransfer transaction must have one transfer!');
  }
  // biome-ignore lint/style/noNonNullAssertion: asserted safe
  return list[0]!;
};

export const massTransfer = factory<
  TClientMassTransfer,
  TWithPartialFee<MassTransferTransaction<string>>
>({
  ...getDefaultTransform(),
  assetId: pipe<TClientMassTransfer, string, string>(
    ifElse<TClientMassTransfer, string, string>(
      has('assetId'),
      // biome-ignore lint/suspicious/noExplicitAny: curried prop() can't infer type param in partial application
      prop<any, 'assetId'>('assetId'),
      // biome-ignore lint/suspicious/noExplicitAny: pipe() first type param can't be inferred from ifElse fallback branch
      pipe<any, IClientMassTransferItem<TMoney>[], IClientMassTransferItem<TMoney>, TMoney, string>(
        prop<IClientMassTransferMoney, 'transfers'>('transfers'),
        getFirstMassTransferItem,
        prop<IClientMassTransferItem<TMoney>, 'amount'>('amount'),
        getAssetId,
      ),
    ),
    emptyError('Has no assetId!'),
  ),
  attachment: prop('attachment'),
  transfers: pipe(prop('transfers'), map(remapTransferItem)),
});

export interface IClientMassTransferMoney extends IDefaultGuiTx<typeof TYPES.MASS_TRANSFER> {
  attachment: string;
  transfers: IClientMassTransferItem<TMoney>[];
}

export interface IClientMassTransferLong extends IDefaultGuiTx<typeof TYPES.MASS_TRANSFER> {
  attachment: string;
  assetId: string;
  transfers: IClientMassTransferItem<TLong>[];
}

export type TClientMassTransfer = IClientMassTransferMoney | IClientMassTransferLong;

interface IClientMassTransferItem<T extends TMoney | TLong> {
  recipient: string;
  amount: T;
}
