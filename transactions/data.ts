import type {
    DataTransactionEntry,
    Long,
    WithApiMixin,
    WithApplicationStatus,
    WithId,
    WithVersion,
} from '../src';
import type { BaseTransaction, SignedTransaction } from './index';

export type DataTransactionFields<LONG = Long> = {
    data: Array<DataTransactionEntry<LONG>>;
};

export type DataTransactionV1<LONG> = WithVersion<
    DataTransactionFields<LONG> & BaseTransaction<LONG, 12>,
    1
>;
export type DataTransactionV2<LONG> = WithVersion<
    DataTransactionFields<LONG> & BaseTransaction<LONG, 12>,
    2
>;

export type DataTransactionMap<LONG = Long> = {
    1: DataTransactionV1<LONG>;
    2: DataTransactionV2<LONG>;
};

export type DataTransaction<LONG = Long> =
    | DataTransactionV1<LONG>
    | DataTransactionV2<LONG>;

export type DataTransactionFromNode<LONG = Long> = SignedTransaction<
    DataTransaction<LONG>
> &
    WithId &
    WithApplicationStatus &
    WithApiMixin & {
        feeAssetId: null;
    };
