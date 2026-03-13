import { BigNumber } from '@decentralchain/bignumber';
import { Asset, Money } from '@decentralchain/data-entities';
import { CubensisConnectAdapter } from '../src/adapters/CubensisConnectAdapter';
import { TRANSACTION_TYPE_NUMBER } from '../src/prepareTx';

const testAsset = new Asset({
  description: 'Some text',
  height: 100,
  id: 'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
  name: 'Test',
  precision: 5,
  quantity: new BigNumber(10000),
  reissuable: false,
  sender: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
  ticker: undefined,
  timestamp: new Date(),
});

const keeperMock = {
  // @ts-expect-error - mock impl
  auth: async (_data) => ({
    address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
    data: 'test',
    host: 'www.yandex.ru',
    name: 'test',
    prefix: 'DCCWalletAuthentication',
    publicKey: 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
    signature:
      '3xvbSznhRTgDP5vMSoPpqwVf29hSdDQLFpdbtVaMHCyzuFFEgSodB7MXZTescxcYiVtR9wCgTGmZPWTApMVMg6qP',
  }),
  initialPromise: Promise.resolve() as any,
  // @ts-expect-error - mock impl
  on: (_key: string, _cb) => {},
  publicState: async () => ({
    account: {
      address: '3P4ECBVGKmsYwSBqEmeZCTAYLtkBCB6eKKM',
      publicKey: 'FNFBjt2Z3PS3wkDyJeoChGWde6pUvMkGGA3A3kBKzM28',
    },
    locked: false,
  }),
  // @ts-expect-error - mock impl
  signCancelOrder: async (_data) => {},
  // @ts-expect-error - mock impl
  signOrder: async (_data) => {},
  // @ts-expect-error - mock impl
  signRequest: async (_data) => {},
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
};

keeperMock.initialPromise = Promise.resolve(keeperMock) as any;

CubensisConnectAdapter.initOptions({ extension: keeperMock, networkCode: 'W'.charCodeAt(0) });

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
      data: {
        amount: new Money(1, testAsset),
        attachment: '',
        fee: Money.fromTokens('0.1', testAsset),
        recipient: 'test',
      },
      type: 4,
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
      data: {
        amount: new Money(1, testAsset),
        attachment: new Uint8Array([1, 2, 3, 4]),
        fee: Money.fromTokens('0.1', testAsset),
        recipient: 'test',
      },
      type: 4,
    };

    CubensisConnectAdapter.setApiExtension(keeperMock);
    const users = await CubensisConnectAdapter.getUserList();
    const adapter = new CubensisConnectAdapter(users[0]);
    const signable = adapter.makeSignable(data as any);
    const result = (await signable.getDataForApi()) as any;
    expect(result.proofs[0]).toBe('realProof');
  });
});
