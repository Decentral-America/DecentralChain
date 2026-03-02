import type {
    Long,
    WithApiMixin,
    WithApplicationStatus,
    WithId,
    WithVersion,
} from '../src';
import type { BaseTransaction, SignedTransaction } from './index';

export type AliasTransactionFields<LONG = Long> = {
    alias: string;
};

export type AliasTransactionV1<LONG> = WithVersion<
    AliasTransactionFields<LONG> & BaseTransaction<LONG, 10>,
    1
>;
export type AliasTransactionV2<LONG> = WithVersion<
    AliasTransactionFields<LONG> & BaseTransaction<LONG, 10>,
    2
>;
export type AliasTransactionV3<LONG> = WithVersion<
    AliasTransactionFields<LONG> & BaseTransaction<LONG, 10>,
    3
>;

export type AliasTransactionMap<LONG = Long> = {
    1: AliasTransactionV1<LONG>;
    2: AliasTransactionV2<LONG>;
    3: AliasTransactionV3<LONG>;
};

export type AliasTransaction<LONG = Long> =
    | AliasTransactionV1<LONG>
    | AliasTransactionV2<LONG>
    | AliasTransactionV3<LONG>;

export type AliasTransactionFromNode<LONG = Long> = SignedTransaction<
    AliasTransaction<LONG>
> &
    WithId &
    WithApplicationStatus &
    WithApiMixin & {
        feeAssetId: null;
    };
