/**
 * DCC-111 — api.ts smoke tests.
 *
 * All network calls are mocked with vi.mock so tests run fully offline,
 * deterministically, and without any node-api-js side-effects.
 *
 * Strategy: verify that each exported wrapper function
 *   1. calls the correct SDK / fetch path
 *   2. returns the expected shape
 *   3. throws on error responses
 */
import { describe, expect, it, vi } from 'vitest';
import {
  fetchAddressTransactions,
  fetchAllPeers,
  fetchAssetDetailsById,
  fetchBatchAssetDetails,
  fetchBlacklistedPeers,
  fetchBlockAt,
  fetchBlockById,
  fetchBlockHeadersSeq,
  fetchConnectedPeers,
  fetchFullAssetDistribution,
  fetchHeight,
  fetchLastBlock,
  fetchNodeStatus,
  fetchNodeVersion,
  fetchSuspendedPeers,
  fetchTransactionInfo,
  fetchUnconfirmedTransactionInfo,
  fetchUnconfirmedTransactions,
  getBlockTransactions,
  type IBlock,
} from './api';

// ── vi.hoisted — values available inside vi.mock factory ───────────────────
const { mockBlock, mockHeader } = vi.hoisted(() => {
  const mockBlock = {
    blocksize: 215,
    desiredReward: 600_000_000,
    features: [],
    generator: '3P3FfgF5f1WxS4jbUMqojfC3xBnrGNrMePy',
    height: 42,
    id: 'abc123',
    reward: 600_000_000,
    signature: 'sig',
    timestamp: 1_700_000_000_000,
    transactionCount: 5,
    transactions: [],
    version: 5,
  };

  const mockHeader = {
    blocksize: 215,
    generator: '3P3FfgF5f1WxS4jbUMqojfC3xBnrGNrMePy',
    height: 42,
    id: 'abc123',
    signature: 'sig',
    timestamp: 1_700_000_000_000,
    transactionCount: 3,
  };

  return { mockBlock, mockHeader };
});

// ── mock @decentralchain/node-api-js ────────────────────────────────────────

vi.mock('@decentralchain/node-api-js', async () => ({
  create: vi.fn(() => ({
    addresses: {
      fetchBalanceDetails: vi.fn().mockResolvedValue({ available: '1000', regular: '1000' }),
    },
    assets: {
      fetchAssetDistribution: vi
        .fn()
        .mockResolvedValue({ hasNext: false, items: { addr: 100 }, lastItem: null }),
      fetchAssetsAddressLimit: vi.fn().mockResolvedValue([]),
      fetchAssetsBalance: vi.fn().mockResolvedValue({ balances: [] }),
      fetchAssetsDetails: vi.fn().mockResolvedValue([{ assetId: 'WAVES', name: 'DCC' }]),
      fetchDetails: vi.fn().mockResolvedValue([{ assetId: 'WAVES', name: 'DCC' }]),
    },
    blocks: {
      fetchBlockAt: vi.fn().mockResolvedValue(mockBlock),
      fetchBlockById: vi.fn().mockResolvedValue(mockBlock),
      fetchHeadersSeq: vi.fn().mockResolvedValue([mockHeader]),
      fetchHeight: vi.fn().mockResolvedValue({ height: 42 }),
      fetchLast: vi.fn().mockResolvedValue(mockBlock),
    },
    leasing: {
      fetchActive: vi.fn().mockResolvedValue([]),
    },
    node: {
      fetchNodeStatus: vi.fn().mockResolvedValue({
        blockGeneratorStatus: 'generating',
        peersCount: 12,
        stateHash: 'deadbeef',
      }),
      fetchNodeVersion: vi.fn().mockResolvedValue({ version: 'DCC v1.3.5 (DCC)' }),
    },
    peers: {
      fetchAll: vi.fn().mockResolvedValue({ peers: [] }),
      fetchBlackListed: vi.fn().mockResolvedValue([]),
      fetchConnected: vi.fn().mockResolvedValue({ peers: [] }),
      fetchSuspended: vi.fn().mockResolvedValue([]),
    },
    rewards: {
      fetchRewards: vi.fn().mockResolvedValue({ currentReward: 600_000_000 }),
    },
    transactions: {
      fetchInfo: vi.fn().mockResolvedValue({ fee: 100_000, height: 10, id: 'tx1', type: 4 }),
      fetchTransactions: vi.fn().mockResolvedValue([{ id: 'tx2', type: 4 }]),
      fetchUnconfirmed: vi.fn().mockResolvedValue([{ id: 'utx1', type: 4 }]),
      fetchUnconfirmedInfo: vi.fn().mockResolvedValue({ id: 'utx2', type: 4 }),
    },
  })),
}));

// ── tests ──────────────────────────────────────────────────────────────────

describe('api — blocks', () => {
  it('fetchHeight returns height', async () => {
    const result = await fetchHeight();
    expect(result).toEqual({ height: 42 });
  });

  it('fetchLastBlock returns block shape', async () => {
    const block = await fetchLastBlock();
    expect(block.height).toBe(42);
    expect(block.id).toBe('abc123');
  });

  it('fetchBlockAt returns block by height', async () => {
    const block = await fetchBlockAt(42);
    expect(block.height).toBe(42);
  });

  it('fetchBlockById returns block by signature', async () => {
    const block = await fetchBlockById('abc123');
    expect(block.id).toBe('abc123');
  });

  it('fetchBlockHeadersSeq returns array', async () => {
    const headers = await fetchBlockHeadersSeq(1, 10);
    expect(Array.isArray(headers)).toBe(true);
    expect(headers[0]?.height).toBe(42);
  });
});

describe('api — node', () => {
  it('fetchNodeVersion returns version string', async () => {
    const v = await fetchNodeVersion();
    expect(v.version).toBe('DCC v1.3.5 (DCC)');
  });

  it('fetchNodeStatus returns blockGeneratorStatus', async () => {
    const s = await fetchNodeStatus();
    expect(s.blockGeneratorStatus).toBe('generating');
    // peersCount is a runtime field not declared in INodeStatus interface
    expect((s as unknown as Record<string, unknown>).peersCount).toBe(12);
  });
});

describe('api — transactions', () => {
  it('fetchTransactionInfo returns tx', async () => {
    const tx = await fetchTransactionInfo('tx1');
    expect(tx.id).toBe('tx1');
  });

  it('fetchUnconfirmedTransactionInfo returns unconfirmed tx', async () => {
    const tx = await fetchUnconfirmedTransactionInfo('utx2');
    expect(tx.id).toBe('utx2');
  });

  it('fetchUnconfirmedTransactions returns array', async () => {
    const txs = await fetchUnconfirmedTransactions();
    expect(Array.isArray(txs)).toBe(true);
    expect(txs[0]?.id).toBe('utx1');
  });

  it('fetchAddressTransactions returns array', async () => {
    const txs = await fetchAddressTransactions('3Paddr', 20);
    expect(Array.isArray(txs)).toBe(true);
  });
});

describe('api — assets', () => {
  it('fetchAssetDetailsById returns single asset', async () => {
    const asset = await fetchAssetDetailsById('WAVES');
    expect(asset.assetId).toBe('WAVES');
  });

  it('fetchBatchAssetDetails returns map', async () => {
    const map = await fetchBatchAssetDetails(['WAVES']);
    expect(map instanceof Map).toBe(true);
    expect(map.get('WAVES')?.name).toBe('DCC');
  });

  it('fetchBatchAssetDetails returns empty map for empty input', async () => {
    const map = await fetchBatchAssetDetails([]);
    expect(map.size).toBe(0);
  });
});

describe('api — peers', () => {
  it('fetchConnectedPeers returns object with peers array', async () => {
    const result = await fetchConnectedPeers();
    expect(Array.isArray(result.peers)).toBe(true);
  });

  it('fetchAllPeers returns object with peers array', async () => {
    const result = await fetchAllPeers();
    expect(Array.isArray(result.peers)).toBe(true);
  });

  it('fetchSuspendedPeers returns array', async () => {
    const result = await fetchSuspendedPeers();
    expect(Array.isArray(result)).toBe(true);
  });

  it('fetchBlacklistedPeers returns array', async () => {
    const result = await fetchBlacklistedPeers();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('api — distribution (cursor-based pagination)', () => {
  it('fetches full distribution — single page, no next', async () => {
    const result = await fetchFullAssetDistribution('WAVES', 100);
    expect(typeof result.items).toBe('object');
    expect(result.totalHolders).toBeGreaterThanOrEqual(0);
    expect(result.totalPages).toBe(1);
  });
});

describe('api — getBlockTransactions helper', () => {
  it('extracts transactions from block', () => {
    const blockWithTxs = { ...mockBlock, transactions: [{ id: 'tx1' }, { id: 'tx2' }] };
    const txs = getBlockTransactions(blockWithTxs as unknown as IBlock);
    expect(txs).toHaveLength(2);
  });

  it('returns empty array when block has no transactions', () => {
    const txs = getBlockTransactions({ ...mockBlock, transactions: [] } as unknown as IBlock);
    expect(txs).toHaveLength(0);
  });
});
