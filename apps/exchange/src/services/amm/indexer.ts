/**
 * The AMM indexer.
 *
 * The chain can answer "what are this pool's reserves" but not "what was its
 * 24h volume" — there is no query for that on a blockchain. The indexer
 * watches blocks and builds those aggregates up, so anything historical or
 * cross-pool comes from here rather than the contracts.
 *
 * Read-only and unauthenticated. Rate limited to 120 requests a minute per
 * client, which is why the hooks above it poll on the order of tens of
 * seconds rather than continuously.
 */
import { logger } from '@/lib/logger';

const INDEXER_BASE = 'https://amm-indexer-production.up.railway.app';

/** Reserves and price for one pool, as the indexer last saw it. */
export interface IndexedPool {
  assetA: string;
  assetB: string;
  blockHeight: number;
  feeBps: number;
  lpSupply: string;
  poolKey: string;
  priceAtoB: number;
  priceBtoA: number;
  reserveA: string;
  reserveB: string;
  status: string;
  timestamp: number;
  tvlA: string;
  tvlB: string;
}

export interface PoolStats {
  apy: number;
  fees24h: string;
  fees7d: string;
  poolKey: string;
  tvl: string;
  txCount24h: number;
  volume24h: string;
  volume7d: string;
}

export interface IndexedSwap {
  amountIn: string;
  amountOut: string;
  blockHeight: number;
  feeBps: number;
  inputAsset: string;
  outputAsset: string;
  poolKey: string;
  sender: string;
  timestamp: number;
  txId: string;
}

export interface ProtocolStatus {
  dApp: string;
  height: number;
  paused: boolean;
  poolCount: number;
}

const get = async <T>(path: string): Promise<T> => {
  const response = await fetch(`${INDEXER_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`Indexer ${path} responded ${response.status}`);
  }

  return (await response.json()) as T;
};

export const fetchIndexedPools = (): Promise<IndexedPool[]> => get('/pools');

/**
 * A pool key contains colons (`p:DCC:<assetId>:35`), so it must be encoded.
 * The indexer decodes it correctly; a stray 404 on a cached client build was a
 * known bug on their side, now fixed.
 */
export const fetchPoolStats = (poolKey: string): Promise<PoolStats> =>
  get(`/pools/${encodeURIComponent(poolKey)}/stats`);

export const fetchSwaps = (limit = 25, poolKey?: string): Promise<IndexedSwap[]> =>
  get(`/swaps?limit=${limit}${poolKey ? `&pool=${encodeURIComponent(poolKey)}` : ''}`);

export const fetchProtocolStatus = (): Promise<ProtocolStatus> => get('/protocol/status');

/**
 * Best-effort stats for every pool.
 *
 * One request per pool, and a pool whose stats fail yields null rather than
 * taking the whole view down — the reserves are already known from the chain,
 * so a missing volume figure is a gap, not an outage.
 */
export const fetchAllPoolStats = async (poolKeys: string[]): Promise<Map<string, PoolStats>> => {
  const entries = await Promise.all(
    poolKeys.map(async (key) => {
      try {
        return [key, await fetchPoolStats(key)] as const;
      } catch (error) {
        logger.warn(`[amm-indexer] stats unavailable for ${key}`, error);
        return null;
      }
    }),
  );

  return new Map(entries.filter((entry): entry is [string, PoolStats] => entry !== null));
};
