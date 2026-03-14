/**
 * AssetName Component
 * Displays asset name/ticker with async loading from blockchain
 */
import { useAssetDetails } from '@/api/services/assetsService';

interface AssetNameProps {
  assetId: string | null | undefined;
  fallback?: string;
}

export const AssetName: React.FC<AssetNameProps> = ({ assetId, fallback = 'DCC' }) => {
  const isDCC = !assetId || assetId === 'DCC' || assetId === '';

  const { data: assetDetails, isLoading } = useAssetDetails(assetId || '', {
    enabled: !isDCC,
  });

  if (isDCC) {
    return <>{fallback}</>;
  }

  if (isLoading) {
    return <>{assetId?.slice(0, 8)}...</>;
  }

  return <>{assetDetails?.name || assetId?.slice(0, 8) + '...' || '???'}</>;
};
