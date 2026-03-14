import {
  type AliasTransactionFields,
  type BaseTransaction,
  type BurnTransactionFields,
  type CancelLeaseTransactionFields,
  type DataTransactionFields,
  type ExchangeTransactionFields,
  type InvokeScriptTransactionFields,
  type IssueTransactionFields,
  type LeaseTransactionFields,
  type Long,
  type MassTransferTransactionFields,
  type Proofs,
  type ReissueTransactionFields,
  type SetAssetScriptTransactionFields,
  type SetScriptTransactionFields,
  type SignedTransaction,
  type SponsorshipTransactionFields,
  type TRANSACTION_TYPE,
  type TransactionMap,
  type TransactionType,
  type TransferTransactionFields,
  type UpdateAssetInfoTransactionFields,
  type WithApiMixin,
  type WithId,
} from '@decentralchain/ts-types';

export interface TypedData {
  /** Field type */
  type: 'string' | 'integer' | 'boolean' | 'binary';
  /** Field name */
  key: string;
  /** Value */
  value: string | number | boolean;
}

export interface Provider {
  user: UserData | null;

  isSignAndBroadcastByProvider?: boolean;

  on<EVENT extends keyof AuthEvents>(event: EVENT, handler: Handler<AuthEvents[EVENT]>): Provider;

  once<EVENT extends keyof AuthEvents>(event: EVENT, handler: Handler<AuthEvents[EVENT]>): Provider;

  off<EVENT extends keyof AuthEvents>(event: EVENT, handler: Handler<AuthEvents[EVENT]>): Provider;

  /** Connect the provider to the library settings */
  connect(options: ConnectOptions): Promise<void>;

  /** Logs in user using provider */
  login(): Promise<UserData>;

  /** Logs out from provider */
  logout(): Promise<void>;

  /** Sign message */
  signMessage(data: string | number): Promise<string>;

  /** Sign order */
  signOrder(data: TOrderArgs): Promise<TSignedOrder>;

  /** Sign typed data */
  signTypedData(data: Array<TypedData>): Promise<string>;

  /** Sign an array of transactions */
  sign<T extends SignerTx>(toSign: T[] | T): Promise<SignedTx<T>>;
}

export interface UserData {
  /** User address */
  address: string;
  /** Public key */
  publicKey: string;
}

export interface ConnectOptions {
  /** Node URL */
  NODE_URL: string;
  /** Network byte */
  NETWORK_BYTE: number;
}

/**
 * Order arguments type. Defines the shape of order creation parameters.
 */
export interface TOrderArgs {
  orderType: 'buy' | 'sell';
  version?: 1 | 2 | 3;
  assetPair: {
    amountAsset: string | null;
    priceAsset: string | null;
  };
  price: string | number;
  amount: string | number;
  timestamp: number;
  expiration: number;
  matcherFee: string | number;
  matcherPublicKey: string;
  senderPublicKey?: string;
  matcherFeeAssetId?: string | null;
  proofs?: string[];
}

/**
 * Signed order result type.
 */
export interface TSignedOrder extends TOrderArgs {
  id: string;
  proofs: string[];
  senderPublicKey: string;
}

type CommonArgs = Partial<Pick<BaseTransaction, 'fee' | 'senderPublicKey' | 'timestamp'>> & {
  proofs?: Proofs;
} & { version?: number };

export type IssueArgs = CommonArgs &
  MakeOptional<IssueTransactionFields, 'script' | 'description' | 'reissuable'>;

export type TransferArgs = CommonArgs &
  MakeOptional<TransferTransactionFields, 'assetId' | 'feeAssetId' | 'attachment'>;

export type ReissueArgs = CommonArgs & ReissueTransactionFields;

export type BurnArgs = CommonArgs & BurnTransactionFields;

export type LeaseArgs = CommonArgs & LeaseTransactionFields;

export type CancelLeaseArgs = CommonArgs & CancelLeaseTransactionFields;

export type AliasArgs = CommonArgs & AliasTransactionFields;

export type MassTransferArgs = CommonArgs & MakeOptional<MassTransferTransactionFields, 'assetId'>;

export type DataArgs = CommonArgs & DataTransactionFields;

export type SetScriptArgs = CommonArgs & SetScriptTransactionFields;

export type SponsorshipArgs = CommonArgs & SponsorshipTransactionFields;

export type ExchangeArgs = CommonArgs & ExchangeTransactionFields;

export type SetAssetScriptArgs = CommonArgs & SetAssetScriptTransactionFields;

export type InvokeArgs = CommonArgs &
  MakeOptional<InvokeScriptTransactionFields, 'payment' | 'call' | 'feeAssetId'>;

export type UpdateAssetInfoArgs = CommonArgs &
  MakeOptional<UpdateAssetInfoTransactionFields, 'description' | 'name'>;

type SignerTxFactory<TxArgs, TxType extends TransactionType> = TxArgs & {
  type: TxType;
};

export type SignerIssueTx = SignerTxFactory<IssueArgs, typeof TRANSACTION_TYPE.ISSUE>;
export type SignerTransferTx = SignerTxFactory<TransferArgs, typeof TRANSACTION_TYPE.TRANSFER>;
export type SignerReissueTx = SignerTxFactory<ReissueArgs, typeof TRANSACTION_TYPE.REISSUE>;
export type SignerBurnTx = SignerTxFactory<BurnArgs, typeof TRANSACTION_TYPE.BURN>;
export type SignerLeaseTx = SignerTxFactory<LeaseArgs, typeof TRANSACTION_TYPE.LEASE>;
export type SignerCancelLeaseTx = SignerTxFactory<
  CancelLeaseArgs,
  typeof TRANSACTION_TYPE.CANCEL_LEASE
>;
export type SignerAliasTx = SignerTxFactory<AliasArgs, typeof TRANSACTION_TYPE.ALIAS>;
export type SignerMassTransferTx = SignerTxFactory<
  MassTransferArgs,
  typeof TRANSACTION_TYPE.MASS_TRANSFER
>;
export type SignerDataTx = SignerTxFactory<DataArgs, typeof TRANSACTION_TYPE.DATA>;
export type SignerSetScriptTx = SignerTxFactory<SetScriptArgs, typeof TRANSACTION_TYPE.SET_SCRIPT>;
export type SignerSponsorshipTx = SignerTxFactory<
  SponsorshipArgs,
  typeof TRANSACTION_TYPE.SPONSORSHIP
>;
export type SignerExchangeTx = SignerTxFactory<ExchangeArgs, typeof TRANSACTION_TYPE.EXCHANGE>;
export type SignerSetAssetScriptTx = SignerTxFactory<
  SetAssetScriptArgs,
  typeof TRANSACTION_TYPE.SET_ASSET_SCRIPT
>;
export type SignerInvokeTx = SignerTxFactory<InvokeArgs, typeof TRANSACTION_TYPE.INVOKE_SCRIPT>;
export type SignerUpdateAssetInfoTx = SignerTxFactory<
  UpdateAssetInfoArgs,
  typeof TRANSACTION_TYPE.UPDATE_ASSET_INFO
>;

export type MakeOptional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type SignerTx =
  | SignerIssueTx
  | SignerTransferTx
  | SignerReissueTx
  | SignerBurnTx
  | SignerLeaseTx
  | SignerCancelLeaseTx
  | SignerAliasTx
  | SignerMassTransferTx
  | SignerDataTx
  | SignerSetScriptTx
  | SignerSponsorshipTx
  | SignerExchangeTx
  | SignerSetAssetScriptTx
  | SignerInvokeTx
  | SignerUpdateAssetInfoTx;

export interface Balance {
  /** Amount in minimum indivisible parts (e.g. 1 DCC = 100000000) */
  amount: Long;
  /** Amount in human-readable token units (raw amount divided by 10^decimals) */
  tokens: Long;
  /** Sponsorship rate for fee payment (to 0.001 DCC), if applicable */
  sponsorship?: Long | null;
  assetId: string;
  assetName: string;
  decimals: number;
  isMyAsset: boolean;
  isSmart: boolean;
}

export interface SignerOptions {
  /** Node URL the library will communicate with. Network byte is derived from the node. */
  NODE_URL: string;
  /** Log level */
  LOG_LEVEL?: 'verbose' | 'production' | 'error';
}

export interface BroadcastOptions {
  /** Send transactions sequentially after the previous one enters the blockchain */
  chain?: boolean;
  /** Number of confirmations to wait for before resolving (for all transactions) */
  confirmations?: number;
}

// Maps a signer tx to a signed transaction from @decentralchain/ts-types
export type SignerTxToSignedTx<T> = T extends SignerTx
  ? T['type'] extends keyof TransactionMap
    ? SignedTransaction<TransactionMap[T['type']]> & WithId
    : never
  : never;

export type SignedTx<T> = T extends SignerTx[]
  ? { [P in keyof T]: SignerTxToSignedTx<T[P]> }
  : SignerTxToSignedTx<T>;

export type BroadcastedTx<T> = T extends SignedTx<SignerTx>[]
  ? { [P in keyof T]: T[P] & WithApiMixin }
  : T extends SignedTx<SignerTx>
    ? T & WithApiMixin
    : never;

export type Handler<T> = (data: T) => unknown;

export type AuthEvents = {
  login: Readonly<UserData>;
  logout: undefined;
};
