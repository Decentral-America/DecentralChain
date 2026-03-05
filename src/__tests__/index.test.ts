import { AssetPair, Asset } from '@decentralchain/data-entities';
import parseJsonBignumber from '@decentralchain/parse-json-bignumber';

import DataServiceClient from '../index';

const parser = (parseJsonBignumber as any)().parse;
const fetch = vi.fn(() => Promise.resolve('{"data":[{ "data": 1 }]}'));
const NODE_URL = 'http://localhost:3000';
const client = new DataServiceClient({
  rootUrl: NODE_URL,
  parse: parser,
  fetch,
});

describe('Assets endpoint: ', () => {
  it('fetch is called with correct params#1', async () => {
    const ids = [
      '4CYRBpSmNKqmw1PoKFoZADv5FaciyJcusqrHyPrAQ4Ca',
      'AENTt5heWujAzcw7PmGXi1ekRc7CAmNm87Q1xZMYXGLa',
    ];
    await client.getAssets(...ids);
    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
  });

  it('fetch is called with correct params#2', async () => {
    const ids = ['4CYRBpSmNKqmw1PoKFoZADv5FaciyJcusqrHyPrAQ4Ca'];
    await client.getAssets(...ids);
    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
  });

  it('fetch is called with correct params#3', async () => {
    const ids: string[] = [];
    await expect(client.getAssets(...ids)).rejects.toBeInstanceOf(Error);
  });

  it('fetch is called with correct params#4', async () => {
    const ticker = 'DCC';
    await client.getAssetsByTicker(ticker);

    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
  });

  it('fetch is called with correct params#5', async () => {
    const ticker = '*';
    await client.getAssetsByTicker(ticker);

    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
  });

  it('throws, if called with wrong types', async () => {
    const wrongTypes: any[] = [1, null, NaN, undefined, {}];
    await Promise.all(
      wrongTypes.map(async (t) => await expect(client.getAssets(t)).rejects.toBeDefined()),
    );
  });
});

describe('Pairs endpoint: ', () => {
  it('fetch is called with correct params#1', async () => {
    const pair1 = new AssetPair(
      'DCC' as any,
      '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS' as any,
    );
    const pair2 = new AssetPair(
      'DCC' as any,
      '474jTeYx2r2Va35794tCScAXWJG9hU2HcgxzMowaZUnu' as any,
    );
    await client.getPairs('3PJjwFREg8F9V6Cp9fnUuEwRts6HQQa5nfP')([pair1, pair2]);
    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
  });

  it('fetch is called with correct params#2', async () => {
    const pairs: any[] = [];
    await client.getPairs('3PJjwFREg8F9V6Cp9fnUuEwRts6HQQa5nfP')(pairs);

    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
  });

  it('throws, if called with wrong types', async () => {
    const wrongTypes: any = [
      1,
      null,
      NaN,
      undefined,
      {},
      { amountAsset: '' },
      { priceAsset: '' },
      '',
    ];
    await Promise.all(
      wrongTypes.map(
        async (t: any) =>
          await expect(
            client.getPairs('3PJjwFREg8F9V6Cp9fnUuEwRts6HQQa5nfP')(t),
          ).rejects.toBeDefined(),
      ),
    );
  });
});

describe('Aliases endpoint: ', () => {
  it('fetch is called with correct params for getByAddress', async () => {
    await client.aliases.getByAddress('address');
    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
  });
  it('fetch is called with correct params for getByAddress with showBroken', async () => {
    await client.aliases.getByAddress('address', { showBroken: true });
    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
  });
  it('fetch is called with correct params#2', async () => {
    await client.aliases.getById('id');
    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
  });

  it('throws, if called with wrong types', async () => {
    const wrongTypes: any = [1, null, NaN, undefined, {}];
    await Promise.all(
      wrongTypes.map(async (t: any) => {
        await expect(client.aliases.getByAddress(t)).rejects.toBeDefined();
        await expect(client.aliases.getById(t)).rejects.toBeDefined();
      }),
    );
  });
});

describe('Candles endpoint: ', () => {
  it('fetch is called with correct params#1', async () => {
    await client.getCandles('AMOUNTASSETID', 'PRICEASSETID', {
      timeStart: '2018-12-01',
      timeEnd: '2018-12-31',
      interval: '1h',
      matcher: '123',
    });
    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
  });
  it('fetch is called with correct params#2', async () => {
    await client.getCandles('AMOUNTASSETID', 'PRICEASSETID', {
      timeStart: '2018-12-01',
      interval: '1h',
      matcher: '123',
    });
    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
  });
  it('throws, if called with wrong types', async () => {
    const wrongTypes: any = [null, NaN, {}];
    await Promise.all(
      wrongTypes.map(async (t: any) => {
        await expect(
          client.getCandles(null as any, null as any, null as any),
        ).rejects.toBeDefined();
        await expect(client.getCandles(null as any, null as any, t)).rejects.toBeDefined();
      }),
    );
  });
});

describe('ExchangeTxs endpoint: ', () => {
  type Case = { label: string; params: any[]; expectedUrl?: string };
  const goodCases: Case[] = [
    {
      label: 'single string',
      params: ['8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS'],
      expectedUrl: `${NODE_URL}/transactions/exchange/8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS`,
    },
    {
      label: 'empty call',
      params: [],
      expectedUrl: `${NODE_URL}/transactions/exchange`,
    },
    {
      label: 'with one filter',
      params: [{ timeStart: '2016-01-01' }],
      expectedUrl: `${NODE_URL}/transactions/exchange?timeStart=2016-01-01`,
    },
    {
      label: 'with all filters',
      params: [
        {
          timeStart: '2016-02-01',
          timeEnd: '2016-03-01',
          matcher: 'matcher',
          sender: 'sender',
          amountAsset: 'asset1',
          priceAsset: 'priceAsset',
          limit: 5,
          sort: 'desc',
        },
      ],
      expectedUrl: `${NODE_URL}/transactions/exchange?timeStart=2016-02-01&timeEnd=2016-03-01&matcher=matcher&sender=sender&amountAsset=asset1&priceAsset=priceAsset&limit=5&sort=desc`,
    },
  ];
  const badCases: Case[] = [
    {
      label: 'with wrong filters',
      params: [{ incorrectField: '' }],
    },
    {
      label: 'with number',
      params: [1],
    },
    {
      label: 'with null',
      params: [null],
    },
  ];

  goodCases.forEach((c) => {
    it(`works with (${c.label})`, async () => {
      await client.getExchangeTxs(c.params[0]);
      expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
    });
  });
  badCases.forEach((c) => {
    it(`fails with (${c.label})`, async () => {
      await expect(client.getExchangeTxs(c.params[0])).rejects.toBeDefined();
    });
  });
});

describe('TransferTxs endpoint: ', () => {
  type Case = { label: string; params: any[]; expectedUrl?: string };
  const goodCases: Case[] = [
    {
      label: 'single string',
      params: ['some id'],
    },
    {
      label: 'empty call',
      params: [],
    },
    {
      label: 'with one filter',
      params: [{ timeStart: '2016-01-01' }],
    },
    {
      label: 'with all filters',
      params: [
        {
          assetId: 'assetId',
          sender: 'sender',
          recipient: 'recipient',
          timeStart: '2016-02-01',
          timeEnd: '2016-03-01',
          limit: 5,
          sort: 'desc',
        },
      ],
    },
  ];
  const badCases: Case[] = [
    {
      label: 'with wrong filters',
      params: [{ incorrectField: '' }],
    },
    {
      label: 'with number',
      params: [1],
    },
    {
      label: 'with null',
      params: [null],
    },
  ];

  goodCases.forEach((c) => {
    it(`works with (${c.label})`, async () => {
      await client.getTransferTxs(c.params[0]);
      expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
    });
  });
  badCases.forEach((c) => {
    it(`fails with (${c.label})`, async () => {
      await expect(client.getTransferTxs(c.params[0])).rejects.toBeDefined();
    });
  });
});

describe('MassTransferTxs endpoint: ', () => {
  type Case = { label: string; params: any[]; expectedUrl?: string };
  const goodCases: Case[] = [
    {
      label: 'single string',
      params: ['some-tx-id'],
    },
    {
      label: 'empty call',
      params: [],
    },
    {
      label: 'with one filter',
      params: [{ sender: 'some-sender' }],
    },
    {
      label: 'with all filters',
      params: [
        {
          sender: 'sender',
          recipient: 'recipient',
          assetId: 'assetId',
          timeStart: '2016-02-01',
          timeEnd: '2016-03-01',
          limit: 5,
          sort: 'asc',
        },
      ],
    },
  ];
  const badCases: Case[] = [
    {
      label: 'with wrong filters',
      params: [{ incorrectField: '' }],
    },
    {
      label: 'with number',
      params: [1],
    },
    {
      label: 'with null',
      params: [null],
    },
  ];

  goodCases.forEach((c) => {
    it(`works with (${c.label})`, async () => {
      await client.getMassTransferTxs(c.params[0]);
      expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
    });
  });
  badCases.forEach((c) => {
    it(`fails with (${c.label})`, async () => {
      await expect(client.getMassTransferTxs(c.params[0])).rejects.toBeDefined();
    });
  });
});

describe('Constructor: ', () => {
  it('throws if no rootUrl is provided', () => {
    expect(() => new DataServiceClient({} as any)).toThrow(
      'No rootUrl was presented in options object',
    );
  });

  it('throws if rootUrl is not a valid HTTP/HTTPS URL', () => {
    expect(() => new DataServiceClient({ rootUrl: 'javascript:alert(1)' })).toThrow(
      'Invalid rootUrl',
    );
    expect(() => new DataServiceClient({ rootUrl: 'ftp://evil.com' })).toThrow('Invalid rootUrl');
    expect(() => new DataServiceClient({ rootUrl: 'not-a-url' })).toThrow('Invalid rootUrl');
  });

  it('accepts valid HTTP and HTTPS URLs', () => {
    expect(() => new DataServiceClient({ rootUrl: 'http://localhost:3000' })).not.toThrow();
    expect(() => new DataServiceClient({ rootUrl: 'https://api.example.com' })).not.toThrow();
  });

  it('applies default fetch, parse, and transform when not provided', () => {
    const instance = new DataServiceClient({ rootUrl: 'http://example.com' });
    expect(instance).toBeDefined();
    expect(instance.getAssets).toBeDefined();
    expect(instance.getPairs).toBeDefined();
    expect(instance.getCandles).toBeDefined();
    expect(instance.getExchangeTxs).toBeDefined();
    expect(instance.getTransferTxs).toBeDefined();
    expect(instance.getMassTransferTxs).toBeDefined();
    expect(instance.aliases).toBeDefined();
    expect(instance.getAssetsByTicker).toBeDefined();
  });
});

describe('Aliases getByIdList: ', () => {
  it('fetch is called with correct params', async () => {
    await client.aliases.getByIdList(['alias1', 'alias2']);
    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
  });

  it('throws if called with non-array', async () => {
    await expect((client.aliases.getByIdList as any)('not-an-array')).rejects.toBeDefined();
  });
});

describe('Pagination: ', () => {
  it('works', async () => {
    const customFetch = vi.fn(() =>
      Promise.resolve('{"__type": "list","lastCursor": "cursor", "data": [{ "data": 1 }]}'),
    );
    const customClient = new DataServiceClient({
      rootUrl: 'http://localhost',
      parse: parser,
      fetch: customFetch,
    });

    const result = await customClient.getAssets('test');
    expect(result).toHaveProperty('data');
    expect(result).not.toHaveProperty('fetchMore');

    const result2 = await customClient.getExchangeTxs({
      sort: 'asc',
      limit: 1,
    });
    expect(result2).toHaveProperty('data');
    expect(result2).toHaveProperty('fetchMore');
    const result3 = await result2.fetchMore!(1);
    expect(result3).toHaveProperty('data');
    expect(result3).toHaveProperty('fetchMore');
    expect(customFetch.mock.calls.slice(-2)).toMatchSnapshot();
  });
});

describe('Custom transformer: ', () => {
  const fetchMocks = {
    assets: JSON.stringify({
      __type: 'list',
      data: [
        {
          __type: 'asset',
          data: {},
        },
        {
          __type: 'asset',
          data: {},
        },
      ],
    }),
    pairs: JSON.stringify({
      __type: 'list',
      data: [
        {
          __type: 'pair',
          data: {},
        },
        {
          __type: 'pair',
          data: {},
        },
      ],
    }),
    candles: JSON.stringify({
      __type: 'list',
      data: [
        {
          __type: 'candle',
          data: {},
        },
        {
          __type: 'candle',
          data: {},
        },
        {
          __type: 'candle',
          data: {},
        },
      ],
    }),
  };
  const customFetchMock = (type: keyof typeof fetchMocks) =>
    vi.fn(() => Promise.resolve(fetchMocks[type]));

  it('works for list of assets', async () => {
    const transformMocks = {
      list: vi.fn((d) => d.map(customTransformer)),
      asset: vi.fn(),
      pair: vi.fn(),
    };

    const customTransformer = ({
      __type,
      data,
    }: {
      __type: keyof typeof transformMocks;
      data: any;
      [key: string]: any;
    }) => transformMocks[__type](data);

    const customClient = new DataServiceClient({
      rootUrl: 'http://localhost',
      parse: parser,
      fetch: customFetchMock('assets'),
      transform: customTransformer,
    });
    await customClient.getAssets('1', '2');
    expect(transformMocks.list).toHaveBeenCalledTimes(1);
    expect(transformMocks.asset).toHaveBeenCalledTimes(2);
    expect(transformMocks.pair).toHaveBeenCalledTimes(0);
  });

  it('works for list of candles', async () => {
    const transformMocks = {
      list: vi.fn((d) => d.map(customTransformer)),
      pair: vi.fn(),
      candle: vi.fn(),
    };

    const customTransformer = ({
      __type,
      data,
    }: {
      __type: keyof typeof transformMocks;
      data: any;
      [key: string]: any;
    }) => transformMocks[__type](data);

    const customClient = new DataServiceClient({
      rootUrl: 'http://localhost',
      parse: parser,
      fetch: customFetchMock('candles'),
      transform: customTransformer,
    });

    await customClient.getCandles('DCC', 'BTC', {
      timeStart: new Date(),
      interval: '1d',
      matcher: 'matcher',
    });
    expect(transformMocks.list).toHaveBeenCalledTimes(1);
    expect(transformMocks.candle).toHaveBeenCalledTimes(3);
    expect(transformMocks.pair).toHaveBeenCalledTimes(0);
  });
});

describe('Long params transforms into POST request', () => {
  it('works', async () => {
    const ids = new Array(300).fill(1).map(() => 'AENTt5heWujAzcw7PmGXi1ekRc7CAmNm87Q1xZMYXGLa');
    await client.getAssets(...ids);
    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
  });
  it('works for pairs', async () => {
    const pairs: AssetPair[] = new Array(300).fill(1).map(
      () =>
        new AssetPair(
          new Asset({
            id: 'DCC',
            name: 'DecentralChain',
            precision: 8,
            description: '',
            height: 0,
            sender: '',
            hasScript: false,
            reissuable: false,
            ticker: 'DCC',
            quantity: '10000000000000000',
          } as any),
          new Asset({
            id: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
            name: 'Test',
            precision: 8,
            description: '',
            height: 0,
            sender: '',
            hasScript: false,
            reissuable: false,
            quantity: '10000000000000000',
          } as any),
        ),
    );
    await client.getPairs('3PJjwFREg8F9V6Cp9fnUuEwRts6HQQa5nfP')(pairs);
    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
  });
});

describe('Security: rejection errors are proper Error objects', () => {
  it('getExchangeTxs rejects null with Error', async () => {
    await expect(client.getExchangeTxs(null as any)).rejects.toBeInstanceOf(Error);
  });

  it('getTransferTxs rejects null with Error', async () => {
    await expect(client.getTransferTxs(null as any)).rejects.toBeInstanceOf(Error);
  });

  it('getMassTransferTxs rejects null with Error', async () => {
    await expect(client.getMassTransferTxs(null as any)).rejects.toBeInstanceOf(Error);
  });

  it('getExchangeTxs rejects number with Error', async () => {
    await expect(client.getExchangeTxs(1 as any)).rejects.toBeInstanceOf(Error);
  });

  it('getCandles rejects with Error', async () => {
    await expect(client.getCandles(null as any, null as any, null as any)).rejects.toBeInstanceOf(
      Error,
    );
  });

  it('aliases.getByIdList rejects non-string items with Error', async () => {
    await expect((client.aliases.getByIdList as any)([1, 2, 3])).rejects.toBeInstanceOf(Error);
  });
});

describe('Security: URL-encodes path and query segments', () => {
  it('encodes special characters in exchange tx id', async () => {
    await client.getExchangeTxs('id/with?special#chars');
    const lastCall: any[] = fetch.mock.calls[fetch.mock.calls.length - 1] ?? [];
    expect(lastCall[0]).toContain('id%2Fwith%3Fspecial%23chars');
    expect(lastCall[0]).not.toContain('id/with?special#chars');
  });

  it('encodes special characters in transfer tx id', async () => {
    await client.getTransferTxs('id with spaces');
    const lastCall: any[] = fetch.mock.calls[fetch.mock.calls.length - 1] ?? [];
    expect(lastCall[0]).toContain('id%20with%20spaces');
  });

  it('encodes query string values properly', async () => {
    await client.getExchangeTxs({ sender: 'addr&inject=true' });
    const lastCall: any[] = fetch.mock.calls[fetch.mock.calls.length - 1] ?? [];
    expect(lastCall[0]).toContain('sender=addr%26inject%3Dtrue');
    expect(lastCall[0]).not.toContain('sender=addr&inject=true');
  });
});

describe('Security: limit and sort validation', () => {
  it('rejects negative limit', async () => {
    await expect(client.getExchangeTxs({ limit: -1 })).rejects.toBeInstanceOf(Error);
  });

  it('rejects zero limit', async () => {
    await expect(client.getExchangeTxs({ limit: 0 })).rejects.toBeInstanceOf(Error);
  });

  it('rejects non-integer limit', async () => {
    await expect(client.getExchangeTxs({ limit: 1.5 })).rejects.toBeInstanceOf(Error);
  });

  it('rejects excessively large limit', async () => {
    await expect(client.getExchangeTxs({ limit: 99999 })).rejects.toBeInstanceOf(Error);
  });

  it('rejects Infinity limit', async () => {
    await expect(client.getExchangeTxs({ limit: Infinity })).rejects.toBeInstanceOf(Error);
  });

  it('rejects NaN limit', async () => {
    await expect(client.getExchangeTxs({ limit: NaN })).rejects.toBeInstanceOf(Error);
  });

  it('rejects arbitrary sort values', async () => {
    await expect(client.getExchangeTxs({ sort: 'DROP TABLE' } as any)).rejects.toBeInstanceOf(
      Error,
    );
  });

  it('rejects sort=-some (must be asc/desc)', async () => {
    await expect(client.getExchangeTxs({ sort: '-some' } as any)).rejects.toBeInstanceOf(Error);
  });

  it('accepts valid sort=asc', async () => {
    const result = await client.getExchangeTxs({ sort: 'asc' });
    expect(result).toBeDefined();
  });

  it('accepts valid sort=desc', async () => {
    const result = await client.getExchangeTxs({ sort: 'desc' });
    expect(result).toBeDefined();
  });

  it('applies same limit validation to transfer txs', async () => {
    await expect(client.getTransferTxs({ limit: -1 })).rejects.toBeInstanceOf(Error);
  });

  it('applies same limit validation to mass transfer txs', async () => {
    await expect(client.getMassTransferTxs({ limit: -1 })).rejects.toBeInstanceOf(Error);
  });
});

describe('Security: prototype pollution protection', () => {
  it('rejects filters with __proto__ key', async () => {
    const malicious = JSON.parse('{"__proto__": {"isAdmin": true}, "sender": "x"}');
    await expect(client.getExchangeTxs(malicious)).rejects.toBeInstanceOf(Error);
  });

  it('rejects filters with constructor key', async () => {
    await expect(client.getExchangeTxs({ constructor: {} } as any)).rejects.toBeInstanceOf(Error);
  });

  it('rejects filters with prototype key', async () => {
    await expect(client.getTransferTxs({ prototype: {} } as any)).rejects.toBeInstanceOf(Error);
  });
});

describe('Security: empty input validation', () => {
  it('rejects getAssets with no arguments', async () => {
    await expect(client.getAssets()).rejects.toBeInstanceOf(Error);
  });

  it('rejects getAssets with empty string', async () => {
    await expect(client.getAssets('')).rejects.toBeInstanceOf(Error);
  });

  it('rejects getAssets with whitespace-only string', async () => {
    await expect(client.getAssets('   ')).rejects.toBeInstanceOf(Error);
  });

  it('rejects getAssetsByTicker with empty string', async () => {
    await expect(client.getAssetsByTicker('')).rejects.toBeInstanceOf(Error);
  });

  it('rejects aliases.getByIdList with empty array', async () => {
    await expect(client.aliases.getByIdList([])).rejects.toBeInstanceOf(Error);
  });

  it('rejects aliases.getByIdList with empty string items', async () => {
    await expect(client.aliases.getByIdList(['valid', ''])).rejects.toBeInstanceOf(Error);
  });
});

describe('Configuration error handling', () => {
  it('rejects when fetch option is not a function', async () => {
    const brokenClient = new DataServiceClient({
      rootUrl: 'http://localhost:3000',
      fetch: 'not-a-function' as any,
      parse: parser,
    });
    await expect(brokenClient.getAssets('testId')).rejects.toThrow(
      'Configuration error: fetch option must be a function',
    );
  });

  it('rejects when parse option is not a function', async () => {
    const brokenClient = new DataServiceClient({
      rootUrl: 'http://localhost:3000',
      fetch: vi.fn(() => Promise.resolve('{"data":[]}')),
      parse: 'not-a-function' as any,
    });
    await expect(brokenClient.getAssets('testId')).rejects.toThrow(
      'Configuration error: parse option must be a function',
    );
  });

  it('rejects when transform option is not a function', async () => {
    const brokenClient = new DataServiceClient({
      rootUrl: 'http://localhost:3000',
      fetch: vi.fn(() => Promise.resolve('{"data":[]}')),
      parse: (text: string) => JSON.parse(text),
      transform: 'not-a-function' as any,
    });
    await expect(brokenClient.getAssets('testId')).rejects.toThrow(
      'Configuration error: transform option must be a function',
    );
  });
});

describe('createRequest edge cases', () => {
  it('rejects empty methodUrl via getAssetsByTicker validation', async () => {
    await expect(client.getAssetsByTicker(undefined as any)).rejects.toThrow();
  });

  it('rejects numeric ticker', async () => {
    await expect(client.getAssetsByTicker(123 as any)).rejects.toThrow();
  });
});

describe('Candles validation edge cases', () => {
  it('rejects candles with empty asset IDs', async () => {
    await expect(
      client.getCandles('', 'priceAsset', {
        timeStart: '2024-01-01',
        interval: '1d',
        matcher: 'matcher',
      }),
    ).rejects.toBeInstanceOf(Error);
  });

  it('rejects candles with extra unknown properties', async () => {
    await expect(
      client.getCandles('amount', 'price', {
        timeStart: '2024-01-01',
        interval: '1d',
        matcher: 'matcher',
        unknownProp: true,
      } as any),
    ).rejects.toBeInstanceOf(Error);
  });

  it('rejects candles with missing required params', async () => {
    await expect(
      client.getCandles('amount', 'price', {
        timeStart: '2024-01-01',
      } as any),
    ).rejects.toBeInstanceOf(Error);
  });

  it('rejects candles with prototype pollution in params', async () => {
    await expect(
      client.getCandles(
        'amount',
        'price',
        JSON.parse('{"__proto__":{},"timeStart":"2024-01-01","interval":"1d","matcher":"m"}'),
      ),
    ).rejects.toBeInstanceOf(Error);
  });
});

describe('Pairs validation edge cases', () => {
  it('rejects pairs with empty matcher', async () => {
    await expect(client.getPairs('')([] as any)).rejects.toThrow(
      'matcher must be a non-empty string',
    );
  });

  it('rejects pairs with whitespace-only matcher', async () => {
    await expect(client.getPairs('   ')([] as any)).rejects.toThrow(
      'matcher must be a non-empty string',
    );
  });
});

describe('Transfer and mass-transfer tx edge cases', () => {
  it('getTransferTxs accepts undefined (defaults to empty filters)', async () => {
    const result = await client.getTransferTxs(undefined);
    expect(result).toHaveProperty('data');
  });

  it('getMassTransferTxs accepts empty filters', async () => {
    const result = await client.getMassTransferTxs(undefined);
    expect(result).toHaveProperty('data');
  });

  it('getTransferTxs rejects with wrong filter keys', async () => {
    await expect(client.getTransferTxs({ badKey: 'value' } as any)).rejects.toBeInstanceOf(Error);
  });

  it('getMassTransferTxs rejects with wrong filter keys', async () => {
    await expect(client.getMassTransferTxs({ badKey: 'value' } as any)).rejects.toBeInstanceOf(
      Error,
    );
  });

  it('getTransferTxs rejects invalid limit', async () => {
    await expect(client.getTransferTxs({ limit: -5 })).rejects.toBeInstanceOf(Error);
  });

  it('getMassTransferTxs rejects invalid sort', async () => {
    await expect(client.getMassTransferTxs({ sort: 'INVALID' } as any)).rejects.toBeInstanceOf(
      Error,
    );
  });
});
