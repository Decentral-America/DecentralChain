import getTxBytes from '../src/prepareTx/getTxBytes';
import { SIGN_TYPE } from '../src/prepareTx';
import { Money, Asset } from '@decentralchain/data-entities';
import { BigNumber } from '@decentralchain/bignumber';

const testAsset = new Asset({
  precision: 8,
  id: 'DCC',
  quantity: new BigNumber(10000000000000000),
  description: '',
  height: 0,
  name: 'DCC',
  reissuable: false,
  sender: '',
  timestamp: new Date('2016-04-11T21:00:00.000Z'),
  ticker: 'DCC',
});

const networkByte = 'W'.charCodeAt(0);

describe('getTxBytes', () => {
  it('returns Uint8Array for auth request', () => {
    const bytes = getTxBytes(
      {
        type: SIGN_TYPE.AUTH,
        data: {
          prefix: 'DCCWalletAuthentication',
          host: 'localhost',
          data: 'testData',
          version: 1,
        },
      } as any,
      networkByte,
    );
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it('returns Uint8Array for transfer v2', () => {
    const bytes = getTxBytes(
      {
        type: SIGN_TYPE.TRANSFER,
        data: {
          amount: Money.fromCoins(100000, testAsset),
          fee: Money.fromCoins(100000, testAsset),
          recipient: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
          timestamp: 1558497371511,
          version: 2,
          senderPublicKey: 'E3ao18QtWEzm7hAbKQaoZNBRw6coj2NAy7opqbrqURFr',
        },
      } as any,
      networkByte,
    );
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it('auto-selects latest version when no version is provided', () => {
    const bytes = getTxBytes(
      {
        type: SIGN_TYPE.AUTH,
        data: {
          prefix: 'DCCWalletAuthentication',
          host: 'localhost',
          data: 'testData',
        },
      } as any,
      networkByte,
    );
    expect(bytes).toBeInstanceOf(Uint8Array);
  });

  it('returns Uint8Array for cancel order', () => {
    const bytes = getTxBytes(
      {
        type: SIGN_TYPE.CANCEL_ORDER,
        data: {
          senderPublicKey: 'E3ao18QtWEzm7hAbKQaoZNBRw6coj2NAy7opqbrqURFr',
          orderId: '8pnVREzPXcpJY6R456M2v2c2qEbL8sGFgdZxdQeNiXZP',
          version: 1,
        },
      } as any,
      networkByte,
    );
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });

  it('returns Uint8Array for matcher orders', () => {
    const bytes = getTxBytes(
      {
        type: SIGN_TYPE.MATCHER_ORDERS,
        data: {
          senderPublicKey: 'E3ao18QtWEzm7hAbKQaoZNBRw6coj2NAy7opqbrqURFr',
          timestamp: 1558497371511,
          version: 1,
        },
      } as any,
      networkByte,
    );
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(0);
  });
});
