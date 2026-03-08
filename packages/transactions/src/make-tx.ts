import { binary } from '@decentralchain/marshall';
import {
  type AliasTransaction,
  type BurnTransaction,
  type CancelLeaseTransaction,
  type DataTransaction,
  type ExchangeTransaction,
  type InvokeScriptTransaction,
  type IssueTransaction,
  type LeaseTransaction,
  type MassTransferTransaction,
  type ReissueTransaction,
  type SetAssetScriptTransaction,
  type SetScriptTransaction,
  type SponsorshipTransaction,
  TRANSACTION_TYPE,
  type TransferTransaction,
  type UpdateAssetInfoTransaction,
} from '@decentralchain/ts-types';
import { txToProtoBytes } from './proto-serialize';
import {
  type IAliasParams,
  type IBurnParams,
  type ICancelLeaseParams,
  type IDataParams,
  type IInvokeScriptParams,
  type IIssueParams,
  type ILeaseParams,
  type IMassTransferParams,
  type IReissueParams,
  type ISetAssetScriptParams,
  type ISetScriptParams,
  type ISponsorshipParams,
  type ITransferParams,
  type TTransaction as TTransactionBase,
  type TTransactionType,
  type WithId,
  type WithSender,
} from './transactions';
import { alias } from './transactions/alias';
import { burn } from './transactions/burn';
import { cancelLease } from './transactions/cancel-lease';
import { data } from './transactions/data';
import { exchange } from './transactions/exchange';
import { invokeScript } from './transactions/invoke-script';
import { issue } from './transactions/issue';
import { lease } from './transactions/lease';
import { massTransfer } from './transactions/mass-transfer';
import { reissue } from './transactions/reissue';
import { setAssetScript } from './transactions/set-asset-script';
import { setScript } from './transactions/set-script';
import { sponsorship } from './transactions/sponsorship';
import { transfer } from './transactions/transfer';
import { updateAssetInfo } from './transactions/update-asset-info';

type TTransaction<T extends TTransactionType> = TxTypeMap[T];

type TxTypeMap = {
  [TRANSACTION_TYPE.ISSUE]: IssueTransaction;
  [TRANSACTION_TYPE.TRANSFER]: TransferTransaction;
  [TRANSACTION_TYPE.REISSUE]: ReissueTransaction;
  [TRANSACTION_TYPE.BURN]: BurnTransaction;
  [TRANSACTION_TYPE.LEASE]: LeaseTransaction;
  [TRANSACTION_TYPE.CANCEL_LEASE]: CancelLeaseTransaction;
  [TRANSACTION_TYPE.ALIAS]: AliasTransaction;
  [TRANSACTION_TYPE.MASS_TRANSFER]: MassTransferTransaction;
  [TRANSACTION_TYPE.DATA]: DataTransaction;
  [TRANSACTION_TYPE.SET_SCRIPT]: SetScriptTransaction;
  [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: SetAssetScriptTransaction;
  [TRANSACTION_TYPE.SPONSORSHIP]: SponsorshipTransaction;
  [TRANSACTION_TYPE.EXCHANGE]: ExchangeTransaction;
  [TRANSACTION_TYPE.INVOKE_SCRIPT]: InvokeScriptTransaction;
  [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: UpdateAssetInfoTransaction;
};
type TTxParamsWithType<T extends TTransactionType> = TxParamsTypeMap[T] & { type: T };

type TxParamsTypeMap = {
  [TRANSACTION_TYPE.ISSUE]: IIssueParams;
  [TRANSACTION_TYPE.TRANSFER]: ITransferParams;
  [TRANSACTION_TYPE.REISSUE]: IReissueParams;
  [TRANSACTION_TYPE.BURN]: IBurnParams;
  [TRANSACTION_TYPE.LEASE]: ILeaseParams;
  [TRANSACTION_TYPE.CANCEL_LEASE]: ICancelLeaseParams;
  [TRANSACTION_TYPE.ALIAS]: IAliasParams;
  [TRANSACTION_TYPE.MASS_TRANSFER]: IMassTransferParams;
  [TRANSACTION_TYPE.DATA]: IDataParams;
  [TRANSACTION_TYPE.SET_SCRIPT]: ISetScriptParams;
  [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: ISetAssetScriptParams;
  [TRANSACTION_TYPE.SPONSORSHIP]: ISponsorshipParams;
  [TRANSACTION_TYPE.EXCHANGE]: ExchangeTransaction;
  [TRANSACTION_TYPE.INVOKE_SCRIPT]: IInvokeScriptParams;
  [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: UpdateAssetInfoTransaction;
};

/**
 * Makes transaction from params. Validates all fields and calculates id
 */
export function makeTx<T extends TTransactionType>(
  params: TTxParamsWithType<T> & WithSender,
): TTransaction<T> & WithId {
  switch (params.type) {
    case TRANSACTION_TYPE.ISSUE:
      return issue(params as unknown as IIssueParams) as TTransaction<T> & WithId;
    case TRANSACTION_TYPE.TRANSFER:
      return transfer(params as unknown as ITransferParams) as TTransaction<T> & WithId;
    case TRANSACTION_TYPE.REISSUE:
      return reissue(params as unknown as IReissueParams) as TTransaction<T> & WithId;
    case TRANSACTION_TYPE.BURN:
      return burn(params as unknown as IBurnParams) as TTransaction<T> & WithId;
    case TRANSACTION_TYPE.LEASE:
      return lease(params as unknown as ILeaseParams) as TTransaction<T> & WithId;
    case TRANSACTION_TYPE.CANCEL_LEASE:
      return cancelLease(params as unknown as ICancelLeaseParams) as TTransaction<T> & WithId;
    case TRANSACTION_TYPE.ALIAS:
      return alias(params as unknown as IAliasParams) as TTransaction<T> & WithId;
    case TRANSACTION_TYPE.MASS_TRANSFER:
      return massTransfer(params as unknown as IMassTransferParams) as TTransaction<T> & WithId;
    case TRANSACTION_TYPE.DATA:
      return data(params as unknown as IDataParams) as TTransaction<T> & WithId;
    case TRANSACTION_TYPE.SET_SCRIPT:
      return setScript(params as unknown as ISetScriptParams) as TTransaction<T> & WithId;
    case TRANSACTION_TYPE.SET_ASSET_SCRIPT:
      return setAssetScript(params as unknown as ISetAssetScriptParams) as TTransaction<T> & WithId;
    case TRANSACTION_TYPE.SPONSORSHIP:
      return sponsorship(params as unknown as ISponsorshipParams) as TTransaction<T> & WithId;
    case TRANSACTION_TYPE.EXCHANGE:
      return exchange(
        params as unknown as ExchangeTransaction & { proofs: string[] },
      ) as TTransaction<T> & WithId;
    case TRANSACTION_TYPE.INVOKE_SCRIPT:
      return invokeScript(params as unknown as IInvokeScriptParams) as TTransaction<T> & WithId;
    case TRANSACTION_TYPE.UPDATE_ASSET_INFO:
      return updateAssetInfo(params as unknown as UpdateAssetInfoTransaction) as TTransaction<T> &
        WithId;
    default:
      throw new Error(`Unknown tx type: ${params.type}`);
  }
}

/**
 * Makes transaction bytes from validated transaction
 */
export function makeTxBytes<T extends TTransactionType>(
  tx: TTxParamsWithType<T> & WithSender & { version: number },
): Uint8Array {
  switch (tx.type) {
    case TRANSACTION_TYPE.ISSUE:
      return tx.version > 2
        ? txToProtoBytes(tx as unknown as TTransactionBase)
        : binary.serializeTx(tx);
    case TRANSACTION_TYPE.TRANSFER:
      return tx.version > 2
        ? txToProtoBytes(tx as unknown as TTransactionBase)
        : binary.serializeTx(tx);
    case TRANSACTION_TYPE.REISSUE:
      return tx.version > 2
        ? txToProtoBytes(tx as unknown as TTransactionBase)
        : binary.serializeTx(tx);
    case TRANSACTION_TYPE.BURN:
      return tx.version > 2
        ? txToProtoBytes(tx as unknown as TTransactionBase)
        : binary.serializeTx(tx);
    case TRANSACTION_TYPE.LEASE:
      return tx.version > 2
        ? txToProtoBytes(tx as unknown as TTransactionBase)
        : binary.serializeTx(tx);
    case TRANSACTION_TYPE.CANCEL_LEASE:
      return tx.version > 2
        ? txToProtoBytes(tx as unknown as TTransactionBase)
        : binary.serializeTx(tx);
    case TRANSACTION_TYPE.ALIAS:
      return tx.version > 2
        ? txToProtoBytes(tx as unknown as TTransactionBase)
        : binary.serializeTx(tx);
    case TRANSACTION_TYPE.MASS_TRANSFER:
      return tx.version > 1
        ? txToProtoBytes(tx as unknown as TTransactionBase)
        : binary.serializeTx(tx);
    case TRANSACTION_TYPE.DATA:
      return tx.version > 1
        ? txToProtoBytes(tx as unknown as TTransactionBase)
        : binary.serializeTx(tx);
    case TRANSACTION_TYPE.SET_SCRIPT:
      return tx.version > 1
        ? txToProtoBytes(tx as unknown as TTransactionBase)
        : binary.serializeTx(tx);
    case TRANSACTION_TYPE.SET_ASSET_SCRIPT:
      return tx.version > 1
        ? txToProtoBytes(tx as unknown as TTransactionBase)
        : binary.serializeTx(tx);
    case TRANSACTION_TYPE.SPONSORSHIP:
      return tx.version > 1
        ? txToProtoBytes(tx as unknown as TTransactionBase)
        : binary.serializeTx(tx);
    case TRANSACTION_TYPE.EXCHANGE:
      return tx.version > 2
        ? txToProtoBytes(tx as unknown as TTransactionBase)
        : binary.serializeTx(tx);
    case TRANSACTION_TYPE.INVOKE_SCRIPT:
      return tx.version > 1
        ? txToProtoBytes(tx as unknown as TTransactionBase)
        : binary.serializeTx(tx);
    case TRANSACTION_TYPE.UPDATE_ASSET_INFO:
      return txToProtoBytes(tx as unknown as TTransactionBase);
    default:
      throw new Error(`Unknown tx type: ${tx.type}`);
  }
}
