import type {
    Base64Script,
    Long,
    WithApiMixin,
    WithApplicationStatus,
    WithId,
    WithVersion,
} from '../src';
import type { BaseTransaction, SignedTransaction } from './index';

export type SetAssetScriptTransactionFields<LONG = Long> = {
    assetId: string;
    script: Base64Script;
};

export type SetAssetScriptTransactionV1<LONG> = WithVersion<
    SetAssetScriptTransactionFields<LONG> & BaseTransaction<LONG, 15>,
    1
>;
export type SetAssetScriptTransactionV2<LONG> = WithVersion<
    SetAssetScriptTransactionFields<LONG> & BaseTransaction<LONG, 15>,
    2
>;

export type SetAssetScriptTransactionMap<LONG = Long> = {
    1: SetAssetScriptTransactionV1<LONG>;
    2: SetAssetScriptTransactionV2<LONG>;
};

export type SetAssetScriptTransaction<LONG = Long> =
    | SetAssetScriptTransactionV1<LONG>
    | SetAssetScriptTransactionV2<LONG>;

export type SetAssetScriptTransactionFromNode<LONG = Long> = SignedTransaction<
    SetAssetScriptTransaction<LONG>
> &
    WithId &
    WithApplicationStatus &
    WithApiMixin & {
        feeAssetId: null;
    };
