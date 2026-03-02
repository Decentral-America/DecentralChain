import type {
    Base58Bytes,
    Long,
    WithApiMixin,
    WithApplicationStatus,
    WithId,
    WithVersion,
} from '../src';
import type { BaseTransaction, SignedTransaction } from './index';

export type TransferTransactionFields<LONG = Long> = {
    recipient: string;
    amount: LONG;
    feeAssetId: string | null;
    assetId: string | null;
    attachment: Base58Bytes | null;
};

export type TransferTransactionV1<LONG> = WithVersion<
    TransferTransactionFields<LONG> & BaseTransaction<LONG, 4>,
    1
>;
export type TransferTransactionV2<LONG> = WithVersion<
    TransferTransactionFields<LONG> & BaseTransaction<LONG, 4>,
    2
>;
export type TransferTransactionV3<LONG> = WithVersion<
    TransferTransactionFields<LONG> & BaseTransaction<LONG, 4>,
    3
>;

export type TransferTransactionMap<LONG = Long> = {
    1: TransferTransactionV1<LONG>;
    2: TransferTransactionV2<LONG>;
    3: TransferTransactionV3<LONG>;
};

export type TransferTransaction<LONG = Long> =
    | TransferTransactionV1<LONG>
    | TransferTransactionV2<LONG>
    | TransferTransactionV3<LONG>;

export type TransferTransactionFromNode<LONG = Long> = SignedTransaction<
    TransferTransaction<LONG>
> &
    WithId &
    WithApplicationStatus &
    WithApiMixin;
