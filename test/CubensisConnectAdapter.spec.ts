import { CubensisConnectAdapter } from '../src/adapters/CubensisConnectAdapter';
import { Asset, Money } from '@decentralchain/data-entities';
import { TRANSACTION_TYPE_NUMBER } from '../src/prepareTx';
import { BigNumber } from '@decentralchain/bignumber';

const testAsset = new Asset({
  precision: 5,
  id: 'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
  quantity: new BigNumber(10000),
  description: 'Some text',
  height: 100,
  name: 'Test',
  reissuable: false,
  sender: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
  timestamp: new Date(),
  ticker: undefined,
});

const keeperMock = {
  // @ts-expect-error - mock impl
  auth: async (_data) => ({
    data: 'test',
    prefix: 'DCCWalletAuthentication',
    host: 'www.yandex.ru',
    name: 'test',
    address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
    publicKey: 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
    signature:
      '3xvbSznhRTgDP5vMSoPpqwVf29hSdDQLFpdbtVaMHCyzuFFEgSodB7MXZTescxcYiVtR9wCgTGmZPWTApMVMg6qP',
  }),
  // @ts-expect-error - mock impl
  signTransaction: async (data) => {
    switch (data.type) {
      case TRANSACTION_TYPE_NUMBER.SPONSORSHIP:
      case TRANSACTION_TYPE_NUMBER.BURN:
      case TRANSACTION_TYPE_NUMBER.CANCEL_LEASING:
      case TRANSACTION_TYPE_NUMBER.CREATE_ALIAS:
      case TRANSACTION_TYPE_NUMBER.DATA:
      case TRANSACTION_TYPE_NUMBER.EXCHANGE:
      case TRANSACTION_TYPE_NUMBER.ISSUE:
      case TRANSACTION_TYPE_NUMBER.LEASE:
      case TRANSACTION_TYPE_NUMBER.MASS_TRANSFER:
      case TRANSACTION_TYPE_NUMBER.TRANSFER:
      case TRANSACTION_TYPE_NUMBER.REISSUE:
      case TRANSACTION_TYPE_NUMBER.SET_SCRIPT:
        break;
      default:
        throw new Error('invalid transaction');
    }
    return JSON.stringify({ proofs: ['test', 'realProof'] });
  },
  // @ts-expect-error - mock impl
  signOrder: async (_data) => {},
  // @ts-expect-error - mock impl
  signCancelOrder: async (_data) => {},
  // @ts-expect-error - mock impl
  signRequest: async (_data) => {},
  publicState: async () => ({
    locked: false,
    account: {
      address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
      publicKey: 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
    },
  }),
  // @ts-expect-error - mock impl
  on: (_key: string, _cb) => {},
  initialPromise: Promise.resolve() as any,
};

keeperMock.initialPromise = Promise.resolve(keeperMock) as any;

CubensisConnectAdapter.initOptions({ networkCode: 'W'.charCodeAt(0), extension: keeperMock });

describe('CubensisConnect adapter test', () => {
  it('Test connect to extension', async () => {
    const users = await CubensisConnectAdapter.getUserList();
    const adapter = new CubensisConnectAdapter(users[0]);
    await expect(adapter.isAvailable()).resolves.not.toThrow();
  });

  it('Test connect to extension by cb', async () => {
    let mock: any = null;
    CubensisConnectAdapter.setApiExtension(() => mock);

    // Should fail when mock is null
    await expect(async () => {
      const users = await CubensisConnectAdapter.getUserList();
      const adapter = new CubensisConnectAdapter(users[0]);
      await adapter.isAvailable();
    }).rejects.toThrow();

    // Now set the real mock and it should succeed
    mock = keeperMock;
    const users = await CubensisConnectAdapter.getUserList();
    const adapter = new CubensisConnectAdapter(users[0]);
    await expect(adapter.isAvailable()).resolves.not.toThrow();
  });

  it('Test sign transfer', async () => {
    const data = {
      type: 4,
      data: {
        fee: Money.fromTokens('0.1', testAsset),
        amount: new Money(1, testAsset),
        recipient: 'test',
        attachment: '',
      },
    };

    CubensisConnectAdapter.setApiExtension(keeperMock);
    const users = await CubensisConnectAdapter.getUserList();
    const adapter = new CubensisConnectAdapter(users[0]);
    const signable = adapter.makeSignable(data as any);
    const result = (await signable.getDataForApi()) as any;
    expect(result.proofs[0]).toBe('realProof');
  });

  it('Test convert UInt8Array transfer', async () => {
    const data = {
      type: 4,
      data: {
        fee: Money.fromTokens('0.1', testAsset),
        amount: new Money(1, testAsset),
        recipient: 'test',
        attachment: new Uint8Array([1, 2, 3, 4]),
      },
    };

    CubensisConnectAdapter.setApiExtension(keeperMock);
    const users = await CubensisConnectAdapter.getUserList();
    const adapter = new CubensisConnectAdapter(users[0]);
    const signable = adapter.makeSignable(data as any);
    const result = (await signable.getDataForApi()) as any;
    expect(result.proofs[0]).toBe('realProof');
  });
});
