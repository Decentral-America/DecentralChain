import type {
    InvokeScriptCall,
    InvokeScriptPayment,
    Long,
    TStateChanges,
    WithApiMixin,
    WithApplicationStatus,
    WithId,
    WithVersion,
} from '../src';
import type { BaseTransaction, SignedTransaction } from './index';

export type InvokeScriptTransactionFields<LONG = Long> = {
    dApp: string;
    call: InvokeScriptCall<LONG> | null;
    feeAssetId: string | null;
    payment: Array<InvokeScriptPayment<LONG>> | null;
};

export type InvokeScriptTransactionV1<LONG> = WithVersion<
    InvokeScriptTransactionFields<LONG> & BaseTransaction<LONG, 16>,
    1
>;
export type InvokeScriptTransactionV2<LONG> = WithVersion<
    InvokeScriptTransactionFields<LONG> & BaseTransaction<LONG, 16>,
    2
>;

export type InvokeScriptTransactionMap<LONG = Long> = {
    1: InvokeScriptTransactionV1<LONG>;
    2: InvokeScriptTransactionV2<LONG>;
};

export type InvokeScriptTransaction<LONG = Long> =
    | InvokeScriptTransactionV1<LONG>
    | InvokeScriptTransactionV2<LONG>;

export type InvokeScriptTransactionFromNode<LONG = Long> = SignedTransaction<
    InvokeScriptTransaction<LONG>
> &
    WithId &
    WithApplicationStatus &
    WithApiMixin & {
        stateChanges: TStateChanges | null;
    };
