import { waitTime } from './utils';

export const NETWORK_BYTE = 68; // 'D' for DecentralChain
export const NODE_URL = 'https://nodes.decentralchain.io';
export const MOCK_URL = 'https://mock.com';

/**
 * Test-only master account seed for unit tests.
 */
export const MASTER_ACCOUNT_SEED = 'some master account seed for testing purposes';

export const ACCOUNTS = {
  NODE: {
    seed: 'some node mainer seed',
  },
  SIMPLE: {
    seed: 'some simple account seed',
  },
  SMART: {
    seed: 'some smart contract seed',
  },
};

export const SMART_ASSET_SCRIPT = `base64:BAbMtW/U`;

const makeResponse = (ok: boolean, data: unknown) => ({
  json: () => Promise.resolve(data),
  ok,
  text: () => Promise.resolve(JSON.stringify(data)),
});

// Capture the original fetch before overwriting so non-mock requests
// don't recurse into the mock handler.
const _originalFetch = globalThis.fetch;

type Fetch = typeof globalThis.fetch;

const f: Fetch = ((url: string | URL | Request, options?: RequestInit) => {
  const urlStr = typeof url === 'string' ? url : url instanceof URL ? url.href : url.url;

  if (!urlStr.includes(MOCK_URL)) {
    return _originalFetch(url, options);
  }

  console.warn(`Request ${urlStr}, options: ${JSON.stringify(options, null, 4)}`);

  return waitTime(100).then(() => {
    const path = urlStr.replace(MOCK_URL, '');

    if (path === '/blocks/headers/last') {
      return makeResponse(true, {
        blocksize: 12134,
        desiredReward: -1,
        features: [],
        generator: '3PMj3yGPBEa1Sx9X4TSBFeJCMMaE3wvKR4N',
        generatorPublicKey: 'BDjPpGYcC8ANJSPX7xgprPpp9nioWK6Qpw9PjbekXxav',
        height: 2362163,
        id: 'HUgEdXjzh9eRmmCMbDCUArybD9xTujLu5pHsBiWgMvLS',
        'nxt-consensus': {
          'base-target': 65,
          'generation-signature':
            '3ePCDAcp4gwu4Ean62Gadq1b8cfiyPS4HcjkNCcbqtnstkgmMxcACy5xKXtvmE8cvuxYCP5up5ySTwBxLEYpdDGxRyS2G39uAKRPk9L7UkhT2NrxgBAp4sFUdKSJCnDVdGN',
        },
        reference: 'FJTPjM4xdnA9UHzzAvJiQrukQXhLdUqcuGCAHyAG9byv',
        reward: 600000000,
        signature:
          '5voKYmNf446S1vjxNi755kpz96dL4JW5csmpKaLrNGg1uKcvFVVDMoFF4cQL3ko71MRHnW5YUTwcZmLb8XFqfjqL',
        timestamp: 1607356839244,
        totalFee: 6700000,
        transactionCount: 19,
        transactionsRoot: 'F29m1msUptvkURdGMfKh5vn4mWcXZ26AjT7rQvEs9G93',
        VRF: 'FW4nZFpq4odLoiuN6ndGNk3w1mEvvJ2zHhv9p3tgyGgZ',
        version: 5,
      });
    }

    if (path === '/transactions/broadcast') {
      return makeResponse(true, JSON.parse(options?.body as string));
    }

    // GET /addresses/balance/details/{address}
    if (path.startsWith('/addresses/balance/details/')) {
      const addr = path.replace('/addresses/balance/details/', '');
      return makeResponse(true, {
        address: addr,
        available: 0,
        effective: 0,
        generating: 0,
        regular: 0,
      });
    }

    // GET /assets/balance/{address}
    if (path.startsWith('/assets/balance/')) {
      const addr = path.replace('/assets/balance/', '');
      return makeResponse(true, {
        address: addr,
        balances: [],
      });
    }

    // GET /assets/details (or /assets/details?id=...)
    if (path.startsWith('/assets/details')) {
      return makeResponse(true, []);
    }

    return makeResponse(false, { error: 'Not found' });
  });
}) as Fetch;

(globalThis as Record<string, unknown>).fetch = f;
