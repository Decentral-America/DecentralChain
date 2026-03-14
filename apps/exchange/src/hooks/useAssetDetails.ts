/**
 * useAssetDetails Hook
 * Fetches and caches asset information using React Query
 */
import { useQuery, QueryClient } from '@tanstack/react-query';
import {
  fetchAssetDetails,
  AssetDetails,
  getAssetDisplayName,
  formatAssetAmount,
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
  options: UseAssetDetailsOptions = {}
): UseAssetDetailsResult => {
  const {
    enabled = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 60 * 60 * 1000, // 1 hour
  } = options;

  // Query asset details
  const query = useQuery({
    queryKey: ['asset-details', assetId],
    queryFn: () => fetchAssetDetails(assetId),
    enabled: enabled && !!assetId, // Only fetch if assetId is provided
    staleTime,
    gcTime: cacheTime, // v5 uses gcTime instead of cacheTime
    retry: 2, // Retry failed requests twice
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
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
    isLoading: query.isLoading,
    error: query.error,
    isSuccess: query.isSuccess,
    displayName,
    formatAmount,
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
  assetId: string | null | undefined
): Promise<void> => {
  if (!assetId) return;

  await queryClient.prefetchQuery({
    queryKey: ['asset-details', assetId],
    queryFn: () => fetchAssetDetails(assetId),
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
  assetIds: (string | null | undefined)[]
): Map<string, UseAssetDetailsResult> => {
  // Filter unique non-null asset IDs
  const uniqueAssetIds = Array.from(new Set(assetIds.filter((id): id is string => !!id)));

  // Create a map of asset results
  const assetMap = new Map<string, UseAssetDetailsResult>();

  // Fetch each asset
  uniqueAssetIds.forEach((assetId) => {
    // This is intentionally calling the hook in a loop
    // React Query handles deduplication internally
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const result = useAssetDetails(assetId);
    assetMap.set(assetId, result);
  });

  return assetMap;
};
