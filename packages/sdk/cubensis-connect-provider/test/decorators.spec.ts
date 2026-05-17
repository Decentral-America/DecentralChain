import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureNetwork } from '../src/decorators';

describe('ensureNetwork', () => {
  const mockPublicState = vi.fn();

  // Minimal context mock — ensureNetwork ignores context (_context), so only
  // need to satisfy the TypeScript type. Use null cast for simplicity.
  // @ts-expect-error: null satisfies mock context; ensureNetwork ignores this parameter
  const mockContext: ClassMethodDecoratorContext = null;

  function createInstance(nodeUrl: string, networkByte: number) {
    return {
      _api: { publicState: mockPublicState },
      _options: {
        NETWORK_BYTE: networkByte,
        NODE_URL: nodeUrl,
      },
    };
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('calls the original method when network matches', async () => {
    const originalFn = vi.fn().mockResolvedValue('result');

    mockPublicState.mockResolvedValue({
      network: { code: 'D', server: 'https://mainnet-node.decentralchain.io' },
    });

    const wrappedFn = ensureNetwork(originalFn, mockContext);

    const instance = createInstance('https://mainnet-node.decentralchain.io', 'D'.charCodeAt(0));
    const result = await wrappedFn.call(instance, 'arg1', 'arg2');

    expect(result).toBe('result');
    expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('throws when node URLs do not match', async () => {
    const originalFn = vi.fn();

    mockPublicState.mockResolvedValue({
      network: { code: 'D', server: 'https://testnet-node.decentralchain.io' },
    });

    const wrappedFn = ensureNetwork(originalFn, mockContext);

    const instance = createInstance('https://mainnet-node.decentralchain.io', 'D'.charCodeAt(0));

    await expect(wrappedFn.call(instance)).rejects.toThrow('Invalid connect options');
    expect(originalFn).not.toHaveBeenCalled();
  });

  it('throws when network bytes do not match', async () => {
    const originalFn = vi.fn();

    mockPublicState.mockResolvedValue({
      network: { code: 'T', server: 'https://mainnet-node.decentralchain.io' },
    });

    const wrappedFn = ensureNetwork(originalFn, mockContext);

    const instance = createInstance('https://mainnet-node.decentralchain.io', 'D'.charCodeAt(0));

    await expect(wrappedFn.call(instance)).rejects.toThrow('Invalid connect options');
    expect(originalFn).not.toHaveBeenCalled();
  });

  it('normalizes trailing slashes for comparison', async () => {
    const originalFn = vi.fn().mockResolvedValue('ok');

    mockPublicState.mockResolvedValue({
      network: { code: 'D', server: 'https://mainnet-node.decentralchain.io/' },
    });

    const wrappedFn = ensureNetwork(originalFn, mockContext);

    const instance = createInstance('https://mainnet-node.decentralchain.io', 'D'.charCodeAt(0));
    const result = await wrappedFn.call(instance);

    expect(result).toBe('ok');
    expect(originalFn).toHaveBeenCalled();
  });
});
