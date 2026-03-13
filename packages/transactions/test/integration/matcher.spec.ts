import { cancelOrder, cancelSubmittedOrder, order, submitOrder } from '../../src';
import { MASTER_SEED, MATCHER_PUBLIC_KEY, MATCHER_URL, randomHexString, TIMEOUT } from './config';

describe('Matcher requests', () => {
  const assetId = 'GS8e5BvJZawr3gEu5nSesDEhJw33tQ8EE4iWfVoH7TDf';

  beforeAll(async () => {
    const _nonce = randomHexString(6);
    vi.setConfig({ testTimeout: 60000 });
  }, TIMEOUT);

  it(
    'should submit and cancel order',
    async () => {
      const oParams = {
        amount: 10,
        amountAsset: assetId,
        matcherFee: 1000000,
        matcherPublicKey: MATCHER_PUBLIC_KEY,
        orderType: 'buy' as const,
        price: 1000000000,
        priceAsset: null,
      };

      const ord = order(oParams, MASTER_SEED);
      const submitResp = await submitOrder(ord, MATCHER_URL);
      expect(submitResp.status).toEqual('OrderAccepted');

      const co = cancelOrder({ orderId: ord.id }, MASTER_SEED);
      const cancelResp = await cancelSubmittedOrder(
        co,
        ord.assetPair.amountAsset,
        ord.assetPair.priceAsset,
        MATCHER_URL,
      );
      expect(cancelResp.status).toEqual('OrderCanceled');
    },
    TIMEOUT,
  );

  it(
    'should submit and cancel order',
    async () => {
      const oParams = {
        amount: 10,
        amountAsset: assetId,
        matcherFee: 1000000,
        matcherPublicKey: MATCHER_PUBLIC_KEY,
        orderType: 'buy' as const,
        price: 1000000000,
        priceAsset: null,
        version: 4,
      };

      const _ord = order(oParams, MASTER_SEED);
      // const submitResp = await submitOrder(ord, MATCHER_URL)
      // expect(submitResp.status).toEqual('OrderAccepted')
      //
      // const co = cancelOrder({orderId: ord.id}, MASTER_SEED)
      // const cancelResp = await cancelSubmittedOrder(co, ord.assetPair.amountAsset, ord.assetPair.priceAsset, MATCHER_URL)
      // expect(cancelResp.status).toEqual('OrderCanceled')
    },
    TIMEOUT,
  );

  it(
    'should submit and cancel market order',
    async () => {
      const oParams = {
        amount: 10,
        amountAsset: assetId,
        matcherFee: 1000000,
        matcherPublicKey: MATCHER_PUBLIC_KEY,
        orderType: 'buy' as const,
        price: 100000000,
        priceAsset: null,
      };

      const ord = order(oParams, MASTER_SEED);
      const submitResp = await submitOrder(ord, { market: false, matcherUrl: MATCHER_URL });
      expect(submitResp.status).toEqual('OrderAccepted');

      const co = cancelOrder({ orderId: ord.id }, MASTER_SEED);
      const cancelResp = await cancelSubmittedOrder(
        co,
        ord.assetPair.amountAsset,
        ord.assetPair.priceAsset,
        MATCHER_URL,
      );
      expect(cancelResp.status).toEqual('OrderCanceled');
    },
    TIMEOUT,
  );

  it(
    'order validation',
    async () => {
      const order1 = order(
        {
          amount: 1,
          amountAsset: assetId,
          matcherFee: 1000000,
          matcherPublicKey: MATCHER_PUBLIC_KEY,
          //matcherPublicKey: publicKey(seed),
          orderType: 'buy',
          price: 100000000,
          priceAsset: null,
        },
        MASTER_SEED,
      );

      const order2 = order(
        {
          amount: 1,
          amountAsset: assetId,
          matcherFee: 1000000,
          matcherPublicKey: MATCHER_PUBLIC_KEY,
          //matcherPublicKey: publicKey(seed),
          orderType: 'sell',
          price: 100000000,
          priceAsset: null,
        },
        MASTER_SEED,
      );

      await submitOrder(order1, MATCHER_URL);
      await submitOrder(order2, MATCHER_URL);
    },
    TIMEOUT,
  );
});
