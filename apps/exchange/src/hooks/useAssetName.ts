/**
 * useAssetName Hook
 * Fetches and caches asset names for display in UI
 */
import { useAssetDetails } from '@/api/services/assetsService';

/**
 * Custom hook to get asset name by assetId
 * Returns 'DCC' for native token (null/undefined assetId)
 * Returns asset name for custom tokens
 * Returns assetId as fallback if fetch fails
 *
 * @param assetId - Asset ID to query (null/undefined for DCC)
 * @returns Object with asset name and loading state
 */
export const useAssetName = (assetId: string | null | undefined) => {
  const isDCC = !assetId || assetId === 'DCC' || assetId === '';

  const {
    data: assetDetails,
    isLoading,
    error,
  } = useAssetDetails(assetId ?? '', {
    enabled: !isDCC,
  });

  return {
    decimals: isDCC ? 8 : assetDetails?.decimals || 8,
    error,
    isLoading,
    name: isDCC ? 'DCC' : assetDetails?.name || assetId || 'Unknown',
    ticker: isDCC ? 'DCC' : assetDetails?.name || assetId || '???',
  };
};
