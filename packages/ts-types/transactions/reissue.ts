import type {
    Long,
    WithApiMixin,
    WithApplicationStatus,
    WithId,
    WithVersion,
} from '../src';
import type { BaseTransaction, SignedTransaction } from './index';

export type ReissueTransactionFields<LONG = Long> = {
    assetId: string;
    quantity: LONG;
    reissuable: boolean;
};

export type ReissueTransactionV1<LONG> = WithVersion<
    ReissueTransactionFields<LONG> & BaseTransaction<LONG, 5>,
    1
>;
export type ReissueTransactionV2<LONG> = WithVersion<
    ReissueTransactionFields<LONG> & BaseTransaction<LONG, 5>,
    2
>;
export type ReissueTransactionV3<LONG> = WithVersion<
    ReissueTransactionFields<LONG> & BaseTransaction<LONG, 5>,
    3
>;

export type ReissueTransactionMap<LONG = Long> = {
    1: ReissueTransactionV1<LONG>;
    2: ReissueTransactionV2<LONG>;
    3: ReissueTransactionV3<LONG>;
};

export type ReissueTransaction<LONG = Long> =
    | ReissueTransactionV1<LONG>
    | ReissueTransactionV2<LONG>
    | ReissueTransactionV3<LONG>;

export type ReissueTransactionFromNode<LONG = Long> = SignedTransaction<
    ReissueTransaction<LONG>
> &
    WithId &
    WithApplicationStatus &
    WithApiMixin & {
        feeAssetId: null;
    };
