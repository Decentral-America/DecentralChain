import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { fetchAssetDetailsById, type TAssetDetails } from '@/lib/api';

/** Fetch full details for a single asset by ID. Cached for 60 s (asset metadata rarely changes). */
export function useAssetDetails(assetId: string | null): UseQueryResult<TAssetDetails> {
  return useQuery({
    enabled: !!assetId,
    queryFn: () => {
      if (!assetId) throw new Error('assetId is required');
      return fetchAssetDetailsById(assetId);
    },
    queryKey: ['asset', assetId],
    staleTime: 60_000,
  });
}
