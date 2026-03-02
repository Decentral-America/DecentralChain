import type {
    Long,
    WithApiMixin,
    WithApplicationStatus,
    WithId,
    WithVersion,
} from '../src';
import type { BaseTransaction, SignedTransaction } from './index';

export type PaymentTransactionFields<LONG = Long> = {
    sender: string;
    recipient: string;
    amount: LONG;
};

export type PaymentTransactionV1<LONG> = WithVersion<
    PaymentTransactionFields<LONG> & BaseTransaction<LONG, 2>,
    1
>;

export type PaymentTransactionMap<LONG = Long> = {
    1: PaymentTransactionV1<LONG>;
};

export type PaymentTransaction<LONG = Long> = PaymentTransactionV1<LONG>;

export type PaymentTransactionFromNode<LONG = Long> = SignedTransaction<
    PaymentTransaction<LONG>
> &
    WithId &
    WithApplicationStatus &
    WithApiMixin & {
        feeAssetId: null;
    };
