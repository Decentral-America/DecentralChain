import type {
    Long,
    WithApiMixin,
    WithApplicationStatus,
    WithId,
    WithVersion,
} from '../src';
import type { BaseTransaction, SignedTransaction } from './index';

export type BurnTransactionFields<LONG = Long> = {
    assetId: string;
    amount: LONG;
};

export type BurnTransactionV1<LONG> = WithVersion<
    BurnTransactionFields<LONG> & BaseTransaction<LONG, 6>,
    1
>;
export type BurnTransactionV2<LONG> = WithVersion<
    BurnTransactionFields<LONG> & BaseTransaction<LONG, 6>,
    2
>;
export type BurnTransactionV3<LONG> = WithVersion<
    BurnTransactionFields<LONG> & BaseTransaction<LONG, 6>,
    3
>;

export type BurnTransactionMap<LONG = Long> = {
    1: BurnTransactionV1<LONG>;
    2: BurnTransactionV2<LONG>;
    3: BurnTransactionV3<LONG>;
};

export type BurnTransaction<LONG = Long> =
    | BurnTransactionV1<LONG>
    | BurnTransactionV2<LONG>
    | BurnTransactionV3<LONG>;

export type BurnTransactionFromNode<LONG = Long> = SignedTransaction<
    BurnTransaction<LONG>
> &
    WithId &
    WithApplicationStatus &
    WithApiMixin & {
        feeAssetId: null;
    };
