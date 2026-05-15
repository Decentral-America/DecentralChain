/**
 * @module @decentralchain/cubensis-connect-types
 *
 * TypeScript type definitions for the CubensisConnect browser extension API.
 * Provides complete type coverage for all CubensisConnect methods including
 * authentication, transaction signing, order management, and message encryption.
 */

// ─── Data Types ──────────────────────────────────────────────────────────────

/** Binary data entry for typed data signing. */
export interface TBinaryData {
  readonly type: 'binary';
  readonly key: string;
  readonly value: string;
}

/** Boolean data entry for typed data signing. */
export interface TBooleanData {
  readonly type: 'boolean';
  readonly key: string;
  readonly value: boolean;
}

/** Integer data entry for typed data signing. */
export interface TIntegerData {
  readonly type: 'integer';
  readonly key: string;
  readonly value: number;
}

/** String data entry for typed data signing. */
export interface TStringData {
  readonly type: 'string';
  readonly key: string;
  readonly value: string;
}

/** Union of all typed data variants used in data transactions and custom data signing. */
export type TTypedData = TBinaryData | TBooleanData | TIntegerData | TStringData;

// ─── Custom Data Signing ─────────────────────────────────────────────────────

/** Parameters for signing custom data (version 1 — binary). */
export interface ISignCustomDataParamsV1 {
  readonly version: 1;
  /** base64 encoded byteArray */
  readonly binary: string;
}

/** Response from signing custom data (version 1). */
export type TSignCustomDataResponseV1 = ISignCustomDataParamsV1 & {
  readonly signature: string;
  readonly publicKey: string;
};

/** Parameters for signing custom data (version 2 — typed data array). */
export interface ISignCustomDataParamsV2 {
  readonly version: 2;
  readonly data: readonly TTypedData[];
}

/** Response from signing custom data (version 2). */
export type TSignCustomDataResponseV2 = ISignCustomDataParamsV2 & {
  readonly signature: string;
  readonly publicKey: string;
};

// ─── Authentication ──────────────────────────────────────────────────────────

/** Data required for authentication via CubensisConnect. */
export interface IAuthData {
  /** A string line with any data (required field). */
  readonly data: string;
  /** Name of the service (optional field). */
  readonly name?: string;
  /** A website's full URL for redirect (optional field). */
  readonly referrer?: string;
  /** Path to the logo relative to the referrer or origin of the website (optional field). */
  readonly icon?: string;
  /** Relative path to the website's Auth API (optional field). */
  readonly successPath?: string;
}

/** Response returned after successful authentication. */
export interface IAuthResponse {
  /** An address in the DecentralChain network. */
  readonly address: string;
  /** A host that requested a signature. */
  readonly host: string;
  /** A prefix participating in the signature. */
  readonly prefix: string;
  /** The user's public key. */
  readonly publicKey: string;
  /** Signature. */
  readonly signature: string;
  /** API version. */
  readonly version: number;
  /** The name of an application that requested a signature. */
  readonly name: string;
}

// ─── Public State ────────────────────────────────────────────────────────────

/** Network configuration for the current DecentralChain network. */
export interface TPublicStateNetwork {
  readonly code: string;
  readonly server: string;
  readonly matcher: string;
}

/** Account balance information. */
export interface TAccountBalance {
  readonly available: string;
  readonly leasedOut: string;
  readonly network: string;
}

/** Public state account information. */
export interface TPublicStateAccount {
  readonly name: string;
  readonly publicKey: string;
  readonly address: string;
  readonly networkCode: string;
  readonly network: string;
  readonly balance: TAccountBalance;
  readonly type: string;
}

/** Status of a pending signature request message. */
export interface TPublicStateMessage {
  readonly id: string;
  readonly status: string;
}

/** Full public state response from CubensisConnect. */
export interface IPublicStateResponse {
  /** Whether CubensisConnect is initialized. */
  readonly initialized: boolean;
  /** Whether CubensisConnect is in wait/locked mode. */
  readonly locked: boolean;
  /** Current account, if the user allowed access to the website, or null. */
  readonly account: TPublicStateAccount | null;
  /** Current DecentralChain network, node and matcher addresses. */
  readonly network: TPublicStateNetwork;
  /** Signature request statuses. */
  readonly messages: readonly TPublicStateMessage[];
  /** Available transaction versions for each type. */
  readonly txVersion: Readonly<Record<number, readonly number[]>>;
}

// ─── Money ───────────────────────────────────────────────────────────────────

/** MoneyLike object using token amounts. */
export interface IMoneyTokens {
  readonly assetId: string;
  readonly tokens: number | string;
}

/** MoneyLike object using coin (smallest unit) amounts. */
export interface IMoneyCoins {
  readonly assetId: string;
  readonly coins: number | string;
}

/** MoneyLike object using amount (alias for coins). */
export interface IMoneyAmount {
  readonly assetId: string;
  /** Coins alias. */
  readonly amount: number | string;
}

/** Union type for money-like values. Supports tokens, coins, or amount notation. */
export type TMoney = IMoneyTokens | IMoneyCoins | IMoneyAmount;

// ─── Notification ────────────────────────────────────────────────────────────

/** Data for sending a notification via CubensisConnect. */
export interface INotificationData {
  /** Notification title (20 chars max). */
  readonly title: string;
  /** Notification message body (250 chars max). */
  readonly message?: string;
}

// ─── Sign Data Wrapper ───────────────────────────────────────────────────────

/** Generic wrapper for sign data requests. Maps a type code to its data body. */
export interface ISignData<TYPE extends number, BODY> {
  readonly type: TYPE;
  readonly data: BODY;
}

// ─── Orders ──────────────────────────────────────────────────────────────────

/** Data for cancelling an order. */
export interface ICancelOrderData {
  /** Order ID. */
  readonly id: string;
  /** Sender's public key in base58. */
  readonly senderPublicKey?: string;
}

/** Sign data type for order cancellation. */
export type TSignCancelOrderData = ISignData<1003, ICancelOrderData>;

/** Body of an order signing request. */
export interface ISignOrderDataBody {
  /** MoneyLike — amount. */
  readonly amount: TMoney;
  /** MoneyLike — price. */
  readonly price: TMoney;
  /** Order type: 'sell' or 'buy'. */
  readonly orderType: 'sell' | 'buy';
  /** MoneyLike — fee (0.003 DCC minimum). */
  readonly matcherFee: TMoney;
  /** The public key of the exchange service. */
  readonly matcherPublicKey: string;
  /** The order's expiration time. */
  readonly expiration: string | number;
  /** Current time. */
  readonly timestamp?: string | number;
  /** Public key in base58. */
  readonly senderPublicKey?: string;
}

/** Sign data type for order creation. */
export type TSignOrderData = ISignData<1002, ISignOrderDataBody>;

// ─── Sign Request ────────────────────────────────────────────────────────────

/** Body of a generic sign request. */
export interface ISignRequestBody {
  readonly timestamp: number | string;
  /** Public key in base58. */
  readonly senderPublicKey?: string;
}

/** Sign data type for generic requests (auth or matcher). */
export type TSignRequestData = ISignData<1001 | 1004, ISignRequestBody>;

// ─── Transaction Base ────────────────────────────────────────────────────────

/** Base interface shared by all transaction types. */
export interface ITransactionBase {
  /** MoneyLike — fee. */
  readonly fee?: TMoney;
  /** Sender's public key in base58. */
  readonly senderPublicKey?: string;
  /** Time in ms. */
  readonly timestamp?: number | string;
}

// ─── Transaction Types ───────────────────────────────────────────────────────

/** Issue transaction data. */
export interface IIssueTx extends ITransactionBase {
  /** [4, 16] string — token name. */
  readonly name: string;
  /** [0, 1000] string — token description. */
  readonly description: string;
  /** [0 - (JLM)] number/string — quantity. */
  readonly quantity: number | string;
  /** [0 - 8] number — precision (decimal places). */
  readonly precision: number;
  /** Whether the token can be reissued. */
  readonly reissuable: boolean;
  /** Smart asset script (optional). */
  readonly script?: string;
}

/** Issue transaction sign data (type 3). */
export type TIssueTxData = ISignData<3, IIssueTx>;

/** Transfer transaction data. */
export interface ITransferTx extends ITransactionBase {
  /** MoneyLike — amount. */
  readonly amount: TMoney;
  /** Recipient's address or alias. */
  readonly recipient: string;
  /** [≤140 bytes] string or byte array — additional info (optional). */
  readonly attachment?: string | Uint8Array | number[];
}

/** Transfer transaction sign data (type 4). */
export type TTransferTxData = ISignData<4, ITransferTx>;

/** Reissue transaction data. */
export interface IReissueTx extends ITransactionBase {
  /** Asset ID. */
  readonly assetId: string;
  /** [0 - (JLM)] number/string/MoneyLike — quantity. */
  readonly quantity: number | string | TMoney;
  /** Whether to allow further reissuing. */
  readonly reissuable: boolean;
}

/** Reissue transaction sign data (type 5). */
export type TReissueTxData = ISignData<5, IReissueTx>;

/** Burn transaction data. */
export interface IBurnTx extends ITransactionBase {
  /** Asset ID. */
  readonly assetId: string;
  /** [0 - (JLM)] number/string/MoneyLike — quantity to burn. */
  readonly amount: number | string | TMoney;
}

/** Burn transaction sign data (type 6). */
export type TBurnTxData = ISignData<6, IBurnTx>;

/** Lease transaction data. */
export interface ILeaseTx extends ITransactionBase {
  /** Recipient's address or alias. */
  readonly recipient: string;
  /** [0 - (JLM)] number/string/MoneyLike — quantity. */
  readonly amount: number | string | TMoney;
}

/** Lease transaction sign data (type 8). */
export type TLeaseTxData = ISignData<8, ILeaseTx>;

/** Lease cancel transaction data. */
export interface ILeaseCancelTx extends ITransactionBase {
  /** Leasing transaction ID. */
  readonly leaseId: string;
}

/** Lease cancel transaction sign data (type 9). */
export type TLeaseCancelTxData = ISignData<9, ILeaseCancelTx>;

/** Create alias transaction data. */
export interface ICreateAliasTx extends ITransactionBase {
  /** [4, 30] string — alias. */
  readonly alias: string;
}

/** Create alias transaction sign data (type 10). */
export type TCreateAliasTxData = ISignData<10, ICreateAliasTx>;

/** Individual transfer within a mass transfer transaction. */
export interface ITransfer {
  /** Recipient address or alias. */
  readonly recipient: string;
  /** Amount to transfer. */
  readonly amount: number | string | TMoney;
}

/** Mass transfer transaction data. */
export interface IMassTransferTx extends ITransactionBase {
  /** MoneyLike — total to be sent. */
  readonly totalAmount: TMoney;
  /** Array of individual transfers. */
  readonly transfers: readonly ITransfer[];
  /** [≤140 bytes in base58] string — additional info (optional). */
  readonly attachment?: string;
}

/** Mass transfer transaction sign data (type 11). */
export type TMassTransferTxData = ISignData<11, IMassTransferTx>;

// ─── Script Call Args ────────────────────────────────────────────────────────

/** Integer argument for script invocation. */
export interface TCallArgsInteger {
  readonly type: 'integer';
  readonly value: number | string;
}

/** Boolean argument for script invocation. */
export interface TCallArgsBoolean {
  readonly type: 'boolean';
  readonly value: boolean;
}

/** Binary argument for script invocation (base64 encoded). */
export interface TCallArgsBinary {
  /** base64 encoded value */
  readonly type: 'binary';
  readonly value: string;
}

/** String argument for script invocation. */
export interface TCallArgsString {
  readonly type: 'string';
  readonly value: string;
}

/** Union of all script call argument types. */
export type TCallArgs = TCallArgsInteger | TCallArgsBoolean | TCallArgsBinary | TCallArgsString;

/** Data entry: a call argument with a key. */
export type TData = TCallArgs & { readonly key: string };

/** Data transaction data. */
export interface IDataTx extends ITransactionBase {
  /** Array of data entries. */
  readonly data: readonly TData[];
}

/** Data transaction sign data (type 12). */
export type TDataTxData = ISignData<12, IDataTx>;

/** Set script transaction data. */
export interface ISetScriptTx extends ITransactionBase {
  /** Compiled script in base64, or null to remove script. */
  readonly script: string | null;
}

/** Set script transaction sign data (type 13). */
export type TSetScriptTxData = ISignData<13, ISetScriptTx>;

/** Sponsored fee transaction data. */
export interface ISponsoredFeeTx extends ITransactionBase {
  /** MoneyLike — fee price in the asset. */
  readonly minSponsoredAssetFee: TMoney;
}

/** Sponsored fee transaction sign data (type 14). */
export type TSponsoredFeeTxData = ISignData<14, ISponsoredFeeTx>;

/** Set asset script transaction data. */
export interface ISetAssetScriptTx extends ITransactionBase {
  /** Asset ID. */
  readonly assetId: string;
  /** Compiled script in base64. */
  readonly script: string;
}

/** Set asset script transaction sign data (type 15). */
export type TSetAssetScriptTxData = ISignData<15, ISetAssetScriptTx>;

/** Function call for script invocation. */
export interface ICall {
  /** Function name. */
  readonly function: string;
  /** Array of call arguments. */
  readonly args: readonly TCallArgs[];
}

/** Script invocation (dApp call) transaction data. */
export interface IScriptInvocationTx extends ITransactionBase {
  /** Address of the dApp script account. */
  readonly dApp: string;
  /** Array of payments to attach to the invocation. */
  readonly payment?: readonly TMoney[];
  /** Function call details. */
  readonly call?: ICall;
}

/** Script invocation transaction sign data (type 16). */
export type TScriptInvocationTxData = ISignData<16, IScriptInvocationTx>;

/** Update asset info transaction data. */
export interface IUpdateAssetInfoTx extends ITransactionBase {
  /** Asset ID to update. */
  readonly assetId: string;
  /** [4, 16] string — token name. */
  readonly name: string;
  /** [0, 1000] string — token description. */
  readonly description: string;
}

/** Update asset info transaction sign data (type 17). */
export type TUpdateAssetInfoTxData = ISignData<17, IUpdateAssetInfoTx>;

/** Invoke expression transaction data. */
export interface IInvokeExpressionTx extends ITransactionBase {
  /** Compiled call script, base64 encoded, up to 32,768 bytes. */
  readonly expression: string;
}

/** Invoke expression transaction sign data (type 18). */
export type TInvokeExpressionTxData = ISignData<18, IInvokeExpressionTx>;

// ─── Transaction Union Types ─────────────────────────────────────────────────

/** Union of all signable transaction data types. */
export type TSignTransactionData =
  | TIssueTxData
  | TTransferTxData
  | TReissueTxData
  | TBurnTxData
  | TLeaseTxData
  | TLeaseCancelTxData
  | TCreateAliasTxData
  | TMassTransferTxData
  | TDataTxData
  | TSetScriptTxData
  | TSponsoredFeeTxData
  | TSetAssetScriptTxData
  | TScriptInvocationTxData
  | TUpdateAssetInfoTxData
  | TInvokeExpressionTxData;

/** Array of transaction data for batch signing (up to 7 transactions). */
export type TSignTransactionPackageData = (
  | TIssueTxData
  | TTransferTxData
  | TReissueTxData
  | TBurnTxData
  | TLeaseTxData
  | TLeaseCancelTxData
  | TCreateAliasTxData
  | TMassTransferTxData
  | TDataTxData
  | TSetScriptTxData
  | TSponsoredFeeTxData
  | TSetAssetScriptTxData
  | TScriptInvocationTxData
  | TInvokeExpressionTxData
)[];

// ─── CubensisConnect API ─────────────────────────────────────────────────────

/**
 * The complete CubensisConnect browser extension API.
 *
 * Provides methods for authentication, transaction signing, order management,
 * message encryption/decryption, and event subscription on the DecentralChain network.
 */
export interface ICubensisConnectApi {
  /**
   * Obtain a signature of authorization data while verifying a DecentralChain user.
   * @param data - Authentication request data.
   */
  auth(data: IAuthData): Promise<IAuthResponse>;

  /**
   * If a website is trusted, CubensisConnect public data are returned.
   */
  publicState(): Promise<IPublicStateResponse>;

  /**
   * CubensisConnect method for cancelling an order to the matcher.
   * Works identically to {@link signCancelOrder}, but also tries to send data to the matcher.
   * @param data - Order cancellation data.
   */
  signAndPublishCancelOrder(data: TSignCancelOrderData): Promise<string>;

  /**
   * CubensisConnect method for creating an order to the matcher.
   * Identical to {@link signOrder} but also tries to send data to the matcher.
   * @param data - Order data.
   */
  signAndPublishOrder(data: TSignOrderData): Promise<string>;

  /**
   * Similar to {@link signTransaction}, but also broadcasts the transaction to the blockchain.
   * @param data - Transaction data.
   */
  signAndPublishTransaction(data: TSignTransactionData): Promise<string>;

  /**
   * CubensisConnect method for signing cancellation of an order to the matcher.
   * @param data - Order cancellation data.
   */
  signCancelOrder(data: TSignCancelOrderData): Promise<string>;

  /**
   * CubensisConnect method for signing an order to the matcher.
   * @param data - Order data.
   */
  signOrder(data: TSignOrderData): Promise<string>;

  /**
   * A method for signing transactions in the DecentralChain network.
   * @param data - Transaction data.
   */
  signTransaction(data: TSignTransactionData): Promise<string>;

  /**
   * CubensisConnect method for signing typified data, for signing requests on various services.
   * @param data - Request data.
   */
  signRequest(data: TSignRequestData): Promise<string>;

  /**
   * Batch transaction signature. Up to seven transactions can be signed at once.
   * Only certain types are permitted: issue, transfer, reissue, burn, create alias,
   * mass transfer, data, set script, sponsored fee, set asset script, script invocation,
   * and invoke expression.
   * @param tx - Array of transaction data to sign.
   * @param name - Optional batch name.
   */
  signTransactionPackage(tx: TSignTransactionPackageData, name?: string): Promise<string[]>;

  /**
   * CubensisConnect method for signing custom data (version 1 — binary).
   * Adds prefix to data to prevent signing transaction data in this method.
   * Signs byteArray. Prefix = [255, 255, 255, 1].
   * @param data - Custom data params (v1).
   */
  signCustomData(data: ISignCustomDataParamsV1): Promise<TSignCustomDataResponseV1>;

  /**
   * CubensisConnect method for signing custom data (version 2 — typed data array).
   * Adds prefix to data to prevent signing transaction data in this method.
   * Signs typed data array. Prefix = [255, 255, 255, 2].
   * @param data - Custom data params (v2).
   */
  signCustomData(data: ISignCustomDataParamsV2): Promise<TSignCustomDataResponseV2>;

  /**
   * Send a notification message to CubensisConnect.
   * Can send a message only once every 30 seconds for trusted sites with send permission.
   * @param data - Notification data.
   */
  notification(data: INotificationData): Promise<void>;

  /**
   * Encrypt a string message to an account in the DecentralChain network.
   * @param stringToEncrypt - String to encrypt.
   * @param publicKey - Recipient's public key in base58 string.
   * @param prefix - Secret app string used for encoding.
   */
  encryptMessage(stringToEncrypt: string, publicKey: string, prefix: string): Promise<string>;

  /**
   * Decrypt a string message from an account in the DecentralChain network.
   * @param stringToDecrypt - String to decrypt.
   * @param publicKey - Sender's public key in base58 string.
   * @param prefix - Secret app string used for encoding.
   */
  decryptMessage(stringToDecrypt: string, publicKey: string, prefix: string): Promise<string>;

  /**
   * Subscribe to CubensisConnect events.
   * If a website is not trusted, events won't be emitted.
   * @param event - Event name. Currently supports: 'update' (state updates).
   * @param cb - Callback invoked with the updated public state.
   */
  on(event: 'update', cb: (state: IPublicStateResponse) => void): object;

  /**
   * On initialization, `window.CubensisConnect` has no API methods.
   * Use `CubensisConnect.initialPromise` to wait for API initialization.
   */
  initialPromise: Promise<void>;
}

/**
 * Legacy type alias for backward compatibility.
 * @deprecated Use {@link ICubensisConnectApi} instead.
 */
export type TCubensisConnectApi = ICubensisConnectApi;
