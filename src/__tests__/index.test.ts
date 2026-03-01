const parser = require('parse-json-bignumber')();
import DataServiceClient from '../index';
import { AssetPair, Asset } from '@decentralchain/data-entities';

const fetch = jest.fn(() => Promise.resolve('{"data":[{ "data": 1 }]}'));
const NODE_URL = 'NODE_URL';
const MATCHER = '3PJjwFREg8F9V6Cp9fnUuEwRts6HQQa5nfP';
const client = new DataServiceClient({
  rootUrl: NODE_URL,
  parse: parser,
  fetch,
});

describe('Asssets endpoint: ', () => {
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
    const ids = [];
    await client.getAssets(...ids);

    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
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
      wrongTypes.map(async t =>
        await expect(client.getAssets(t)).rejects.toBeDefined()
      )
    );
  });
});

describe('Pairs endpoint: ', () => {
  it('fetch is called with correct params#1', async () => {
    const pair1 = new AssetPair(
      'DCC' as any,
      '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS' as any
    );
    const pair2 = new AssetPair(
      'DCC' as any,
      '474jTeYx2r2Va35794tCScAXWJG9hU2HcgxzMowaZUnu' as any
    );
    await client.getPairs('3PJjwFREg8F9V6Cp9fnUuEwRts6HQQa5nfP')([
      pair1,
      pair2,
    ]);
    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
  });

  it('fetch is called with correct params#2', async () => {
    const pairs = [];
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
        async t =>
          await expect(
            client.getPairs('3PJjwFREg8F9V6Cp9fnUuEwRts6HQQa5nfP')(t)
          ).rejects.toBeDefined()
      )
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
      wrongTypes.map(async t => {
        await expect(client.aliases.getByAddress(t)).rejects.toBeDefined();
        await expect(client.aliases.getById(t)).rejects.toBeDefined();
      })
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
      wrongTypes.map(async t => {
        await expect(client.getCandles(null, null, null)).rejects.toBeDefined();
        await expect(client.getCandles(null, null, t)).rejects.toBeDefined();
      })
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
          sort: '-some',
        },
      ],
      expectedUrl: `${NODE_URL}/transactions/exchange?timeStart=2016-02-01&timeEnd=2016-03-01&matcher=matcher&sender=sender&amountAsset=asset1&priceAsset=priceAsset&limit=5&sort=-some`,
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

  goodCases.forEach((c, i) => {
    it(`works with (${c.label})`, async () => {
      const result = await client.getExchangeTxs(c.params[0]);
      expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
    });
  });
  badCases.forEach((c, i) => {
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
          sort: '-some',
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

  goodCases.forEach((c, i) => {
    it(`works with (${c.label})`, async () => {
      const result = await client.getTransferTxs(c.params[0]);
      expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
    });
  });
  badCases.forEach((c, i) => {
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
      'No rootUrl was presented in options object'
    );
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
    await expect(
      (client.aliases.getByIdList as any)('not-an-array')
    ).rejects.toBeDefined();
  });
});

describe('Pagination: ', () => {
  it('works', async () => {
    const customFetch = jest.fn(() =>
      Promise.resolve(
        '{"__type": "list","lastCursor": "cursor", "data": [{ "data": 1 }]}'
      )
    );
    const customClient = new DataServiceClient({
      rootUrl: NODE_URL,
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
    const result3 = await result2.fetchMore(1);
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
  const customFetchMock = type =>
    jest.fn(() => Promise.resolve(fetchMocks[type]));

  it('works for list of assets', async () => {
    const transformMocks = {
      list: jest.fn(d => d.map(customTransformer)),
      asset: jest.fn(),
      pair: jest.fn(),
    };

    const customTransformer = ({ __type, data, ...etc }) =>
      transformMocks[__type](data);

    const customClient = new DataServiceClient({
      rootUrl: NODE_URL,
      parse: parser,
      fetch: customFetchMock('assets'),
      transform: customTransformer,
    });
    const assets = await customClient.getAssets('1', '2');
    expect(transformMocks.list).toHaveBeenCalledTimes(1);
    expect(transformMocks.asset).toHaveBeenCalledTimes(2);
    expect(transformMocks.pair).toHaveBeenCalledTimes(0);
  });

  it('works for list of candles', async () => {
    const transformMocks = {
      list: jest.fn(d => d.map(customTransformer)),
      pair: jest.fn(),
      candle: jest.fn(),
    };

    const customTransformer = ({ __type, data, ...etc }) =>
      transformMocks[__type](data);

    const customClient = new DataServiceClient({
      rootUrl: NODE_URL,
      parse: parser,
      fetch: customFetchMock('candles'),
      transform: customTransformer,
    });

    const candles = await customClient.getCandles('DCC', 'BTC', {
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
    const ids = new Array(300)
      .fill(1)
      .map(() => 'AENTt5heWujAzcw7PmGXi1ekRc7CAmNm87Q1xZMYXGLa');
    await client.getAssets(...ids);
    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
  });
  it('works for pairs', async () => {
    const pairs = new Array(300).fill(1).map(
      () =>
        new AssetPair(
          new Asset({ id: 'DCC' } as any),
          new Asset({
            id: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
          } as any)
        )
    );
    await client.getPairs('3PJjwFREg8F9V6Cp9fnUuEwRts6HQQa5nfP')(pairs);
    expect(fetch.mock.calls.slice().pop()).toMatchSnapshot();
  });
});

describe('Security: rejection errors are proper Error objects', () => {
  it('getExchangeTxs rejects null with Error', async () => {
    await expect(client.getExchangeTxs(null)).rejects.toBeInstanceOf(Error);
  });

  it('getTransferTxs rejects null with Error', async () => {
    await expect(client.getTransferTxs(null)).rejects.toBeInstanceOf(Error);
  });

  it('getMassTransferTxs rejects null with Error', async () => {
    await expect(client.getMassTransferTxs(null)).rejects.toBeInstanceOf(Error);
  });

  it('getExchangeTxs rejects number with Error', async () => {
    await expect(client.getExchangeTxs(1 as any)).rejects.toBeInstanceOf(Error);
  });

  it('getCandles rejects with Error', async () => {
    await expect(client.getCandles(null, null, null)).rejects.toBeInstanceOf(Error);
  });

  it('aliases.getByIdList rejects non-string items with Error', async () => {
    await expect(
      (client.aliases.getByIdList as any)([1, 2, 3])
    ).rejects.toBeInstanceOf(Error);
  });
});

describe('Security: URL-encodes path and query segments', () => {
  it('encodes special characters in exchange tx id', async () => {
    await client.getExchangeTxs('id/with?special#chars');
    const lastCall: any[] = fetch.mock.calls[fetch.mock.calls.length - 1];
    expect(lastCall[0]).toContain('id%2Fwith%3Fspecial%23chars');
    expect(lastCall[0]).not.toContain('id/with?special#chars');
  });

  it('encodes special characters in transfer tx id', async () => {
    await client.getTransferTxs('id with spaces');
    const lastCall: any[] = fetch.mock.calls[fetch.mock.calls.length - 1];
    expect(lastCall[0]).toContain('id%20with%20spaces');
  });

  it('encodes query string values properly', async () => {
    await client.getExchangeTxs({ sender: 'addr&inject=true' });
    const lastCall: any[] = fetch.mock.calls[fetch.mock.calls.length - 1];
    expect(lastCall[0]).toContain('sender=addr%26inject%3Dtrue');
    expect(lastCall[0]).not.toContain('sender=addr&inject=true');
  });
});
