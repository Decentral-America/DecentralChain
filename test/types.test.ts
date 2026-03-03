import { describe, it, expectTypeOf } from 'vitest';

/**
 * Type-level tests for CubensisConnect types.
 * Since this is a types-only package, we validate that the declared
 * types are structurally sound and assignable as expected.
 */
describe('CubensisConnect Types', () => {
  it('TCubensisConnectApi should have required methods', () => {
    expectTypeOf<CubensisConnect.TCubensisConnectApi>().toHaveProperty('auth');
    expectTypeOf<CubensisConnect.TCubensisConnectApi>().toHaveProperty('publicState');
    expectTypeOf<CubensisConnect.TCubensisConnectApi>().toHaveProperty('signTransaction');
    expectTypeOf<CubensisConnect.TCubensisConnectApi>().toHaveProperty('signAndPublishTransaction');
    expectTypeOf<CubensisConnect.TCubensisConnectApi>().toHaveProperty('signOrder');
    expectTypeOf<CubensisConnect.TCubensisConnectApi>().toHaveProperty('signAndPublishOrder');
    expectTypeOf<CubensisConnect.TCubensisConnectApi>().toHaveProperty('signCancelOrder');
    expectTypeOf<CubensisConnect.TCubensisConnectApi>().toHaveProperty('signAndPublishCancelOrder');
    expectTypeOf<CubensisConnect.TCubensisConnectApi>().toHaveProperty('signRequest');
    expectTypeOf<CubensisConnect.TCubensisConnectApi>().toHaveProperty('signTransactionPackage');
    expectTypeOf<CubensisConnect.TCubensisConnectApi>().toHaveProperty('signCustomData');
    expectTypeOf<CubensisConnect.TCubensisConnectApi>().toHaveProperty('notification');
    expectTypeOf<CubensisConnect.TCubensisConnectApi>().toHaveProperty('encryptMessage');
    expectTypeOf<CubensisConnect.TCubensisConnectApi>().toHaveProperty('decryptMessage');
    expectTypeOf<CubensisConnect.TCubensisConnectApi>().toHaveProperty('on');
    expectTypeOf<CubensisConnect.TCubensisConnectApi>().toHaveProperty('initialPromise');
  });

  it('auth should accept IAuthData and return IAuthResponse', () => {
    type AuthFn = CubensisConnect.TCubensisConnectApi['auth'];
    expectTypeOf<AuthFn>().parameter(0).toMatchTypeOf<CubensisConnect.IAuthData>();
    expectTypeOf<AuthFn>().returns.toMatchTypeOf<Promise<CubensisConnect.IAuthResponse>>();
  });

  it('IAuthData should require data field', () => {
    expectTypeOf<CubensisConnect.IAuthData>().toHaveProperty('data');
    expectTypeOf<CubensisConnect.IAuthData['data']>().toBeString();
  });

  it('IAuthResponse should have expected shape', () => {
    expectTypeOf<CubensisConnect.IAuthResponse>().toHaveProperty('address');
    expectTypeOf<CubensisConnect.IAuthResponse>().toHaveProperty('publicKey');
    expectTypeOf<CubensisConnect.IAuthResponse>().toHaveProperty('signature');
    expectTypeOf<CubensisConnect.IAuthResponse>().toHaveProperty('version');
  });

  it('TMoney should accept tokens, coins, or amount variants', () => {
    const moneyTokens: CubensisConnect.TMoney = { assetId: 'abc', tokens: 100 };
    const moneyCoins: CubensisConnect.TMoney = { assetId: 'abc', coins: 100 };
    const moneyAmount: CubensisConnect.TMoney = { assetId: 'abc', amount: 100 };

    expectTypeOf(moneyTokens).toMatchTypeOf<CubensisConnect.TMoney>();
    expectTypeOf(moneyCoins).toMatchTypeOf<CubensisConnect.TMoney>();
    expectTypeOf(moneyAmount).toMatchTypeOf<CubensisConnect.TMoney>();
  });

  it('IPublicStateResponse should have correct structure', () => {
    expectTypeOf<CubensisConnect.IPublicStateResponse>().toHaveProperty('initialized');
    expectTypeOf<CubensisConnect.IPublicStateResponse>().toHaveProperty('locked');
    expectTypeOf<CubensisConnect.IPublicStateResponse>().toHaveProperty('account');
    expectTypeOf<CubensisConnect.IPublicStateResponse>().toHaveProperty('network');
    expectTypeOf<CubensisConnect.IPublicStateResponse>().toHaveProperty('messages');
    expectTypeOf<CubensisConnect.IPublicStateResponse>().toHaveProperty('txVersion');
  });

  it('TSignTransactionData should include all transaction types', () => {
    // Verify the union type contains expected members
    expectTypeOf<CubensisConnect.TIssueTxData>().toMatchTypeOf<CubensisConnect.TSignTransactionData>();
    expectTypeOf<CubensisConnect.TTransferTxData>().toMatchTypeOf<CubensisConnect.TSignTransactionData>();
    expectTypeOf<CubensisConnect.TReissueTxData>().toMatchTypeOf<CubensisConnect.TSignTransactionData>();
    expectTypeOf<CubensisConnect.TBurnTxData>().toMatchTypeOf<CubensisConnect.TSignTransactionData>();
    expectTypeOf<CubensisConnect.TDataTxData>().toMatchTypeOf<CubensisConnect.TSignTransactionData>();
  });

  it('signCustomData should handle v1 and v2 params', () => {
    const v1Params: CubensisConnect.TSignCustomDataParamsV1 = {
      version: 1,
      binary: 'base64data',
    };
    const v2Params: CubensisConnect.TSignCustomDataParamsV2 = {
      version: 2,
      data: [{ type: 'string', key: 'test', value: 'hello' }],
    };

    expectTypeOf(v1Params).toMatchTypeOf<CubensisConnect.TSignCustomDataParamsV1>();
    expectTypeOf(v2Params).toMatchTypeOf<CubensisConnect.TSignCustomDataParamsV2>();
  });

  it('TTypedData should support all data types', () => {
    const binaryData: CubensisConnect.TTypedData = { type: 'binary', key: 'k', value: 'v' };
    const boolData: CubensisConnect.TTypedData = { type: 'boolean', key: 'k', value: true };
    const intData: CubensisConnect.TTypedData = { type: 'integer', key: 'k', value: 42 };
    const strData: CubensisConnect.TTypedData = { type: 'string', key: 'k', value: 'v' };

    expectTypeOf(binaryData).toMatchTypeOf<CubensisConnect.TTypedData>();
    expectTypeOf(boolData).toMatchTypeOf<CubensisConnect.TTypedData>();
    expectTypeOf(intData).toMatchTypeOf<CubensisConnect.TTypedData>();
    expectTypeOf(strData).toMatchTypeOf<CubensisConnect.TTypedData>();
  });

  it('Window interface should expose CubensisConnect', () => {
    expectTypeOf<Window>().toHaveProperty('CubensisConnect');
  });

  it('INotificationData should require title', () => {
    expectTypeOf<CubensisConnect.INotificationData>().toHaveProperty('title');
    expectTypeOf<CubensisConnect.INotificationData['title']>().toBeString();
  });

  it('order types should have correct structure', () => {
    expectTypeOf<CubensisConnect.ISignOrderDataBody>().toHaveProperty('amount');
    expectTypeOf<CubensisConnect.ISignOrderDataBody>().toHaveProperty('price');
    expectTypeOf<CubensisConnect.ISignOrderDataBody>().toHaveProperty('orderType');
    expectTypeOf<CubensisConnect.ISignOrderDataBody>().toHaveProperty('matcherFee');
    expectTypeOf<CubensisConnect.ISignOrderDataBody>().toHaveProperty('matcherPublicKey');
    expectTypeOf<CubensisConnect.ISignOrderDataBody>().toHaveProperty('expiration');
  });
});
