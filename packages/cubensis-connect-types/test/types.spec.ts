import { describe, expectTypeOf, it } from 'vitest';
import {
  type IAuthData,
  type IAuthResponse,
  type IBurnTx,
  type ICall,
  type ICancelOrderData,
  type ICreateAliasTx,
  type ICubensisConnectApi,
  type IDataTx,
  type IInvokeExpressionTx,
  type IIssueTx,
  type ILeaseCancelTx,
  type ILeaseTx,
  type IMassTransferTx,
  type IMoneyAmount,
  type IMoneyCoins,
  type IMoneyTokens,
  type INotificationData,
  type IPublicStateResponse,
  type IReissueTx,
  type IScriptInvocationTx,
  type ISetAssetScriptTx,
  type ISetScriptTx,
  type ISignCustomDataParamsV1,
  type ISignCustomDataParamsV2,
  type ISignData,
  type ISignOrderDataBody,
  type ISignRequestBody,
  type ISponsoredFeeTx,
  type ITransactionBase,
  type ITransfer,
  type ITransferTx,
  type IUpdateAssetInfoTx,
  type TAccountBalance,
  type TBinaryData,
  type TBooleanData,
  type TBurnTxData,
  type TCallArgs,
  type TCallArgsBinary,
  type TCallArgsBoolean,
  type TCallArgsInteger,
  type TCallArgsString,
  type TCreateAliasTxData,
  type TCubensisConnectApi,
  type TData,
  type TDataTxData,
  type TIntegerData,
  type TInvokeExpressionTxData,
  type TIssueTxData,
  type TLeaseCancelTxData,
  type TLeaseTxData,
  type TMassTransferTxData,
  type TMoney,
  type TPublicStateAccount,
  type TPublicStateMessage,
  type TPublicStateNetwork,
  type TReissueTxData,
  type TScriptInvocationTxData,
  type TSetAssetScriptTxData,
  type TSetScriptTxData,
  type TSignCancelOrderData,
  type TSignCustomDataResponseV1,
  type TSignCustomDataResponseV2,
  type TSignOrderData,
  type TSignRequestData,
  type TSignTransactionData,
  type TSignTransactionPackageData,
  type TSponsoredFeeTxData,
  type TStringData,
  type TTransferTxData,
  type TTypedData,
  type TUpdateAssetInfoTxData,
} from '../src/types.js';

// ─── API Interface ───────────────────────────────────────────────────────────

describe('ICubensisConnectApi', () => {
  it('should have all required methods', () => {
    expectTypeOf<ICubensisConnectApi>().toHaveProperty('auth');
    expectTypeOf<ICubensisConnectApi>().toHaveProperty('publicState');
    expectTypeOf<ICubensisConnectApi>().toHaveProperty('signAndPublishCancelOrder');
    expectTypeOf<ICubensisConnectApi>().toHaveProperty('signAndPublishOrder');
    expectTypeOf<ICubensisConnectApi>().toHaveProperty('signAndPublishTransaction');
    expectTypeOf<ICubensisConnectApi>().toHaveProperty('signCancelOrder');
    expectTypeOf<ICubensisConnectApi>().toHaveProperty('signOrder');
    expectTypeOf<ICubensisConnectApi>().toHaveProperty('signTransaction');
    expectTypeOf<ICubensisConnectApi>().toHaveProperty('signRequest');
    expectTypeOf<ICubensisConnectApi>().toHaveProperty('signTransactionPackage');
    expectTypeOf<ICubensisConnectApi>().toHaveProperty('signCustomData');
    expectTypeOf<ICubensisConnectApi>().toHaveProperty('notification');
    expectTypeOf<ICubensisConnectApi>().toHaveProperty('encryptMessage');
    expectTypeOf<ICubensisConnectApi>().toHaveProperty('decryptMessage');
    expectTypeOf<ICubensisConnectApi>().toHaveProperty('on');
    expectTypeOf<ICubensisConnectApi>().toHaveProperty('initialPromise');
  });

  it('auth should accept IAuthData and return Promise<IAuthResponse>', () => {
    type AuthFn = ICubensisConnectApi['auth'];
    expectTypeOf<AuthFn>().parameter(0).toMatchTypeOf<IAuthData>();
    expectTypeOf<AuthFn>().returns.toMatchTypeOf<Promise<IAuthResponse>>();
  });

  it('publicState should return Promise<IPublicStateResponse>', () => {
    type PublicStateFn = ICubensisConnectApi['publicState'];
    expectTypeOf<PublicStateFn>().returns.toMatchTypeOf<Promise<IPublicStateResponse>>();
  });

  it('signTransaction should accept TSignTransactionData', () => {
    type SignTxFn = ICubensisConnectApi['signTransaction'];
    expectTypeOf<SignTxFn>().parameter(0).toMatchTypeOf<TSignTransactionData>();
    expectTypeOf<SignTxFn>().returns.toMatchTypeOf<Promise<string>>();
  });

  it('notification should return Promise<void>', () => {
    type NotifyFn = ICubensisConnectApi['notification'];
    expectTypeOf<NotifyFn>().returns.toMatchTypeOf<Promise<void>>();
  });

  it('encryptMessage should accept three string params', () => {
    type EncryptFn = ICubensisConnectApi['encryptMessage'];
    expectTypeOf<EncryptFn>().parameters.toMatchTypeOf<[string, string, string]>();
    expectTypeOf<EncryptFn>().returns.toMatchTypeOf<Promise<string>>();
  });

  it('decryptMessage should accept three string params', () => {
    type DecryptFn = ICubensisConnectApi['decryptMessage'];
    expectTypeOf<DecryptFn>().parameters.toMatchTypeOf<[string, string, string]>();
    expectTypeOf<DecryptFn>().returns.toMatchTypeOf<Promise<string>>();
  });

  it('initialPromise should be Promise<void>', () => {
    expectTypeOf<ICubensisConnectApi['initialPromise']>().toMatchTypeOf<Promise<void>>();
  });

  it('TCubensisConnectApi should be alias for ICubensisConnectApi', () => {
    expectTypeOf<TCubensisConnectApi>().toEqualTypeOf<ICubensisConnectApi>();
  });
});

// ─── Authentication Types ────────────────────────────────────────────────────

describe('IAuthData', () => {
  it('should require data field as string', () => {
    expectTypeOf<IAuthData>().toHaveProperty('data');
    expectTypeOf<IAuthData['data']>().toBeString();
  });

  it('should have optional fields', () => {
    expectTypeOf<IAuthData>().toHaveProperty('name');
    expectTypeOf<IAuthData>().toHaveProperty('referrer');
    expectTypeOf<IAuthData>().toHaveProperty('icon');
    expectTypeOf<IAuthData>().toHaveProperty('successPath');
  });
});

describe('IAuthResponse', () => {
  it('should have all required fields', () => {
    expectTypeOf<IAuthResponse>().toHaveProperty('address');
    expectTypeOf<IAuthResponse>().toHaveProperty('host');
    expectTypeOf<IAuthResponse>().toHaveProperty('prefix');
    expectTypeOf<IAuthResponse>().toHaveProperty('publicKey');
    expectTypeOf<IAuthResponse>().toHaveProperty('signature');
    expectTypeOf<IAuthResponse>().toHaveProperty('version');
    expectTypeOf<IAuthResponse>().toHaveProperty('name');
  });

  it('address should be string', () => {
    expectTypeOf<IAuthResponse['address']>().toBeString();
  });

  it('version should be number', () => {
    expectTypeOf<IAuthResponse['version']>().toBeNumber();
  });
});

// ─── Money Types ─────────────────────────────────────────────────────────────

describe('TMoney', () => {
  it('should accept IMoneyTokens', () => {
    expectTypeOf<IMoneyTokens>().toMatchTypeOf<TMoney>();
  });

  it('should accept IMoneyCoins', () => {
    expectTypeOf<IMoneyCoins>().toMatchTypeOf<TMoney>();
  });

  it('should accept IMoneyAmount', () => {
    expectTypeOf<IMoneyAmount>().toMatchTypeOf<TMoney>();
  });

  it('tokens variant should have assetId and tokens', () => {
    expectTypeOf<IMoneyTokens>().toHaveProperty('assetId');
    expectTypeOf<IMoneyTokens>().toHaveProperty('tokens');
  });

  it('coins variant should have assetId and coins', () => {
    expectTypeOf<IMoneyCoins>().toHaveProperty('assetId');
    expectTypeOf<IMoneyCoins>().toHaveProperty('coins');
  });

  it('amount variant should have assetId and amount', () => {
    expectTypeOf<IMoneyAmount>().toHaveProperty('assetId');
    expectTypeOf<IMoneyAmount>().toHaveProperty('amount');
  });
});

// ─── Typed Data ──────────────────────────────────────────────────────────────

describe('TTypedData', () => {
  it('should accept all four data variants', () => {
    expectTypeOf<TBinaryData>().toMatchTypeOf<TTypedData>();
    expectTypeOf<TBooleanData>().toMatchTypeOf<TTypedData>();
    expectTypeOf<TIntegerData>().toMatchTypeOf<TTypedData>();
    expectTypeOf<TStringData>().toMatchTypeOf<TTypedData>();
  });

  it('binary data should have type "binary"', () => {
    expectTypeOf<TBinaryData['type']>().toEqualTypeOf<'binary'>();
  });

  it('boolean data should have type "boolean"', () => {
    expectTypeOf<TBooleanData['type']>().toEqualTypeOf<'boolean'>();
  });

  it('integer data should have type "integer"', () => {
    expectTypeOf<TIntegerData['type']>().toEqualTypeOf<'integer'>();
  });

  it('string data should have type "string"', () => {
    expectTypeOf<TStringData['type']>().toEqualTypeOf<'string'>();
  });
});

// ─── Custom Data Signing ─────────────────────────────────────────────────────

describe('Custom Data Signing', () => {
  it('v1 params should have version 1 and binary field', () => {
    expectTypeOf<ISignCustomDataParamsV1['version']>().toEqualTypeOf<1>();
    expectTypeOf<ISignCustomDataParamsV1>().toHaveProperty('binary');
  });

  it('v2 params should have version 2 and data field', () => {
    expectTypeOf<ISignCustomDataParamsV2['version']>().toEqualTypeOf<2>();
    expectTypeOf<ISignCustomDataParamsV2>().toHaveProperty('data');
  });

  it('v1 response should include signature and publicKey', () => {
    expectTypeOf<TSignCustomDataResponseV1>().toHaveProperty('signature');
    expectTypeOf<TSignCustomDataResponseV1>().toHaveProperty('publicKey');
    expectTypeOf<TSignCustomDataResponseV1>().toHaveProperty('binary');
  });

  it('v2 response should include signature and publicKey', () => {
    expectTypeOf<TSignCustomDataResponseV2>().toHaveProperty('signature');
    expectTypeOf<TSignCustomDataResponseV2>().toHaveProperty('publicKey');
    expectTypeOf<TSignCustomDataResponseV2>().toHaveProperty('data');
  });
});

// ─── Public State ────────────────────────────────────────────────────────────

describe('IPublicStateResponse', () => {
  it('should have all required fields', () => {
    expectTypeOf<IPublicStateResponse>().toHaveProperty('initialized');
    expectTypeOf<IPublicStateResponse>().toHaveProperty('locked');
    expectTypeOf<IPublicStateResponse>().toHaveProperty('account');
    expectTypeOf<IPublicStateResponse>().toHaveProperty('network');
    expectTypeOf<IPublicStateResponse>().toHaveProperty('messages');
    expectTypeOf<IPublicStateResponse>().toHaveProperty('txVersion');
  });

  it('account should be nullable', () => {
    expectTypeOf<IPublicStateResponse['account']>().toMatchTypeOf<TPublicStateAccount | null>();
  });

  it('network should match TPublicStateNetwork', () => {
    expectTypeOf<IPublicStateResponse['network']>().toMatchTypeOf<TPublicStateNetwork>();
  });
});

describe('TPublicStateAccount', () => {
  it('should have balance of type TAccountBalance', () => {
    expectTypeOf<TPublicStateAccount>().toHaveProperty('balance');
    expectTypeOf<TPublicStateAccount['balance']>().toMatchTypeOf<TAccountBalance>();
  });

  it('should have identity fields', () => {
    expectTypeOf<TPublicStateAccount>().toHaveProperty('name');
    expectTypeOf<TPublicStateAccount>().toHaveProperty('publicKey');
    expectTypeOf<TPublicStateAccount>().toHaveProperty('address');
    expectTypeOf<TPublicStateAccount>().toHaveProperty('networkCode');
  });
});

describe('TPublicStateMessage', () => {
  it('should have id and status', () => {
    expectTypeOf<TPublicStateMessage>().toHaveProperty('id');
    expectTypeOf<TPublicStateMessage>().toHaveProperty('status');
  });
});

// ─── Notification ────────────────────────────────────────────────────────────

describe('INotificationData', () => {
  it('should require title as string', () => {
    expectTypeOf<INotificationData>().toHaveProperty('title');
    expectTypeOf<INotificationData['title']>().toBeString();
  });

  it('should have optional message', () => {
    expectTypeOf<INotificationData>().toHaveProperty('message');
  });
});

// ─── Transaction Base ────────────────────────────────────────────────────────

describe('ITransactionBase', () => {
  it('should have optional fee, senderPublicKey, and timestamp', () => {
    expectTypeOf<ITransactionBase>().toHaveProperty('fee');
    expectTypeOf<ITransactionBase>().toHaveProperty('senderPublicKey');
    expectTypeOf<ITransactionBase>().toHaveProperty('timestamp');
  });
});

// ─── ISignData ───────────────────────────────────────────────────────────────

describe('ISignData', () => {
  it('should have type and data fields', () => {
    expectTypeOf<ISignData<3, IIssueTx>>().toHaveProperty('type');
    expectTypeOf<ISignData<3, IIssueTx>>().toHaveProperty('data');
  });
});

// ─── Orders ──────────────────────────────────────────────────────────────────

describe('Order Types', () => {
  it('ICancelOrderData should have id field', () => {
    expectTypeOf<ICancelOrderData>().toHaveProperty('id');
    expectTypeOf<ICancelOrderData['id']>().toBeString();
  });

  it('TSignCancelOrderData should be ISignData<1003, ICancelOrderData>', () => {
    expectTypeOf<TSignCancelOrderData>().toMatchTypeOf<ISignData<1003, ICancelOrderData>>();
  });

  it('ISignOrderDataBody should have required order fields', () => {
    expectTypeOf<ISignOrderDataBody>().toHaveProperty('amount');
    expectTypeOf<ISignOrderDataBody>().toHaveProperty('price');
    expectTypeOf<ISignOrderDataBody>().toHaveProperty('orderType');
    expectTypeOf<ISignOrderDataBody>().toHaveProperty('matcherFee');
    expectTypeOf<ISignOrderDataBody>().toHaveProperty('matcherPublicKey');
    expectTypeOf<ISignOrderDataBody>().toHaveProperty('expiration');
  });

  it('orderType should be sell or buy', () => {
    expectTypeOf<ISignOrderDataBody['orderType']>().toEqualTypeOf<'sell' | 'buy'>();
  });

  it('TSignOrderData should be type 1002', () => {
    expectTypeOf<TSignOrderData>().toMatchTypeOf<ISignData<1002, ISignOrderDataBody>>();
  });
});

// ─── Sign Request ────────────────────────────────────────────────────────────

describe('Sign Request Types', () => {
  it('ISignRequestBody should have timestamp', () => {
    expectTypeOf<ISignRequestBody>().toHaveProperty('timestamp');
  });

  it('TSignRequestData should be type 1001 or 1004', () => {
    expectTypeOf<TSignRequestData>().toMatchTypeOf<ISignData<1001 | 1004, ISignRequestBody>>();
  });
});

// ─── Transaction Types ───────────────────────────────────────────────────────

describe('Transaction Types', () => {
  it('TSignTransactionData should include all tx types', () => {
    expectTypeOf<TIssueTxData>().toMatchTypeOf<TSignTransactionData>();
    expectTypeOf<TTransferTxData>().toMatchTypeOf<TSignTransactionData>();
    expectTypeOf<TReissueTxData>().toMatchTypeOf<TSignTransactionData>();
    expectTypeOf<TBurnTxData>().toMatchTypeOf<TSignTransactionData>();
    expectTypeOf<TLeaseTxData>().toMatchTypeOf<TSignTransactionData>();
    expectTypeOf<TLeaseCancelTxData>().toMatchTypeOf<TSignTransactionData>();
    expectTypeOf<TCreateAliasTxData>().toMatchTypeOf<TSignTransactionData>();
    expectTypeOf<TMassTransferTxData>().toMatchTypeOf<TSignTransactionData>();
    expectTypeOf<TDataTxData>().toMatchTypeOf<TSignTransactionData>();
    expectTypeOf<TSetScriptTxData>().toMatchTypeOf<TSignTransactionData>();
    expectTypeOf<TSponsoredFeeTxData>().toMatchTypeOf<TSignTransactionData>();
    expectTypeOf<TSetAssetScriptTxData>().toMatchTypeOf<TSignTransactionData>();
    expectTypeOf<TScriptInvocationTxData>().toMatchTypeOf<TSignTransactionData>();
    expectTypeOf<TUpdateAssetInfoTxData>().toMatchTypeOf<TSignTransactionData>();
    expectTypeOf<TInvokeExpressionTxData>().toMatchTypeOf<TSignTransactionData>();
  });

  it('TSignTransactionPackageData should be an array', () => {
    expectTypeOf<TSignTransactionPackageData>().toMatchTypeOf<unknown[]>();
  });
});

describe('IIssueTx', () => {
  it('should extend ITransactionBase and have issue-specific fields', () => {
    expectTypeOf<IIssueTx>().toHaveProperty('name');
    expectTypeOf<IIssueTx>().toHaveProperty('description');
    expectTypeOf<IIssueTx>().toHaveProperty('quantity');
    expectTypeOf<IIssueTx>().toHaveProperty('precision');
    expectTypeOf<IIssueTx>().toHaveProperty('reissuable');
    expectTypeOf<IIssueTx>().toHaveProperty('fee');
  });
});

describe('ITransferTx', () => {
  it('should have recipient and amount', () => {
    expectTypeOf<ITransferTx>().toHaveProperty('recipient');
    expectTypeOf<ITransferTx>().toHaveProperty('amount');
  });
});

describe('IReissueTx', () => {
  it('should have assetId and quantity', () => {
    expectTypeOf<IReissueTx>().toHaveProperty('assetId');
    expectTypeOf<IReissueTx>().toHaveProperty('quantity');
    expectTypeOf<IReissueTx>().toHaveProperty('reissuable');
  });
});

describe('IBurnTx', () => {
  it('should have assetId and amount', () => {
    expectTypeOf<IBurnTx>().toHaveProperty('assetId');
    expectTypeOf<IBurnTx>().toHaveProperty('amount');
  });
});

describe('ILeaseTx', () => {
  it('should have recipient and amount', () => {
    expectTypeOf<ILeaseTx>().toHaveProperty('recipient');
    expectTypeOf<ILeaseTx>().toHaveProperty('amount');
  });
});

describe('ILeaseCancelTx', () => {
  it('should have leaseId', () => {
    expectTypeOf<ILeaseCancelTx>().toHaveProperty('leaseId');
    expectTypeOf<ILeaseCancelTx['leaseId']>().toBeString();
  });
});

describe('ICreateAliasTx', () => {
  it('should have alias', () => {
    expectTypeOf<ICreateAliasTx>().toHaveProperty('alias');
    expectTypeOf<ICreateAliasTx['alias']>().toBeString();
  });
});

describe('IMassTransferTx', () => {
  it('should have totalAmount and transfers', () => {
    expectTypeOf<IMassTransferTx>().toHaveProperty('totalAmount');
    expectTypeOf<IMassTransferTx>().toHaveProperty('transfers');
  });
});

describe('ITransfer', () => {
  it('should have recipient and amount', () => {
    expectTypeOf<ITransfer>().toHaveProperty('recipient');
    expectTypeOf<ITransfer>().toHaveProperty('amount');
  });
});

// ─── Call Args ───────────────────────────────────────────────────────────────

describe('TCallArgs', () => {
  it('should accept all four arg types', () => {
    expectTypeOf<TCallArgsInteger>().toMatchTypeOf<TCallArgs>();
    expectTypeOf<TCallArgsBoolean>().toMatchTypeOf<TCallArgs>();
    expectTypeOf<TCallArgsBinary>().toMatchTypeOf<TCallArgs>();
    expectTypeOf<TCallArgsString>().toMatchTypeOf<TCallArgs>();
  });
});

describe('TData', () => {
  it('should have key field', () => {
    expectTypeOf<TData>().toHaveProperty('key');
  });
});

// ─── Data Transaction ────────────────────────────────────────────────────────

describe('IDataTx', () => {
  it('should have data array', () => {
    expectTypeOf<IDataTx>().toHaveProperty('data');
  });
});

// ─── Script Transactions ─────────────────────────────────────────────────────

describe('ISetScriptTx', () => {
  it('should have script field (string or null)', () => {
    expectTypeOf<ISetScriptTx>().toHaveProperty('script');
    expectTypeOf<ISetScriptTx['script']>().toMatchTypeOf<string | null>();
  });
});

describe('ISponsoredFeeTx', () => {
  it('should have minSponsoredAssetFee', () => {
    expectTypeOf<ISponsoredFeeTx>().toHaveProperty('minSponsoredAssetFee');
  });
});

describe('ISetAssetScriptTx', () => {
  it('should have assetId and script', () => {
    expectTypeOf<ISetAssetScriptTx>().toHaveProperty('assetId');
    expectTypeOf<ISetAssetScriptTx>().toHaveProperty('script');
  });
});

describe('ICall', () => {
  it('should have function name and args', () => {
    expectTypeOf<ICall>().toHaveProperty('function');
    expectTypeOf<ICall>().toHaveProperty('args');
  });
});

describe('IScriptInvocationTx', () => {
  it('should have dApp and optional payment/call', () => {
    expectTypeOf<IScriptInvocationTx>().toHaveProperty('dApp');
    expectTypeOf<IScriptInvocationTx>().toHaveProperty('payment');
    expectTypeOf<IScriptInvocationTx>().toHaveProperty('call');
  });
});

describe('IUpdateAssetInfoTx', () => {
  it('should have assetId, name and description', () => {
    expectTypeOf<IUpdateAssetInfoTx>().toHaveProperty('assetId');
    expectTypeOf<IUpdateAssetInfoTx['assetId']>().toBeString();
    expectTypeOf<IUpdateAssetInfoTx>().toHaveProperty('name');
    expectTypeOf<IUpdateAssetInfoTx>().toHaveProperty('description');
  });
});

describe('IInvokeExpressionTx', () => {
  it('should have expression field', () => {
    expectTypeOf<IInvokeExpressionTx>().toHaveProperty('expression');
    expectTypeOf<IInvokeExpressionTx['expression']>().toBeString();
  });

  it('should extend ITransactionBase (has fee, senderPublicKey, timestamp)', () => {
    expectTypeOf<IInvokeExpressionTx>().toHaveProperty('fee');
    expectTypeOf<IInvokeExpressionTx>().toHaveProperty('senderPublicKey');
    expectTypeOf<IInvokeExpressionTx>().toHaveProperty('timestamp');
  });
});

// ─── Global Augmentation ─────────────────────────────────────────────────────

describe('Global Augmentation', () => {
  it('Window should have CubensisConnect property', () => {
    expectTypeOf<Window>().toHaveProperty('CubensisConnect');
  });
});
