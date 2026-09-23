/**
 * Node client — reads pool state from the DecentralChain node API.
 *
 * v2: Uses pool:field:poolId state key format.
 * Reads from /addresses/data/{address} endpoint.
 * No external dependencies beyond fetch (Node 18+).
 */

import { canonicalSort, DCC_ASSET_ID, getPoolId } from './core';
import { type AmmSdkConfig, type DataEntry, type PoolStateV2 } from './types';

export class NodeClient {
  private readonly nodeUrl: string;
  private readonly dAppAddress: string;

  constructor(config: AmmSdkConfig) {
    this.nodeUrl = config.nodeUrl.replace(/\/$/, '');
    this.dAppAddress = config.dAppAddress;
  }

  // ─── Low-level data readers ──────────────────────────────────────

  /** Fetch a single data entry by key */
  async getDataEntry(key: string): Promise<DataEntry | null> {
    const url = `${this.nodeUrl}/addresses/data/${this.dAppAddress}/${encodeURIComponent(key)}`;
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      return (await res.json()) as DataEntry;
    } catch {
      return null;
    }
  }

  /** Fetch multiple data entries by regex or prefix */
  async getDataEntries(matches?: string): Promise<DataEntry[]> {
    let url = `${this.nodeUrl}/addresses/data/${this.dAppAddress}`;
    if (matches) {
      url += `?matches=${encodeURIComponent(matches)}`;
    }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Node API error: ${res.status}`);
    return (await res.json()) as DataEntry[];
  }

  /** Fetch integer value for a key */
  async getInteger(key: string): Promise<bigint | null> {
    const entry = await this.getDataEntry(key);
    if (entry?.type !== 'integer') return null;
    return BigInt(entry.value as number);
  }

  /** Fetch string value for a key */
  async getString(key: string): Promise<string | null> {
    const entry = await this.getDataEntry(key);
    if (entry?.type !== 'string') return null;
    return entry.value as string;
  }

  /** Fetch boolean value for a key */
  async getBoolean(key: string): Promise<boolean | null> {
    const entry = await this.getDataEntry(key);
    if (entry?.type !== 'boolean') return null;
    return entry.value as boolean;
  }

  // ─── v2 Pool State Readers ───────────────────────────────────────

  /**
   * Read full v2 pool state by pool ID.
   * State keys: pool:exists:<pid>, pool:t0:<pid>, pool:r0:<pid>, etc.
   */
  async getPoolState(poolId: string): Promise<PoolStateV2 | null> {
    const escaped = poolId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = `pool:.*:${escaped}`;
    const entries = await this.getDataEntries(pattern);

    if (entries.length === 0) return null;

    const map = new Map<string, DataEntry>();
    for (const e of entries) {
      const prefix = 'pool:';
      const pidStart = e.key.indexOf(poolId);
      if (pidStart < 0) continue;
      const field = e.key.slice(prefix.length, pidStart - 1);
      map.set(field, e);
    }

    const exists = map.get('exists');
    if (!exists || (exists.value as number) !== 1) return null;

    return {
      createdAt: (map.get('createdAt')?.value as number) ?? 0,
      exists: true,
      feeBps: BigInt((map.get('fee')?.value as number) ?? 35),
      fees0: BigInt((map.get('fees0')?.value as number) ?? 0),
      fees1: BigInt((map.get('fees1')?.value as number) ?? 0),
      lastK: BigInt((map.get('lastK')?.value as number) ?? 0),
      lpAssetId: (map.get('lpAssetId')?.value as string) ?? '',
      lpSupply: BigInt((map.get('lpSupply')?.value as number) ?? 0),
      poolId,
      reserve0: BigInt((map.get('r0')?.value as number) ?? 0),
      reserve1: BigInt((map.get('r1')?.value as number) ?? 0),
      swapCount: (map.get('swaps')?.value as number) ?? 0,
      token0: (map.get('t0')?.value as string) ?? '',
      token1: (map.get('t1')?.value as string) ?? '',
      volume0: BigInt((map.get('volume0')?.value as number) ?? 0),
      volume1: BigInt((map.get('volume1')?.value as number) ?? 0),
    };
  }

  /**
   * Get pool state by token pair + fee tier (auto-derives pool ID).
   */
  async getPoolByPair(
    assetA: string | null,
    assetB: string | null,
    feeBps: number = 35,
  ): Promise<PoolStateV2 | null> {
    const poolId = getPoolId(assetA, assetB, feeBps);
    return this.getPoolState(poolId);
  }

  /** Get total pool count */
  async getPoolCount(): Promise<number> {
    const val = await this.getInteger('poolCount');
    return val !== null ? Number(val) : 0;
  }

  /** Get LP token asset ID for a pool (empty string if legacy pool without LP token) */
  async getPoolLpAssetId(poolId: string): Promise<string> {
    const val = await this.getString(`pool:lpAssetId:${poolId}`);
    return val ?? '';
  }

  /** Check if a user has already claimed LP tokens for a legacy pool */
  async hasClaimedLpTokens(poolId: string, address: string): Promise<boolean> {
    const val = await this.getBoolean(`lpClaimed:${poolId}:${address}`);
    return val === true;
  }

  /** Get LP balance for an address in a specific pool */
  async getLpBalance(poolId: string, address: string): Promise<bigint> {
    const key = `lp:${poolId}:${address}`;
    const val = await this.getInteger(key);
    return val ?? 0n;
  }

  /**
   * Find the best pool for a token pair across all fee tiers.
   * Queries pool:exists:p:<t0>:<t1>:.* to discover any matching pool.
   * Returns the pool with the most liquidity, or null if none exist.
   */
  async findPoolForPair(assetA: string | null, assetB: string | null): Promise<PoolStateV2 | null> {
    const [t0, t1] = canonicalSort(assetA, assetB);
    const pattern = `pool:exists:p:${t0}:${t1}:.*`;
    const entries = await this.getDataEntries(pattern);
    let best: PoolStateV2 | null = null;
    for (const entry of entries) {
      if ((entry.value as number) !== 1) continue;
      const poolId = entry.key.replace('pool:exists:', '');
      const state = await this.getPoolState(poolId);
      if (!state || state.reserve0 === 0n) continue;
      if (!best || state.reserve0 + state.reserve1 > best.reserve0 + best.reserve1) {
        best = state;
      }
    }
    return best;
  }

  /**
   * List all pools by scanning pool:exists:* entries.
   */
  async listPools(): Promise<PoolStateV2[]> {
    const entries = await this.getDataEntries('pool:exists:.*');
    const pools: PoolStateV2[] = [];

    for (const entry of entries) {
      if ((entry.value as number) !== 1) continue;
      const poolId = entry.key.replace('pool:exists:', '');
      const state = await this.getPoolState(poolId);
      if (state) pools.push(state);
    }

    return pools;
  }

  // ─── Global State ────────────────────────────────────────────────

  /** Check if protocol is paused */
  async isPaused(): Promise<boolean> {
    const val = await this.getBoolean('paused');
    return val === true;
  }

  /** Get current blockchain height */
  async getHeight(): Promise<number> {
    const res = await fetch(`${this.nodeUrl}/blocks/height`);
    if (!res.ok) throw new Error(`Node API error: ${res.status}`);
    const data = (await res.json()) as { height: number };
    return data.height;
  }

  /** Get last block timestamp (ms) */
  async getLastBlockTimestamp(): Promise<number> {
    const res = await fetch(`${this.nodeUrl}/blocks/last`);
    if (!res.ok) throw new Error(`Node API error: ${res.status}`);
    const data = (await res.json()) as { timestamp: number };
    return data.timestamp;
  }

  // ─── Asset / Balance helpers ─────────────────────────────────────

  /** Get asset info */
  async getAssetInfo(assetId: string): Promise<{
    name: string;
    decimals: number;
    description: string;
    quantity: number;
    scripted: boolean;
  } | null> {
    if (assetId === DCC_ASSET_ID || !assetId) {
      return {
        decimals: 8,
        description: 'DecentralChain native token',
        name: 'DCC',
        quantity: 0,
        scripted: false,
      };
    }
    try {
      const res = await fetch(`${this.nodeUrl}/assets/details/${assetId}`);
      if (!res.ok) return null;
      return (await res.json()) as {
        name: string;
        decimals: number;
        description: string;
        quantity: number;
        scripted: boolean;
      };
    } catch {
      return null;
    }
  }

  /** Get address balance for a specific asset */
  async getBalance(address: string, assetId: string | null): Promise<bigint> {
    if (!assetId || assetId === DCC_ASSET_ID) {
      const res = await fetch(`${this.nodeUrl}/addresses/balance/${address}`);
      if (!res.ok) return 0n;
      const data = (await res.json()) as { balance: number };
      return BigInt(data.balance);
    }
    const res = await fetch(`${this.nodeUrl}/assets/balance/${address}/${assetId}`);
    if (!res.ok) return 0n;
    const data = (await res.json()) as { balance: number };
    return BigInt(data.balance);
  }
}
