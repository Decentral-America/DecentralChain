import type {
    Base64Script,
    Long,
    WithApiMixin,
    WithApplicationStatus,
    WithId,
    WithVersion,
} from '../src';
import type { BaseTransaction, SignedTransaction } from './index';

export type SetScriptTransactionFields<LONG = Long> = {
    script: Base64Script | null;
};

export type SetScriptTransactionV1<LONG> = WithVersion<
    SetScriptTransactionFields<LONG> & BaseTransaction<LONG, 13>,
    1
>;
export type SetScriptTransactionV2<LONG> = WithVersion<
    SetScriptTransactionFields<LONG> & BaseTransaction<LONG, 13>,
    2
>;

export type SetScriptTransactionMap<LONG = Long> = {
    1: SetScriptTransactionV1<LONG>;
    2: SetScriptTransactionV2<LONG>;
};

export type SetScriptTransaction<LONG = Long> =
    | SetScriptTransactionV1<LONG>
    | SetScriptTransactionV2<LONG>;

export type SetScriptTransactionFromNode<LONG = Long> = SignedTransaction<
    SetScriptTransaction<LONG>
> &
    WithId &
    WithApplicationStatus &
    WithApiMixin & {
        feeAssetId: null;
    };
