/**
 * @packageDocumentation
 *
 * TypeScript type definitions for the CubensisConnect browser extension API.
 *
 * @example
 * ```typescript
 * import type { ICubensisConnectApi, IAuthData } from '@decentralchain/cubensis-connect-types';
 * ```
 *
 * For global type augmentation (ambient `window.CubensisConnect`), the types
 * are automatically available when this package is installed and referenced
 * in your tsconfig.json `types` or `typeRoots`.
 *
 * @module @decentralchain/cubensis-connect-types
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

import type { ICubensisConnectApi as _ICubensisConnectApiGlobal } from './types.js';

import type {
  TBinaryData as _TBinaryData,
  TBooleanData as _TBooleanData,
  TIntegerData as _TIntegerData,
  TStringData as _TStringData,
  TTypedData as _TTypedData,
  ISignCustomDataParamsV1 as _ISignCustomDataParamsV1,
  TSignCustomDataResponseV1 as _TSignCustomDataResponseV1,
  ISignCustomDataParamsV2 as _ISignCustomDataParamsV2,
  TSignCustomDataResponseV2 as _TSignCustomDataResponseV2,
  IAuthData as _IAuthData,
  IAuthResponse as _IAuthResponse,
  TPublicStateNetwork as _TPublicStateNetwork,
  TAccountBalance as _TAccountBalance,
  TPublicStateAccount as _TPublicStateAccount,
  TPublicStateMessage as _TPublicStateMessage,
  IPublicStateResponse as _IPublicStateResponse,
  IMoneyTokens as _IMoneyTokens,
  IMoneyCoins as _IMoneyCoins,
  IMoneyAmount as _IMoneyAmount,
  TMoney as _TMoney,
  INotificationData as _INotificationData,
  ICancelOrderData as _ICancelOrderData,
  TSignCancelOrderData as _TSignCancelOrderData,
  ISignOrderDataBody as _ISignOrderDataBody,
  TSignOrderData as _TSignOrderData,
  ISignRequestBody as _ISignRequestBody,
  TSignRequestData as _TSignRequestData,
  ITransactionBase as _ITransactionBase,
  IIssueTx as _IIssueTx,
  TIssueTxData as _TIssueTxData,
  ITransferTx as _ITransferTx,
  TTransferTxData as _TTransferTxData,
  IReissueTx as _IReissueTx,
  TReissueTxData as _TReissueTxData,
  IBurnTx as _IBurnTx,
  TBurnTxData as _TBurnTxData,
  ILeaseTx as _ILeaseTx,
  TLeaseTxData as _TLeaseTxData,
  ILeaseCancelTx as _ILeaseCancelTx,
  TLeaseCancelTxData as _TLeaseCancelTxData,
  ICreateAliasTx as _ICreateAliasTx,
  TCreateAliasTxData as _TCreateAliasTxData,
  ITransfer as _ITransfer,
  IMassTransferTx as _IMassTransferTx,
  TMassTransferTxData as _TMassTransferTxData,
  TCallArgsInteger as _TCallArgsInteger,
  TCallArgsBoolean as _TCallArgsBoolean,
  TCallArgsBinary as _TCallArgsBinary,
  TCallArgsString as _TCallArgsString,
  TCallArgs as _TCallArgs,
  TData as _TData,
  IDataTx as _IDataTx,
  TDataTxData as _TDataTxData,
  ISetScriptTx as _ISetScriptTx,
  TSetScriptTxData as _TSetScriptTxData,
  ISponsoredFeeTx as _ISponsoredFeeTx,
  TSponsoredFeeTxData as _TSponsoredFeeTxData,
  ISetAssetScriptTx as _ISetAssetScriptTx,
  TSetAssetScriptTxData as _TSetAssetScriptTxData,
  ICall as _ICall,
  IScriptInvocationTx as _IScriptInvocationTx,
  TScriptInvocationTxData as _TScriptInvocationTxData,
  IUpdateAssetInfoTx as _IUpdateAssetInfoTx,
  TUpdateAssetInfoTxData as _TUpdateAssetInfoTxData,
  IInvokeExpressionTx as _IInvokeExpressionTx,
  TInvokeExpressionTxData as _TInvokeExpressionTxData,
  TSignTransactionData as _TSignTransactionData,
  TSignTransactionPackageData as _TSignTransactionPackageData,
  ICubensisConnectApi as _ICubensisConnectApi,
  TCubensisConnectApi as _TCubensisConnectApi,
} from './types.js';

declare global {
  /**
   * Global namespace for CubensisConnect types.
   *
   * Allows consumer code to reference types as `CubensisConnect.IMoneyCoins`,
   * `CubensisConnect.TSignTransactionData`, etc. without explicit imports.
   */
  namespace CubensisConnect {
    // Data types
    type TBinaryData = _TBinaryData;
    type TBooleanData = _TBooleanData;
    type TIntegerData = _TIntegerData;
    type TStringData = _TStringData;
    type TTypedData = _TTypedData;
    // Custom data signing
    type ISignCustomDataParamsV1 = _ISignCustomDataParamsV1;
    type TSignCustomDataResponseV1 = _TSignCustomDataResponseV1;
    type ISignCustomDataParamsV2 = _ISignCustomDataParamsV2;
    type TSignCustomDataResponseV2 = _TSignCustomDataResponseV2;
    // Authentication
    type IAuthData = _IAuthData;
    type IAuthResponse = _IAuthResponse;
    // Public state
    type TPublicStateNetwork = _TPublicStateNetwork;
    type TAccountBalance = _TAccountBalance;
    type TPublicStateAccount = _TPublicStateAccount;
    type TPublicStateMessage = _TPublicStateMessage;
    type IPublicStateResponse = _IPublicStateResponse;
    // Money
    type IMoneyTokens = _IMoneyTokens;
    type IMoneyCoins = _IMoneyCoins;
    type IMoneyAmount = _IMoneyAmount;
    type TMoney = _TMoney;
    // Notification
    type INotificationData = _INotificationData;
    // Orders
    type ICancelOrderData = _ICancelOrderData;
    type TSignCancelOrderData = _TSignCancelOrderData;
    type ISignOrderDataBody = _ISignOrderDataBody;
    type TSignOrderData = _TSignOrderData;
    // Sign request
    type ISignRequestBody = _ISignRequestBody;
    type TSignRequestData = _TSignRequestData;
    // Transaction base
    type ITransactionBase = _ITransactionBase;
    // Transaction types
    type IIssueTx = _IIssueTx;
    type TIssueTxData = _TIssueTxData;
    type ITransferTx = _ITransferTx;
    type TTransferTxData = _TTransferTxData;
    type IReissueTx = _IReissueTx;
    type TReissueTxData = _TReissueTxData;
    type IBurnTx = _IBurnTx;
    type TBurnTxData = _TBurnTxData;
    type ILeaseTx = _ILeaseTx;
    type TLeaseTxData = _TLeaseTxData;
    type ILeaseCancelTx = _ILeaseCancelTx;
    type TLeaseCancelTxData = _TLeaseCancelTxData;
    type ICreateAliasTx = _ICreateAliasTx;
    type TCreateAliasTxData = _TCreateAliasTxData;
    type ITransfer = _ITransfer;
    type IMassTransferTx = _IMassTransferTx;
    type TMassTransferTxData = _TMassTransferTxData;
    // Call args
    type TCallArgsInteger = _TCallArgsInteger;
    type TCallArgsBoolean = _TCallArgsBoolean;
    type TCallArgsBinary = _TCallArgsBinary;
    type TCallArgsString = _TCallArgsString;
    type TCallArgs = _TCallArgs;
    type TData = _TData;
    // Data transaction
    type IDataTx = _IDataTx;
    type TDataTxData = _TDataTxData;
    // Script transactions
    type ISetScriptTx = _ISetScriptTx;
    type TSetScriptTxData = _TSetScriptTxData;
    type ISponsoredFeeTx = _ISponsoredFeeTx;
    type TSponsoredFeeTxData = _TSponsoredFeeTxData;
    type ISetAssetScriptTx = _ISetAssetScriptTx;
    type TSetAssetScriptTxData = _TSetAssetScriptTxData;
    type ICall = _ICall;
    type IScriptInvocationTx = _IScriptInvocationTx;
    type TScriptInvocationTxData = _TScriptInvocationTxData;
    type IUpdateAssetInfoTx = _IUpdateAssetInfoTx;
    type TUpdateAssetInfoTxData = _TUpdateAssetInfoTxData;
    type IInvokeExpressionTx = _IInvokeExpressionTx;
    type TInvokeExpressionTxData = _TInvokeExpressionTxData;
    // Transaction unions
    type TSignTransactionData = _TSignTransactionData;
    type TSignTransactionPackageData = _TSignTransactionPackageData;
    // API
    type ICubensisConnectApi = _ICubensisConnectApi;
    /** @deprecated Use {@link ICubensisConnectApi} instead. */
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- Re-exporting deprecated alias for backward compatibility
    type TCubensisConnectApi = _TCubensisConnectApi;
  }

  interface Window {
    CubensisConnect: _ICubensisConnectApiGlobal;
  }

  var CubensisConnect: _ICubensisConnectApiGlobal;
}
