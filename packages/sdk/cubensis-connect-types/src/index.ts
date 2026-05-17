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
  // Authentication
  IAuthData,
  IAuthResponse,
  IBurnTx,
  ICall,
  // Orders
  ICancelOrderData,
  ICreateAliasTx,
  // API
  ICubensisConnectApi,
  // Data transaction
  IDataTx,
  IInvokeExpressionTx,
  // Transaction types
  IIssueTx,
  ILeaseCancelTx,
  ILeaseTx,
  IMassTransferTx,
  IMoneyAmount,
  IMoneyCoins,
  // Money
  IMoneyTokens,
  // Notification
  INotificationData,
  IPublicStateResponse,
  IReissueTx,
  IScriptInvocationTx,
  ISetAssetScriptTx,
  // Script transactions
  ISetScriptTx,
  // Custom data signing
  ISignCustomDataParamsV1,
  ISignCustomDataParamsV2,
  // Sign data
  ISignData,
  ISignOrderDataBody,
  // Sign request
  ISignRequestBody,
  ISponsoredFeeTx,
  // Transaction base
  ITransactionBase,
  ITransfer,
  ITransferTx,
  IUpdateAssetInfoTx,
  TAccountBalance,
  // Data types
  TBinaryData,
  TBooleanData,
  TBurnTxData,
  TCallArgs,
  TCallArgsBinary,
  TCallArgsBoolean,
  // Call args
  TCallArgsInteger,
  TCallArgsString,
  TCreateAliasTxData,
  TCubensisConnectApi,
  TData,
  TDataTxData,
  TIntegerData,
  TInvokeExpressionTxData,
  TIssueTxData,
  TLeaseCancelTxData,
  TLeaseTxData,
  TMassTransferTxData,
  TMoney,
  TPublicStateAccount,
  TPublicStateMessage,
  // Public state
  TPublicStateNetwork,
  TReissueTxData,
  TScriptInvocationTxData,
  TSetAssetScriptTxData,
  TSetScriptTxData,
  TSignCancelOrderData,
  TSignCustomDataResponseV1,
  TSignCustomDataResponseV2,
  TSignOrderData,
  TSignRequestData,
  // Transaction unions
  TSignTransactionData,
  TSignTransactionPackageData,
  TSponsoredFeeTxData,
  TStringData,
  TTransferTxData,
  TTypedData,
  TUpdateAssetInfoTxData,
} from './types.js';

// ─── Global Augmentation ─────────────────────────────────────────────────────

// biome-ignore lint/nursery/useImportsFirst: intentional — private import block placed after public exports for documentation clarity; all types are from the same './types.js' module
import {
  type IAuthData as _IAuthData,
  type IAuthResponse as _IAuthResponse,
  type IBurnTx as _IBurnTx,
  type ICall as _ICall,
  type ICancelOrderData as _ICancelOrderData,
  type ICreateAliasTx as _ICreateAliasTx,
  type ICubensisConnectApi as _ICubensisConnectApi,
  type ICubensisConnectApi as _ICubensisConnectApiGlobal,
  type IDataTx as _IDataTx,
  type IInvokeExpressionTx as _IInvokeExpressionTx,
  type IIssueTx as _IIssueTx,
  type ILeaseCancelTx as _ILeaseCancelTx,
  type ILeaseTx as _ILeaseTx,
  type IMassTransferTx as _IMassTransferTx,
  type IMoneyAmount as _IMoneyAmount,
  type IMoneyCoins as _IMoneyCoins,
  type IMoneyTokens as _IMoneyTokens,
  type INotificationData as _INotificationData,
  type IPublicStateResponse as _IPublicStateResponse,
  type IReissueTx as _IReissueTx,
  type IScriptInvocationTx as _IScriptInvocationTx,
  type ISetAssetScriptTx as _ISetAssetScriptTx,
  type ISetScriptTx as _ISetScriptTx,
  type ISignCustomDataParamsV1 as _ISignCustomDataParamsV1,
  type ISignCustomDataParamsV2 as _ISignCustomDataParamsV2,
  type ISignOrderDataBody as _ISignOrderDataBody,
  type ISignRequestBody as _ISignRequestBody,
  type ISponsoredFeeTx as _ISponsoredFeeTx,
  type ITransactionBase as _ITransactionBase,
  type ITransfer as _ITransfer,
  type ITransferTx as _ITransferTx,
  type IUpdateAssetInfoTx as _IUpdateAssetInfoTx,
  type TAccountBalance as _TAccountBalance,
  type TBinaryData as _TBinaryData,
  type TBooleanData as _TBooleanData,
  type TBurnTxData as _TBurnTxData,
  type TCallArgs as _TCallArgs,
  type TCallArgsBinary as _TCallArgsBinary,
  type TCallArgsBoolean as _TCallArgsBoolean,
  type TCallArgsInteger as _TCallArgsInteger,
  type TCallArgsString as _TCallArgsString,
  type TCreateAliasTxData as _TCreateAliasTxData,
  type ICubensisConnectApi as _TCubensisConnectApi,
  type TData as _TData,
  type TDataTxData as _TDataTxData,
  type TIntegerData as _TIntegerData,
  type TInvokeExpressionTxData as _TInvokeExpressionTxData,
  type TIssueTxData as _TIssueTxData,
  type TLeaseCancelTxData as _TLeaseCancelTxData,
  type TLeaseTxData as _TLeaseTxData,
  type TMassTransferTxData as _TMassTransferTxData,
  type TMoney as _TMoney,
  type TPublicStateAccount as _TPublicStateAccount,
  type TPublicStateMessage as _TPublicStateMessage,
  type TPublicStateNetwork as _TPublicStateNetwork,
  type TReissueTxData as _TReissueTxData,
  type TScriptInvocationTxData as _TScriptInvocationTxData,
  type TSetAssetScriptTxData as _TSetAssetScriptTxData,
  type TSetScriptTxData as _TSetScriptTxData,
  type TSignCancelOrderData as _TSignCancelOrderData,
  type TSignCustomDataResponseV1 as _TSignCustomDataResponseV1,
  type TSignCustomDataResponseV2 as _TSignCustomDataResponseV2,
  type TSignOrderData as _TSignOrderData,
  type TSignRequestData as _TSignRequestData,
  type TSignTransactionData as _TSignTransactionData,
  type TSignTransactionPackageData as _TSignTransactionPackageData,
  type TSponsoredFeeTxData as _TSponsoredFeeTxData,
  type TStringData as _TStringData,
  type TTransferTxData as _TTransferTxData,
  type TTypedData as _TTypedData,
  type TUpdateAssetInfoTxData as _TUpdateAssetInfoTxData,
} from './types.js';

declare global {
  /**
   * Global namespace for CubensisConnect types.
   *
   * Allows consumer code to reference types as `CubensisConnect.IMoneyCoins`,
   * `CubensisConnect.TSignTransactionData`, etc. without explicit imports.
   */
  // biome-ignore lint/style/noNamespace: declare-global ambient namespaces are required by TypeScript
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
    type TCubensisConnectApi = _TCubensisConnectApi;
  }

  interface Window {
    CubensisConnect: _ICubensisConnectApiGlobal;
  }

  var CubensisConnect: _ICubensisConnectApiGlobal;
}
