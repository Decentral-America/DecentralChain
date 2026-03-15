/**
 * useAdminTradingPairs Hook
 * Provides access to admin-configured DEX trading pairs from localStorage
 */
import { useEffect, useState } from 'react';
import { logger } from '@/lib/logger';

export interface AdminTradingPair {
  id: string;
  amountAsset: {
    id: string;
    name: string;
    ticker: string;
    decimals: number;
  };
  priceAsset: {
    id: string;
    name: string;
    ticker: string;
    decimals: number;
  };
  enabled: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'dex_trading_pairs';

export const useAdminTradingPairs = () => {
  const [pairs, setPairs] = useState<AdminTradingPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPairs = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const allPairs: AdminTradingPair[] = JSON.parse(stored);
          // Only return enabled pairs, sorted by sortOrder
          const enabledPairs = allPairs
            .filter((pair) => pair.enabled)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          setPairs(enabledPairs);
        } else {
          // No pairs configured yet
          setPairs([]);
        }
      } catch (error) {
        logger.error('Failed to load admin trading pairs:', error);
        setPairs([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadPairs();

    // Listen for storage changes (in case admin panel updates pairs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        loadPairs();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Get featured pairs
  const featuredPairs = pairs.filter((pair) => pair.featured);

  // Get pair by ID
  const getPairById = (id: string) => pairs.find((pair) => pair.id === id);

  // Get pair by tickers
  const getPairByTickers = (amountTicker: string, priceTicker: string) =>
    pairs.find(
      (pair) =>
        pair.amountAsset.ticker.toLowerCase() === amountTicker.toLowerCase() &&
        pair.priceAsset.ticker.toLowerCase() === priceTicker.toLowerCase(),
    );

  return {
    featuredPairs,
    getPairById,
    getPairByTickers,
    isLoading,
    pairs,
  };
};
