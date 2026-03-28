/**
 * DEX WebSocket Hook
 * Real-time order book and trade updates
 */
import { useCallback, useEffect, useState } from 'react';
import { type OrderBook, type Trade } from '@/api/services/matcherService';
import { config } from '@/config';
import { createWebSocketUrl, useWebSocketChannel } from '@/services/websocket';
import { useDexStore } from '@/stores/dexStore';

/**
 * Order Book Update Message
 */
interface OrderBookUpdate {
  timestamp: number;
  pair: {
    amountAsset: string;
    priceAsset: string;
  };
  bids: Array<{ price: number; amount: number }>;
  asks: Array<{ price: number; amount: number }>;
}

/**
 * Trade Update Message
 */
interface TradeUpdate {
  id: string;
  timestamp: number;
  price: number;
  amount: number;
  type: 'buy' | 'sell';
  pair: string;
}

/**
 * Hook: useDexOrderBook
 * Subscribe to real-time order book updates for selected trading pair
 */
export const useDexOrderBook = () => {
  const { selectedPair } = useDexStore();
  const [orderBook, setOrderBook] = useState<OrderBook | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(0);
  const [isLive, setIsLive] = useState(false);

  // Create WebSocket URL from matcher URL
  const wsUrl = createWebSocketUrl(config.matcherUrl);

  // Build channel name for current pair
  const channel = selectedPair
    ? `orderbook:${selectedPair.amountAsset}/${selectedPair.priceAsset}`
    : '';

  // Handle order book updates
  const handleOrderBookUpdate = useCallback((data: OrderBookUpdate) => {
    setOrderBook({
      asks: data.asks,
      bids: data.bids,
      pair: data.pair,
      timestamp: data.timestamp,
    });
    setLastUpdate(Date.now());
    setIsLive(true);
  }, []);

  // Subscribe to order book channel
  useWebSocketChannel<OrderBookUpdate>(
    { debug: config.enableDebug, url: wsUrl },
    channel,
    handleOrderBookUpdate,
    !!selectedPair, // Only subscribe when pair is selected
  );

  // Reset state when pair changes
  useEffect(() => {
    setOrderBook(null);
    setIsLive(false);
  }, []);

  return {
    isLive,
    lastUpdate,
    orderBook,
    selectedPair,
  };
};

/**
 * Hook: useDexTrades
 * Subscribe to real-time trade updates for selected trading pair
 */
export const useDexTrades = () => {
  const { selectedPair } = useDexStore();
  const [trades, setTrades] = useState<Trade[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(0);

  // Create WebSocket URL from matcher URL
  const wsUrl = createWebSocketUrl(config.matcherUrl);

  // Build channel name for current pair
  const channel = selectedPair
    ? `trades:${selectedPair.amountAsset}/${selectedPair.priceAsset}`
    : '';

  // Handle trade updates
  const handleTradeUpdate = useCallback((data: TradeUpdate) => {
    setTrades((prev) => {
      // Add new trade to the beginning
      const newTrades = [data as Trade, ...prev];
      // Keep only last 100 trades
      return newTrades.slice(0, 100);
    });
    setLastUpdate(Date.now());
  }, []);

  // Subscribe to trades channel
  useWebSocketChannel<TradeUpdate>(
    { debug: config.enableDebug, url: wsUrl },
    channel,
    handleTradeUpdate,
    !!selectedPair,
  );

  // Reset state when pair changes
  useEffect(() => {
    setTrades([]);
  }, []);

  return {
    lastUpdate,
    selectedPair,
    trades,
  };
};

/**
 * Hook: useDexUserOrders
 * Subscribe to user's order updates (fills, cancellations)
 */
export const useDexUserOrders = (userAddress?: string) => {
  const [orderUpdates, setOrderUpdates] = useState<
    Array<{
      orderId: string;
      status: string;
      timestamp: number;
    }>
  >([]);

  // Create WebSocket URL from matcher URL
  const wsUrl = createWebSocketUrl(config.matcherUrl);

  // Build channel name for user
  const channel = userAddress ? `user:${userAddress}:orders` : '';

  // Handle order updates
  const handleOrderUpdate = useCallback(
    (data: { orderId: string; status: string; timestamp: number }) => {
      setOrderUpdates((prev) => {
        const newUpdates = [data, ...prev];
        // Keep only last 50 updates
        return newUpdates.slice(0, 50);
      });
    },
    [],
  );

  // Subscribe to user orders channel
  useWebSocketChannel(
    { debug: config.enableDebug, url: wsUrl },
    channel,
    handleOrderUpdate,
    !!userAddress,
  );

  // Reset state when user changes
  useEffect(() => {
    setOrderUpdates([]);
  }, []);

  return {
    orderUpdates,
    userAddress,
  };
};

/**
 * Hook: useDexWebSocket (Combined)
 * Unified hook for all DEX WebSocket subscriptions
 */
export const useDexWebSocket = (options?: {
  enableOrderBook?: boolean;
  enableTrades?: boolean;
  enableUserOrders?: boolean;
  userAddress?: string;
}) => {
  const {
    enableOrderBook = true,
    enableTrades = true,
    enableUserOrders = false,
    userAddress,
  } = options ?? {};

  // Subscribe to order book if enabled
  const orderBookData = useDexOrderBook();
  const orderBook = enableOrderBook ? orderBookData : null;

  // Subscribe to trades if enabled
  const tradesData = useDexTrades();
  const trades = enableTrades ? tradesData : null;

  // Subscribe to user orders if enabled and address provided
  const userOrdersData = useDexUserOrders(enableUserOrders ? userAddress : undefined);
  const userOrders = enableUserOrders && userAddress ? userOrdersData : null;

  return {
    orderBook: orderBook?.orderBook,
    orderBookIsLive: orderBook?.isLive,
    orderBookLastUpdate: orderBook?.lastUpdate,

    orderUpdates: userOrders?.orderUpdates,

    trades: trades?.trades,
    tradesLastUpdate: trades?.lastUpdate,
  };
};

/**
 * Utility: Calculate order book spread
 * @param orderBook - Order book data
 */
export const calculateSpread = (orderBook: OrderBook | null): number => {
  if (!orderBook || orderBook.bids.length === 0 || orderBook.asks.length === 0) {
    return 0;
  }

  const bestBid = orderBook.bids[0]?.price ?? 0;
  const bestAsk = orderBook.asks[0]?.price ?? 0;

  return bestAsk - bestBid;
};

/**
 * Utility: Calculate spread percentage
 * @param orderBook - Order book data
 */
export const calculateSpreadPercentage = (orderBook: OrderBook | null): number => {
  if (!orderBook || orderBook.bids.length === 0 || orderBook.asks.length === 0) {
    return 0;
  }

  const spread = calculateSpread(orderBook);
  const bestAsk = orderBook.asks[0]?.price ?? 0;

  if (bestAsk === 0) return 0;

  return (spread / bestAsk) * 100;
};

/**
 * Utility: Get mid-market price
 * @param orderBook - Order book data
 */
export const getMidMarketPrice = (orderBook: OrderBook | null): number => {
  if (!orderBook || orderBook.bids.length === 0 || orderBook.asks.length === 0) {
    return 0;
  }

  const bestBid = orderBook.bids[0]?.price ?? 0;
  const bestAsk = orderBook.asks[0]?.price ?? 0;

  return (bestBid + bestAsk) / 2;
};

/**
 * Utility: Get total liquidity at depth
 * @param orderBook - Order book data
 * @param depth - Number of price levels to consider
 */
export const getTotalLiquidity = (
  orderBook: OrderBook | null,
  depth = 10,
): { bidLiquidity: number; askLiquidity: number; totalLiquidity: number } => {
  if (!orderBook) {
    return { askLiquidity: 0, bidLiquidity: 0, totalLiquidity: 0 };
  }

  const bidLiquidity = orderBook.bids
    .slice(0, depth)
    .reduce((sum, order) => sum + order.amount * order.price, 0);

  const askLiquidity = orderBook.asks
    .slice(0, depth)
    .reduce((sum, order) => sum + order.amount * order.price, 0);

  return {
    askLiquidity,
    bidLiquidity,
    totalLiquidity: bidLiquidity + askLiquidity,
  };
};
