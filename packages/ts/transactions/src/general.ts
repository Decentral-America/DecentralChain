import { binary } from '@decentralchain/marshall';
import { address, verifySignature } from '@decentralchain/ts-lib-crypto';
import {
  type AliasTransaction,
  type BurnTransaction,
  type CancelLeaseTransaction,
  type CommitToGenerationTransaction,
  type DataTransaction,
  type ExchangeTransaction,
  type ExchangeTransactionOrder,
  type InvokeScriptTransaction,
  type IssueTransaction,
  type LeaseTransaction,
  type MassTransferTransaction,
  type ReissueTransaction,
  type SetAssetScriptTransaction,
  type SetScriptTransaction,
  type SignedIExchangeTransactionOrder,
  type SignedTransaction,
  type SponsorshipTransaction,
  TRANSACTION_TYPE,
  type Transaction,
  type TransferTransaction,
  type UpdateAssetInfoTransaction,
} from '@decentralchain/ts-types';
import { isOrder } from './generic';
import { serializeAuthData } from './requests/auth';
import { serializeCustomData, type TSignedData } from './requests/custom-data';
import { serializeDccAuthData } from './requests/dccAuth';
import { matcherRequest } from './tools/request';
import { stringifyOrder } from './tools/stringify';
import {
  type IAuthParams,
  type ICancelOrder,
  type TTransaction,
  type TTxParams,
  type WithProofs,
  type WithSender,
  type WithTxType,
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
import { type TSeedTypes } from './types';

type TLong = string | number;

// Union of all transaction types that can be signed via signTx.
// Adding a new transaction type here forces a TypeScript error if the
// corresponding entry is missing from signableTxMap below (Record<> exhaustiveness).
type SignableTransactionType =
  | typeof TRANSACTION_TYPE.ISSUE
  | typeof TRANSACTION_TYPE.TRANSFER
  | typeof TRANSACTION_TYPE.REISSUE
  | typeof TRANSACTION_TYPE.BURN
  | typeof TRANSACTION_TYPE.LEASE
  | typeof TRANSACTION_TYPE.CANCEL_LEASE
  | typeof TRANSACTION_TYPE.ALIAS
  | typeof TRANSACTION_TYPE.MASS_TRANSFER
  | typeof TRANSACTION_TYPE.DATA
  | typeof TRANSACTION_TYPE.SET_SCRIPT
  | typeof TRANSACTION_TYPE.SET_ASSET_SCRIPT
  | typeof TRANSACTION_TYPE.SPONSORSHIP
  | typeof TRANSACTION_TYPE.EXCHANGE
  | typeof TRANSACTION_TYPE.INVOKE_SCRIPT
  | typeof TRANSACTION_TYPE.UPDATE_ASSET_INFO
  | typeof TRANSACTION_TYPE.COMMIT_TO_GENERATION;

type SignFn = (
  tx: Transaction<TLong> | (TTxParams & WithTxType),
  seed: TSeedTypes,
) => SignedTransaction<Transaction<TLong>>;

// Record<SignableTransactionType, ...> is exhaustive: TypeScript will error
// if any entry in SignableTransactionType is missing — no more silent gaps.
const signableTxMap: Record<SignableTransactionType, { sign: SignFn }> = {
  [TRANSACTION_TYPE.ISSUE]: { sign: (x, seed) => issue(x as IssueTransaction<TLong>, seed) },
  [TRANSACTION_TYPE.TRANSFER]: {
    sign: (x, seed) => transfer(x as TransferTransaction<TLong>, seed),
  },
  [TRANSACTION_TYPE.REISSUE]: { sign: (x, seed) => reissue(x as ReissueTransaction<TLong>, seed) },
  [TRANSACTION_TYPE.BURN]: { sign: (x, seed) => burn(x as BurnTransaction<TLong>, seed) },
  [TRANSACTION_TYPE.LEASE]: { sign: (x, seed) => lease(x as LeaseTransaction<TLong>, seed) },
  [TRANSACTION_TYPE.CANCEL_LEASE]: {
    sign: (x, seed) => cancelLease(x as CancelLeaseTransaction, seed),
  },
  [TRANSACTION_TYPE.ALIAS]: { sign: (x, seed) => alias(x as AliasTransaction, seed) },
  [TRANSACTION_TYPE.MASS_TRANSFER]: {
    sign: (x, seed) => massTransfer(x as MassTransferTransaction, seed),
  },
  [TRANSACTION_TYPE.DATA]: { sign: (x, seed) => data(x as DataTransaction, seed) },
  [TRANSACTION_TYPE.SET_SCRIPT]: { sign: (x, seed) => setScript(x as SetScriptTransaction, seed) },
  [TRANSACTION_TYPE.SET_ASSET_SCRIPT]: {
    sign: (x, seed) => setAssetScript(x as SetAssetScriptTransaction, seed),
  },
  [TRANSACTION_TYPE.SPONSORSHIP]: {
    sign: (x, seed) => sponsorship(x as SponsorshipTransaction, seed),
  },
  [TRANSACTION_TYPE.EXCHANGE]: {
    sign: (x, seed) => exchange(x as ExchangeTransaction & WithProofs, seed),
  },
  [TRANSACTION_TYPE.INVOKE_SCRIPT]: {
    sign: (x, seed) => invokeScript(x as InvokeScriptTransaction, seed),
  },
  [TRANSACTION_TYPE.UPDATE_ASSET_INFO]: {
    sign: (x, seed) => updateAssetInfo(x as UpdateAssetInfoTransaction, seed),
  },
  [TRANSACTION_TYPE.COMMIT_TO_GENERATION]: {
    sign: (x, seed) => commitToGeneration(x as CommitToGenerationTransaction, seed),
  },
};

/**
 * Signs arbitrary transaction. Can also create signed transaction if provided params have type field
 * @param tx
 * @param seed
 */
export function signTx(
  tx: Transaction | (TTxParams & WithTxType),
  seed: TSeedTypes,
): SignedTransaction<Transaction> {
  const entry = (signableTxMap as Record<number, { sign: SignFn } | undefined>)[tx.type];
  if (!entry) throw new Error(`Unknown tx type: ${tx.type}`);

  return entry.sign(tx, seed);
}

/**
 * Converts transaction or order object to Uint8Array
 * @param obj transaction or order
 */
export function serialize(
  obj: Transaction | SignedIExchangeTransactionOrder<ExchangeTransactionOrder>,
): Uint8Array {
  if (isOrder(obj)) return binary.serializeOrder(obj);
  return binary.serializeTx(obj);
}

/**
 * Verifies signature of transaction or order
 * @param obj
 * @param proofN - proof index. Takes first proof by default
 * @param publicKey - takes senderPublicKey by default
 */
export function verify(
  obj: (TTransaction & WithProofs) | SignedIExchangeTransactionOrder<ExchangeTransactionOrder>,
  proofN = 0,
  publicKey?: string,
): boolean {
  publicKey = publicKey ?? obj.senderPublicKey;
  if (!publicKey) throw new Error('No public key provided and transaction has no senderPublicKey');
  const bytes = serialize(obj);
  if (obj.version == null) {
    const signature = (obj as { signature?: string }).signature;
    if (!signature) throw new Error('Transaction has no signature to verify');
    return verifySignature(publicKey, bytes, signature);
  }
  const proofs: string[] | undefined = (obj as { proofs?: string[] }).proofs;
  if (!Array.isArray(proofs) || proofs.length === 0) {
    throw new Error('Transaction has no proofs to verify');
  }
  if (proofN < 0 || proofN >= proofs.length) {
    throw new Error(`Proof index ${proofN} is out of bounds (${proofs.length} proofs available)`);
  }
  const signature = proofs[proofN] as string;
  return verifySignature(publicKey, bytes, signature);
}

export function verifyCustomData(data: TSignedData): boolean {
  if (!data.publicKey || !data.signature) return false;
  const bytes = serializeCustomData(data);
  return verifySignature(data.publicKey as string, bytes, data.signature as string);
}

export function verifyAuthData(
  authData: { signature: string; publicKey: string; address: string },
  params: IAuthParams,
  chainId?: string | number,
): boolean {
  chainId = chainId ?? '?';
  const bytes = serializeAuthData(params);
  const myAddress = address({ publicKey: authData.publicKey }, chainId);
  return (
    myAddress === authData.address && verifySignature(authData.publicKey, bytes, authData.signature)
  );
}

export function verifyDccAuthData(
  authData: { signature: string; publicKey: string; address: string; timestamp: number },
  params: { publicKey: string; timestamp: number },
  chainId?: string | number,
): boolean {
  chainId = chainId ?? '?';
  const bytes = serializeDccAuthData(params);
  const myAddress = address({ publicKey: authData.publicKey }, chainId);
  return (
    myAddress === authData.address && verifySignature(authData.publicKey, bytes, authData.signature)
  );
}

/**
 * Sends order to matcher
 * @param ord - transaction to send
 * @param options - matcher address to send order to. E.g. https://matcher.decentralchain.io/. Optional 'market' flag to send market order
 */
export function submitOrder(
  ord: ExchangeTransactionOrder & WithProofs & WithSender,
  options: { matcherUrl: string; market?: boolean },
): Promise<unknown>;
/**
 * Sends order to matcher
 * @param ord - transaction to send
 * @param matcherUrl - matcher address to send order to. E.g. https://matcher.decentralchain.io/
 */
export function submitOrder(
  ord: ExchangeTransactionOrder & WithProofs & WithSender,
  matcherUrl: string,
): Promise<unknown>;
export function submitOrder(
  ord: ExchangeTransactionOrder & WithProofs & WithSender,
  opts: string | { matcherUrl: string; market?: boolean },
) {
  let endpoint: string, matcherUrl: string;
  if (typeof opts === 'string') {
    matcherUrl = opts;
    endpoint = 'matcher/orderbook';
  } else {
    matcherUrl = opts.matcherUrl;
    endpoint = opts.market ? 'matcher/orderbook/market' : 'matcher/orderbook';
  }
  return matcherRequest({
    base: matcherUrl,
    options: {
      body: stringifyOrder(ord),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
    url: endpoint,
  });
}

/**
 * Sends cancel order command to matcher. Since matcher api requires amountAsset and priceAsset in request url,
 * this function requires them as params
 * @param co - signed cancelOrder object
 * @param amountAsset - amount asset of the order to be canceled
 * @param priceAsset - price asset of the order to be canceled
 * @param matcherUrl - matcher address to send order cancel to. E.g. https://matcher.decentralchain.io/
 */
export function cancelSubmittedOrder(
  co: ICancelOrder,
  amountAsset: string | null,
  priceAsset: string | null,
  matcherUrl: string,
) {
  const endpoint = `matcher/orderbook/${amountAsset ?? 'DCC'}/${priceAsset ?? 'DCC'}/cancel`;
  return matcherRequest({
    base: matcherUrl,
    options: {
      body: stringifyOrder(co),
      headers: { 'Content-Type': 'application/json' },
      method: 'POST',
    },
    url: endpoint,
  });
}
