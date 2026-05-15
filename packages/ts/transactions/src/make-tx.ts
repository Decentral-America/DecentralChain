import { binary } from '@decentralchain/marshall';
import {
  type AliasTransaction,
  type BurnTransaction,
  type CancelLeaseTransaction,
  type CommitToGenerationTransaction,
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
  type ICommitToGenerationParams,
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
  type IUpdateAssetInfoParams,
  type TTransaction as TTransactionBase,
  type WithId,
  type WithSender,
} from './transactions';
import { alias } from './transactions/alias';
import { burn } from './transactions/burn';
import { cancelLease } from './transactions/cancel-lease';
import { commitToGeneration } from './transactions/commit-to-generation';
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

type SupportedTransactionType = keyof TxTypeMap;

type TTransaction<T extends SupportedTransactionType> = TxTypeMap[T];

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
  [TRANSACTION_TYPE.COMMIT_TO_GENERATION]: CommitToGenerationTransaction;
};
type TTxParamsWithType<T extends SupportedTransactionType> = TxParamsTypeMap[T] & { type: T };

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
  [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: IUpdateAssetInfoParams;
  [TRANSACTION_TYPE.COMMIT_TO_GENERATION]: ICommitToGenerationParams;
};

/**
 * Typed dispatch map — one entry per transaction type.
 * Consolidates all per-arm casts into a single, documented assertion when
 * accessing the handler. Each handler is individually type-safe for its own
 * transaction type; the map is indexed by SupportedTransactionType so the
 * lookup `makeTxDispatch[params.type]` can be cast once to `MakeTxFn<T>`.
 */
type MakeTxFn<K extends SupportedTransactionType> = (
  params: TxParamsTypeMap[K] & WithSender,
) => TxTypeMap[K] & WithId;

const makeTxDispatch: { [K in SupportedTransactionType]: MakeTxFn<K> } = {
  [TRANSACTION_TYPE.ISSUE]: (p) => issue(p),
  [TRANSACTION_TYPE.TRANSFER]: (p) => transfer(p),
  [TRANSACTION_TYPE.REISSUE]: (p) => reissue(p),
  [TRANSACTION_TYPE.BURN]: (p) => burn(p),
  [TRANSACTION_TYPE.LEASE]: (p) => lease(p),
  [TRANSACTION_TYPE.CANCEL_LEASE]: (p) => cancelLease(p),
  [TRANSACTION_TYPE.ALIAS]: (p) => alias(p),
  [TRANSACTION_TYPE.MASS_TRANSFER]: (p) => massTransfer(p),
  [TRANSACTION_TYPE.DATA]: (p) => data(p),
  [TRANSACTION_TYPE.SET_SCRIPT]: (p) => setScript(p),
  [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: (p) => setAssetScript(p),
  [TRANSACTION_TYPE.SPONSORSHIP]: (p) => sponsorship(p),
  [TRANSACTION_TYPE.EXCHANGE]: (p) => exchange(p as ExchangeTransaction & { proofs: string[] }),
  [TRANSACTION_TYPE.INVOKE_SCRIPT]: (p) => invokeScript(p),
  [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: (p) => updateAssetInfo(p as UpdateAssetInfoTransaction),
  [TRANSACTION_TYPE.COMMIT_TO_GENERATION]: (p) => commitToGeneration(p),
};

/**
 * Makes transaction from params. Validates all fields and calculates id
 */
export function makeTx<T extends SupportedTransactionType>(
  params: TTxParamsWithType<T> & WithSender,
): TTransaction<T> & WithId {
  // Single typed assertion: the dispatch map guarantees the handler for
  // params.type produces TTransaction<T> & WithId at the call site.
  const handler = makeTxDispatch[params.type] as MakeTxFn<T>;
  if (!handler) throw new Error(`Unknown tx type: ${params.type}`);
  return handler(params as TxParamsTypeMap[T] & WithSender);
}

/**
 * Minimum version at which protobuf serialization supersedes legacy binary serialization.
 * Types with value 0 always use proto (they have no legacy binary format).
 */
const PROTO_MIN_VERSION: { [K in SupportedTransactionType]: number } = {
  [TRANSACTION_TYPE.ISSUE]: 3,
  [TRANSACTION_TYPE.TRANSFER]: 3,
  [TRANSACTION_TYPE.REISSUE]: 3,
  [TRANSACTION_TYPE.BURN]: 3,
  [TRANSACTION_TYPE.LEASE]: 3,
  [TRANSACTION_TYPE.CANCEL_LEASE]: 3,
  [TRANSACTION_TYPE.ALIAS]: 3,
  [TRANSACTION_TYPE.EXCHANGE]: 3,
  [TRANSACTION_TYPE.MASS_TRANSFER]: 2,
  [TRANSACTION_TYPE.DATA]: 2,
  [TRANSACTION_TYPE.SET_SCRIPT]: 2,
  [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: 2,
  [TRANSACTION_TYPE.SPONSORSHIP]: 2,
  [TRANSACTION_TYPE.INVOKE_SCRIPT]: 2,
  [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: 0, // proto-only, no legacy format
  [TRANSACTION_TYPE.COMMIT_TO_GENERATION]: 0, // proto-only, no legacy format
} as const;

/**
 * Makes transaction bytes from validated transaction
 */
export function makeTxBytes<T extends SupportedTransactionType>(
  tx: TTxParamsWithType<T> & WithSender & { version: number },
): Uint8Array {
  if (tx.version >= PROTO_MIN_VERSION[tx.type]) {
    // Params satisfy TTransaction at runtime; TypeScript cannot prove this
    // without materialising T — single documented cross-schema assertion.
    return txToProtoBytes(tx as unknown as TTransactionBase);
  }
  return binary.serializeTx(tx);
}
