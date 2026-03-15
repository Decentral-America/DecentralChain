/**
 * Address API Service
 * Handles address-related API calls with React Query
 */
import { type UseQueryResult, useQuery } from '@tanstack/react-query';
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
 * Returns DCC and asset balances for a given address
 * Combines data from both /addresses/balance/details and /assets/balance endpoints
 *
 * @param address - DCC address to query
 * @param options - React Query options
 */
export const useAddressBalance = (
  address: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  },
): UseQueryResult<AddressBalance, Error> => {
  return useQuery({
    enabled: !!address && options?.enabled !== false,
    queryFn: async () => {
      // Fetch DCC balance details
      const { data: balanceDetails } = await nodeClient.get<AddressBalance>(
        `/addresses/balance/details/${address}`,
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
        assets, // All token balances
        available: balanceDetails.available ?? 0,
        balance: balanceDetails.available ?? balanceDetails.regular ?? 0,
        effective: balanceDetails.effective ?? 0,
        generating: balanceDetails.generating ?? 0,
        leaseIn: balanceDetails.leaseIn ?? 0,
        leaseOut: balanceDetails.leaseOut ?? 0,
        regular: balanceDetails.regular ?? 0,
      };
    },
    queryKey: ['address', 'balance', address],
    ...(options?.refetchInterval != null && { refetchInterval: options.refetchInterval }),
    staleTime: 30000, // Consider data fresh for 30 seconds
  });
};

/**
 * Fetch Address Transactions
 * Returns transaction history for a given address
 *
 * @param address - DCC address to query
 * @param limit - Maximum number of transactions to return (default: 100)
 * @param options - React Query options
 */
export const useAddressTransactions = (
  address: string,
  limit = 100,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  },
): UseQueryResult<Transaction[][], Error> => {
  return useQuery({
    enabled: !!address && options?.enabled !== false,
    queryFn: async () => {
      const { data } = await nodeClient.get<Transaction[][]>(
        `/transactions/address/${address}/limit/${limit}`,
      );
      return data;
    },
    queryKey: ['address', 'transactions', address, limit],
    ...(options?.refetchInterval != null && { refetchInterval: options.refetchInterval }),
    staleTime: 10000, // Consider data fresh for 10 seconds
  });
};

/**
 * Fetch Address Data Entries
 * Returns data storage entries for a given address
 *
 * @param address - DCC address to query
 * @param options - React Query options
 */
export const useAddressData = (
  address: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  },
): UseQueryResult<AddressData, Error> => {
  return useQuery({
    enabled: !!address && options?.enabled !== false,
    queryFn: async () => {
      const { data } = await nodeClient.get<AddressData>(`/addresses/data/${address}`);
      return data;
    },
    queryKey: ['address', 'data', address],
    ...(options?.refetchInterval != null && { refetchInterval: options.refetchInterval }),
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
  },
): UseQueryResult<Transaction, Error> => {
  return useQuery({
    enabled: !!txId && options?.enabled !== false,
    queryFn: async () => {
      const { data } = await nodeClient.get<Transaction>(`/transactions/info/${txId}`);
      return data;
    },
    queryKey: ['transaction', txId],
    staleTime: Infinity, // Transactions are immutable
  });
};

/**
 * Fetch Address Script Info
 * Returns script information if address has a script set
 *
 * @param address - DCC address to query
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
  },
): UseQueryResult<AddressScriptInfo, Error> => {
  return useQuery({
    enabled: !!address && options?.enabled !== false,
    queryFn: async () => {
      const { data } = await nodeClient.get<AddressScriptInfo>(`/addresses/scriptInfo/${address}`);
      return data;
    },
    queryKey: ['address', 'script', address],
    staleTime: 300000, // Consider data fresh for 5 minutes
  });
};

/**
 * Utility function to convert wavelets to DCC coins
 * @param wavelets - Amount in wavelets (10^8)
 */
export const waveletsToCoins = (wavelets: number): number => {
  return wavelets / 100000000;
};

/**
 * Utility function to convert DCC coins to wavelets
 * @param coins - Amount in DCC
 */
export const coinsToWavelets = (coins: number): number => {
  return Math.floor(coins * 100000000);
};
