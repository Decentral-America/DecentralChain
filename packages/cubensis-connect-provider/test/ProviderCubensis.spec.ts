// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderCubensis } from '../src/ProviderCubensis';

const TEST_NODE_URL = 'https://mainnet-node.decentralchain.io';
const TEST_NETWORK_BYTE = 'D'.charCodeAt(0);
const TEST_OPTIONS = { NETWORK_BYTE: TEST_NETWORK_BYTE, NODE_URL: TEST_NODE_URL };

/**
 * Creates a mock CubensisConnect API object with all methods stubbed.
 * publicState is pre-configured to return matching network info.
 */
function createMockApi(): CubensisConnect.TCubensisConnectApi {
  return {
    auth: vi.fn(),
    signTransaction: vi.fn(),
    signTransactionPackage: vi.fn(),
    signCustomData: vi.fn(),
    publicState: vi.fn().mockResolvedValue({
      account: { publicKey: 'mockPublicKey' },
      network: {
        server: TEST_NODE_URL,
        code: String.fromCharCode(TEST_NETWORK_BYTE),
      },
    }),
    signOrder: vi.fn(),
    signAndPublishOrder: vi.fn(),
    signAndPublishTransaction: vi.fn(),
    signRequest: vi.fn(),
    resourceIsApproved: vi.fn(),
    resourceIsBlocked: vi.fn(),
    on: vi.fn(),
    notification: vi.fn(),
    encryptMessage: vi.fn(),
    decryptMessage: vi.fn(),
  } as unknown as CubensisConnect.TCubensisConnectApi;
}

/**
 * Installs a mock CubensisConnect extension on the global window object.
 * The mock mirrors the real extension: API methods live directly on the
 * CubensisConnect object, and initialPromise resolves to void once ready.
 */
function installMockExtension(api: CubensisConnect.TCubensisConnectApi) {
  (window as unknown as Record<string, unknown>).CubensisConnect = {
    ...api,
    initialPromise: Promise.resolve(),
  };
}

function removeMockExtension() {
  delete (window as unknown as Record<string, unknown>).CubensisConnect;
}

describe('ProviderCubensis', () => {
  let provider: ProviderCubensis;
  let mockApi: CubensisConnect.TCubensisConnectApi;

  beforeEach(() => {
    mockApi = createMockApi();
    installMockExtension(mockApi);
    provider = new ProviderCubensis();
  });

  afterEach(() => {
    removeMockExtension();
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('initializes with null user', () => {
      expect(provider.user).toBeNull();
    });

    it('creates a new instance without errors', () => {
      expect(provider).toBeInstanceOf(ProviderCubensis);
    });
  });

  describe('connect()', () => {
    it('resolves when CubensisConnect extension is available', async () => {
      await expect(provider.connect(TEST_OPTIONS)).resolves.toBeUndefined();
    });

    it('rejects when CubensisConnect extension is not installed after retries', async () => {
      removeMockExtension();

      // Create a provider with a short retry to keep tests fast
      const p = new ProviderCubensis();
      Object.defineProperty(p, '_maxRetries', { value: 0 });

      await expect(p.connect(TEST_OPTIONS)).rejects.toThrow('CubensisConnect is not installed.');
    });

    it('polls and eventually finds the extension', async () => {
      removeMockExtension();

      // Install after a short delay
      setTimeout(() => {
        installMockExtension(mockApi);
      }, 50);

      await expect(provider.connect(TEST_OPTIONS)).resolves.toBeUndefined();
    });

    it('rejects when initialPromise rejects', async () => {
      // Override the extension mock to have a rejecting initialPromise
      (window as unknown as Record<string, unknown>).CubensisConnect = {
        initialPromise: Promise.reject(new Error('Extension init failed')),
      };

      const p = new ProviderCubensis();
      await expect(p.connect(TEST_OPTIONS)).rejects.toThrow('Extension init failed');
    });
  });

  describe('login()', () => {
    it('authenticates and returns user data', async () => {
      const authResult = {
        address: '3N1234567890abcdef',
        publicKey: 'abc123publickey',
        host: 'example.com',
        prefix: 'CubensisConnect',
        signature: 'sig123',
      };
      (mockApi.auth as ReturnType<typeof vi.fn>).mockResolvedValue(authResult);

      await provider.connect(TEST_OPTIONS);
      const user = await provider.login();

      expect(user).toEqual({
        address: '3N1234567890abcdef',
        publicKey: 'abc123publickey',
      });
      expect(provider.user).toEqual(user);
    });

    it('calls auth with auth data containing hex-encoded random bytes', async () => {
      (mockApi.auth as ReturnType<typeof vi.fn>).mockResolvedValue({
        address: 'addr',
        publicKey: 'pk',
        host: '',
        prefix: '',
        signature: '',
      });

      await provider.connect(TEST_OPTIONS);
      await provider.login();

      expect(mockApi.auth).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.stringMatching(/^[0-9a-f]+$/i) as string,
        }),
      );
    });
  });

  describe('logout()', () => {
    it('clears the user and resolves', async () => {
      provider.user = { address: 'addr', publicKey: 'pk' };

      await provider.logout();

      expect(provider.user).toBeNull();
    });
  });

  describe('signMessage()', () => {
    it('calls signCustomData with version 1 and base64 binary', async () => {
      (mockApi.signCustomData as ReturnType<typeof vi.fn>).mockResolvedValue({
        signature: 'sig_abc123',
      });

      await provider.connect(TEST_OPTIONS);
      const sig = await provider.signMessage('hello');

      expect(sig).toBe('sig_abc123');
      expect(mockApi.signCustomData).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 1,
          binary: expect.stringMatching(/^base64:/) as string,
        }),
      );
    });

    it('converts numeric data to string before signing', async () => {
      (mockApi.signCustomData as ReturnType<typeof vi.fn>).mockResolvedValue({
        signature: 'num_sig',
      });

      await provider.connect(TEST_OPTIONS);
      const sig = await provider.signMessage(42);

      expect(sig).toBe('num_sig');
    });
  });

  describe('signTypedData()', () => {
    it('calls signCustomData with version 2 and typed data', async () => {
      (mockApi.signCustomData as ReturnType<typeof vi.fn>).mockResolvedValue({
        signature: 'typed_sig',
      });

      await provider.connect(TEST_OPTIONS);

      const typedData = [{ type: 'string' as const, key: 'name', value: 'Alice' }];
      const sig = await provider.signTypedData(typedData);

      expect(sig).toBe('typed_sig');
      expect(mockApi.signCustomData).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 2,
          data: typedData,
        }),
      );
    });
  });

  describe('sign()', () => {
    it('signs a single transfer transaction', async () => {
      const signedJson = JSON.stringify({
        type: 4,
        version: 2,
        amount: 1000,
        recipient: '3Naddr',
        id: 'txid123',
        proofs: ['proof1'],
      });
      (mockApi.signTransaction as ReturnType<typeof vi.fn>).mockResolvedValue(signedJson);

      await provider.connect(TEST_OPTIONS);

      const result = await provider.sign([{ type: 4, amount: 1000, recipient: '3Naddr' }]);

      expect(result).toHaveLength(1);
      expect(mockApi.signTransaction).toHaveBeenCalled();
    });

    it('signs multiple transactions as a package', async () => {
      const signed1 = JSON.stringify({
        type: 4,
        version: 2,
        amount: 100,
        recipient: '3Na',
        id: 'id1',
        proofs: ['p1'],
      });
      const signed2 = JSON.stringify({
        type: 4,
        version: 2,
        amount: 200,
        recipient: '3Nb',
        id: 'id2',
        proofs: ['p2'],
      });
      (mockApi.signTransactionPackage as ReturnType<typeof vi.fn>).mockResolvedValue([
        signed1,
        signed2,
      ]);

      await provider.connect(TEST_OPTIONS);

      const result = await provider.sign([
        { type: 4, amount: 100, recipient: '3Na' },
        { type: 4, amount: 200, recipient: '3Nb' },
      ]);

      expect(result).toHaveLength(2);
      expect(mockApi.signTransactionPackage).toHaveBeenCalled();
    });

    it('calculates fee for invoke script transactions without fee', async () => {
      // Mock fetch for calculateFee
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ feeAmount: 500000 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const signedJson = JSON.stringify({
        type: 16,
        version: 2,
        dApp: '3Napp',
        call: { function: 'transfer', args: [] },
        payment: [],
        id: 'txid',
        proofs: ['p'],
      });
      (mockApi.signTransaction as ReturnType<typeof vi.fn>).mockResolvedValue(signedJson);

      await provider.connect(TEST_OPTIONS);

      await provider.sign([{ type: 16, dApp: '3Napp', call: { function: 'transfer', args: [] } }]);

      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('/transactions/calculateFee'),
        expect.objectContaining({ method: 'POST' }),
      );

      fetchSpy.mockRestore();
    });
  });

  describe('ensureNetwork decorator', () => {
    it('throws when network does not match connect options', async () => {
      // publicState returns a different network than what we connected with
      (mockApi.publicState as ReturnType<typeof vi.fn>).mockResolvedValue({
        account: { publicKey: 'pk' },
        network: {
          server: 'https://other-node.example.com',
          code: 'X',
        },
      });

      await provider.connect(TEST_OPTIONS);

      await expect(provider.login()).rejects.toThrow('Invalid connect options');
    });
  });

  describe('_txWithFee (via sign)', () => {
    it('passes through transactions with existing fee', async () => {
      const signedJson = JSON.stringify({
        type: 16,
        dApp: '3Napp',
        call: { function: 'f', args: [] },
        payment: [],
        fee: 500000,
        id: 'txid',
        proofs: ['p'],
      });
      (mockApi.signTransaction as ReturnType<typeof vi.fn>).mockResolvedValue(signedJson);

      await provider.connect(TEST_OPTIONS);

      // Invoke script WITH fee should NOT call calculateFee/fetch
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      await provider.sign([
        { type: 16, dApp: '3Napp', call: { function: 'f', args: [] }, fee: 500000 },
      ]);

      expect(fetchSpy).not.toHaveBeenCalled();
      fetchSpy.mockRestore();
    });

    it('resolves publicKey from user when available', async () => {
      provider.user = { address: 'addr', publicKey: 'userPK' };

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ feeAmount: 500000 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );

      const signedJson = JSON.stringify({
        type: 16,
        dApp: '3Napp',
        call: { function: 'f', args: [] },
        payment: [],
        id: 'txid',
        proofs: ['p'],
      });
      (mockApi.signTransaction as ReturnType<typeof vi.fn>).mockResolvedValue(signedJson);

      await provider.connect(TEST_OPTIONS);
      await provider.sign([{ type: 16, dApp: '3Napp', call: { function: 'f', args: [] } }]);

      // Should have used user's publicKey in the fetch body
      const fetchBody = JSON.parse(
        (fetchSpy.mock.calls[0]?.[1] as RequestInit).body as string,
      ) as Record<string, unknown>;
      expect(fetchBody).toHaveProperty('senderPublicKey', 'userPK');

      fetchSpy.mockRestore();
    });
  });

  describe('event methods', () => {
    it('on() returns the provider instance for chaining', () => {
      const handler = vi.fn();
      const result = provider.on('login', handler);
      expect(result).toBe(provider);
    });

    it('once() returns the provider instance for chaining', () => {
      const handler = vi.fn();
      const result = provider.once('login', handler);
      expect(result).toBe(provider);
    });

    it('off() returns the provider instance for chaining', () => {
      const handler = vi.fn();
      const result = provider.off('login', handler);
      expect(result).toBe(provider);
    });
  });
});
