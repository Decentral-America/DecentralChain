import type { Long, TStateChanges, WithApiMixin, WithApplicationStatus, WithVersion } from '../src';
import type { BaseTransaction } from './index';
import type { InvokeScriptTransactionFields } from './invoke-script';

export type EthereumTransactionFields<LONG = Long> = {
    payload:
        | ({
              type: 'invocation';
              stateChanges: TStateChanges | null;
          } & InvokeScriptTransactionFields)
        | {
              type: 'transfer';
              recipient: string;
              amount: LONG;
              asset: string | null;
          }
        | {};
    bytes: string;
};

export type EthereumTransactionV1<LONG> = WithVersion<
    EthereumTransactionFields<LONG> & BaseTransaction<LONG, 18>,
    1
>;

export type EthereumTransactionMap<LONG = Long> = {
    1: EthereumTransactionV1<LONG>;
};

export type EthereumTransaction<LONG = Long> = EthereumTransactionV1<LONG> &
    WithApiMixin &
    WithApplicationStatus & {
        feeAssetId: null;
    };

