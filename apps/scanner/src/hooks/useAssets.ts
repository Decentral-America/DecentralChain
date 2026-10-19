import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { fetchAssetDetailsById, fetchBatchAssetDetails, type TAssetDetails } from '@/lib/api';
import { type AssetMetaMap, toAssetMetaMap } from '@/lib/assetAmount';

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

const NO_ASSETS: AssetMetaMap = {};

/** Display metadata (decimals, name) for a set of non-native asset ids, batched in one request. */
export function useAssetMetas(assetIds: readonly string[]): AssetMetaMap {
  const ids = [...new Set(assetIds)].sort();
  const { data } = useQuery({
    enabled: ids.length > 0,
    queryFn: async () => toAssetMetaMap(await fetchBatchAssetDetails(ids)),
    queryKey: ['asset-metas', ids],
    staleTime: 60_000,
  });
  return data ?? NO_ASSETS;
}
