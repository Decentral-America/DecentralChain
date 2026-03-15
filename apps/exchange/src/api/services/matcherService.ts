/**
 * Matcher API Service
 * Handles DEX matcher endpoints for trading operations
 */
import {
  type UseMutationResult,
  type UseQueryResult,
  useMutation,
  useQuery,
} from '@tanstack/react-query';
import * as ds from 'data-service';
import { logger } from '@/lib/logger';
import { matcherClient } from '../client';

/**
 * Order Side Enum
 */
export type OrderSide = 'buy' | 'sell';

/**
 * Order Status Enum
 */
export type OrderStatus = 'Accepted' | 'PartiallyFilled' | 'Filled' | 'Cancelled';

/**
 * Order Book Entry
 */
export interface OrderBookEntry {
  price: number;
  amount: number;
}

/**
 * Order Book Response
 */
export interface OrderBook {
  timestamp: number;
  pair: {
    amountAsset: string;
    priceAsset: string;
  };
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

/**
 * Order Interface
 */
export interface Order {
  id: string;
  type: OrderSide;
  orderType: 'limit' | 'market';
  amount: number;
  price: number;
  timestamp: number;
  expiration: number;
  matcherFee: number;
  status: OrderStatus;
  assetPair: {
    amountAsset: string;
    priceAsset: string;
  };
  filled: number;
  filledFee?: number;
  avgFilledPrice?: number;
}

/**
 * Trade/Match Interface
 */
export interface Trade {
  id: string;
  timestamp: number;
  price: number;
  amount: number;
  type: OrderSide; // buyer or seller perspective
  pair: string;
}

/**
 * Order Creation Data
 */
export interface CreateOrderData {
  orderType: 'limit' | 'market';
  amount: number;
  price?: number; // Optional for market orders
  matcherFee: number;
  matcherPublicKey: string;
  assetPair: {
    amountAsset: string;
    priceAsset: string;
  };
  timestamp: number;
  expiration: number;
  senderPublicKey: string;
  proofs: string[];
}

/**
 * Matcher Settings
 */
export interface MatcherSettings {
  matcherPublicKey: string;
  matcherVersion: string;
  priceAssets: string[];
  orderFee: {
    dynamic: {
      baseFee: number;
    };
  };
}

/**
 * Trading Pair Info
 */
export interface TradingPairInfo {
  amountAsset: string;
  amountAssetName: string;
  amountAssetInfo?: {
    decimals: number;
  };
  priceAsset: string;
  priceAssetName: string;
  priceAssetInfo?: {
    decimals: number;
  };
  created: number;
}

/**
 * Fetch Order Book
 * Returns current bids and asks for a trading pair
 * Uses data-service for proper Money/BigNumber conversion
 *
 * @param amountAsset - Amount asset ID
 * @param priceAsset - Price asset ID
 * @param depth - Number of price levels to return (default 50)
 * @param options - React Query options
 */
export const useOrderBook = (
  amountAsset: string,
  priceAsset: string,
  depth = 50,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  },
): UseQueryResult<OrderBook, Error> => {
  return useQuery({
    enabled: !!amountAsset && !!priceAsset && options?.enabled !== false,
    queryFn: async () => {
      // Use data-service which properly converts Money objects
      interface DsOrderEntry {
        amount: { getTokens(): { toNumber(): number } };
        price: { getTokens(): { toNumber(): number } };
      }
      interface DsOrderBook {
        bids: DsOrderEntry[];
        asks: DsOrderEntry[];
        pair: { amountAsset: { id: string }; priceAsset: { id: string } };
      }
      const orderBookData = (await ds.api.matcher.getOrderBook(
        amountAsset,
        priceAsset,
      )) as DsOrderBook;

      // Convert Money objects to numbers (in token units, not smallest units)
      const bids = orderBookData.bids.slice(0, depth).map((bid) => ({
        amount: bid.amount.getTokens().toNumber(),
        price: bid.price.getTokens().toNumber(),
      }));

      const asks = orderBookData.asks.slice(0, depth).map((ask) => ({
        amount: ask.amount.getTokens().toNumber(),
        price: ask.price.getTokens().toNumber(),
      }));

      return {
        asks,
        bids,
        pair: {
          amountAsset: orderBookData.pair.amountAsset.id,
          priceAsset: orderBookData.pair.priceAsset.id,
        },
        timestamp: Date.now(),
      };
    },
    queryKey: ['orderbook', amountAsset, priceAsset, depth],
    refetchInterval: options?.refetchInterval ?? 5000, // 5 seconds for real-time updates
    refetchOnWindowFocus: false, // Don't refetch on window focus to reduce load
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    staleTime: 3000, // 3 seconds
  });
};

/**
 * Fetch User Orders
 * Returns all active orders for a specific address
 * Note: This requires proper authentication with the matcher
 * The endpoint expects public key, not address
 *
 * @param address - User address (or public key)
 * @param amountAsset - Optional: filter by amount asset
 * @param priceAsset - Optional: filter by price asset
 * @param options - React Query options
 */
export const useUserOrders = (
  address: string,
  amountAsset?: string,
  priceAsset?: string,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  },
): UseQueryResult<Order[], Error> => {
  return useQuery({
    // Disable by default until authentication is implemented
    enabled: false, // was: !!address && options?.enabled !== false,
    queryFn: async () => {
      // For now, return empty array as this requires proper matcher authentication
      // TODO: Implement proper matcher signature authentication
      logger.warn('User orders require matcher authentication - not yet implemented');
      return [];

      // Original implementation (requires authentication):
      // const activeOnly = true;
      // const { data } = await matcherClient.get<Order[]>(`/orderbook/${address}?activeOnly=${activeOnly}`);
      // return data;
    },
    queryKey: ['orders', address, amountAsset, priceAsset],
    refetchInterval: options?.refetchInterval ?? 10000, // 10 seconds
    refetchOnWindowFocus: false,
    retry: 0, // Don't retry since it's not implemented
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5000,
  });
};

/**
 * Fetch Order History
 * Returns historical orders for a user
 *
 * @param address - User address
 * @param activeOnly - Filter to active orders only
 * @param options - React Query options
 */
export const useOrderHistory = (
  address: string,
  activeOnly = false,
  options?: {
    enabled?: boolean;
  },
): UseQueryResult<Order[], Error> => {
  return useQuery({
    enabled: !!address && options?.enabled !== false,
    queryFn: async () => {
      const status = activeOnly ? '/activeOnly' : '';
      const { data } = await matcherClient.get<Order[]>(`/orderbook/${address}${status}`);
      return data;
    },
    queryKey: ['orders', 'history', address, activeOnly],
    staleTime: 30000, // 30 seconds
  });
};

/**
 * Fetch Trade History
 * Returns recent trades for a trading pair
 * Note: Trades come from exchange transactions on the blockchain,
 * not from the matcher API. This requires using the data-service.
 *
 * @param amountAsset - Amount asset ID
 * @param priceAsset - Price asset ID
 * @param limit - Number of trades to return
 * @param options - React Query options
 */
export const useTradeHistory = (
  amountAsset: string,
  priceAsset: string,
  limit = 100,
  options?: {
    enabled?: boolean;
    refetchInterval?: number;
  },
): UseQueryResult<Trade[], Error> => {
  return useQuery({
    enabled: false, // Disable until data-service integration is complete
    queryFn: async () => {
      // TODO: Implement using data-service getExchangeTxs
      // For now, return empty array as the matcher doesn't have a trades endpoint
      logger.warn('Trade history requires data-service integration - returning empty array');
      return [];

      // Original implementation (incorrect - matcher doesn't have /trades endpoint):
      // const { data } = await matcherClient.get<Trade[]>(
      //   `/trades/${amountAsset}/${priceAsset}?limit=${limit}`
      // );
      // return data;
    },
    queryKey: ['trades', amountAsset, priceAsset, limit],
    refetchInterval: options?.refetchInterval ?? 10000, // 10 seconds
    refetchOnWindowFocus: false,
    retry: 0, // Don't retry
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5000,
  });
};

/**
 * Fetch Matcher Settings
 * Returns matcher configuration and supported assets
 *
 * @param options - React Query options
 */
export const useMatcherSettings = (options?: {
  enabled?: boolean;
}): UseQueryResult<MatcherSettings, Error> => {
  return useQuery({
    enabled: options?.enabled !== false,
    queryFn: async () => {
      // Use empty string because matcherClient base URL is already '/matcher'
      const { data } = await matcherClient.get<MatcherSettings>('/');
      return data;
    },
    queryKey: ['matcher', 'settings'],
    staleTime: 300000, // 5 minutes - settings rarely change
  });
};

/**
 * Fetch Trading Pairs
 * Returns all available trading pairs
 *
 * @param options - React Query options
 */
export const useTradingPairs = (options?: {
  enabled?: boolean;
}): UseQueryResult<TradingPairInfo[], Error> => {
  return useQuery({
    enabled: options?.enabled !== false,
    queryFn: async () => {
      const { data } = await matcherClient.get<TradingPairInfo[]>('/orderbook');
      return data;
    },
    queryKey: ['matcher', 'pairs'],
    staleTime: 60000, // 1 minute
  });
};

/**
 * Place Order Mutation
 * Creates a new order on the matcher
 */
export const usePlaceOrder = (): UseMutationResult<Order, Error, CreateOrderData> => {
  return useMutation({
    mutationFn: async (orderData: CreateOrderData) => {
      const { data } = await matcherClient.post<Order>('/orderbook', orderData);
      return data;
    },
  });
};

/**
 * Cancel Order Mutation
 * Cancels an existing order
 */
export const useCancelOrder = (): UseMutationResult<
  { status: string; message: string },
  Error,
  { orderId: string; sender: string; signature: string }
> => {
  return useMutation<
    { status: string; message: string },
    Error,
    { orderId: string; sender: string; signature: string }
  >({
    mutationFn: async ({ orderId, sender, signature }) => {
      const { data } = await matcherClient.post<{ status: string; message: string }>(
        `/orderbook/${orderId}/cancel`,
        {
          sender,
          signature,
        },
      );
      return data;
    },
  });
};

/**
 * Cancel All Orders Mutation
 * Cancels all active orders for a user
 */
export const useCancelAllOrders = (): UseMutationResult<
  { status: string; message: string },
  Error,
  { sender: string; timestamp: number; signature: string }
> => {
  return useMutation<
    { status: string; message: string },
    Error,
    { sender: string; timestamp: number; signature: string }
  >({
    mutationFn: async ({ sender, timestamp, signature }) => {
      const { data } = await matcherClient.post<{ status: string; message: string }>(
        '/orderbook/cancel',
        {
          sender,
          signature,
          timestamp,
        },
      );
      return data;
    },
  });
};

/**
 * Utility: Calculate order total (price * amount)
 * @param price - Order price
 * @param amount - Order amount
 */
export const calculateOrderTotal = (price: number, amount: number): number => {
  return price * amount;
};

/**
 * Utility: Calculate fill percentage
 * @param order - Order object
 */
export const getOrderFillPercentage = (order: Order): number => {
  if (order.amount === 0) return 0;
  return (order.filled / order.amount) * 100;
};

/**
 * Utility: Check if order is active
 * @param order - Order object
 */
export const isOrderActive = (order: Order): boolean => {
  return order.status === 'Accepted' || order.status === 'PartiallyFilled';
};

/**
 * Utility: Format trading pair
 * @param amountAsset - Amount asset ID or name
 * @param priceAsset - Price asset ID or name
 */
export const formatTradingPair = (amountAsset: string, priceAsset: string): string => {
  return `${amountAsset}/${priceAsset}`;
};
