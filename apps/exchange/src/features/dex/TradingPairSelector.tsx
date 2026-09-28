/**
 * Trading Pair Selector Component
 * Dropdown/search component for selecting trading pairs on the DEX
 * Updates Zustand DEX store when pair changes
 */

import { useQueries } from '@tanstack/react-query';
import { ChevronDown as FiChevronDown, Search as FiSearch } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { NetworkConfig } from '@/config';
import { fetchAssetDetails } from '@/services/assetService';
import {
  selectSelectedPair,
  selectSetSelectedPair,
  type TradingPair,
  useDexStore,
} from '@/stores/dexStore';
import { noTouchZoom } from '@/styles/mixins';
import { chrome } from '@/styles/tokens';
import { AVAILABLE_PAIRS, cacheAssetName, DEFAULT_PAIR, loadTradingPairs } from './tradingPairs';

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
        cacheAssetName(assetId, assetName);
      }
    });
  }, [queries, unknownAssetIds]);

  // Return loading state
  const isLoading = queries.some((q) => q.isLoading);
  return { isLoading };
};

/**
 * Container for the pair selector
 */
const SelectorContainer = styled.div`
  position: relative;
  display: inline-block;
  overflow: visible;
  z-index: 10;
`;

/*
 * The pair is the page's subject, so the trigger reads as a title with a
 * chevron rather than a form field: no border at rest, a soft fill on hover.
 */
const SelectedPairButton = styled.button`
  all: unset;
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: -8px;
  padding: 4px 8px;
  border-radius: 10px;
  cursor: pointer;
  transition: background-color 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    background: color-mix(in srgb, ${(p) => p.theme.colors.text} 6%, transparent);
  }

  &:focus-visible {
    box-shadow: 0 0 0 2px ${(p) => p.theme.colors.primary};
  }
`;

const PairText = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 28px;
  color: ${(p) => p.theme.colors.text};
`;

const AssetName = styled.span<{ $isBase?: boolean }>`
  color: ${(p) => (p.$isBase ? p.theme.colors.text : p.theme.colors.textSecondary)};
`;

const Separator = styled.span`
  color: ${(p) => p.theme.colors.textSubtle};
  font-weight: 400;
`;

const ChevronIcon = styled(FiChevronDown as React.ComponentType<Record<string, unknown>>)<{
  $isOpen: boolean;
}>`
  color: ${(p) => p.theme.colors.textSecondary};
  transition: transform 200ms cubic-bezier(0.32, 0.72, 0, 1);
  transform: ${(p) => (p.$isOpen ? 'rotate(180deg)' : 'rotate(0deg)')};
`;

const DropdownPanel = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  left: -8px;
  width: 300px;
  max-width: calc(100vw - 32px);
  background: ${(p) => p.theme.colors.surface};
  border-radius: 14px;
  box-shadow: ${(p) =>
    p.theme.mode === 'dark'
      ? `0 0 0 1px ${p.theme.colors.borderStrong}, ${p.theme.shadows.xl}`
      : p.theme.shadows.xl};
  max-height: 400px;
  overflow-y: auto;
  z-index: 1000;
  display: ${(p) => (p.$isOpen ? 'block' : 'none')};
  scrollbar-width: thin;
`;

const SearchContainer = styled.div`
  padding: 8px;
  position: sticky;
  top: 0;
  background: ${(p) => p.theme.colors.surface};
  z-index: 1;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIcon = styled(FiSearch as React.ComponentType<Record<string, unknown>>)`
  position: absolute;
  left: 10px;
  color: ${(p) => p.theme.colors.textSecondary};
`;

const SearchInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  height: 36px;
  border: none;
  border-radius: 10px;
  padding: 0 10px 0 32px;
  font: inherit;
  font-size: 14px;
  color: ${(p) => p.theme.colors.text};
  background: ${(p) => chrome[p.theme.mode].fill};

  /* iOS Safari zooms the page on focus below 16px; touch only. */
  ${noTouchZoom}

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${(p) => p.theme.colors.primary};
  }

  &::placeholder {
    color: ${(p) => p.theme.colors.textSecondary};
  }
`;

const PairList = styled.div`
  padding: 0 8px 8px;
`;

const PairItem = styled.button<{ $isSelected: boolean }>`
  all: unset;
  box-sizing: border-box;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  background: ${(p) => (p.$isSelected ? p.theme.colors.primarySurface : 'transparent')};
  transition: background-color 160ms cubic-bezier(0.32, 0.72, 0, 1);

  &:hover {
    background: ${(p) =>
      p.$isSelected
        ? p.theme.colors.primarySurface
        : `color-mix(in srgb, ${p.theme.colors.text} 6%, transparent)`};
  }

  &:focus-visible {
    box-shadow: inset 0 0 0 2px ${(p) => p.theme.colors.primary};
  }
`;

const PairItemText = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
  font-size: 14px;
  font-weight: 500;
`;

const NoResults = styled.div`
  padding: 24px 16px;
  text-align: center;
  color: ${(p) => p.theme.colors.textSecondary};
  font-size: 13px;
`;

/**
 * Trading Pair Selector Component
 */
export const TradingPairSelector: React.FC = () => {
  const selectedPair = useDexStore(selectSelectedPair);
  const setSelectedPair = useDexStore(selectSetSelectedPair);
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
   * Set default pair on mount, and clear any stale pair with empty asset IDs
   * that was stored from a previous session with a different network config.
   */
  useEffect(() => {
    const hasEmptyIds = selectedPair && (!selectedPair.amountAsset || !selectedPair.priceAsset);
    if (hasEmptyIds) {
      // Pair has empty IDs — placeholder from a prior config. Replace or clear.
      setSelectedPair(DEFAULT_PAIR);
    } else if (!selectedPair && DEFAULT_PAIR) {
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
      <SelectedPairButton
        type="button"
        onClick={handleToggle}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
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
        <ChevronIcon $isOpen={isOpen} size={18} strokeWidth={2.25} />
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
