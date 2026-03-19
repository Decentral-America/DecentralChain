import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import {
  fetchActiveLeases,
  fetchAddressNFTs,
  fetchAssetsBalance,
  fetchBalanceDetails,
  type IBalanceDetails,
  type TAssetDetails,
  type TAssetsBalance,
} from '@/lib/api';
import { type Lease } from '@/types';

/** Fetch full balance details (regular, generating, available, effective) for an address. */
export function useAddressBalance(address: string | null): UseQueryResult<IBalanceDetails> {
  return useQuery({
    enabled: !!address,
    queryFn: () => fetchBalanceDetails(address!),
    queryKey: ['balanceDetails', address],
    staleTime: 10_000,
  });
}

/** Fetch all asset balances (fungible tokens) held by an address. */
export function useAddressAssets(address: string | null): UseQueryResult<TAssetsBalance> {
  return useQuery({
    enabled: !!address,
    queryFn: () => fetchAssetsBalance(address!),
    queryKey: ['addressAssets', address],
    staleTime: 10_000,
  });
}

/** Fetch NFTs held by an address (default: up to 100). */
export function useAddressNFTs(
  address: string | null,
  limit = 100,
): UseQueryResult<TAssetDetails[]> {
  return useQuery({
    enabled: !!address,
    queryFn: () => fetchAddressNFTs(address!, limit),
    queryKey: ['addressNFTs', address, limit],
    staleTime: 30_000,
  });
}

/** Fetch all active leases originating from an address. */
export function useActiveLeases(address: string | null): UseQueryResult<Lease[]> {
  return useQuery({
    enabled: !!address,
    queryFn: () => fetchActiveLeases(address!) as Promise<Lease[]>,
    queryKey: ['activeLeases', address],
    staleTime: 10_000,
  });
}
