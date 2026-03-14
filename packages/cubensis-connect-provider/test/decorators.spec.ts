import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ensureNetwork } from '../src/decorators';

describe('ensureNetwork', () => {
  const mockPublicState = vi.fn();

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
    const descriptor: PropertyDescriptor = { value: originalFn };

    mockPublicState.mockResolvedValue({
      network: { code: 'D', server: 'https://mainnet-node.decentralchain.io' },
    });

    ensureNetwork(null, 'testMethod', descriptor);

    const instance = createInstance('https://mainnet-node.decentralchain.io', 'D'.charCodeAt(0));
    const result = await descriptor.value.call(instance, 'arg1', 'arg2');

    expect(result).toBe('result');
    expect(originalFn).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('throws when node URLs do not match', async () => {
    const originalFn = vi.fn();
    const descriptor: PropertyDescriptor = { value: originalFn };

    mockPublicState.mockResolvedValue({
      network: { code: 'D', server: 'https://testnet-node.decentralchain.io' },
    });

    ensureNetwork(null, 'testMethod', descriptor);

    const instance = createInstance('https://mainnet-node.decentralchain.io', 'D'.charCodeAt(0));

    await expect(descriptor.value.call(instance)).rejects.toThrow('Invalid connect options');
    expect(originalFn).not.toHaveBeenCalled();
  });

  it('throws when network bytes do not match', async () => {
    const originalFn = vi.fn();
    const descriptor: PropertyDescriptor = { value: originalFn };

    mockPublicState.mockResolvedValue({
      network: { code: 'T', server: 'https://mainnet-node.decentralchain.io' },
    });

    ensureNetwork(null, 'testMethod', descriptor);

    const instance = createInstance('https://mainnet-node.decentralchain.io', 'D'.charCodeAt(0));

    await expect(descriptor.value.call(instance)).rejects.toThrow('Invalid connect options');
    expect(originalFn).not.toHaveBeenCalled();
  });

  it('normalizes trailing slashes for comparison', async () => {
    const originalFn = vi.fn().mockResolvedValue('ok');
    const descriptor: PropertyDescriptor = { value: originalFn };

    mockPublicState.mockResolvedValue({
      network: { code: 'D', server: 'https://mainnet-node.decentralchain.io/' },
    });

    ensureNetwork(null, 'testMethod', descriptor);

    const instance = createInstance('https://mainnet-node.decentralchain.io', 'D'.charCodeAt(0));
    const result = await descriptor.value.call(instance);

    expect(result).toBe('ok');
    expect(originalFn).toHaveBeenCalled();
  });
});
