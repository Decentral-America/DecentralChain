/**
 * Asset Service
 * Handles fetching and caching asset information from the blockchain
 */
import { config } from '@/config';
import { logger } from '@/lib/logger';

/**
 * Asset Details Interface
 */
export interface AssetDetails {
  assetId: string;
  issueHeight: number;
  issueTimestamp: number;
  issuer: string;
  issuerPublicKey: string;
  name: string;
  description: string;
  decimals: number;
  reissuable: boolean;
  quantity: number;
  scripted: boolean;
  minSponsoredAssetFee: number | null;
  originTransactionId: string;
  ticker?: string; // Some assets have ticker in name
}

/**
 * Error thrown when asset details cannot be fetched
 */
export class AssetNotFoundError extends Error {
  constructor(assetId: string) {
    super(`Asset not found: ${assetId}`);
    this.name = 'AssetNotFoundError';
  }
}

/**
 * Fetch asset details from blockchain node
 *
 * @param assetId - The asset ID to fetch details for
 * @returns Asset details or null if assetId is null (DCC)
 * @throws AssetNotFoundError if asset cannot be found
 * @throws Error if network request fails
 */
export const fetchAssetDetails = async (
  assetId: string | null | undefined,
): Promise<AssetDetails | null> => {
  // Null assetId means DCC (native token)
  if (!assetId) {
    return null;
  }

  try {
    const response = await fetch(`${config.nodeUrl}/assets/details/${assetId}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new AssetNotFoundError(assetId);
      }
      throw new Error(`Failed to fetch asset details: ${response.statusText}`);
    }

    const data = await response.json();
    return data as AssetDetails;
  } catch (error) {
    if (error instanceof AssetNotFoundError) {
      throw error;
    }
    // Re-throw network or parsing errors
    throw new Error(
      `Asset service error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

/**
 * Fetch multiple asset details in batch
 * Optimizes multiple asset lookups by parallel fetching
 *
 * @param assetIds - Array of asset IDs to fetch
 * @returns Map of assetId -> AssetDetails (DCC/null entries are excluded)
 */
export const fetchMultipleAssetDetails = async (
  assetIds: (string | null | undefined)[],
): Promise<Map<string, AssetDetails>> => {
  // Filter out nulls and duplicates
  const uniqueAssetIds = Array.from(new Set(assetIds.filter((id): id is string => !!id)));

  if (uniqueAssetIds.length === 0) {
    return new Map();
  }

  try {
    // Fetch all assets in parallel
    const results = await Promise.allSettled(uniqueAssetIds.map((id) => fetchAssetDetails(id)));

    const assetMap = new Map<string, AssetDetails>();

    results.forEach((result, index) => {
      const assetId = uniqueAssetIds[index];
      if (assetId && result.status === 'fulfilled' && result.value) {
        assetMap.set(assetId, result.value);
      }
      // Silently skip failed asset fetches (they'll use fallback display)
    });

    return assetMap;
  } catch (error) {
    logger.error('Batch asset fetch error:', error);
    return new Map();
  }
};

/**
 * Extract ticker from asset name
 * Many assets have ticker in their name like "CR Coin (CRC)"
 *
 * @param name - Asset name
 * @returns Extracted ticker or the name itself
 */
export const extractTickerFromName = (name: string): string => {
  // Try to extract ticker from patterns like "Name (TICKER)"
  const match = name.match(/\(([A-Z0-9]+)\)$/);
  if (match?.[1]) {
    return match[1];
  }

  // If name is short (3-5 chars), assume it's already a ticker
  if (name.length >= 3 && name.length <= 5 && /^[A-Z0-9]+$/.test(name)) {
    return name;
  }

  // Otherwise return the full name
  return name;
};

/**
 * Get display name for asset (ticker preferred, fallback to name)
 *
 * @param assetDetails - Asset details object
 * @returns Display name (ticker or name)
 */
export const getAssetDisplayName = (assetDetails: AssetDetails | null): string => {
  if (!assetDetails) {
    return 'DCC';
  }

  // Use ticker if explicitly defined
  if (assetDetails.ticker) {
    return assetDetails.ticker;
  }

  // Try to extract ticker from name
  return extractTickerFromName(assetDetails.name);
};

/**
 * Format asset amount with proper decimals
 *
 * @param amount - Raw amount (smallest unit)
 * @param decimals - Number of decimal places
 * @returns Formatted amount string
 */
export const formatAssetAmount = (amount: number, decimals: number): string => {
  const divisor = 10 ** decimals;
  const value = amount / divisor;

  // Show up to decimal places, but remove trailing zeros
  return value.toFixed(decimals).replace(/\.?0+$/, '');
};

/**
 * Shorten asset ID for display
 *
 * @param assetId - Full asset ID
 * @param length - Number of characters to show on each end
 * @returns Shortened asset ID like "G9TVb...C59cMo"
 */
export const shortenAssetId = (assetId: string, length = 5): string => {
  if (assetId.length <= length * 2 + 3) {
    return assetId;
  }
  return `${assetId.slice(0, length)}...${assetId.slice(-length)}`;
};
