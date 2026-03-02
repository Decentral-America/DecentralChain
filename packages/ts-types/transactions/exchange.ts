import type {
    ExchangeTransactionOrder,
    Long,
    SignedIExchangeTransactionOrder,
    WithApiMixin,
    WithApplicationStatus,
    WithId,
    WithVersion,
} from '../src';
import type { BaseTransaction, SignedTransaction } from './index';

export type ExchangeTransactionFields<LONG = Long> = {
    order1: SignedIExchangeTransactionOrder<ExchangeTransactionOrder<LONG>>;
    order2: SignedIExchangeTransactionOrder<ExchangeTransactionOrder<LONG>>;
    price: LONG;
    amount: LONG;
    buyMatcherFee: LONG;
    sellMatcherFee: LONG;
};

export type ExchangeTransactionV1<LONG = Long> = WithVersion<
    ExchangeTransactionFields<LONG> & BaseTransaction<LONG, 7>,
    1
>;
export type ExchangeTransactionV2<LONG = Long> = WithVersion<
    ExchangeTransactionFields<LONG> & BaseTransaction<LONG, 7>,
    2
>;
export type ExchangeTransactionV3<LONG = Long> = WithVersion<
    ExchangeTransactionFields<LONG> & BaseTransaction<LONG, 7>,
    3
>;

export type ExchangeTransactionMap<LONG = Long> = {
    1: ExchangeTransactionV1<LONG>;
    2: ExchangeTransactionV2<LONG>;
    3: ExchangeTransactionV3<LONG>;
};

export type ExchangeTransaction<LONG = Long> =
    | ExchangeTransactionV1<LONG>
    | ExchangeTransactionV2<LONG>
    | ExchangeTransactionV3<LONG>;

export type ExchangeTransactionFromNode<LONG = Long> = SignedTransaction<
    ExchangeTransaction<LONG>
> &
    WithId &
    WithApplicationStatus &
    WithApiMixin & {
        feeAssetId: null;
    };
