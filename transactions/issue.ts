import type {
    AssetDecimals,
    Base64Script,
    Long,
    WithApiMixin,
    WithApplicationStatus,
    WithId,
    WithVersion,
} from '../src';
import type { BaseTransaction, SignedTransaction } from './index';

export type IssueTransactionFields<LONG = Long> = {
    name: string;
    description: string;
    decimals: AssetDecimals;
    quantity: LONG;
    reissuable: boolean;
    script: Base64Script | null;
};

export type IssueTransactionV1<LONG = Long> = WithVersion<
    IssueTransactionFields<LONG> & BaseTransaction<LONG, 3>,
    1
>;
export type IssueTransactionV2<LONG = Long> = WithVersion<
    IssueTransactionFields<LONG> & BaseTransaction<LONG, 3>,
    2
>;
export type IssueTransactionV3<LONG = Long> = WithVersion<
    IssueTransactionFields<LONG> & BaseTransaction<LONG, 3>,
    3
>;

export type IssueTransactionMap<LONG = Long> = {
    1: IssueTransactionV1<LONG>;
    2: IssueTransactionV2<LONG>;
    3: IssueTransactionV3<LONG>;
};

export type IssueTransaction<LONG = Long> =
    | IssueTransactionV1<LONG>
    | IssueTransactionV2<LONG>
    | IssueTransactionV3<LONG>;

export type IssueTransactionFromNode<LONG = Long> = SignedTransaction<
    IssueTransaction<LONG>
> &
    WithId &
    WithApplicationStatus &
    WithApiMixin & {
        feeAssetId: null;
        assetId: string;
    };
