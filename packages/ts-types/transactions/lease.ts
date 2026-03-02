import type {
    Long,
    WithApiMixin,
    WithApplicationStatus,
    WithId,
    WithVersion,
} from '../src';
import type { BaseTransaction, SignedTransaction } from './index';

export type LeaseTransactionFields<LONG = Long> = {
    amount: LONG;
    recipient: string;
};

export type LeaseTransactionV1<LONG> = WithVersion<
    LeaseTransactionFields<LONG> & BaseTransaction<LONG, 8>,
    1
>;
export type LeaseTransactionV2<LONG> = WithVersion<
    LeaseTransactionFields<LONG> & BaseTransaction<LONG, 8>,
    2
>;
export type LeaseTransactionV3<LONG> = WithVersion<
    LeaseTransactionFields<LONG> & BaseTransaction<LONG, 8>,
    3
>;

export type LeaseTransactionMap<LONG = Long> = {
    1: LeaseTransactionV1<LONG>;
    2: LeaseTransactionV2<LONG>;
    3: LeaseTransactionV3<LONG>;
};

export type LeaseTransaction<LONG = Long> =
    | LeaseTransactionV1<LONG>
    | LeaseTransactionV2<LONG>
    | LeaseTransactionV3<LONG>;

export type LeaseTransactionFromNode<LONG = Long> = SignedTransaction<
    LeaseTransaction<LONG>
> &
    WithId &
    WithApplicationStatus &
    WithApiMixin & {
        feeAssetId: null;
        status: 'canceled' | 'active';
    };
