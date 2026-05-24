import { describe, expect, it } from 'vitest';
import { mkBlockchainUpdatesApi } from '../src/blockchain-updates-api.js';
import { BLOCKCHAIN_UPDATES_PORT, mkDefaultChannel, NODE_GRPC_PORT } from '../src/channel.js';
import {
  mkAccountsApi,
  mkAssetsApi,
  mkBlockchainApi,
  mkBlocksApi,
  mkTransactionsApi,
} from '../src/node-api.js';

describe('channel factories', () => {
  it('mkDefaultChannel produces a Transport object', () => {
    const channel = mkDefaultChannel('localhost');
    expect(channel).toBeDefined();
    expect(typeof channel).toBe('object');
  });

  it('exports correct default ports', () => {
    expect(NODE_GRPC_PORT).toBe(6870);
    expect(BLOCKCHAIN_UPDATES_PORT).toBe(6881);
  });
});

describe('API client factories', () => {
  const channel = mkDefaultChannel('localhost');

  it('mkAccountsApi returns a typed client', () => {
    const client = mkAccountsApi(channel);
    expect(typeof client.getBalances).toBe('function');
    expect(typeof client.getScript).toBe('function');
    expect(typeof client.getActiveLeases).toBe('function');
    expect(typeof client.getDataEntries).toBe('function');
    expect(typeof client.resolveAlias).toBe('function');
  });

  it('mkAssetsApi returns a typed client', () => {
    const client = mkAssetsApi(channel);
    expect(typeof client.getInfo).toBe('function');
    expect(typeof client.getNFTList).toBe('function');
  });

  it('mkBlockchainApi returns a typed client', () => {
    const client = mkBlockchainApi(channel);
    expect(typeof client.getActivationStatus).toBe('function');
    expect(typeof client.getBaseTarget).toBe('function');
    expect(typeof client.getCumulativeScore).toBe('function');
  });

  it('mkBlocksApi returns a typed client', () => {
    const client = mkBlocksApi(channel);
    expect(typeof client.getBlock).toBe('function');
    expect(typeof client.getBlockRange).toBe('function');
  });

  it('mkTransactionsApi returns a typed client', () => {
    const client = mkTransactionsApi(channel);
    expect(typeof client.getTransactions).toBe('function');
    expect(typeof client.getTransactionSnapshots).toBe('function');
    expect(typeof client.getStateChanges).toBe('function');
    expect(typeof client.getStatuses).toBe('function');
    expect(typeof client.getUnconfirmed).toBe('function');
    expect(typeof client.sign).toBe('function');
    expect(typeof client.broadcast).toBe('function');
  });

  it('mkBlockchainUpdatesApi returns a typed client', () => {
    const updatesChannel = mkDefaultChannel('localhost');
    const client = mkBlockchainUpdatesApi(updatesChannel);
    expect(typeof client.getBlockUpdate).toBe('function');
    expect(typeof client.getBlockUpdatesRange).toBe('function');
    expect(typeof client.subscribe).toBe('function');
  });
});
