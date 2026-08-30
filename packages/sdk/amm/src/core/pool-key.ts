/**
 * Pool key / pool ID derivation and canonical token ordering.
 *
 * v2 Pool ID format: "p:<token0>:<token1>:<feeBps>"
 *   - token0, token1 are in canonical (sorted) order
 *   - feeBps makes pools unique per fee tier
 *
 * Legacy v1 pool key format: "tokenA_tokenB" (kept for backward compat)
 */

import { DCC_ASSET_ID } from './constants';

/**
 * Normalize an asset ID.
 * - null / undefined / empty string / "DCC" all represent the native DCC token.
 *
 * @param assetId - Raw asset ID (possibly null for native token)
 * @returns Normalized string: "DCC" for native token, or the base58 asset ID
 */
export function normalizeAssetId(assetId: string | null | undefined): string {
  if (!assetId || assetId === '' || assetId === DCC_ASSET_ID) {
    return DCC_ASSET_ID;
  }
  return assetId;
}

/**
 * Sort two asset IDs into canonical order.
 *
 * Rules:
 * 1. Normalize both asset IDs.
 * 2. DCC (native token) always comes first.
 * 3. For non-DCC pairs, compare lexicographically.
 *
 * This matches the RIDE contract's canonicalOrder function exactly.
 *
 * @returns Tuple [canonicalA, canonicalB] where DCC is always first if present
 */
export function canonicalSort(
  assetA: string | null | undefined,
  assetB: string | null | undefined,
): [string, string] {
  const a = normalizeAssetId(assetA);
  const b = normalizeAssetId(assetB);

  if (a === b) {
    throw new Error('canonicalSort: assets must be different');
  }

  // DCC always sorts first (matches RIDE canonicalOrder)
  if (a === DCC_ASSET_ID) return [a, b];
  if (b === DCC_ASSET_ID) return [b, a];

  // For non-DCC pairs, lexicographic order
  return a < b ? [a, b] : [b, a];
}

/**
 * Derive the deterministic pool key for a pair of assets.
 *
 * poolKey = canonicalA + "_" + canonicalB
 *
 * This is used as the namespace prefix for all pool state keys.
 *
 * @param assetA - First asset ID
 * @param assetB - Second asset ID
 * @returns Pool key string (e.g., "DCC_3P...")
 */
export function getPoolKey(
  assetA: string | null | undefined,
  assetB: string | null | undefined,
): string {
  const [a, b] = canonicalSort(assetA, assetB);
  return `${a}_${b}`;
}

/**
 * Given a pool key, determine the direction of a swap.
 *
 * @param poolKey - The pool key
 * @param inputAssetId - The asset being sold
 * @returns { isAToB: true } if selling assetA for assetB, else { isAToB: false }
 */
export function getSwapDirection(
  poolKey: string,
  inputAssetId: string | null | undefined,
): { isAToB: boolean; assetA: string; assetB: string } {
  const parts = poolKey.split('_');
  if (parts.length !== 2) {
    throw new Error('getSwapDirection: invalid pool key');
  }
  const [assetA, assetB] = parts as [string, string];
  const normalizedInput = normalizeAssetId(inputAssetId);

  if (normalizedInput === assetA) {
    return { assetA, assetB, isAToB: true };
  } else if (normalizedInput === assetB) {
    return { assetA, assetB, isAToB: false };
  } else {
    throw new Error('getSwapDirection: input asset not in pool');
  }
}

/**
 * Build a state key for a pool data entry.
 * @deprecated Use poolStateKeyV2 for v2 schema
 */
export function poolStateKey(poolKey: string, field: string): string {
  return `pool_${poolKey}_${field}`;
}

// ─── V2 Pool ID (includes feeBps) ────────────────────────────────────

/**
 * Derive the v2 pool ID: "p:<token0>:<token1>:<feeBps>".
 *
 * This matches the RIDE contract's makePoolId/resolvePoolId exactly.
 * Same pair with different fees = different pools (fee tiers).
 *
 * @param assetA - First asset ID
 * @param assetB - Second asset ID
 * @param feeBps - Fee in basis points (1–1000)
 * @returns Pool ID string
 */
export function getPoolId(
  assetA: string | null | undefined,
  assetB: string | null | undefined,
  feeBps: number | bigint,
): string {
  const [t0, t1] = canonicalSort(assetA, assetB);
  return `p:${t0}:${t1}:${feeBps}`;
}

/**
 * Build a v2 state key for a pool data entry.
 *
 * v2 format: "pool:<field>:<poolId>"
 *
 * @param poolId - The v2 pool ID (e.g., "p:DCC:3PAbcd:35")
 * @param field - Field name (e.g., "r0", "r1", "lpSupply", "exists")
 * @returns State key string (e.g., "pool:r0:p:DCC:3PAbcd:35")
 */
export function poolStateKeyV2(poolId: string, field: string): string {
  return `pool:${field}:${poolId}`;
}

/**
 * Build a v2 LP balance state key.
 *
 * Format: "lp:<poolId>:<address>"
 *
 * @param poolId - The v2 pool ID
 * @param address - User address (base58)
 * @returns State key string
 */
export function lpBalanceKey(poolId: string, address: string): string {
  return `lp:${poolId}:${address}`;
}

/**
 * Parse a v2 pool ID into its components.
 *
 * @param poolId - Pool ID string like "p:DCC:3PAbcd:35"
 * @returns { token0, token1, feeBps } or throws if invalid
 */
export function parsePoolId(poolId: string): {
  token0: string;
  token1: string;
  feeBps: number;
} {
  const parts = poolId.split(':');
  if (parts.length !== 4 || parts[0] !== 'p') {
    throw new Error(`parsePoolId: invalid pool ID "${poolId}"`);
  }
  const [, token0, token1, feeBpsStr] = parts as [string, string, string, string];
  return {
    feeBps: parseInt(feeBpsStr, 10),
    token0,
    token1,
  };
}
