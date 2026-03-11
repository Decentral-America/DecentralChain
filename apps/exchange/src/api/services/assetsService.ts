/**
 * Assets API Service
 * Handles asset-related API calls with React Query
 */
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { nodeClient } from '../client';

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
}

/**
 * Asset Balance Interface
 */
export interface AssetBalance {
  address: string;
  assetId: string;
  balance: number;
}

/**
 * Asset Distribution Interface
 */
export interface AssetDistribution {
  hasNext: boolean;
  lastItem: string | null;
  items: Record<string, number>; // address -> balance mapping
}

/**
 * NFT Collection Interface
 */
export interface NFTCollection {
  assetId: string;
  name: string;
  description: string;
  issuer: string;
  quantity: number;
  decimals: number;
  nft: boolean;
}

/**
 * Fetch Asset Details
 * Returns comprehensive information about a specific asset
 *
 * @param assetId - Asset ID to query
 * @param options - React Query options
 */
export const useAssetDetails = (
  assetId: string,
  options?: {
    enabled?: boolean;
  },
): UseQueryResult<AssetDetails, Error> => {
  return useQuery({
    queryKey: ['asset', 'details', assetId],
    queryFn: async () => {
      const { data } = await nodeClient.get<AssetDetails>(`/assets/details/${assetId}`);
      return data;
    },
    enabled: !!assetId && options?.enabled !== false,
    staleTime: 300000, // 5 minutes - asset details rarely change
  });
};

/**
 * Fetch Multiple Asset Details
 * Returns details for multiple assets in a single query
 *
 * @param assetIds - Array of asset IDs to query
 * @param options - React Query options
 */
export const useMultipleAssetDetails = (
  assetIds: string[],
  options?: {
    enabled?: boolean;
  },
): UseQueryResult<AssetDetails[], Error> => {
  return useQuery({
    queryKey: ['assets', 'details', assetIds.sort().join(',')],
    queryFn: async () => {
      const requests = assetIds.map((id) => nodeClient.get<AssetDetails>(`/assets/details/${id}`));
      const responses = await Promise.all(requests);
      return responses.map((res) => res.data);
    },
    enabled: assetIds.length > 0 && options?.enabled !== false,
    staleTime: 300000, // 5 minutes
  });
};

/**
 * Fetch Asset Balance for Address
 * Returns the balance of a specific asset for an address
 *
 * @param address - DCC address to query
 * @param assetId - Asset ID to query
 * @param options - React Query options
 */
export const useAssetBalance = (
  address: string,
  assetId: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  },
): UseQueryResult<AssetBalance, Error> => {
  return useQuery({
    queryKey: ['asset', 'balance', address, assetId],
    queryFn: async () => {
      const { data } = await nodeClient.get<AssetBalance>(`/assets/balance/${address}/${assetId}`);
      return data;
    },
    enabled: !!address && !!assetId && options?.enabled !== false,
    ...(options?.refetchInterval != null && { refetchInterval: options.refetchInterval }),
    staleTime: 30000, // 30 seconds - balances change frequently
  });
};

/**
 * Fetch Asset Distribution
 * Returns holders and their balances for a specific asset
 *
 * @param assetId - Asset ID to query
 * @param limit - Maximum number of holders to return
 * @param after - Address to start after (for pagination)
 * @param options - React Query options
 */
export const useAssetDistribution = (
  assetId: string,
  limit = 1000,
  after?: string,
  options?: {
    enabled?: boolean;
  },
): UseQueryResult<AssetDistribution, Error> => {
  return useQuery({
    queryKey: ['asset', 'distribution', assetId, limit, after],
    queryFn: async () => {
      const url = after
        ? `/assets/${assetId}/distribution/${limit}/after/${after}`
        : `/assets/${assetId}/distribution/${limit}`;
      const { data } = await nodeClient.get<AssetDistribution>(url);
      return data;
    },
    enabled: !!assetId && options?.enabled !== false,
    staleTime: 300000, // 5 minutes - distribution changes slowly
  });
};

/**
 * Fetch NFT Collections by Issuer
 * Returns all NFTs issued by a specific address
 *
 * @param issuer - Issuer address to query
 * @param limit - Maximum number of NFTs to return
 * @param options - React Query options
 */
export const useNFTsByIssuer = (
  issuer: string,
  limit = 100,
  options?: {
    enabled?: boolean;
  },
): UseQueryResult<NFTCollection[], Error> => {
  return useQuery({
    queryKey: ['nft', 'issuer', issuer, limit],
    queryFn: async () => {
      const { data } = await nodeClient.get<NFTCollection[]>(
        `/assets/nft/${issuer}/limit/${limit}`,
      );
      return data;
    },
    enabled: !!issuer && options?.enabled !== false,
    staleTime: 60000, // 1 minute
  });
};

/**
 * Utility: Check if an asset is DCC (null assetId)
 * @param assetId - Asset ID to check
 */
export const isDCC = (assetId: string | null | undefined): boolean => {
  return !assetId || assetId === 'DCC';
};

/**
 * Utility: Format asset amount with decimals
 * @param amount - Raw amount from API
 * @param decimals - Number of decimals for the asset
 */
export const formatAssetAmount = (amount: number, decimals: number): number => {
  return amount / 10 ** decimals;
};

/**
 * Utility: Parse asset amount to raw value
 * @param amount - Human-readable amount
 * @param decimals - Number of decimals for the asset
 */
export const parseAssetAmount = (amount: number, decimals: number): number => {
  return Math.floor(amount * 10 ** decimals);
};

/**
 * Utility: Get asset display name
 * Falls back to short asset ID if no name available
 * @param asset - Asset details or partial asset info
 */
export const getAssetDisplayName = (
  asset: Pick<AssetDetails, 'name' | 'assetId'> | null | undefined,
): string => {
  if (!asset) return 'Unknown Asset';
  if (asset.name) return asset.name;
  return `${asset.assetId.slice(0, 6)}...${asset.assetId.slice(-4)}`;
};

/**
 * Utility: Check if asset is NFT (non-fungible token)
 * NFTs have quantity=1, decimals=0, and reissuable=false
 * @param asset - Asset details
 */
export const isNFT = (asset: AssetDetails): boolean => {
  return asset.quantity === 1 && asset.decimals === 0 && !asset.reissuable;
};

/**
 * Utility: Calculate total supply in human-readable format
 * @param asset - Asset details
 */
export const getTotalSupply = (asset: AssetDetails): number => {
  return formatAssetAmount(asset.quantity, asset.decimals);
};
