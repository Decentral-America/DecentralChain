import { BigNumber } from '@decentralchain/bignumber';
import { Asset, Money } from '@decentralchain/data-entities';
import { seedUtils } from '@decentralchain/transactions';
import { SeedAdapter } from '../src/adapters';
import { SIGN_TYPE } from '../src/prepareTx';
import { ERROR_MSG } from '../src/prepareTx/fieldValidator';

const Seed = seedUtils.Seed;

const getError = (e: Error) => JSON.parse(e.message);

const testSeed = 'some test seed words without money on mainnet';
const seed = new Seed(testSeed);
const testAsset = new Asset({
  description: 'Some text',
  height: 100,
  id: 'Gtb1WRznfchDnTh37ezoDTJ4wcoKaRsKqKjJjy7nm2zU',
  name: 'Test',
  precision: 5,
  quantity: new BigNumber(10000),
  reissuable: false,
  sender: seed.address,
  ticker: undefined,
  timestamp: new Date(),
});

describe('Check validators', () => {
  let adapter: SeedAdapter;

  beforeEach(() => {
    adapter = new SeedAdapter(testSeed, 'W');
  });

  describe('check order validations', () => {
    const data = {
      amount: new Money('12.5', testAsset),
      expiration: Date.now(),
      matcherFee: Money.fromTokens('0.003', testAsset),
      matcherPublicKey: 'AHLRHBJYtxwqjCcBYnFWeDco8hGJicWYrFd5yM5bWmNh',
      orderType: 'sell',
      price: Money.fromTokens('12.22', testAsset),
    };

    it('valid order', () => {
      const signData = {
        data: { ...data },
        type: SIGN_TYPE.CREATE_ORDER,
      } as any;

      expect(
        (() => {
          const signable = adapter.makeSignable(signData);
          signable.getDataForApi();
          return true;
        })(),
      ).toBe(true);
    });

    it('invalid order type', () => {
      const signData = {
        data: { ...data, orderType: 'none' },
        type: SIGN_TYPE.CREATE_ORDER,
      } as any;

      try {
        adapter.makeSignable(signData);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(1);
        expect(e[0].message).toEqual(ERROR_MSG.WRONG_ORDER_TYPE);
        expect(e[0].field).toEqual('orderType');
      }
    });

    it('invalid order amount', () => {
      const signData = {
        data: { ...data, amount: '10' },
        type: SIGN_TYPE.CREATE_ORDER,
      } as any;

      try {
        adapter.makeSignable(signData);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(3);
        expect(e[0].message).toEqual(ERROR_MSG.WRONG_TYPE);
        expect(e[0].field).toEqual('amount');
      }
    });
  });

  describe('check transfer validations', () => {
    const data = {
      amount: Money.fromTokens(1, testAsset),
      fee: Money.fromTokens(0.0001, testAsset),
      recipient: 'send2',
      timestamp: Date.now(),
    };

    it('valid transfer', () => {
      const signData = {
        data: { ...data },
        type: SIGN_TYPE.TRANSFER,
      } as any;

      expect((() => !!adapter.makeSignable(signData))()).toBe(true);
    });

    it('valid transfer bytes', () => {
      const signData = {
        data: { ...data, transfers: [2, 15, 40, 20] },
        type: SIGN_TYPE.TRANSFER,
      } as any;

      expect((() => !!adapter.makeSignable(signData))()).toBe(true);
    });

    it('valid transfer UInt8 bytes', () => {
      const signData = {
        data: { ...data, transfers: new Uint8Array([2, 15, 40, 20]) },
        type: SIGN_TYPE.TRANSFER,
      } as any;

      expect((() => !!adapter.makeSignable(signData))()).toBe(true);
    });

    it('invalid transfer amount', () => {
      const signData = {
        data: { ...data, amount: '' },
        type: SIGN_TYPE.TRANSFER,
      } as any;

      try {
        adapter.makeSignable(signData);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(2);
        expect(e[0].message).toEqual(ERROR_MSG.WRONG_TYPE);
        expect(e[0].field).toEqual('amount');
      }
    });

    it('invalid transfer fee', () => {
      const signData = {
        data: { ...data, fee: '' },
        type: SIGN_TYPE.TRANSFER,
      } as any;

      try {
        adapter.makeSignable(signData);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(2);
        expect(e[0].message).toEqual(ERROR_MSG.WRONG_TYPE);
        expect(e[0].field).toEqual('fee');
      }
    });

    it('invalid transfer attachment', () => {
      const signData = {
        data: { ...data, attachment: {} },
        type: SIGN_TYPE.TRANSFER,
      } as any;

      try {
        adapter.makeSignable(signData);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(1);
        expect(e[0].field).toEqual('attachment');
        expect(e[0].message).toEqual(ERROR_MSG.WRONG_TYPE);
      }
    });

    it('invalid transfer recipient', () => {
      const signData = {
        data: { ...data, recipient: '3Mz9N7YPfZPWGd4yYaX6H53Gcgrq6ifYiH7' },
        type: SIGN_TYPE.TRANSFER,
      } as any;

      try {
        adapter.makeSignable(signData);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(1);
        expect(e[0].field).toEqual('recipient');
        expect(e[0].message).toEqual(ERROR_MSG.WRONG_ADDRESS);
      }
    });

    it('invalid transfer timestamp', () => {
      const signData = {
        data: { ...data, timestamp: '3Mz9N7YPfZPWGd4yYaX6H53Gcgrq6ifYiH7' },
        type: SIGN_TYPE.TRANSFER,
      } as any;

      try {
        adapter.makeSignable(signData);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(1);
        expect(e[0].field).toEqual('timestamp');
        expect(e[0].message).toEqual(ERROR_MSG.WRONG_TIMESTAMP);
      }
    });
  });

  describe('check mass-transfer validations', () => {
    const data = {
      amount: Money.fromTokens(1, testAsset),
      fee: Money.fromTokens(0.0001, testAsset),
      timestamp: Date.now(),
      totalAmount: new Money(1, testAsset),
      transfers: [{ amount: '1', recipient: 'test1' }],
    };

    it('valid mass transfer', () => {
      const signData = {
        data: { ...data },
        type: SIGN_TYPE.MASS_TRANSFER,
      } as any;

      expect((() => !!adapter.makeSignable(signData))()).toBe(true);
    });

    it('mass transfer invalid transfers required', () => {
      const signData = {
        data: { ...data, transfers: null },
        type: SIGN_TYPE.MASS_TRANSFER,
      } as any;

      try {
        adapter.makeSignable(signData);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(1);
        expect(e[0].field).toEqual('transfers');
        expect(e[0].message).toEqual(ERROR_MSG.REQUIRED);
      }
    });

    it('mass transfer invalid transfers type', () => {
      const signData = {
        data: { ...data, transfers: {} },
        type: SIGN_TYPE.MASS_TRANSFER,
      } as any;

      try {
        adapter.makeSignable(signData);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(1);
        expect(e[0].field).toEqual('transfers');
        expect(e[0].message).toEqual(ERROR_MSG.WRONG_TYPE);
      }
    });

    it('mass transfer invalid transfers address and amount', () => {
      const signData = {
        data: {
          ...data,
          transfers: [
            { amount: '', recipient: 'tes' },
            { amount: '1', recipient: '3Mz9N7YPfZPWGd4yYaX6H53Gcgrq6ifYiH7' },
          ],
        },
        type: SIGN_TYPE.MASS_TRANSFER,
      } as any;

      try {
        adapter.makeSignable(signData);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(1);
        expect(e[0].field).toEqual('transfers');

        expect(e[0].message.length).toEqual(2);
        expect(e[0].message[0].length).toEqual(2);
        expect(e[0].message[0][0].field).toEqual('transfers:0:amount');
        expect(e[0].message[0][0].message).toEqual(ERROR_MSG.WRONG_NUMBER);
        expect(e[0].message[0][1].field).toEqual('transfers:0:recipient');
        expect(e[0].message[0][1].message).toEqual(ERROR_MSG.SMALL_FIELD);

        expect(e[0].message[1].length).toEqual(1);
        expect(e[0].message[1][0].field).toEqual('transfers:1:recipient');
        expect(e[0].message[1][0].message).toEqual(ERROR_MSG.WRONG_ADDRESS);
      }
    });
  });

  describe('check issue validations', () => {
    const data = {
      description: '',
      fee: Money.fromTokens(1, testAsset),
      name: 'test',
      precision: 7,
      quantity: 100000,
      reissuable: true,
    };

    it('issue no script valid', () => {
      const signData = {
        data: { ...data },
        type: SIGN_TYPE.ISSUE,
      } as any;

      expect((() => !!adapter.makeSignable(signData))()).toBe(true);
    });

    it('issue has script valid', () => {
      const signData = {
        data: { ...data },
        script: 'base64:AbCd',
        type: SIGN_TYPE.ISSUE,
      } as any;

      expect((() => !!adapter.makeSignable(signData))()).toBe(true);
    });

    it('issue invalid name', () => {
      const signData = {
        data: { ...data, name: 'P' },
        type: SIGN_TYPE.ISSUE,
      } as any;

      try {
        adapter.makeSignable(signData);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(1);
        expect(e[0].field).toEqual('name');
        expect(e[0].message).toEqual(ERROR_MSG.SMALL_FIELD);
      }

      const signData2 = {
        data: { ...data, name: 'японамама' },
        type: SIGN_TYPE.ISSUE,
      } as any;

      try {
        adapter.makeSignable(signData2);
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(1);
        expect(e[0].field).toEqual('name');
        expect(e[0].message).toEqual(ERROR_MSG.LARGE_FIELD);
      }
    });

    it('issue invalid description', () => {
      const signData = {
        data: { ...data, description: {} },
        type: SIGN_TYPE.ISSUE,
      } as any;

      try {
        adapter.makeSignable(signData);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(1);
        expect(e[0].field).toEqual('description');
        expect(e[0].message).toEqual(ERROR_MSG.WRONG_TYPE);
      }

      const desc = new Array(1002).join('T');

      const signData2 = {
        data: { ...data, description: desc },
        type: SIGN_TYPE.ISSUE,
      } as any;

      try {
        adapter.makeSignable(signData2);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(1);
        expect(e[0].field).toEqual('description');
        expect(e[0].message).toEqual(ERROR_MSG.LARGE_FIELD);
      }
    });

    it('issue invalid precision', () => {
      const signData = {
        data: { ...data, precision: -1 },
        type: SIGN_TYPE.ISSUE,
      } as any;

      try {
        adapter.makeSignable(signData);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(1);
        expect(e[0].field).toEqual('precision');
        expect(e[0].message).toEqual(ERROR_MSG.SMALL_FIELD);
      }

      const signData2 = {
        data: { ...data, precision: '10' },
        type: SIGN_TYPE.ISSUE,
      } as any;

      try {
        adapter.makeSignable(signData2);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(1);
        expect(e[0].field).toEqual('precision');
        expect(e[0].message).toEqual(ERROR_MSG.LARGE_FIELD);
      }
    });
  });

  describe('check data validations', () => {
    const data = {
      data: [
        { key: 'string', type: 'string', value: 'testVal' },
        { key: 'binary', type: 'binary', value: 'base64:AbCd' },
        { key: 'integer', type: 'integer', value: '20' },
        { key: 'boolean', type: 'boolean', value: false },
      ],
      fee: Money.fromTokens(0.003, testAsset),
    };

    it('valid data', () => {
      const signData = {
        data: { ...data },
        type: SIGN_TYPE.DATA,
      } as any;

      expect((() => !!adapter.makeSignable(signData))()).toBe(true);
    });

    it('invalid data', () => {
      const signData = {
        data: { ...data, data: {} },
        type: SIGN_TYPE.DATA,
      } as any;

      try {
        adapter.makeSignable(signData);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(1);
        expect(e[0].message).toEqual(ERROR_MSG.WRONG_TYPE);
        expect(e[0].field).toEqual('data');
      }
    });

    it('invalid data binary', () => {
      const signData = {
        data: {
          ...data,
          data: [{ key: 'binary', type: 'binary', value: 'AbCd' }],
        },
        type: SIGN_TYPE.DATA,
      } as any;

      try {
        adapter.makeSignable(signData);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(1);
        expect(e[0].message[0].message).toEqual(ERROR_MSG.BASE64);
        expect(e[0].message[0].field).toEqual('data:0:value');
      }
    });

    it('invalid data binary no base64', () => {
      const signData = {
        data: {
          ...data,
          data: [{ key: 'binary', type: 'binary', value: 'base64:AbC' }],
        },
        type: SIGN_TYPE.DATA,
      } as any;

      try {
        adapter.makeSignable(signData);
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(1);
        expect(e[0].message[0].message).toEqual(ERROR_MSG.BASE64);
        expect(e[0].message[0].field).toEqual('data:0:value');
      }
    });

    it('invalid data type', () => {
      const signData = {
        data: {
          ...data,
          data: [{ key: 'custom', type: 'custom', value: 'base64:AbCd' }],
        },
        type: SIGN_TYPE.DATA,
      } as any;

      try {
        adapter
          .makeSignable(signData)
          .getBytes()
          .catch((_e) => {});
        expect.fail('Expected to throw but did not');
      } catch (error) {
        const e = getError(error);
        expect(e.length).toEqual(1);
        expect(e[0].message[0].message).toEqual(ERROR_MSG.WRONG_TYPE);
        expect(e[0].message[0].field).toEqual('data:0:type');
      }
    });
  });
});
