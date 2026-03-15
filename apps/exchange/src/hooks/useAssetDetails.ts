/**
 * useAssetDetails Hook
 * Fetches and caches asset information using React Query
 */
import { type QueryClient, useQueries, useQuery } from '@tanstack/react-query';
import {
  type AssetDetails,
  fetchAssetDetails,
  formatAssetAmount,
  getAssetDisplayName,
  shortenAssetId,
} from '@/services/assetService';

/**
 * Hook options
 */
export interface UseAssetDetailsOptions {
  /**
   * Enable/disable the query
   * @default true
   */
  enabled?: boolean;

  /**
   * Stale time in milliseconds
   * Asset data rarely changes, so we can cache for longer
   * @default 300000 (5 minutes)
   */
  staleTime?: number;

  /**
   * Cache time in milliseconds
   * @default 3600000 (1 hour)
   */
  cacheTime?: number;
}

/**
 * Hook return value with additional helpers
 */
export interface UseAssetDetailsResult {
  /**
   * Asset details data
   */
  data: AssetDetails | null | undefined;

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error state
   */
  error: Error | null;

  /**
   * Success state
   */
  isSuccess: boolean;

  /**
   * Display name (ticker preferred, fallback to name)
   */
  displayName: string;

  /**
   * Format amount with proper decimals
   */
  formatAmount: (amount: number) => string;

  /**
   * Shortened asset ID for display
   */
  shortAssetId: string;
}

/**
 * Fetch and cache asset details for a given asset ID
 *
 * @param assetId - Asset ID to fetch details for (null = DCC)
 * @param options - Query options
 * @returns Asset details query result with helper functions
 *
 * @example
 * ```tsx
 * const { data: asset, displayName, formatAmount, isLoading } = useAssetDetails(assetId);
 *
 * if (isLoading) return <Skeleton />;
 *
 * return (
 *   <div>
 *     {formatAmount(transaction.amount)} {displayName}
 *   </div>
 * );
 * ```
 */
export const useAssetDetails = (
  assetId: string | null | undefined,
  options: UseAssetDetailsOptions = {},
): UseAssetDetailsResult => {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 60 * 60 * 1000, // 1 hour
  } = options;

  // Query asset details
  const query = useQuery({
    enabled: enabled && !!assetId, // Only fetch if assetId is provided
    gcTime: cacheTime, // v5 uses gcTime instead of cacheTime
    queryFn: () => fetchAssetDetails(assetId),
    queryKey: ['asset-details', assetId],
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    staleTime,
  });

  // Null assetId means DCC
  const assetDetails = (assetId ? query.data : null) as AssetDetails | null | undefined;

  // Helper: Get display name
  const displayName = getAssetDisplayName(assetDetails ?? null);

  // Helper: Format amount with proper decimals
  const formatAmount = (amount: number): string => {
    const decimals = assetDetails?.decimals ?? 8; // DCC has 8 decimals
    return formatAssetAmount(amount, decimals);
  };

  // Helper: Shortened asset ID
  const shortAssetId = assetId ? shortenAssetId(assetId) : 'DCC';

  return {
    data: query.data as AssetDetails | null | undefined,
    displayName,
    error: query.error,
    formatAmount,
    isLoading: query.isLoading,
    isSuccess: query.isSuccess,
    shortAssetId,
  };
};

/**
 * Prefetch asset details (useful for preloading)
 *
 * @param queryClient - React Query client
 * @param assetId - Asset ID to prefetch
 *
 * @example
 * ```tsx
 * const queryClient = useQueryClient();
 *
 * useEffect(() => {
 *   // Prefetch common assets
 *   prefetchAssetDetails(queryClient, 'G9TVbwiiUZd5WxFxoY7Tb6ZPjGGLfynJK4a3aoC59cMo');
 * }, []);
 * ```
 */
export const prefetchAssetDetails = async (
  queryClient: QueryClient,
  assetId: string | null | undefined,
): Promise<void> => {
  if (!assetId) return;

  await queryClient.prefetchQuery({
    queryFn: () => fetchAssetDetails(assetId),
    queryKey: ['asset-details', assetId],
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * Hook to fetch multiple assets at once
 * Useful when rendering a list of transactions with different assets
 *
 * @param assetIds - Array of asset IDs to fetch
 * @returns Map of assetId -> asset details result
 *
 * @example
 * ```tsx
 * const assetIds = transactions.map(tx => tx.assetId);
 * const assets = useMultipleAssets(assetIds);
 *
 * transactions.map(tx => {
 *   const asset = assets.get(tx.assetId);
 *   return <div>{asset?.displayName ?? 'Loading...'}</div>;
 * });
 * ```
 */
export const useMultipleAssets = (
  assetIds: (string | null | undefined)[],
): Map<string, UseAssetDetailsResult> => {
  // Filter unique non-null asset IDs
  const uniqueAssetIds = Array.from(new Set(assetIds.filter((id): id is string => !!id)));

  // Fetch each asset using useQueries (avoids calling hooks in a loop)
  const queries = useQueries({
    queries: uniqueAssetIds.map((assetId) => ({
      enabled: !!assetId,
      gcTime: 60 * 60 * 1000,
      queryFn: () => fetchAssetDetails(assetId),
      queryKey: ['asset-details', assetId] as const,
      retry: 2,
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000),
      staleTime: 5 * 60 * 1000,
    })),
  });

  // Build result map
  const assetMap = new Map<string, UseAssetDetailsResult>();
  uniqueAssetIds.forEach((assetId, index) => {
    const query = queries[index];
    const assetDetails = query?.data as AssetDetails | null | undefined;
    const displayName = getAssetDisplayName(assetDetails ?? null);
    const formatAmount = (amount: number): string => {
      const decimals = assetDetails?.decimals ?? 8;
      return formatAssetAmount(amount, decimals);
    };
    const shortAssetId = shortenAssetId(assetId);
    assetMap.set(assetId, {
      data: assetDetails,
      displayName,
      error: query?.error ?? null,
      formatAmount,
      isLoading: query?.isLoading ?? false,
      isSuccess: query?.isSuccess ?? false,
      shortAssetId,
    });
  });

  return assetMap;
};
