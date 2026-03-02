import type {
    Base58Bytes,
    Long,
    MassTransferItem,
    WithApiMixin,
    WithApplicationStatus,
    WithId,
    WithVersion,
} from '../src';
import type { BaseTransaction, SignedTransaction } from './index';

export type MassTransferTransactionFields<LONG = Long> = {
    transfers: Array<MassTransferItem<LONG>>;
    assetId: string | null;
    attachment: Base58Bytes | null;
};

export type MassTransferTransactionV1<LONG> = WithVersion<
    MassTransferTransactionFields<LONG> & BaseTransaction<LONG, 11>,
    1
>;
export type MassTransferTransactionV2<LONG> = WithVersion<
    MassTransferTransactionFields<LONG> & BaseTransaction<LONG, 11>,
    2
>;

export type MassTransferTransactionMap<LONG = Long> = {
    1: MassTransferTransactionV1<LONG>;
    2: MassTransferTransactionV2<LONG>;
};

export type MassTransferTransaction<LONG = Long> =
    | MassTransferTransactionV1<LONG>
    | MassTransferTransactionV2<LONG>;

export type MassTransferTransactionFromNode<LONG = Long> = SignedTransaction<
    MassTransferTransaction<LONG>
> &
    WithId &
    WithApplicationStatus &
    WithApiMixin & {
        feeAssetId: null;
        totalAmount: LONG;
        transferCount: number;
    };
