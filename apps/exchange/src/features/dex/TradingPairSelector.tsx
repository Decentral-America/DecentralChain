/**
 * Trading Pair Selector Component
 * Dropdown/search component for selecting trading pairs on the DEX
 * Updates Zustand DEX store when pair changes
 */

import { useQueries } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { FiChevronDown, FiSearch } from 'react-icons/fi';
import styled from 'styled-components';
import { NetworkConfig } from '@/config';
import { fetchAssetDetails } from '@/services/assetService';
import { type TradingPair, useDexStore } from '@/stores/dexStore';

/**
 * Cache for asset names to avoid repeated API calls
 * Maps assetId -> asset ticker/name
 */
const assetNameCache = new Map<string, string>();

/**
 * Get asset display name from asset ID
 * First checks config, then cache, returns placeholder if not available
 */
const getAssetDisplayName = (assetId: string): string => {
  // Try to get ticker from NetworkConfig
  const ticker = NetworkConfig.getAssetTicker(assetId);
  if (ticker) return ticker;

  // If it's already a ticker (like 'DCC'), return as-is
  if (assetId === 'DCC' || assetId.length <= 5) return assetId;

  // Check cache
  if (assetNameCache.has(assetId)) {
    return assetNameCache.get(assetId) ?? `${assetId.substring(0, 6)}...`;
  }

  // Return shortened ID as placeholder while loading
  return `${assetId.substring(0, 6)}...`;
};

/**
 * Load trading pairs from mainnet.json config
 * Uses display names from cache or config
 */
const loadTradingPairs = (): TradingPair[] => {
  const rawPairs = NetworkConfig.getTradingPairs();

  return rawPairs.map(([amountAsset, priceAsset]) => ({
    amountAsset,
    amountAssetName: getAssetDisplayName(amountAsset),
    priceAsset,
    priceAssetName: getAssetDisplayName(priceAsset),
  }));
};

/**
 * Hook to fetch asset details and update cache
 * This ensures asset names are fetched from blockchain and cached
 */
const useAssetNameFetcher = (assetIds: string[]) => {
  // Only fetch asset IDs not in config
  const unknownAssetIds = useMemo(() => {
    return assetIds.filter((id) => {
      if (id === 'DCC' || id.length <= 5) return false;
      if (NetworkConfig.getAssetTicker(id)) return false;
      return true;
    });
  }, [assetIds]);

  // Fetch all unknown assets using useQueries (avoids calling hooks in a loop)
  const queries = useQueries({
    queries: unknownAssetIds.map((assetId) => ({
      enabled: !!assetId,
      gcTime: 60 * 60 * 1000, // 1 hour
      queryFn: () => fetchAssetDetails(assetId),
      queryKey: ['asset-details', assetId] as const,
      staleTime: 5 * 60 * 1000, // 5 minutes
    })),
  });

  // Update cache when asset details are loaded
  useEffect(() => {
    queries.forEach((query, index) => {
      if (query.data && unknownAssetIds[index]) {
        const assetId = unknownAssetIds[index];
        const assetName = query.data.ticker || query.data.name || assetId.substring(0, 6);
        assetNameCache.set(assetId, assetName);
      }
    });
  }, [queries, unknownAssetIds]);

  // Return loading state
  const isLoading = queries.some((q) => q.isLoading);
  return { isLoading };
};

/**
 * Available trading pairs from mainnet.json
 */
const AVAILABLE_PAIRS: TradingPair[] = loadTradingPairs();

/**
 * Default trading pair
 * Uses the first pair from config, or can be configured via environment
 */
const getDefaultPair = (): TradingPair => {
  // Try to find DCC/CRC pair as preferred default
  const dccCrcPair = AVAILABLE_PAIRS.find(
    (pair) => pair.amountAssetName === 'DCC' && pair.priceAssetName === 'CRC',
  );

  // Fall back to first pair if DCC/CRC not found
  return (
    dccCrcPair ||
    AVAILABLE_PAIRS[0] || {
      amountAsset: '',
      amountAssetName: 'DCC',
      priceAsset: '',
      priceAssetName: 'CRC',
    }
  );
};

const DEFAULT_PAIR = getDefaultPair();

/**
 * Container for the pair selector
 */
const SelectorContainer = styled.div`
  position: relative;
  width: 100%;
  overflow: visible;
  z-index: 1000;
`;

/**
 * Selected pair display button
 */
const SelectedPairButton = styled.button`
  width: 100%;
  height: 100%;
  background: ${(p) => p.theme.colors.background};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.md};
  padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: ${(p) => p.theme.colors.primary};
  }

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.colors.primary};
    box-shadow: 0 0 0 2px ${(p) => p.theme.colors.primary}20;
  }
`;

/**
 * Pair text display
 */
const PairText = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.xs};
  font-size: ${(p) => p.theme.fontSizes.lg};
  font-weight: ${(p) => p.theme.fontWeights.semibold};
  color: ${(p) => p.theme.colors.text};
`;

/**
 * Asset name in pair
 */
const AssetName = styled.span<{ $isBase?: boolean }>`
  color: ${(p) => (p.$isBase ? p.theme.colors.primary : p.theme.colors.text)};
`;

/**
 * Separator between assets
 */
const Separator = styled.span`
  color: ${(p) => p.theme.colors.text};
  opacity: 0.5;
`;

/**
 * Chevron icon
 */
const ChevronIcon = styled(FiChevronDown as React.ComponentType<Record<string, unknown>>)<{
  $isOpen: boolean;
}>`
  color: ${(p) => p.theme.colors.text};
  opacity: 0.7;
  transition: transform 0.2s;
  transform: ${(p) => (p.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
`;

/**
 * Dropdown panel
 */
const DropdownPanel = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + ${(p) => p.theme.spacing.xs});
  left: 0;
  right: 0;
  background: ${(p) => p.theme.colors.background};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.md};
  box-shadow: ${(p) => p.theme.shadows.lg};
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  display: ${(p) => (p.$isOpen ? 'block' : 'none')};

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: ${(p) => p.theme.colors.background};
  }

  &::-webkit-scrollbar-thumb {
    background: ${(p) => p.theme.colors.border};
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: ${(p) => p.theme.colors.primary};
  }
`;

/**
 * Search input container
 */
const SearchContainer = styled.div`
  padding: ${(p) => p.theme.spacing.sm};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  position: sticky;
  top: 0;
  background: ${(p) => p.theme.colors.background};
  z-index: 1;
`;

/**
 * Search input wrapper
 */
const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

/**
 * Search icon
 */
const SearchIcon = styled(FiSearch as React.ComponentType<Record<string, unknown>>)`
  position: absolute;
  left: ${(p) => p.theme.spacing.sm};
  color: ${(p) => p.theme.colors.text};
  opacity: 0.5;
`;

/**
 * Search input
 */
const SearchInput = styled.input`
  width: 100%;
  background: ${(p) => p.theme.colors.background};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.sm};
  padding: ${(p) => p.theme.spacing.xs} ${(p) => p.theme.spacing.sm};
  padding-left: calc(${(p) => p.theme.spacing.sm} + 24px);
  font-size: ${(p) => p.theme.fontSizes.sm};
  color: ${(p) => p.theme.colors.text};
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.colors.primary};
  }

  &::placeholder {
    color: ${(p) => p.theme.colors.text};
    opacity: 0.5;
  }
`;

/**
 * Pair list container
 */
const PairList = styled.div`
  padding: ${(p) => p.theme.spacing.xs} 0;
`;

/**
 * Pair item button
 */
const PairItem = styled.button<{ $isSelected: boolean }>`
  width: 100%;
  background: ${(p) => (p.$isSelected ? `${p.theme.colors.primary}10` : 'transparent')};
  border: none;
  padding: ${(p) => p.theme.spacing.sm} ${(p) => p.theme.spacing.md};
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;

  &:hover {
    background: ${(p) => p.theme.colors.primary}15;
  }
`;

/**
 * Pair item text
 */
const PairItemText = styled.div`
  display: flex;
  align-items: center;
  gap: ${(p) => p.theme.spacing.xs};
  font-size: ${(p) => p.theme.fontSizes.md};
  font-weight: ${(p) => p.theme.fontWeights.medium};
`;

/**
 * No results message
 */
const NoResults = styled.div`
  padding: ${(p) => p.theme.spacing.lg};
  text-align: center;
  color: ${(p) => p.theme.colors.text};
  opacity: 0.5;
  font-size: ${(p) => p.theme.fontSizes.sm};
`;

/**
 * Trading Pair Selector Component
 */
export const TradingPairSelector: React.FC = () => {
  const { selectedPair, setSelectedPair } = useDexStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pairs, setPairs] = useState<TradingPair[]>(AVAILABLE_PAIRS);

  // Extract all unique asset IDs from trading pairs for fetching
  const allAssetIds = useMemo(() => {
    const ids = new Set<string>();
    AVAILABLE_PAIRS.forEach((pair) => {
      if (pair.amountAsset !== 'DCC') ids.add(pair.amountAsset);
      if (pair.priceAsset !== 'DCC') ids.add(pair.priceAsset);
    });
    return Array.from(ids);
  }, []);

  // Fetch asset names for all trading pairs
  const { isLoading: isLoadingAssets } = useAssetNameFetcher(allAssetIds);

  /**
   * Reload pairs when asset names are fetched
   * This ensures trading pairs update with real asset names
   */
  useEffect(() => {
    if (!isLoadingAssets) {
      const updatedPairs = loadTradingPairs();
      setPairs(updatedPairs);

      // Update selected pair with new names if it exists
      if (selectedPair) {
        const updatedSelectedPair = updatedPairs.find(
          (p) =>
            p.amountAsset === selectedPair.amountAsset && p.priceAsset === selectedPair.priceAsset,
        );
        if (
          updatedSelectedPair &&
          (updatedSelectedPair.amountAssetName !== selectedPair.amountAssetName ||
            updatedSelectedPair.priceAssetName !== selectedPair.priceAssetName)
        ) {
          setSelectedPair(updatedSelectedPair);
        }
      }
    }
  }, [isLoadingAssets, selectedPair, setSelectedPair]);

  /**
   * Set default pair on mount if none selected
   */
  useEffect(() => {
    if (!selectedPair) {
      setSelectedPair(DEFAULT_PAIR);
    }
  }, [selectedPair, setSelectedPair]);

  /**
   * Filter pairs based on search query
   * Uses the live pairs state which includes fetched asset names
   */
  const filteredPairs = useMemo(() => {
    if (!searchQuery.trim()) {
      return pairs;
    }

    const query = searchQuery.toLowerCase();
    return pairs.filter((pair) => {
      const pairString = `${pair.amountAssetName}/${pair.priceAssetName}`.toLowerCase();
      return pairString.includes(query);
    });
  }, [searchQuery, pairs]);

  /**
   * Handle pair selection
   */
  const handleSelectPair = (pair: TradingPair) => {
    setSelectedPair(pair);
    setIsOpen(false);
    setSearchQuery('');
  };

  /**
   * Toggle dropdown
   */
  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  /**
   * Handle click outside to close dropdown
   */
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest('[data-pair-selector]')) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  /**
   * Check if pair is selected
   */
  const isPairSelected = (pair: TradingPair): boolean => {
    return (
      selectedPair?.amountAsset === pair.amountAsset && selectedPair?.priceAsset === pair.priceAsset
    );
  };

  return (
    <SelectorContainer data-pair-selector>
      {/* Selected Pair Button */}
      <SelectedPairButton onClick={handleToggle} aria-expanded={isOpen} aria-haspopup="listbox">
        <PairText>
          {selectedPair ? (
            <>
              <AssetName $isBase>
                {selectedPair.amountAssetName || selectedPair.amountAsset}
              </AssetName>
              <Separator>/</Separator>
              <AssetName>{selectedPair.priceAssetName || selectedPair.priceAsset}</AssetName>
            </>
          ) : (
            <span>Select Trading Pair</span>
          )}
        </PairText>
        <ChevronIcon $isOpen={isOpen} size={20} />
      </SelectedPairButton>

      {/* Dropdown Panel */}
      <DropdownPanel $isOpen={isOpen} role="listbox">
        {/* Search Input */}
        <SearchContainer>
          <SearchInputWrapper>
            <SearchIcon size={16} />
            <SearchInput
              type="text"
              placeholder="Search pairs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </SearchInputWrapper>
        </SearchContainer>

        {/* Pair List */}
        {filteredPairs.length > 0 ? (
          <PairList>
            {filteredPairs.map((pair) => (
              <PairItem
                key={`${pair.amountAsset}-${pair.priceAsset}`}
                $isSelected={isPairSelected(pair)}
                onClick={() => handleSelectPair(pair)}
                role="option"
                aria-selected={isPairSelected(pair)}
              >
                <PairItemText>
                  <AssetName $isBase>{pair.amountAssetName || pair.amountAsset}</AssetName>
                  <Separator>/</Separator>
                  <AssetName>{pair.priceAssetName || pair.priceAsset}</AssetName>
                </PairItemText>
              </PairItem>
            ))}
          </PairList>
        ) : (
          <NoResults>No pairs found</NoResults>
        )}
      </DropdownPanel>
    </SelectorContainer>
  );
};
