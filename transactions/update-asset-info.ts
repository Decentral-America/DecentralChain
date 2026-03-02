import type {
    Long,
    WithApiMixin,
    WithApplicationStatus,
    WithId,
    WithVersion,
} from '../src';
import type { BaseTransaction, SignedTransaction } from './index';

export type UpdateAssetInfoTransactionFields<LONG = Long> = {
    assetId: string;
    name: string;
    description: string;
};

export type UpdateAssetInfoTransactionV1<LONG> = WithVersion<
    UpdateAssetInfoTransactionFields<LONG> & BaseTransaction<LONG, 17>,
    1
>;

export type UpdateAssetInfoTransactionMap<LONG = Long> = {
    1: UpdateAssetInfoTransactionV1<LONG>;
};

export type UpdateAssetInfoTransaction<
    LONG = Long
> = UpdateAssetInfoTransactionV1<LONG>;

export type UpdateAssetInfoTransactionFromNode<LONG = Long> = SignedTransaction<
    UpdateAssetInfoTransaction<LONG>
> &
    WithId &
    WithApplicationStatus &
    WithApiMixin & {
        feeAssetId: null;
    };
