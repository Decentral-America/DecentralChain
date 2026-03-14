/**
 * Address API Service
 * Handles address-related API calls with React Query
 */
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { nodeClient } from '../client';

/**
 * Balance Response Interface
 */
export interface AddressBalance {
  address: string;
  /**
   * Regular balance in wavelets (10^8)
   */
  regular?: number;
  /**
   * Available balance in wavelets (10^8)
   */
  available?: number;
  /**
   * Effective balance in wavelets (10^8)
   */
  effective?: number;
  /**
   * Generating balance in wavelets (10^8)
   */
  generating?: number;
  /**
   * Lease in amount in wavelets (10^8)
   */
  leaseIn?: number;
  /**
   * Lease out amount in wavelets (10^8)
   */
  leaseOut?: number;
  /**
   * Alias for regular balance maintained for backwards compatibility
   */
  balance: number;
  /**
   * Asset balances in minimal units keyed by asset ID
   */
  assets: Record<string, number>;
}

/**
 * Transaction Interface
 */
export interface Transaction {
  id: string;
  type: number;
  sender: string;
  senderPublicKey: string;
  fee: number;
  timestamp: number;
  version?: number;
  height: number;
  applicationStatus?: string;
  // Type-specific fields
  recipient?: string;
  amount?: number;
  assetId?: string | null;
  attachment?: string;
  transfers?: Array<{
    recipient: string;
    amount: number;
  }>;
  [key: string]: unknown;
}

/**
 * Address Data Response
 */
export interface AddressData {
  address: string;
  data: Array<{
    key: string;
    type: 'binary' | 'boolean' | 'integer' | 'string';
    value: string | number | boolean;
  }>;
}

/**
 * Fetch Address Balance
 * Returns WAVES and asset balances for a given address
 * Combines data from both /addresses/balance/details and /assets/balance endpoints
 *
 * @param address - Waves address to query
 * @param options - React Query options
 */
export const useAddressBalance = (
  address: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
): UseQueryResult<AddressBalance, Error> => {
  return useQuery({
    queryKey: ['address', 'balance', address],
    queryFn: async () => {
      // Fetch WAVES balance details
      const { data: balanceDetails } = await nodeClient.get<AddressBalance>(
        `/addresses/balance/details/${address}`
      );

      // Fetch all assets balance
      const { data: assetsData } = await nodeClient.get<{
        address: string;
        balances: Array<{
          assetId: string;
          balance: number;
          reissuable: boolean;
          minSponsoredAssetFee?: number;
          sponsorBalance?: number;
          quantity: number;
          issueTransaction: {
            sender: string;
            [key: string]: unknown;
          };
        }>;
      }>(`/assets/balance/${address}`);

      // Build assets object from balances array
      const assets: Record<string, number> = {};
      assetsData.balances.forEach((asset) => {
        assets[asset.assetId] = asset.balance;
      });

      // Combine data
      return {
        address: balanceDetails.address,
        balance: balanceDetails.available ?? balanceDetails.regular ?? 0,
        regular: balanceDetails.regular ?? 0,
        available: balanceDetails.available ?? 0,
        effective: balanceDetails.effective ?? 0,
        generating: balanceDetails.generating ?? 0,
        leaseIn: balanceDetails.leaseIn ?? 0,
        leaseOut: balanceDetails.leaseOut ?? 0,
        assets, // All token balances
      };
    },
    enabled: !!address && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};

/**
 * Fetch Address Transactions
 * Returns transaction history for a given address
 *
 * @param address - Waves address to query
 * @param limit - Maximum number of transactions to return (default: 100)
 * @param options - React Query options
 */
export const useAddressTransactions = (
  address: string,
  limit = 100,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
): UseQueryResult<Transaction[][], Error> => {
  return useQuery({
    queryKey: ['address', 'transactions', address, limit],
    queryFn: async () => {
      const { data } = await nodeClient.get<Transaction[][]>(
        `/transactions/address/${address}/limit/${limit}`
      );
      return data;
    },
    enabled: !!address && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
    staleTime: 10000, // Consider data fresh for 10 seconds
  });
};

/**
 * Fetch Address Data Entries
 * Returns data storage entries for a given address
 *
 * @param address - Waves address to query
 * @param options - React Query options
 */
export const useAddressData = (
  address: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  }
): UseQueryResult<AddressData, Error> => {
  return useQuery({
    queryKey: ['address', 'data', address],
    queryFn: async () => {
      const { data } = await nodeClient.get<AddressData>(`/addresses/data/${address}`);
      return data;
    },
    enabled: !!address && options?.enabled !== false,
    refetchInterval: options?.refetchInterval,
    staleTime: 60000, // Consider data fresh for 1 minute
  });
};

/**
 * Fetch Single Transaction by ID
 * Returns full transaction details
 *
 * @param txId - Transaction ID to query
 * @param options - React Query options
 */
export const useTransaction = (
  txId: string,
  options?: {
    enabled?: boolean;
  }
): UseQueryResult<Transaction, Error> => {
  return useQuery({
    queryKey: ['transaction', txId],
    queryFn: async () => {
      const { data } = await nodeClient.get<Transaction>(`/transactions/info/${txId}`);
      return data;
    },
    enabled: !!txId && options?.enabled !== false,
    staleTime: Infinity, // Transactions are immutable
  });
};

/**
 * Fetch Address Script Info
 * Returns script information if address has a script set
 *
 * @param address - Waves address to query
 * @param options - React Query options
 */
export interface AddressScriptInfo {
  address: string;
  script?: string;
  scriptText?: string;
  complexity: number;
  extraFee: number;
}

export const useAddressScript = (
  address: string,
  options?: {
    enabled?: boolean;
  }
): UseQueryResult<AddressScriptInfo, Error> => {
  return useQuery({
    queryKey: ['address', 'script', address],
    queryFn: async () => {
      const { data } = await nodeClient.get<AddressScriptInfo>(`/addresses/scriptInfo/${address}`);
      return data;
    },
    enabled: !!address && options?.enabled !== false,
    staleTime: 300000, // Consider data fresh for 5 minutes
  });
};

/**
 * Utility function to convert wavelets to WAVES
 * @param wavelets - Amount in wavelets (10^8)
 */
export const waveletsToWaves = (wavelets: number): number => {
  return wavelets / 100000000;
};

/**
 * Utility function to convert WAVES to wavelets
 * @param waves - Amount in WAVES
 */
export const wavesToWavelets = (waves: number): number => {
  return Math.floor(waves * 100000000);
};
