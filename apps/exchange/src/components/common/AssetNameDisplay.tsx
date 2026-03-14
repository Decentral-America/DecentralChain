/**
 * AssetNameDisplay Component
 * Displays asset name/ticker with async loading from blockchain
 * Uses React Query caching to minimize API calls
 */
import { useAssetDetails } from '@/hooks/useAssetDetails';

export interface AssetNameDisplayProps {
  /**
   * Asset ID to display name for (null/undefined = DCC)
   */
  assetId: string | null | undefined;

  /**
   * Fallback text if asset fetch fails
   * @default 'Unknown Asset'
   */
  fallback?: string;

  /**
   * Show ticker only (shorter) vs full name
   * @default true
   */
  preferTicker?: boolean;
}

/**
 * Component that displays asset name with proper async loading
 * Handles loading states gracefully with skeleton
 * Falls back to shortened asset ID if fetch fails
 *
 * @example
 * // Show DCC for native token
 * <AssetNameDisplay assetId={null} />
 *
 * // Show custom asset name with loading state
 * <AssetNameDisplay assetId="G9TVbwiiUZd5WxFxoY7Tb6ZPjGGLfynJK4a3aoC59cMo" />
 */
export const AssetNameDisplay: React.FC<AssetNameDisplayProps> = ({
  assetId,
  fallback = 'Unknown Asset',
  preferTicker = true,
}) => {
  // Always call hook (React hooks rule), but conditionally enable query
  const {
    data: asset,
    isLoading,
    shortAssetId,
  } = useAssetDetails(assetId, {
    enabled: !!assetId, // Only fetch if assetId exists
  });

  // DCC (native token) - no API call needed
  if (!assetId) {
    return <>DCC</>;
  }

  // Loading state - show short asset ID temporarily (non-disruptive)
  if (isLoading) {
    return <>{shortAssetId}</>;
  }

  // Success - show ticker (preferred) or name
  if (asset) {
    const name = preferTicker ? asset.ticker || asset.name : asset.name || asset.ticker;
    return <>{name || shortAssetId}</>;
  }

  // Error/Not found - show shortened asset ID as graceful fallback
  return <>{shortAssetId || fallback}</>;
};
