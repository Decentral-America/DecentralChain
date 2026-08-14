/**
 * Unit tests for MessageController - the wallet-extension's signing/auth
 * message handler (previously had zero test coverage). Written as the safety
 * net before extracting #generateMessageTx into its own module (see
 * buildTransaction.ts) - every switch branch that module covers is exercised
 * here first, through the real public API (newMessage/approve), with the
 * exact same fixtures re-used after the extraction to prove no behavioral
 * change.
 *
 * Collaborators (wallet/network/assetInfo/remoteConfig/extensionStorage) are
 * hand-rolled duck-typed doubles, not the real classes - those have their own
 * heavy dependencies (chrome.storage, real HTTP, Ledger transport) that don't
 * belong in a unit test for this controller's own logic.
 *
 * Run with:
 *   pnpm nx run cubensis-connect:test:unit
 */
import { base58Encode } from '@decentralchain/crypto';
import { TRANSACTION_TYPE } from '@decentralchain/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AssetDetail, AssetsRecord } from '#assets/types';
import type { MessageInput, MessageInputOfType, MessageOfType } from '../messages/types';
import type { PreferencesAccount } from '../preferences/types';

vi.mock('webextension-polyfill', () => ({
  default: {
    alarms: {
      create: vi.fn(),
      onAlarm: { addListener: vi.fn() },
    },
  },
}));

vi.mock('../sentry/init', () => ({
  captureException: vi.fn(),
}));

const { MessageController } = await import('./message');

function makeAsset(overrides: Partial<AssetDetail> = {}): AssetDetail {
  return {
    description: '',
    displayName: 'Decentral Coin',
    height: 1,
    id: 'DCC',
    issuer: '',
    name: 'DCC',
    precision: 8,
    quantity: '0',
    reissuable: false,
    sender: '',
    timestamp: new Date(0),
    ...overrides,
  };
}

const assets: AssetsRecord = {
  DCC: makeAsset(),
  SecondAsset1: makeAsset({ displayName: 'Other Token', hasScript: false, id: 'SecondAsset1' }),
};

const account: PreferencesAccount = {
  address: '31VMNVAvVh67dPZ41nMnYZvhoZFW7wwPrmq',
  name: 'Test account',
  network: 'testnet',
  networkCode: 'T',
  publicKey: '9Qpg2xw6BQxbBQ7fV3z9pCGnUXHkAnu99g8b9jRVpUXm',
  type: 'seed',
};

const FIXED_SIGNATURE = new Uint8Array(64).fill(7);

function makeWalletController() {
  const wallet = {
    createSharedKey: vi.fn().mockResolvedValue(new Uint8Array(32).fill(9)),
    signAuth: vi.fn().mockResolvedValue(FIXED_SIGNATURE),
    signCancelOrder: vi.fn().mockResolvedValue(FIXED_SIGNATURE),
    signCustomData: vi.fn().mockResolvedValue(FIXED_SIGNATURE),
    signDccAuth: vi.fn().mockResolvedValue(FIXED_SIGNATURE),
    signOrder: vi.fn().mockResolvedValue(FIXED_SIGNATURE),
    signRequest: vi.fn().mockResolvedValue(FIXED_SIGNATURE),
    signTx: vi.fn().mockResolvedValue(FIXED_SIGNATURE),
  };

  return { getWallet: vi.fn().mockReturnValue(wallet), wallet };
}

function makeNetworkController() {
  return {
    broadcastCancelOrder: vi.fn().mockResolvedValue({ broadcast: 'cancelOrder' }),
    broadcastOrder: vi.fn().mockResolvedValue({ broadcast: 'order' }),
    broadcastTransaction: vi.fn().mockResolvedValue({ broadcast: 'transaction' }),
    getMatcherPublicKey: vi.fn().mockResolvedValue('MatcherPubKey9x'),
    getNetworkCode: vi.fn().mockReturnValue('T'),
    getNode: vi.fn().mockReturnValue('https://testnet-node.example'),
  };
}

function makeAssetInfoController() {
  return {
    getAssets: vi.fn().mockReturnValue(assets),
    getUsdPrices: vi.fn().mockReturnValue({}),
    updateAssets: vi.fn().mockResolvedValue(undefined),
  };
}

function makeRemoteConfigController() {
  return {
    getMessagesConfig: vi.fn().mockReturnValue({
      message_expiration_ms: 24 * 60 * 60 * 1000,
      update_messages_ms: 60 * 60 * 1000,
    }),
    getPackConfig: vi.fn().mockReturnValue({
      allow_tx: [TRANSACTION_TYPE.TRANSFER, TRANSACTION_TYPE.DATA],
      max: 100,
    }),
  };
}

function makeExtensionStorage() {
  return {
    getInitState: vi.fn().mockReturnValue({ messages: [] }),
    subscribe: vi.fn(),
  };
}

function makeController() {
  const walletController = makeWalletController();
  const networkController = makeNetworkController();
  const assetInfoController = makeAssetInfoController();
  const remoteConfigController = makeRemoteConfigController();
  const extensionStorage = makeExtensionStorage();
  const setPermission = vi.fn();
  const getAccountBalance = vi.fn().mockReturnValue({
    assets: {
      DCC: { balance: '100000000000', minSponsoredAssetFee: null, sponsorBalance: '0' },
      SecondAsset1: { balance: '100000000000', minSponsoredAssetFee: null, sponsorBalance: '0' },
    },
  });

  // biome-ignore lint/suspicious/noExplicitAny: duck-typed test doubles, not the real controller classes
  const controller = new MessageController({
    assetInfoController: assetInfoController as any,
    extensionStorage: extensionStorage as any,
    getAccountBalance,
    networkController: networkController as any,
    remoteConfigController: remoteConfigController as any,
    setPermission,
    walletController: walletController as any,
  });

  return {
    controller,
    getAccountBalance,
    networkController,
    setPermission,
    wallet: walletController.wallet,
  };
}

async function approveAndGet<T extends MessageInput['type']>(
  controller: InstanceType<typeof MessageController>,
  input: MessageInputOfType<T>,
): Promise<MessageOfType<T>> {
  const message = await controller.newMessage(input);
  return (await controller.approve(message.id)) as MessageOfType<T>;
}

describe('MessageController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('auth messages', () => {
    it('signs an auth request and encodes the result', async () => {
      const { controller, wallet } = makeController();

      const result = await approveAndGet(controller, {
        account,
        data: { data: 'some auth data', host: 'example.com' },
        type: 'auth',
      });

      expect(wallet.signAuth).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('signed');
      if (result.status !== 'signed' || typeof result.result !== 'object') throw new Error();
      expect(result.result.signature).toBe(base58Encode(FIXED_SIGNATURE));
      expect(result.result.address).toBe(account.address);
    });

    it('opens a new tab with signature params when successPath is set', async () => {
      const { controller } = makeController();
      const openTab = vi.fn();
      controller.on('Open new tab', openTab);

      await approveAndGet(controller, {
        account,
        data: {
          data: 'some auth data',
          host: 'example.com',
          successPath: 'https://example.com/callback',
        },
        type: 'auth',
      });

      expect(openTab).toHaveBeenCalledTimes(1);
      const [url] = openTab.mock.calls[0] as [string];
      expect(url).toContain('https://example.com/callback');
      expect(url).toContain('s=');
      expect(url).toContain('a=');
    });
  });

  it('authOrigin: approves permission and marks signed without any wallet call', async () => {
    const { controller, setPermission, wallet } = makeController();

    const result = await approveAndGet(controller, {
      account,
      data: { origin: 'example.com' },
      origin: 'example.com',
      type: 'authOrigin',
    });

    expect(setPermission).toHaveBeenCalledWith('example.com', 'approved');
    expect(result.result).toEqual({ approved: 'OK' });
    expect(wallet.signAuth).not.toHaveBeenCalled();
  });

  describe('cancelOrder', () => {
    it('signs without broadcasting when broadcast is false', async () => {
      const { controller, wallet, networkController } = makeController();

      const result = await approveAndGet(controller, {
        account,
        broadcast: false,
        data: {
          amountAsset: 'DCC',
          data: { id: 'orderid1' },
          priceAsset: 'SecondAsset1',
        },
        type: 'cancelOrder',
      });

      expect(wallet.signCancelOrder).toHaveBeenCalledTimes(1);
      expect(networkController.broadcastCancelOrder).not.toHaveBeenCalled();
      expect(result.status).toBe('signed');
    });

    it('signs and broadcasts when broadcast is true', async () => {
      const { controller, networkController } = makeController();

      const result = await approveAndGet(controller, {
        account,
        broadcast: true,
        data: {
          amountAsset: 'DCC',
          data: { id: 'orderid2' },
          priceAsset: 'SecondAsset1',
        },
        type: 'cancelOrder',
      });

      expect(networkController.broadcastCancelOrder).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('published');
    });
  });

  it('customData: signs and includes a content hash', async () => {
    const { controller, wallet } = makeController();

    const result = await approveAndGet(controller, {
      account,
      data: { binary: 'base64:AAAA', version: 1 },
      type: 'customData',
    });

    expect(wallet.signCustomData).toHaveBeenCalledTimes(1);
    expect(result.status).toBe('signed');
    if (typeof result.result !== 'object') throw new Error();
    expect(result.result.signature).toBe(base58Encode(FIXED_SIGNATURE));
  });

  describe('order', () => {
    function orderInput(broadcast: boolean) {
      return {
        account,
        broadcast,
        data: {
          data: {
            amount: { assetId: 'DCC', coins: 100_000_000 },
            expiration: Date.now() + 60_000,
            matcherFee: { assetId: 'DCC', coins: 3_000_000 },
            orderType: 'buy' as const,
            price: { assetId: 'SecondAsset1', coins: 50_000_000 },
          },
        },
        type: 'order' as const,
      };
    }

    it('rejects a non-positive amount before ever touching the wallet', async () => {
      const { controller, wallet } = makeController();
      const input = orderInput(false);
      input.data.data.amount = { assetId: 'DCC', coins: 0 };

      await expect(controller.newMessage(input)).rejects.toThrow();
      expect(wallet.signOrder).not.toHaveBeenCalled();
    });

    it('signs without broadcasting', async () => {
      const { controller, wallet, networkController } = makeController();

      const result = await approveAndGet(controller, orderInput(false));

      expect(wallet.signOrder).toHaveBeenCalledTimes(1);
      expect(networkController.broadcastOrder).not.toHaveBeenCalled();
      expect(result.status).toBe('signed');
    });

    it('signs and broadcasts', async () => {
      const { controller, networkController } = makeController();

      const result = await approveAndGet(controller, orderInput(true));

      expect(networkController.broadcastOrder).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('published');
    });
  });

  it('request: signs and base58-encodes the raw signature as the result', async () => {
    const { controller, wallet } = makeController();

    const result = await approveAndGet(controller, {
      account,
      data: { data: {} },
      type: 'request',
    });

    expect(wallet.signRequest).toHaveBeenCalledTimes(1);
    expect(result.result).toBe(base58Encode(FIXED_SIGNATURE));
  });

  it('dccAuth: signs and includes address + hash', async () => {
    const { controller, wallet } = makeController();

    const result = await approveAndGet(controller, {
      account,
      data: { timestamp: Date.now() },
      type: 'dccAuth',
    });

    expect(wallet.signDccAuth).toHaveBeenCalledTimes(1);
    if (typeof result.result !== 'object') throw new Error();
    expect(result.result.address).toBe(account.address);
    expect(result.result.signature).toBe(base58Encode(FIXED_SIGNATURE));
  });

  it('getKEK: derives a shared key only after explicit approval', async () => {
    const { controller, wallet } = makeController();

    const message = await controller.newMessage({
      account,
      data: { prefix: 'p', publicKey: 'someDappPublicKey' },
      type: 'getKEK',
    });
    expect(wallet.createSharedKey).not.toHaveBeenCalled();

    const result = await controller.approve(message.id);
    expect(wallet.createSharedKey).toHaveBeenCalledWith('someDappPublicKey');
    expect(result.result).toBe(base58Encode(new Uint8Array(32).fill(9)));
  });

  describe('transactionPackage', () => {
    it('rejects when a disallowed tx type is included', async () => {
      const { controller } = makeController();

      await expect(
        controller.newMessage({
          account,
          data: [
            {
              data: {
                amount: { assetId: 'DCC', coins: 100_000_000 },
                fee: { assetId: 'DCC', coins: 100_000 },
                recipient: '31LQd8WcvtYXMjHzNKzRrgZy8P3NnLQvPnk',
              },
              type: TRANSACTION_TYPE.TRANSFER,
            },
            {
              data: {
                description: 'x',
                name: 'x',
                precision: 0,
                quantity: 1,
                reissuable: false,
              },
              type: TRANSACTION_TYPE.ISSUE,
            },
          ],
          type: 'transactionPackage',
        }),
      ).rejects.toThrow();
    });

    it('signs every transaction in an allowed package', async () => {
      const { controller, wallet } = makeController();

      const message = await controller.newMessage({
        account,
        data: [
          {
            data: {
              amount: { assetId: 'DCC', coins: 100_000_000 },
              fee: { assetId: 'DCC', coins: 100_000 },
              recipient: '31LQd8WcvtYXMjHzNKzRrgZy8P3NnLQvPnk',
            },
            type: TRANSACTION_TYPE.TRANSFER,
          },
          {
            data: {
              data: [{ key: 'k', type: 'boolean', value: true }],
              fee: { assetId: 'DCC', coins: 100_000 },
            },
            type: TRANSACTION_TYPE.DATA,
          },
        ],
        type: 'transactionPackage',
      });

      const result = await controller.approve(message.id);
      expect(wallet.signTx).toHaveBeenCalledTimes(2);
      expect(result.status).toBe('signed');
      expect(Array.isArray(result.result)).toBe(true);
    });
  });

  describe('transaction: per-type field building via #generateMessageTx', () => {
    it('ISSUE: builds tx fields and signs', async () => {
      const { controller, wallet } = makeController();

      const result = await approveAndGet(controller, {
        account,
        broadcast: false,
        data: {
          data: {
            description: 'A token',
            fee: { assetId: 'DCC', coins: 100_000_000 },
            name: 'MyToken',
            precision: 2,
            quantity: 1000,
            reissuable: true,
          },
          type: TRANSACTION_TYPE.ISSUE,
        },
        type: 'transaction',
      });

      expect(wallet.signTx).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('signed');
      expect(result.data.type).toBe(TRANSACTION_TYPE.ISSUE);
    });

    it('ISSUE: rejects invalid precision', async () => {
      const { controller } = makeController();

      await expect(
        controller.newMessage({
          account,
          broadcast: false,
          data: {
            data: {
              description: 'A token',
              fee: { assetId: 'DCC', coins: 100_000_000 },
              name: 'MyToken',
              // deliberately out of AssetDecimals' 0-8 range - tests the runtime
              // guard against untrusted external (dApp postMessage) input, which
              // TypeScript's own type wouldn't allow a caller to construct
              // biome-ignore lint/suspicious/noExplicitAny: see above
              precision: 9 as any,
              quantity: 1000,
              reissuable: true,
            },
            type: TRANSACTION_TYPE.ISSUE,
          },
          type: 'transaction',
        }),
      ).rejects.toThrow();
    });

    it('TRANSFER: resolves recipient, amount, and broadcasts', async () => {
      const { controller, networkController } = makeController();

      const result = await approveAndGet(controller, {
        account,
        broadcast: true,
        data: {
          data: {
            amount: { assetId: 'DCC', coins: 5_000_000_00 },
            fee: { assetId: 'DCC', coins: 100_000 },
            recipient: '31LQd8WcvtYXMjHzNKzRrgZy8P3NnLQvPnk',
          },
          type: TRANSACTION_TYPE.TRANSFER,
        },
        type: 'transaction',
      });

      expect(networkController.broadcastTransaction).toHaveBeenCalledTimes(1);
      expect(result.status).toBe('published');
      if (result.data.type !== TRANSACTION_TYPE.TRANSFER) throw new Error();
      expect(result.data.recipient).toBe('31LQd8WcvtYXMjHzNKzRrgZy8P3NnLQvPnk');
    });

    it('TRANSFER: rejects a non-positive amount', async () => {
      const { controller } = makeController();

      await expect(
        controller.newMessage({
          account,
          broadcast: false,
          data: {
            data: {
              amount: { assetId: 'DCC', coins: 0 },
              fee: { assetId: 'DCC', coins: 100_000 },
              recipient: '31LQd8WcvtYXMjHzNKzRrgZy8P3NnLQvPnk',
            },
            type: TRANSACTION_TYPE.TRANSFER,
          },
          type: 'transaction',
        }),
      ).rejects.toThrow();
    });

    it('REISSUE: builds tx fields via the assetId+quantity input shape', async () => {
      const { controller } = makeController();

      const result = await approveAndGet(controller, {
        account,
        broadcast: false,
        data: {
          data: {
            assetId: 'SecondAsset1',
            fee: { assetId: 'DCC', coins: 100_000 },
            quantity: 500,
            reissuable: false,
          },
          type: TRANSACTION_TYPE.REISSUE,
        },
        type: 'transaction',
      });

      expect(result.status).toBe('signed');
      if (result.data.type !== TRANSACTION_TYPE.REISSUE) throw new Error();
      expect(result.data.assetId).toBe('SecondAsset1');
      expect(result.data.quantity).toBe(500);
    });

    it('BURN: builds tx fields via the assetId+amount input shape', async () => {
      const { controller } = makeController();

      const result = await approveAndGet(controller, {
        account,
        broadcast: false,
        data: {
          data: {
            amount: 100,
            assetId: 'SecondAsset1',
            fee: { assetId: 'DCC', coins: 100_000 },
          },
          type: TRANSACTION_TYPE.BURN,
        },
        type: 'transaction',
      });

      expect(result.status).toBe('signed');
      if (result.data.type !== TRANSACTION_TYPE.BURN) throw new Error();
      expect(result.data.amount).toBe(100);
    });

    it('LEASE: builds tx fields with a resolved recipient', async () => {
      const { controller } = makeController();

      const result = await approveAndGet(controller, {
        account,
        broadcast: false,
        data: {
          data: {
            amount: { assetId: 'DCC', coins: 100_000_000 },
            fee: { assetId: 'DCC', coins: 100_000 },
            recipient: '31LQd8WcvtYXMjHzNKzRrgZy8P3NnLQvPnk',
          },
          type: TRANSACTION_TYPE.LEASE,
        },
        type: 'transaction',
      });

      expect(result.status).toBe('signed');
      expect(result.data.type).toBe(TRANSACTION_TYPE.LEASE);
    });

    it('CANCEL_LEASE: fetches the lease from the node before building the tx', async () => {
      const { controller } = makeController();
      const fetchMock = vi.fn().mockResolvedValue({
        json: async () => ({ id: 'myRef1x', recipient: 'x', sender: 'y' }),
        ok: true,
      });
      vi.stubGlobal('fetch', fetchMock);

      try {
        const result = await approveAndGet(controller, {
          account,
          broadcast: false,
          data: {
            data: {
              fee: { assetId: 'DCC', coins: 100_000 },
              leaseId: 'myRef1x',
            },
            type: TRANSACTION_TYPE.CANCEL_LEASE,
          },
          type: 'transaction',
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(result.status).toBe('signed');
        if (result.data.type !== TRANSACTION_TYPE.CANCEL_LEASE) throw new Error();
        expect(result.data.lease).toEqual({ id: 'myRef1x', recipient: 'x', sender: 'y' });
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('CANCEL_LEASE: surfaces a clear error when the node lookup fails', async () => {
      const { controller } = makeController();
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({ ok: false, text: async () => 'not found' }),
      );

      try {
        await expect(
          controller.newMessage({
            account,
            broadcast: false,
            data: {
              data: {
                fee: { assetId: 'DCC', coins: 100_000 },
                leaseId: 'missing-lease',
              },
              type: TRANSACTION_TYPE.CANCEL_LEASE,
            },
            type: 'transaction',
          }),
        ).rejects.toThrow(/Could not fetch lease transaction/);
      } finally {
        vi.unstubAllGlobals();
      }
    });

    it('ALIAS: builds tx fields', async () => {
      const { controller } = makeController();

      const result = await approveAndGet(controller, {
        account,
        broadcast: false,
        data: {
          data: { alias: 'my-alias', fee: { assetId: 'DCC', coins: 100_000 } },
          type: TRANSACTION_TYPE.ALIAS,
        },
        type: 'transaction',
      });

      expect(result.status).toBe('signed');
      if (result.data.type !== TRANSACTION_TYPE.ALIAS) throw new Error();
      expect(result.data.alias).toBe('my-alias');
    });

    it('MASS_TRANSFER: resolves every recipient and amount', async () => {
      const { controller } = makeController();

      const result = await approveAndGet(controller, {
        account,
        broadcast: false,
        data: {
          data: {
            fee: { assetId: 'DCC', coins: 200_000 },
            totalAmount: { assetId: 'DCC' },
            transfers: [
              {
                amount: { assetId: 'DCC', coins: 1_000_000 },
                recipient: '31LQd8WcvtYXMjHzNKzRrgZy8P3NnLQvPnk',
              },
              { amount: 500_000, recipient: '31PmKNdHAU5sZbtg8TrzKh8WfE7E8xBc9WD' },
            ],
          },
          type: TRANSACTION_TYPE.MASS_TRANSFER,
        },
        type: 'transaction',
      });

      expect(result.status).toBe('signed');
      if (result.data.type !== TRANSACTION_TYPE.MASS_TRANSFER) throw new Error();
      expect(result.data.transfers).toHaveLength(2);
      expect(result.data.transfers[0]?.amount).toBe('1000000');
      expect(result.data.transfers[1]?.amount).toBe(500_000);
    });

    it('MASS_TRANSFER: rejects when any transfer amount is non-positive', async () => {
      const { controller } = makeController();

      await expect(
        controller.newMessage({
          account,
          broadcast: false,
          data: {
            data: {
              fee: { assetId: 'DCC', coins: 200_000 },
              totalAmount: { assetId: 'DCC' },
              transfers: [{ amount: 0, recipient: '31LQd8WcvtYXMjHzNKzRrgZy8P3NnLQvPnk' }],
            },
            type: TRANSACTION_TYPE.MASS_TRANSFER,
          },
          type: 'transaction',
        }),
      ).rejects.toThrow();
    });

    it('DATA: validates integer entries and builds the tx', async () => {
      const { controller } = makeController();

      const result = await approveAndGet(controller, {
        account,
        broadcast: false,
        data: {
          data: {
            data: [
              { key: 'k1', type: 'integer', value: 42 },
              { key: 'k2', type: 'string', value: 'v' },
            ],
            fee: { assetId: 'DCC', coins: 100_000 },
          },
          type: TRANSACTION_TYPE.DATA,
        },
        type: 'transaction',
      });

      expect(result.status).toBe('signed');
      expect(result.data.type).toBe(TRANSACTION_TYPE.DATA);
    });

    it('DATA: rejects a non-integer value for an integer entry', async () => {
      const { controller } = makeController();

      await expect(
        controller.newMessage({
          account,
          broadcast: false,
          data: {
            data: {
              data: [{ key: 'k1', type: 'integer', value: 'not-an-integer' }],
              fee: { assetId: 'DCC', coins: 100_000 },
            },
            type: TRANSACTION_TYPE.DATA,
          },
          type: 'transaction',
        }),
        // Real current behavior: BigNumber's constructor throws synchronously on a
        // non-numeric string, and #generateMessageTx doesn't catch it before the
        // intended "must be a string or number representing an integer" check -
        // so the actual, less friendly BigNumber error is what a caller gets today.
      ).rejects.toThrow(/Not a number/);
    });

    it('SET_SCRIPT: builds the tx with a null script', async () => {
      const { controller } = makeController();

      const result = await approveAndGet(controller, {
        account,
        broadcast: false,
        data: {
          data: { fee: { assetId: 'DCC', coins: 100_000 } },
          type: TRANSACTION_TYPE.SET_SCRIPT,
        },
        type: 'transaction',
      });

      expect(result.status).toBe('signed');
      if (result.data.type !== TRANSACTION_TYPE.SET_SCRIPT) throw new Error();
      expect(result.data.script).toBeNull();
    });

    it('SPONSORSHIP: builds the tx and treats a zero fee as disabling sponsorship (null)', async () => {
      const { controller } = makeController();

      const result = await approveAndGet(controller, {
        account,
        broadcast: false,
        data: {
          data: {
            fee: { assetId: 'DCC', coins: 100_000 },
            minSponsoredAssetFee: { assetId: 'SecondAsset1', coins: 0 },
          },
          type: TRANSACTION_TYPE.SPONSORSHIP,
        },
        type: 'transaction',
      });

      expect(result.status).toBe('signed');
      if (result.data.type !== TRANSACTION_TYPE.SPONSORSHIP) throw new Error();
      expect(result.data.minSponsoredAssetFee).toBeNull();
    });

    it('SPONSORSHIP: rejects a non-string assetId', async () => {
      const { controller } = makeController();

      await expect(
        controller.newMessage({
          account,
          broadcast: false,
          data: {
            data: {
              fee: { assetId: 'DCC', coins: 100_000 },
              // biome-ignore lint/suspicious/noExplicitAny: deliberately malformed to test the runtime guard
              minSponsoredAssetFee: { assetId: 123 as any, coins: 0 },
            },
            type: TRANSACTION_TYPE.SPONSORSHIP,
          },
          type: 'transaction',
        }),
      ).rejects.toThrow();
    });

    it('SET_ASSET_SCRIPT: builds the tx', async () => {
      const { controller } = makeController();

      const result = await approveAndGet(controller, {
        account,
        broadcast: false,
        data: {
          data: {
            assetId: 'SecondAsset1',
            fee: { assetId: 'DCC', coins: 100_000 },
            script: 'base64:AAA=',
          },
          type: TRANSACTION_TYPE.SET_ASSET_SCRIPT,
        },
        type: 'transaction',
      });

      expect(result.status).toBe('signed');
      if (result.data.type !== TRANSACTION_TYPE.SET_ASSET_SCRIPT) throw new Error();
      expect(result.data.assetId).toBe('SecondAsset1');
    });

    it('INVOKE_SCRIPT: resolves dApp, payments, and builds the tx', async () => {
      const { controller } = makeController();

      const result = await approveAndGet(controller, {
        account,
        broadcast: false,
        data: {
          data: {
            call: { function: 'doThing' },
            dApp: '31LQd8WcvtYXMjHzNKzRrgZy8P3NnLQvPnk',
            fee: { assetId: 'DCC', coins: 500_000 },
            payment: [{ assetId: 'DCC', coins: 1_000_000 }],
          },
          type: TRANSACTION_TYPE.INVOKE_SCRIPT,
        },
        type: 'transaction',
      });

      expect(result.status).toBe('signed');
      if (result.data.type !== TRANSACTION_TYPE.INVOKE_SCRIPT) throw new Error();
      expect(result.data.dApp).toBe('31LQd8WcvtYXMjHzNKzRrgZy8P3NnLQvPnk');
      expect(result.data.payment).toEqual([{ amount: '1000000', assetId: null }]);
    });

    it('INVOKE_SCRIPT: rejects a non-positive payment amount', async () => {
      const { controller } = makeController();

      await expect(
        controller.newMessage({
          account,
          broadcast: false,
          data: {
            data: {
              dApp: '31LQd8WcvtYXMjHzNKzRrgZy8P3NnLQvPnk',
              fee: { assetId: 'DCC', coins: 500_000 },
              payment: [{ assetId: 'DCC', coins: 0 }],
            },
            type: TRANSACTION_TYPE.INVOKE_SCRIPT,
          },
          type: 'transaction',
        }),
      ).rejects.toThrow();
    });

    it('UPDATE_ASSET_INFO: builds the tx', async () => {
      const { controller } = makeController();

      const result = await approveAndGet(controller, {
        account,
        broadcast: false,
        data: {
          data: {
            assetId: 'SecondAsset1',
            description: 'new description',
            fee: { assetId: 'DCC', coins: 100_000 },
            name: 'NewName',
          },
          type: TRANSACTION_TYPE.UPDATE_ASSET_INFO,
        },
        type: 'transaction',
      });

      expect(result.status).toBe('signed');
      if (result.data.type !== TRANSACTION_TYPE.UPDATE_ASSET_INFO) throw new Error();
      expect(result.data.name).toBe('NewName');
    });

    it('rejects when chainId is supplied and does not match the current network', async () => {
      const { controller } = makeController();

      await expect(
        controller.newMessage({
          account,
          broadcast: false,
          data: {
            data: {
              alias: 'x',
              chainId: 'X'.charCodeAt(0),
              fee: { assetId: 'DCC', coins: 100_000 },
            },
            type: TRANSACTION_TYPE.ALIAS,
          },
          type: 'transaction',
        }),
      ).rejects.toThrow(/chainId does not match/);
    });

    it('opens a new tab with the tx id when successPath is set', async () => {
      const { controller } = makeController();
      const openTab = vi.fn();
      controller.on('Open new tab', openTab);

      await approveAndGet(controller, {
        account,
        broadcast: false,
        data: {
          data: { alias: 'x', fee: { assetId: 'DCC', coins: 100_000 } },
          successPath: 'https://example.com/done',
          type: TRANSACTION_TYPE.ALIAS,
        },
        type: 'transaction',
      });

      expect(openTab).toHaveBeenCalledTimes(1);
      const [url] = openTab.mock.calls[0] as [string];
      expect(url).toContain('txId=');
    });
  });

  describe('updateTransactionFee', () => {
    it('rebuilds the transaction with a new fee, keeping the same message id', async () => {
      const { controller } = makeController();

      const message = await controller.newMessage({
        account,
        broadcast: false,
        data: {
          data: {
            alias: 'x',
            fee: { assetId: 'DCC', coins: 100_000 },
          },
          type: TRANSACTION_TYPE.ALIAS,
        },
        type: 'transaction',
      });

      const updated = await controller.updateTransactionFee(message.id, {
        assetId: 'DCC',
        coins: 200_000,
      });

      expect(updated.id).toBe(message.id);
      if (updated.type !== 'transaction') throw new Error();
      expect(updated.data.fee).toBe('200000');
    });

    it('throws when called on a non-transaction message', async () => {
      const { controller } = makeController();

      const message = await controller.newMessage({
        account,
        data: { origin: 'example.com' },
        origin: 'example.com',
        type: 'authOrigin',
      });

      await expect(
        controller.updateTransactionFee(message.id, { assetId: 'DCC', coins: 1 }),
      ).rejects.toThrow();
    });
  });

  describe('message lifecycle (non-signing behavior)', () => {
    it('reject marks a message rejected without touching the wallet', async () => {
      const { controller, wallet } = makeController();

      const message = await controller.newMessage({
        account,
        data: { origin: 'example.com' },
        origin: 'example.com',
        type: 'authOrigin',
      });

      controller.reject(message.id);

      expect(controller.getMessageById(message.id).status).toBe('rejected');
      expect(wallet.signAuth).not.toHaveBeenCalled();
    });

    it('reject(id, true) marks a message rejected forever', async () => {
      const { controller } = makeController();

      const message = await controller.newMessage({
        account,
        data: { origin: 'example.com' },
        origin: 'example.com',
        type: 'authOrigin',
      });

      controller.reject(message.id, true);

      expect(controller.getMessageById(message.id).status).toBe('rejected_forever');
    });

    it('rejectByOrigin rejects only messages from the matching origin', async () => {
      const { controller } = makeController();

      const a = await controller.newMessage({
        account,
        data: { origin: 'a.com' },
        origin: 'a.com',
        type: 'authOrigin',
      });
      const b = await controller.newMessage({
        account,
        data: { origin: 'b.com' },
        origin: 'b.com',
        type: 'authOrigin',
      });

      controller.rejectByOrigin('a.com');

      expect(controller.getMessageById(a.id).status).toBe('rejected');
      expect(controller.getMessageById(b.id).status).toBe('unapproved');
    });

    it('removeMessagesFromConnection rejects then deletes messages tied to that connection', async () => {
      const { controller } = makeController();

      const message = await controller.newMessage({
        account,
        connectionId: 'conn-1',
        data: { origin: 'a.com' },
        origin: 'a.com',
        type: 'authOrigin',
      });

      controller.removeMessagesFromConnection('conn-1');

      expect(() => controller.getMessageById(message.id)).toThrow();
    });

    it('deleteMessage removes a single message by id', async () => {
      const { controller } = makeController();

      const message = await controller.newMessage({
        account,
        data: { origin: 'a.com' },
        origin: 'a.com',
        type: 'authOrigin',
      });

      controller.deleteMessage(message.id);

      expect(() => controller.getMessageById(message.id)).toThrow();
    });

    it('clearMessages() with no args clears every message', async () => {
      const { controller } = makeController();

      await controller.newMessage({
        account,
        data: { origin: 'a.com' },
        origin: 'a.com',
        type: 'authOrigin',
      });
      await controller.newMessage({
        account,
        data: { origin: 'b.com' },
        origin: 'b.com',
        type: 'authOrigin',
      });

      controller.clearMessages();

      expect(controller.getMessages()).toHaveLength(0);
    });

    it('getUnapproved returns only messages still awaiting approval', async () => {
      const { controller } = makeController();

      const unapproved = await controller.newMessage({
        account,
        data: { origin: 'a.com' },
        origin: 'a.com',
        type: 'authOrigin',
      });
      const approved = await controller.newMessage({
        account,
        data: { origin: 'b.com' },
        origin: 'b.com',
        type: 'authOrigin',
      });
      await controller.approve(approved.id);

      const result = controller.getUnapproved();
      expect(result.map((m) => m.id)).toEqual([unapproved.id]);
    });

    it('getMessageById throws a clear error for an unknown id', () => {
      const { controller } = makeController();
      expect(() => controller.getMessageById('does-not-exist')).toThrow(/does-not-exist/);
    });
  });

  describe('approve error handling', () => {
    it('marks the message failed and rethrows when signing fails', async () => {
      const { controller, wallet } = makeController();
      wallet.signAuth.mockRejectedValueOnce(new Error('ledger disconnected'));

      const message = await controller.newMessage({
        account,
        data: { data: 'x', host: 'example.com' },
        type: 'auth',
      });

      await expect(controller.approve(message.id)).rejects.toThrow('ledger disconnected');

      const stored = controller.getMessageById(message.id);
      expect(stored.status).toBe('failed');
      if (stored.status !== 'failed') throw new Error();
      expect(stored.err).toBe('ledger disconnected');
    });
  });
});
