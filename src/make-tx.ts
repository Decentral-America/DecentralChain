import {
  IAliasParams,
  IBurnParams,
  ICancelLeaseParams,
  IDataParams,
  IInvokeScriptParams,
  IIssueParams,
  ILeaseParams,
  IMassTransferParams,
  IReissueParams,
  ISetAssetScriptParams,
  ISetScriptParams,
  ISponsorshipParams,
  ITransferParams,
  TTransactionType,
  WithId,
  WithSender,
} from './transactions';
import { issue } from './transactions/issue';
import { transfer } from './transactions/transfer';
import { reissue } from './transactions/reissue';
import { burn } from './transactions/burn';
import { lease } from './transactions/lease';
import { cancelLease } from './transactions/cancel-lease';
import { alias } from './transactions/alias';
import { massTransfer } from './transactions/mass-transfer';
import { data } from './transactions/data';
import { setScript } from './transactions/set-script';
import { setAssetScript } from './transactions/set-asset-script';
import { sponsorship } from './transactions/sponsorship';
import { exchange } from './transactions/exchange';
import { invokeScript } from './transactions/invoke-script';
import { updateAssetInfo } from './transactions/update-asset-info';
import { txToProtoBytes } from './proto-serialize';
import { binary } from '@decentralchain/marshall';
import {
<<<<<<< HEAD
    AliasTransaction,
    BurnTransaction,
    CancelLeaseTransaction,
    DataTransaction,
    ExchangeTransaction,
<<<<<<< HEAD
<<<<<<< HEAD
    // InvokeExpressionTransaction,
=======
>>>>>>> 697d643a (minor fixes)
=======
    // InvokeExpressionTransaction,
>>>>>>> f33083a0 (updated dependencies)
    InvokeScriptTransaction,
    IssueTransaction,
    LeaseTransaction,
    MassTransferTransaction,
    ReissueTransaction,
    SetAssetScriptTransaction,
    SetScriptTransaction,
    SponsorshipTransaction,
    TRANSACTION_TYPE,
    TransferTransaction,
    UpdateAssetInfoTransaction
=======
  AliasTransaction,
  BurnTransaction,
  CancelLeaseTransaction,
  DataTransaction,
  ExchangeTransaction,
  // InvokeExpressionTransaction,
  InvokeScriptTransaction,
  IssueTransaction,
  LeaseTransaction,
  MassTransferTransaction,
  ReissueTransaction,
  SetAssetScriptTransaction,
  SetScriptTransaction,
  SponsorshipTransaction,
  TRANSACTION_TYPE,
  TransferTransaction,
  UpdateAssetInfoTransaction,
<<<<<<< HEAD
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
} from '@decentralchain/ts-types'
=======
} from '@decentralchain/ts-types';
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup)

export type TTransaction<T extends TTransactionType> = TxTypeMap[T];

export type TxTypeMap = {
<<<<<<< HEAD
<<<<<<< HEAD
    [TRANSACTION_TYPE.ISSUE]: IssueTransaction
    [TRANSACTION_TYPE.TRANSFER]: TransferTransaction
    [TRANSACTION_TYPE.REISSUE]: ReissueTransaction
    [TRANSACTION_TYPE.BURN]: BurnTransaction
    [TRANSACTION_TYPE.LEASE]: LeaseTransaction
    [TRANSACTION_TYPE.CANCEL_LEASE]: CancelLeaseTransaction
    [TRANSACTION_TYPE.ALIAS]: AliasTransaction
    [TRANSACTION_TYPE.MASS_TRANSFER]: MassTransferTransaction
    [TRANSACTION_TYPE.DATA]: DataTransaction
    [TRANSACTION_TYPE.SET_SCRIPT]: SetScriptTransaction
    [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: SetAssetScriptTransaction
    [TRANSACTION_TYPE.SPONSORSHIP]: SponsorshipTransaction
    [TRANSACTION_TYPE.EXCHANGE]: ExchangeTransaction
    [TRANSACTION_TYPE.INVOKE_SCRIPT]: InvokeScriptTransaction
    [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: UpdateAssetInfoTransaction
<<<<<<< HEAD
<<<<<<< HEAD
    // [TRANSACTION_TYPE.INVOKE_EXPRESSION]: InvokeExpressionTransaction
=======
>>>>>>> 697d643a (minor fixes)
=======
    // [TRANSACTION_TYPE.INVOKE_EXPRESSION]: InvokeExpressionTransaction
>>>>>>> f33083a0 (updated dependencies)
=======
  [TRANSACTION_TYPE.ISSUE]: IssueTransaction
  [TRANSACTION_TYPE.TRANSFER]: TransferTransaction
  [TRANSACTION_TYPE.REISSUE]: ReissueTransaction
  [TRANSACTION_TYPE.BURN]: BurnTransaction
  [TRANSACTION_TYPE.LEASE]: LeaseTransaction
  [TRANSACTION_TYPE.CANCEL_LEASE]: CancelLeaseTransaction
  [TRANSACTION_TYPE.ALIAS]: AliasTransaction
  [TRANSACTION_TYPE.MASS_TRANSFER]: MassTransferTransaction
  [TRANSACTION_TYPE.DATA]: DataTransaction
  [TRANSACTION_TYPE.SET_SCRIPT]: SetScriptTransaction
  [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: SetAssetScriptTransaction
  [TRANSACTION_TYPE.SPONSORSHIP]: SponsorshipTransaction
  [TRANSACTION_TYPE.EXCHANGE]: ExchangeTransaction
  [TRANSACTION_TYPE.INVOKE_SCRIPT]: InvokeScriptTransaction
  [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: UpdateAssetInfoTransaction
  // [TRANSACTION_TYPE.INVOKE_EXPRESSION]: InvokeExpressionTransaction
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
}
export type TTxParamsWithType<T extends TTransactionType> = TxParamsTypeMap[T] & { type: T }

export type TxParamsTypeMap = {
<<<<<<< HEAD
    [TRANSACTION_TYPE.ISSUE]: IIssueParams
    [TRANSACTION_TYPE.TRANSFER]: ITransferParams
    [TRANSACTION_TYPE.REISSUE]: IReissueParams
    [TRANSACTION_TYPE.BURN]: IBurnParams
    [TRANSACTION_TYPE.LEASE]: ILeaseParams
    [TRANSACTION_TYPE.CANCEL_LEASE]: ICancelLeaseParams
    [TRANSACTION_TYPE.ALIAS]: IAliasParams
    [TRANSACTION_TYPE.MASS_TRANSFER]: IMassTransferParams
    [TRANSACTION_TYPE.DATA]: IDataParams
    [TRANSACTION_TYPE.SET_SCRIPT]: ISetScriptParams
    [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: ISetAssetScriptParams
    [TRANSACTION_TYPE.SPONSORSHIP]: ISponsorshipParams
    [TRANSACTION_TYPE.EXCHANGE]: ExchangeTransaction
    [TRANSACTION_TYPE.INVOKE_SCRIPT]: IInvokeScriptParams
    [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: UpdateAssetInfoTransaction
<<<<<<< HEAD
<<<<<<< HEAD
    // [TRANSACTION_TYPE.INVOKE_EXPRESSION]: InvokeExpressionTransaction
=======
>>>>>>> 697d643a (minor fixes)
=======
    // [TRANSACTION_TYPE.INVOKE_EXPRESSION]: InvokeExpressionTransaction
>>>>>>> f33083a0 (updated dependencies)
=======
  [TRANSACTION_TYPE.ISSUE]: IIssueParams
  [TRANSACTION_TYPE.TRANSFER]: ITransferParams
  [TRANSACTION_TYPE.REISSUE]: IReissueParams
  [TRANSACTION_TYPE.BURN]: IBurnParams
  [TRANSACTION_TYPE.LEASE]: ILeaseParams
  [TRANSACTION_TYPE.CANCEL_LEASE]: ICancelLeaseParams
  [TRANSACTION_TYPE.ALIAS]: IAliasParams
  [TRANSACTION_TYPE.MASS_TRANSFER]: IMassTransferParams
  [TRANSACTION_TYPE.DATA]: IDataParams
  [TRANSACTION_TYPE.SET_SCRIPT]: ISetScriptParams
  [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: ISetAssetScriptParams
  [TRANSACTION_TYPE.SPONSORSHIP]: ISponsorshipParams
  [TRANSACTION_TYPE.EXCHANGE]: ExchangeTransaction
  [TRANSACTION_TYPE.INVOKE_SCRIPT]: IInvokeScriptParams
  [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: UpdateAssetInfoTransaction
  // [TRANSACTION_TYPE.INVOKE_EXPRESSION]: InvokeExpressionTransaction
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
}
=======
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
  // [TRANSACTION_TYPE.INVOKE_EXPRESSION]: InvokeExpressionTransaction
};
export type TTxParamsWithType<T extends TTransactionType> = TxParamsTypeMap[T] & { type: T };

export type TxParamsTypeMap = {
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
  // [TRANSACTION_TYPE.INVOKE_EXPRESSION]: InvokeExpressionTransaction
};
>>>>>>> 591daad2 (feat!: modernize to ESM, TypeScript 5.9, Vitest, tsup)

/**
 * Makes transaction from params. Validates all fields and calculates id
 */
<<<<<<< HEAD
export function makeTx<T extends TTransactionType>(params: TTxParamsWithType<T> & WithSender): TTransaction<T> & WithId {
    switch (params.type) {
        case TRANSACTION_TYPE.ISSUE:
            return issue(params as any) as any
        case TRANSACTION_TYPE.TRANSFER:
            return transfer(params as any) as any
        case TRANSACTION_TYPE.REISSUE:
            return reissue(params as any) as any
        case TRANSACTION_TYPE.BURN:
            return burn(params as any) as any
        case TRANSACTION_TYPE.LEASE:
            return lease(params as any) as any
        case TRANSACTION_TYPE.CANCEL_LEASE:
            return cancelLease(params as any) as any
        case TRANSACTION_TYPE.ALIAS:
            return alias(params as any) as any
        case TRANSACTION_TYPE.MASS_TRANSFER:
            return massTransfer(params as any) as any
        case TRANSACTION_TYPE.DATA:
            return data(params as any) as any
        case TRANSACTION_TYPE.SET_SCRIPT:
            return setScript(params as any) as any
        case TRANSACTION_TYPE.SET_ASSET_SCRIPT:
            return setAssetScript(params as any) as any
        case TRANSACTION_TYPE.SPONSORSHIP:
            return sponsorship(params as any) as any
        case TRANSACTION_TYPE.EXCHANGE:
            return exchange(params as any) as any
        case TRANSACTION_TYPE.INVOKE_SCRIPT:
            return invokeScript(params as any) as any
        case TRANSACTION_TYPE.UPDATE_ASSET_INFO:
            return updateAssetInfo(params as any) as any
<<<<<<< HEAD
<<<<<<< HEAD
        // case TRANSACTION_TYPE.INVOKE_EXPRESSION:
        //     return txToProtoBytes(params as any) as any
=======
>>>>>>> 697d643a (minor fixes)
=======
        // case TRANSACTION_TYPE.INVOKE_EXPRESSION:
        //     return txToProtoBytes(params as any) as any
>>>>>>> f33083a0 (updated dependencies)
        default:
            throw new Error(`Unknown tx type: ${params.type}`)
    }
=======
export function makeTx<T extends TTransactionType>(
  params: TTxParamsWithType<T> & WithSender,
): TTransaction<T> & WithId {
  switch (params.type) {
    case TRANSACTION_TYPE.ISSUE:
      return issue(params as any) as any;
    case TRANSACTION_TYPE.TRANSFER:
      return transfer(params as any) as any;
    case TRANSACTION_TYPE.REISSUE:
      return reissue(params as any) as any;
    case TRANSACTION_TYPE.BURN:
      return burn(params as any) as any;
    case TRANSACTION_TYPE.LEASE:
      return lease(params as any) as any;
    case TRANSACTION_TYPE.CANCEL_LEASE:
      return cancelLease(params as any) as any;
    case TRANSACTION_TYPE.ALIAS:
      return alias(params as any) as any;
    case TRANSACTION_TYPE.MASS_TRANSFER:
      return massTransfer(params as any) as any;
    case TRANSACTION_TYPE.DATA:
      return data(params as any) as any;
    case TRANSACTION_TYPE.SET_SCRIPT:
      return setScript(params as any) as any;
    case TRANSACTION_TYPE.SET_ASSET_SCRIPT:
      return setAssetScript(params as any) as any;
    case TRANSACTION_TYPE.SPONSORSHIP:
      return sponsorship(params as any) as any;
    case TRANSACTION_TYPE.EXCHANGE:
      return exchange(params as any) as any;
    case TRANSACTION_TYPE.INVOKE_SCRIPT:
      return invokeScript(params as any) as any;
    case TRANSACTION_TYPE.UPDATE_ASSET_INFO:
      return updateAssetInfo(params as any) as any;
    // case TRANSACTION_TYPE.INVOKE_EXPRESSION:
    //     return txToProtoBytes(params as any) as any
    default:
      throw new Error(`Unknown tx type: ${params.type}`);
  }
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
}

/**
 * Makes transaction bytes from validated transaction
 */
<<<<<<< HEAD
export function makeTxBytes<T extends TTransactionType>(tx: TTxParamsWithType<T> & WithSender & { version: number }): Uint8Array {
    switch (tx.type) {
        case TRANSACTION_TYPE.ISSUE:
            return tx.version > 2 ? txToProtoBytes(tx as any) : binary.serializeTx(tx)
        case TRANSACTION_TYPE.TRANSFER:
            return tx.version > 2 ? txToProtoBytes(tx as any) : binary.serializeTx(tx)
        case TRANSACTION_TYPE.REISSUE:
            return tx.version > 2 ? txToProtoBytes(tx as any) : binary.serializeTx(tx)
        case TRANSACTION_TYPE.BURN:
            return tx.version > 2 ? txToProtoBytes(tx as any) : binary.serializeTx(tx)
        case TRANSACTION_TYPE.LEASE:
            return tx.version > 2 ? txToProtoBytes(tx as any) : binary.serializeTx(tx)
        case TRANSACTION_TYPE.CANCEL_LEASE:
            return tx.version > 2 ? txToProtoBytes(tx as any) : binary.serializeTx(tx)
        case TRANSACTION_TYPE.ALIAS:
            return tx.version > 2 ? txToProtoBytes(tx as any) : binary.serializeTx(tx)
        case TRANSACTION_TYPE.MASS_TRANSFER:
            return tx.version > 1 ? txToProtoBytes(tx as any) : binary.serializeTx(tx)
        case TRANSACTION_TYPE.DATA:
            return tx.version > 1 ? txToProtoBytes(tx as any) : binary.serializeTx(tx)
        case TRANSACTION_TYPE.SET_SCRIPT:
            return tx.version > 1 ? txToProtoBytes(tx as any) : binary.serializeTx(tx)
        case TRANSACTION_TYPE.SET_ASSET_SCRIPT:
            return tx.version > 1 ? txToProtoBytes(tx as any) : binary.serializeTx(tx)
        case TRANSACTION_TYPE.SPONSORSHIP:
            return tx.version > 1 ? txToProtoBytes(tx as any) : binary.serializeTx(tx)
        case TRANSACTION_TYPE.EXCHANGE:
            return tx.version > 2 ? txToProtoBytes(tx as any) : binary.serializeTx(tx)
        case TRANSACTION_TYPE.INVOKE_SCRIPT:
            return tx.version > 1 ? txToProtoBytes(tx as any) : binary.serializeTx(tx)
        case TRANSACTION_TYPE.UPDATE_ASSET_INFO:
            return txToProtoBytes(tx as any)
<<<<<<< HEAD
<<<<<<< HEAD
        // case TRANSACTION_TYPE.INVOKE_EXPRESSION:
        //     return txToProtoBytes(tx as any)
=======
>>>>>>> 697d643a (minor fixes)
=======
        // case TRANSACTION_TYPE.INVOKE_EXPRESSION:
        //     return txToProtoBytes(tx as any)
>>>>>>> f33083a0 (updated dependencies)
        default:
            throw new Error(`Unknown tx type: ${tx.type}`)
    }
=======
export function makeTxBytes<T extends TTransactionType>(
  tx: TTxParamsWithType<T> & WithSender & { version: number },
): Uint8Array {
  switch (tx.type) {
    case TRANSACTION_TYPE.ISSUE:
      return tx.version > 2 ? txToProtoBytes(tx as any) : binary.serializeTx(tx);
    case TRANSACTION_TYPE.TRANSFER:
      return tx.version > 2 ? txToProtoBytes(tx as any) : binary.serializeTx(tx);
    case TRANSACTION_TYPE.REISSUE:
      return tx.version > 2 ? txToProtoBytes(tx as any) : binary.serializeTx(tx);
    case TRANSACTION_TYPE.BURN:
      return tx.version > 2 ? txToProtoBytes(tx as any) : binary.serializeTx(tx);
    case TRANSACTION_TYPE.LEASE:
      return tx.version > 2 ? txToProtoBytes(tx as any) : binary.serializeTx(tx);
    case TRANSACTION_TYPE.CANCEL_LEASE:
      return tx.version > 2 ? txToProtoBytes(tx as any) : binary.serializeTx(tx);
    case TRANSACTION_TYPE.ALIAS:
      return tx.version > 2 ? txToProtoBytes(tx as any) : binary.serializeTx(tx);
    case TRANSACTION_TYPE.MASS_TRANSFER:
      return tx.version > 1 ? txToProtoBytes(tx as any) : binary.serializeTx(tx);
    case TRANSACTION_TYPE.DATA:
      return tx.version > 1 ? txToProtoBytes(tx as any) : binary.serializeTx(tx);
    case TRANSACTION_TYPE.SET_SCRIPT:
      return tx.version > 1 ? txToProtoBytes(tx as any) : binary.serializeTx(tx);
    case TRANSACTION_TYPE.SET_ASSET_SCRIPT:
      return tx.version > 1 ? txToProtoBytes(tx as any) : binary.serializeTx(tx);
    case TRANSACTION_TYPE.SPONSORSHIP:
      return tx.version > 1 ? txToProtoBytes(tx as any) : binary.serializeTx(tx);
    case TRANSACTION_TYPE.EXCHANGE:
      return tx.version > 2 ? txToProtoBytes(tx as any) : binary.serializeTx(tx);
    case TRANSACTION_TYPE.INVOKE_SCRIPT:
      return tx.version > 1 ? txToProtoBytes(tx as any) : binary.serializeTx(tx);
    case TRANSACTION_TYPE.UPDATE_ASSET_INFO:
      return txToProtoBytes(tx as any);
    // case TRANSACTION_TYPE.INVOKE_EXPRESSION:
    //     return txToProtoBytes(tx as any)
    default:
      throw new Error(`Unknown tx type: ${tx.type}`);
  }
>>>>>>> d9e75820 (chore: add Bulletproof quality pipeline)
}
