import type {
    Long,
    WithApiMixin,
    WithApplicationStatus,
    WithId,
    WithVersion,
} from '../src';
import type { BaseTransaction, SignedTransaction } from './index';
import type {
    LeaseTransactionV1,
    LeaseTransactionV2,
    LeaseTransactionV3,
} from './lease';

export type CancelLeaseTransactionFields<LONG = Long> = {
    leaseId: string;
};

export type CancelLeaseTransactionV1<LONG> = WithVersion<
    CancelLeaseTransactionFields<LONG> & BaseTransaction<LONG, 9>,
    1
>;
export type CancelLeaseTransactionV2<LONG> = WithVersion<
    CancelLeaseTransactionFields<LONG> & BaseTransaction<LONG, 9>,
    2
>;
export type CancelLeaseTransactionV3<LONG> = WithVersion<
    CancelLeaseTransactionFields<LONG> & BaseTransaction<LONG, 9>,
    3
>;

export type CancelLeaseTransactionMap<LONG = Long> = {
    1: LeaseTransactionV1<LONG>;
    2: LeaseTransactionV2<LONG>;
    3: LeaseTransactionV3<LONG>;
};

export type CancelLeaseTransaction<LONG = Long> =
    | CancelLeaseTransactionV1<LONG>
    | CancelLeaseTransactionV2<LONG>
    | CancelLeaseTransactionV3<LONG>;

export type CancelLeaseTransactionFromNode<LONG = Long> = SignedTransaction<
    CancelLeaseTransaction<LONG>
> &
    WithId &
    WithApplicationStatus &
    WithApiMixin & {
        feeAssetId: null;
    } & {
        lease: {
            id: string;
            originTransactionId: string;
            sender: string;
            recipient: string;
            amount: Long;
            height: number;
            status: 'canceled' | 'active';
            cancelHeight: number;
            cancelTransactionId: string;
        };
    };
