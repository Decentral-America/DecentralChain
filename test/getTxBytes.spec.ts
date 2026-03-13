import { BigNumber } from '@decentralchain/bignumber';
import { Asset, Money } from '@decentralchain/data-entities';
import { SIGN_TYPE } from '../src/prepareTx';
import getTxBytes from '../src/prepareTx/getTxBytes';

const testAsset = new Asset({
  description: '',
  height: 0,
  id: 'DCC',
  name: 'DCC',
  precision: 8,
  quantity: new BigNumber(10000000000000000),
  reissuable: false,
  sender: '',
  ticker: 'DCC',
  timestamp: new Date('2016-04-11T21:00:00.000Z'),
});

const networkByte = 'W'.charCodeAt(0);

describe('getTxBytes', () => {
  it('returns Uint8Array for auth request', () => {
    const bytes = getTxBytes(
      {
        data: {
          data: 'testData',
          host: 'localhost',
          prefix: 'DCCWalletAuthentication',
          version: 1,
        },
        type: SIGN_TYPE.AUTH,
      } as any,
      networkByte,
    );
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it('returns Uint8Array for transfer v2', () => {
    const bytes = getTxBytes(
      {
        data: {
          amount: Money.fromCoins(100000, testAsset),
          fee: Money.fromCoins(100000, testAsset),
          recipient: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          senderPublicKey: 'E3ao18QtWEzm7hAbKQaoZNBRw6coj2NAy7opqbrqURFr',
          timestamp: 1558497371511,
          version: 2,
        },
        type: SIGN_TYPE.TRANSFER,
      } as any,
      networkByte,
    );
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it('auto-selects latest version when no version is provided', () => {
    const bytes = getTxBytes(
      {
        data: {
          data: 'testData',
          host: 'localhost',
          prefix: 'DCCWalletAuthentication',
        },
        type: SIGN_TYPE.AUTH,
      } as any,
      networkByte,
    );
    expect(bytes).toBeInstanceOf(Uint8Array);
  });

  it('returns Uint8Array for cancel order', () => {
    const bytes = getTxBytes(
      {
        data: {
          orderId: '8pnVREzPXcpJY6R456M2v2c2qEbL8sGFgdZxdQeNiXZP',
          senderPublicKey: 'E3ao18QtWEzm7hAbKQaoZNBRw6coj2NAy7opqbrqURFr',
          version: 1,
        },
        type: SIGN_TYPE.CANCEL_ORDER,
      } as any,
      networkByte,
    );
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it('returns Uint8Array for matcher orders', () => {
    const bytes = getTxBytes(
      {
        data: {
          senderPublicKey: 'E3ao18QtWEzm7hAbKQaoZNBRw6coj2NAy7opqbrqURFr',
          timestamp: 1558497371511,
          version: 1,
        },
        type: SIGN_TYPE.MATCHER_ORDERS,
      } as any,
      networkByte,
    );
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });
});
