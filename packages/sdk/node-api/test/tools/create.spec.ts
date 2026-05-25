import { describe, expect, it } from 'vitest';
import { create } from '../../src/create';

describe('create – API factory', () => {
  const api = create('https://nodes.example.com');

  it('returns an object with all expected namespaces', () => {
    expect(api).toHaveProperty('addresses');
    expect(api).toHaveProperty('blocks');
    expect(api).toHaveProperty('transactions');
    expect(api).toHaveProperty('leasing');
    expect(api).toHaveProperty('peers');
    expect(api).toHaveProperty('rewards');
    expect(api).toHaveProperty('utils');
    expect(api).toHaveProperty('debug');
    expect(api).toHaveProperty('alias');
    expect(api).toHaveProperty('consensus');
    expect(api).toHaveProperty('activation');
    expect(api).toHaveProperty('node');
    expect(api).toHaveProperty('assets');
    expect(api).toHaveProperty('eth');
    expect(api).toHaveProperty('tools');
  });

  it('wraps address functions so base URL is pre-bound', () => {
    // The wrapped function should have one fewer parameter (base is already bound)
    expect(typeof api.addresses.fetchBalance).toBe('function');
    expect(typeof api.addresses.fetchDataKey).toBe('function');
    expect(typeof api.addresses.fetchScriptInfo).toBe('function');
  });

  it('wraps block functions with pre-bound base URL', () => {
    expect(typeof api.blocks.fetchHeight).toBe('function');
    expect(typeof api.blocks.fetchHeadersLast).toBe('function');
    expect(typeof api.blocks.fetchBlockAt).toBe('function');
  });

  it('wraps transaction functions with pre-bound base URL', () => {
    expect(typeof api.transactions.fetchInfo).toBe('function');
    expect(typeof api.transactions.fetchUnconfirmed).toBe('function');
    expect(typeof api.transactions.broadcast).toBe('function');
  });

  it('provides tools namespace with expected sub-modules', () => {
    expect(typeof api.tools.transactions.broadcast).toBe('function');
    expect(typeof api.tools.transactions.wait).toBe('function');
    expect(typeof api.tools.blocks.getNetworkByte).toBe('function');
    expect(typeof api.tools.blocks.getNetworkCode).toBe('function');
    expect(typeof api.tools.addresses.createWatch).toBe('function');
    expect(typeof api.tools.addresses.getAssetsByTransaction).toBe('function');
    expect(typeof api.tools.addresses.getAssetIdListByTx).toBe('function');
    expect(typeof api.tools.addresses.getTransactionsWithAssets).toBe('function');
    expect(typeof api.tools.addresses.availableSponsoredBalances).toBe('function');
    expect(typeof api.tools.query).toBe('function');
    expect(typeof api.tools.resolve).toBe('function');
    expect(typeof api.tools.request).toBe('function');
    expect(typeof api.tools.parse).toBe('function');
  });

  it('creates independent instances for different base URLs', () => {
    const api1 = create('https://node1.example.com');
    const api2 = create('https://node2.example.com');

    // Each instance should be a separate object
    expect(api1).not.toBe(api2);
    expect(api1.addresses).not.toBe(api2.addresses);
  });
});
