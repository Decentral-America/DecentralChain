import {
  type AliasTransaction,
  type BurnTransaction,
  type CancelLeaseTransaction,
  type DataTransaction,
  type DataTransactionEntry,
  type ExchangeTransaction,
  type ExchangeTransactionOrder,
  type InvokeScriptCall,
  type InvokeScriptCallArgument,
  type InvokeScriptPayment,
  type InvokeScriptTransaction,
  type IssueTransaction,
  type LeaseTransaction,
  type MassTransferItem,
  type MassTransferTransaction,
  type ReissueTransaction,
  type SetAssetScriptTransaction,
  type SetScriptTransaction,
  type SignableTransaction,
  type SignedIExchangeTransactionOrder,
  type SponsorshipTransaction,
  type Transaction,
  type TransferTransaction,
  type UpdateAssetInfoTransaction,
} from '@decentralchain/ts-types';
import { TYPES } from '../constants/index.js';

// biome-ignore lint/suspicious/noExplicitAny: legacy untyped code
interface TConvertMap<TO, T extends SignableTransaction<any>> {
  [TYPES.ISSUE]: TReplaceParam<T, 'fee' | 'quantity', TO>;
  [TYPES.TRANSFER]: TReplaceParam<T, 'fee' | 'amount', TO>;
  [TYPES.REISSUE]: TReplaceParam<T, 'fee' | 'quantity', TO>;
  [TYPES.BURN]: TReplaceParam<T, 'fee' | 'amount' | 'quantity', TO>;
  [TYPES.EXCHANGE]: TReplaceParam<
    T,
    'fee' | 'buyOrder' | 'sellOrder' | 'amount' | 'price' | 'sellMatcherFee' | 'buyMatcherFee',
    TO
  >;
  [TYPES.LEASE]: TReplaceParam<T, 'fee' | 'amount', TO>;
  [TYPES.CANCEL_LEASE]: TReplaceParam<T, 'fee', TO>;
  [TYPES.ALIAS]: TReplaceParam<T, 'fee', TO>;
  [TYPES.MASS_TRANSFER]: T extends MassTransferTransaction<unknown>
    ? TReplaceParam<TReplaceParam<T, 'fee', TO>, 'transfers', MassTransferItem<TO>[]>
    : never;
  [TYPES.DATA]: T extends DataTransaction<unknown>
    ? TReplaceParam<TReplaceParam<T, 'fee', TO>, 'data', DataTransactionEntry<TO>[]>
    : never;
  [TYPES.SET_SCRIPT]: TReplaceParam<T, 'fee', TO>;
  [TYPES.SPONSORSHIP]: TReplaceParam<T, 'fee' | 'minSponsoredAssetFee', TO>;
  [TYPES.SET_ASSET_SCRIPT]: TReplaceParam<T, 'fee', TO>;
  [TYPES.INVOKE_SCRIPT]: TReplaceParam<
    TReplaceParam<TReplaceParam<T, 'fee', TO>, 'payment', InvokeScriptPayment<TO>[]>,
    'call',
    InvokeScriptCall<TO>
  >;
  [TYPES.UPDATE_ASSET_INFO]: TReplaceParam<T, 'fee', TO>;
}

type TReplaceParam<T, KEYS, NEW_VALUE> = {
  [Key in keyof T]: Key extends KEYS ? NEW_VALUE : T[Key];
};

type IFactory<FROM, TO> = (long: FROM) => TO;

// biome-ignore lint/suspicious/noExplicitAny: legacy untyped code
const defaultConvert = <FROM, TO, T extends Transaction<any>>(
  data: T,
  factory: IFactory<FROM, TO>,
): TReplaceParam<T, 'fee', TO> => {
  return Object.assign({}, data, { fee: factory(data.fee) }) as TReplaceParam<T, 'fee', TO>;
};

const issue = <FROM, TO, TX extends IssueTransaction<FROM>>(
  tx: TX,
  factory: IFactory<FROM, TO>,
) => ({
  ...defaultConvert(tx, factory),
  quantity: factory(tx.quantity),
});

const transfer = <FROM, TO, TX extends TransferTransaction<FROM>>(
  tx: TX,
  factory: IFactory<FROM, TO>,
) => ({
  ...defaultConvert(tx, factory),
  amount: factory(tx.amount),
});

const reissue = <FROM, TO, TX extends ReissueTransaction<FROM>>(
  tx: TX,
  factory: IFactory<FROM, TO>,
) => ({
  ...defaultConvert(tx, factory),
  quantity: factory(tx.quantity),
});

const burn = <
  FROM,
  TO,
  TX extends BurnTransaction<FROM> & { amount?: FROM | undefined; quantity?: FROM | undefined },
>(
  tx: TX,
  factory: IFactory<FROM, TO>,
) => ({
  ...defaultConvert(tx, factory),
  amount: tx.amount != null ? factory(tx.amount) : factory(tx.quantity as FROM),
  quantity: tx.amount != null ? factory(tx.amount) : factory(tx.quantity as FROM),
});

const order = <FROM, TO, O extends SignedIExchangeTransactionOrder<ExchangeTransactionOrder<FROM>>>(
  data: O,
  factory: IFactory<FROM, TO>,
): TReplaceParam<O, 'price' | 'amount' | 'matcherFee', TO> =>
  ({
    ...data,
    amount: factory(data.amount),
    matcherFee: factory(data.matcherFee),
    price: factory(data.price),
  }) as TReplaceParam<O, 'price' | 'amount' | 'matcherFee', TO>;

const exchange = <FROM, TO, TX extends ExchangeTransaction<FROM>>(
  tx: TX,
  factory: IFactory<FROM, TO>,
) => ({
  ...defaultConvert(tx, factory),
  amount: factory(tx.amount),
  buyMatcherFee: factory(tx.buyMatcherFee),
  order1: order(tx.order1, factory),
  order2: order(tx.order2, factory),
  price: factory(tx.price),
  sellMatcherFee: factory(tx.sellMatcherFee),
});

const lease = <FROM, TO, TX extends LeaseTransaction<FROM>>(
  tx: TX,
  factory: IFactory<FROM, TO>,
) => ({
  ...defaultConvert(tx, factory),
  amount: factory(tx.amount),
});

const cancelLease = <FROM, TO, TX extends CancelLeaseTransaction<FROM>>(
  tx: TX,
  factory: IFactory<FROM, TO>,
) => defaultConvert(tx, factory);

const alias = <FROM, TO, TX extends AliasTransaction<FROM>>(tx: TX, factory: IFactory<FROM, TO>) =>
  defaultConvert(tx, factory);

const massTransfer = <FROM, TO, TX extends MassTransferTransaction<FROM>>(
  tx: TX,
  factory: IFactory<FROM, TO>,
) => ({
  ...defaultConvert(tx, factory),
  transfers: tx.transfers.map((item) => ({ ...item, amount: factory(item.amount) })),
});

const data = <FROM, TO, TX extends DataTransaction<FROM>>(tx: TX, factory: IFactory<FROM, TO>) => ({
  ...defaultConvert(tx, factory),
  data: tx.data.map((item) => {
    switch (item.type) {
      case 'integer':
        return item.value != null ? { ...item, value: factory(item.value) } : item;
      default:
        return item;
    }
  }),
});

const setScript = <FROM, TO, TX extends SetScriptTransaction<FROM>>(
  tx: TX,
  factory: IFactory<FROM, TO>,
) => defaultConvert(tx, factory);

const sponsorship = <FROM, TO, TX extends SponsorshipTransaction<FROM>>(
  tx: TX,
  factory: IFactory<FROM, TO>,
) => ({
  ...defaultConvert(tx, factory),
  minSponsoredAssetFee: tx.minSponsoredAssetFee !== null ? factory(tx.minSponsoredAssetFee) : null,
});

const invokeScript = <FROM, TO, TX extends InvokeScriptTransaction<FROM>>(
  tx: TX,
  factory: IFactory<FROM, TO>,
) => ({
  ...defaultConvert(tx, factory),
  call: tx.call
    ? {
        ...tx.call,
        args: tx.call.args.map(
          (item) =>
            ({
              ...item,
              value: item.type === 'integer' ? factory(item.value) : item.value,
            }) as InvokeScriptCallArgument<TO>,
        ),
      }
    : tx.call,
  payment: tx.payment
    ? tx.payment.map((item) => ({ ...item, amount: factory(item.amount) }))
    : tx.payment,
});

const updateAssetInfo = <FROM, TO, TX extends UpdateAssetInfoTransaction<FROM>>(
  tx: TX,
  factory: IFactory<FROM, TO>,
) => ({
  ...defaultConvert(tx, factory),
});

const setAssetScript = <FROM, TO, TX extends SetAssetScriptTransaction<FROM>>(
  tx: TX,
  factory: IFactory<FROM, TO>,
) => defaultConvert(tx, factory);

// The implementation signature's return type is a wide union. TypeScript cannot
// verify that TReplaceParam over a narrowed union variant (e.g. CancelLeaseV1)
// is assignable to the parent SignableTransaction<TO> union, because of Phantom
// type parameters that carry FROM rather than TO. The runtime logic is correct —
// defaultConvert replaces fee with factory(fee) — so we use explicit casts.
type ConvertResult<TO> =
  | SignableTransaction<TO>
  | SignedIExchangeTransactionOrder<ExchangeTransactionOrder<TO>>;

export function convert<
  FROM,
  TO,
  TX extends SignableTransaction<FROM>,
  TYPE extends TX['type'] = TX['type'],
>(tx: TX, factory: IFactory<FROM, TO>): TConvertMap<TO, TX>[TYPE];
export function convert<
  FROM,
  TO,
  TX extends SignedIExchangeTransactionOrder<ExchangeTransactionOrder<FROM>>,
>(tx: TX, factory: IFactory<FROM, TO>): TReplaceParam<TX, 'price' | 'amount' | 'matcherFee', TO>;
export function convert<FROM, TO>(
  tx: SignableTransaction<FROM> | SignedIExchangeTransactionOrder<ExchangeTransactionOrder<FROM>>,
  factory: IFactory<FROM, TO>,
): ConvertResult<TO> {
  if ('orderType' in tx) {
    return order(tx, factory) as unknown as ConvertResult<TO>;
  }

  switch (tx.type) {
    case TYPES.ISSUE:
      return issue(tx, factory) as unknown as ConvertResult<TO>;
    case TYPES.TRANSFER:
      return transfer(tx, factory) as unknown as ConvertResult<TO>;
    case TYPES.REISSUE:
      return reissue(tx, factory) as unknown as ConvertResult<TO>;
    case TYPES.BURN:
      return burn(tx, factory) as unknown as ConvertResult<TO>;
    case TYPES.EXCHANGE:
      return exchange(tx, factory) as unknown as ConvertResult<TO>;
    case TYPES.LEASE:
      return lease(tx, factory) as unknown as ConvertResult<TO>;
    case TYPES.CANCEL_LEASE:
      return cancelLease(tx, factory) as unknown as ConvertResult<TO>;
    case TYPES.ALIAS:
      return alias(tx, factory) as unknown as ConvertResult<TO>;
    case TYPES.MASS_TRANSFER:
      return massTransfer(tx, factory) as unknown as ConvertResult<TO>;
    case TYPES.DATA:
      return data(tx, factory) as unknown as ConvertResult<TO>;
    case TYPES.SET_SCRIPT:
      return setScript(tx, factory) as unknown as ConvertResult<TO>;
    case TYPES.SPONSORSHIP:
      return sponsorship(tx, factory) as unknown as ConvertResult<TO>;
    case TYPES.SET_ASSET_SCRIPT:
      return setAssetScript(tx, factory) as unknown as ConvertResult<TO>;
    case TYPES.INVOKE_SCRIPT:
      return invokeScript(tx, factory) as unknown as ConvertResult<TO>;
    case TYPES.UPDATE_ASSET_INFO:
      return updateAssetInfo(tx, factory) as unknown as ConvertResult<TO>;
    default:
      throw new Error('Unknown transaction type!');
  }
}
