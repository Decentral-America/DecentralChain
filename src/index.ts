/**
 * @packageDocumentation
 *
 * TypeScript type definitions for the CubensisConnect browser extension API.
 *
 * @example
 * ```typescript
 * import type { ICubensisConnectApi, IAuthData } from '@decentralchain/cubensisconnect-types';
 * ```
 *
 * For global type augmentation (ambient `window.CubensisConnect`), the types
 * are automatically available when this package is installed and referenced
 * in your tsconfig.json `types` or `typeRoots`.
 *
 * @module @decentralchain/cubensisconnect-types
 */

export type {
  // Data types
  TBinaryData,
  TBooleanData,
  TIntegerData,
  TStringData,
  TTypedData,
  // Custom data signing
  ISignCustomDataParamsV1,
  TSignCustomDataResponseV1,
  ISignCustomDataParamsV2,
  TSignCustomDataResponseV2,
  // Authentication
  IAuthData,
  IAuthResponse,
  // Public state
  TPublicStateNetwork,
  TAccountBalance,
  TPublicStateAccount,
  TPublicStateMessage,
  IPublicStateResponse,
  // Money
  IMoneyTokens,
  IMoneyCoins,
  IMoneyAmount,
  TMoney,
  // Notification
  INotificationData,
  // Sign data
  ISignData,
  // Orders
  ICancelOrderData,
  TSignCancelOrderData,
  ISignOrderDataBody,
  TSignOrderData,
  // Sign request
  ISignRequestBody,
  TSignRequestData,
  // Transaction base
  ITransactionBase,
  // Transaction types
  IIssueTx,
  TIssueTxData,
  ITransferTx,
  TTransferTxData,
  IReissueTx,
  TReissueTxData,
  IBurnTx,
  TBurnTxData,
  ILeaseTx,
  TLeaseTxData,
  ILeaseCancelTx,
  TLeaseCancelTxData,
  ICreateAliasTx,
  TCreateAliasTxData,
  ITransfer,
  IMassTransferTx,
  TMassTransferTxData,
  // Call args
  TCallArgsInteger,
  TCallArgsBoolean,
  TCallArgsBinary,
  TCallArgsString,
  TCallArgs,
  TData,
  // Data transaction
  IDataTx,
  TDataTxData,
  // Script transactions
  ISetScriptTx,
  TSetScriptTxData,
  ISponsoredFeeTx,
  TSponsoredFeeTxData,
  ISetAssetScriptTx,
  TSetAssetScriptTxData,
  ICall,
  IScriptInvocationTx,
  TScriptInvocationTxData,
  IUpdateAssetInfoTx,
  TUpdateAssetInfoTxData,
  IInvokeExpressionTx,
  TInvokeExpressionTxData,
  // Transaction unions
  TSignTransactionData,
  TSignTransactionPackageData,
  // API
  ICubensisConnectApi,
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  TCubensisConnectApi,
} from './types.js';

// ─── Global Augmentation ─────────────────────────────────────────────────────

import type { ICubensisConnectApi } from './types.js';

declare global {
  interface Window {
    CubensisConnect: ICubensisConnectApi;
  }

  var CubensisConnect: ICubensisConnectApi;
}
