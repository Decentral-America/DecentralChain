/**
 * DEX Store
 * Zustand store for managing DecentralChain DEX trading state
 * Handles trading pairs, order book, user orders, and market data
 */
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * Trading pair representing asset pair for trading
 */
export interface TradingPair {
  amountAsset: string; // Asset being traded (amount asset ID)
  priceAsset: string; // Asset used for pricing (price asset ID)
  amountAssetName?: string; // Display name for amount asset
  priceAssetName?: string; // Display name for price asset
}

/**
 * Order in the order book or user's order history
 */
export interface Order {
  id: string;
  type: 'buy' | 'sell';
  price: string; // Price as string to maintain precision
  amount: string; // Amount as string to maintain precision
  filled?: string; // Amount filled for partially filled orders
  timestamp: number;
  status?: 'pending' | 'filled' | 'partially_filled' | 'cancelled';
}

/**
 * Order book containing bids (buy orders) and asks (sell orders)
 */
export interface OrderBook {
  bids: Order[]; // Buy orders (sorted by price descending)
  asks: Order[]; // Sell orders (sorted by price ascending)
  lastUpdate?: number; // Timestamp of last update
}

/**
 * Market data for current trading pair
 */
export interface MarketData {
  currentPrice: number;
  lastPrice: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  priceChange24h: number;
  priceChangePercent24h: number;
}

/**
 * DEX State interface
 */
interface DexState {
  // Trading pair selection
  selectedPair: TradingPair | null;
  setSelectedPair: (pair: TradingPair) => void;

  // Order book
  orderBook: OrderBook;
  updateOrderBook: (orderBook: OrderBook) => void;

  // User orders
  userOrders: Order[];
  addUserOrder: (order: Order) => void;
  removeUserOrder: (orderId: string) => void;
  updateUserOrder: (orderId: string, updates: Partial<Order>) => void;
  clearUserOrders: () => void;

  // Market data
  marketData: MarketData;
  updateMarketData: (data: Partial<MarketData>) => void;

  // Loading states
  isOrderBookLoading: boolean;
  isMarketDataLoading: boolean;
  setOrderBookLoading: (loading: boolean) => void;
  setMarketDataLoading: (loading: boolean) => void;

  // Reset functionality
  reset: () => void;
}

/**
 * Initial market data state
 */
const initialMarketData: MarketData = {
  currentPrice: 0,
  high24h: 0,
  lastPrice: 0,
  low24h: 0,
  priceChange24h: 0,
  priceChangePercent24h: 0,
  volume24h: 0,
};

/**
 * Zustand DEX store with devtools middleware for debugging
 */
export const useDexStore = create<DexState>()(
  devtools(
    (set) => ({
      // User order actions
      addUserOrder: (order) =>
        set(
          (state) => ({
            userOrders: [...state.userOrders, order],
          }),
          false,
          'dex/addUserOrder',
        ),

      clearUserOrders: () => set({ userOrders: [] }, false, 'dex/clearUserOrders'),
      isMarketDataLoading: false,
      isOrderBookLoading: false,
      marketData: initialMarketData,
      orderBook: { asks: [], bids: [] },

      removeUserOrder: (orderId) =>
        set(
          (state) => ({
            userOrders: state.userOrders.filter((o) => o.id !== orderId),
          }),
          false,
          'dex/removeUserOrder',
        ),

      // Reset store
      reset: () =>
        set(
          {
            isMarketDataLoading: false,
            isOrderBookLoading: false,
            marketData: initialMarketData,
            orderBook: { asks: [], bids: [] },
            selectedPair: null,
            userOrders: [],
          },
          false,
          'dex/reset',
        ),
      // Initial state
      selectedPair: null,

      setMarketDataLoading: (loading) =>
        set({ isMarketDataLoading: loading }, false, 'dex/setMarketDataLoading'),

      // Loading state actions
      setOrderBookLoading: (loading) =>
        set({ isOrderBookLoading: loading }, false, 'dex/setOrderBookLoading'),

      // Trading pair actions
      setSelectedPair: (pair) => set({ selectedPair: pair }, false, 'dex/setSelectedPair'),

      // Market data actions
      updateMarketData: (data) =>
        set(
          (state) => ({
            marketData: { ...state.marketData, ...data },
          }),
          false,
          'dex/updateMarketData',
        ),

      // Order book actions
      updateOrderBook: (orderBook) =>
        set({ orderBook: { ...orderBook, lastUpdate: Date.now() } }, false, 'dex/updateOrderBook'),

      updateUserOrder: (orderId, updates) =>
        set(
          (state) => ({
            userOrders: state.userOrders.map((order) =>
              order.id === orderId ? { ...order, ...updates } : order,
            ),
          }),
          false,
          'dex/updateUserOrder',
        ),
      userOrders: [],
    }),
    { name: 'DEX Store' },
  ),
);

/**
 * Selectors for efficient state access
 */
export const selectSelectedPair = (state: DexState) => state.selectedPair;
export const selectOrderBook = (state: DexState) => state.orderBook;
export const selectUserOrders = (state: DexState) => state.userOrders;
export const selectMarketData = (state: DexState) => state.marketData;
export const selectIsLoading = (state: DexState) =>
  state.isOrderBookLoading || state.isMarketDataLoading;
