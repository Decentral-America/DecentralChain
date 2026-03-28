/**
 * useExplorerLinks Hook
 *
 * React hook wrapper for ExplorerLinkService.
 * Provides explorer link generation and opening functionality
 * with proper React patterns (useCallback for stability).
 */

import { useCallback } from 'react';
import { ExplorerLinkService } from '@/services/explorerLinks';

export interface ExplorerLinks {
  // Link generators
  getTransactionLink: (txId: string) => string;
  getAddressLink: (address: string) => string;
  getBlockLink: (blockHeight: number) => string;
  getAssetLink: (assetId: string) => string;

  // Open in new tab
  openTransaction: (txId: string) => void;
  openAddress: (address: string) => void;
  openBlock: (blockHeight: number) => void;
  openAsset: (assetId: string) => void;

  // Utility
  isConfigured: () => boolean;
}

/**
 * Hook for generating and opening blockchain explorer links
 * @returns Object with link generation and opening functions
 */
export const useExplorerLinks = (): ExplorerLinks => {
  const getTransactionLink = useCallback((txId: string) => {
    return ExplorerLinkService.getTransactionLink(txId);
  }, []);

  const getAddressLink = useCallback((address: string) => {
    return ExplorerLinkService.getAddressLink(address);
  }, []);

  const getBlockLink = useCallback((blockHeight: number) => {
    return ExplorerLinkService.getBlockLink(blockHeight);
  }, []);

  const getAssetLink = useCallback((assetId: string) => {
    return ExplorerLinkService.getAssetLink(assetId);
  }, []);

  const openTransaction = useCallback((txId: string) => {
    ExplorerLinkService.openTransaction(txId);
  }, []);

  const openAddress = useCallback((address: string) => {
    ExplorerLinkService.openAddress(address);
  }, []);

  const openBlock = useCallback((blockHeight: number) => {
    ExplorerLinkService.openBlock(blockHeight);
  }, []);

  const openAsset = useCallback((assetId: string) => {
    ExplorerLinkService.openAsset(assetId);
  }, []);

  const isConfigured = useCallback(() => {
    return ExplorerLinkService.isConfigured();
  }, []);

  return {
    getAddressLink,
    getAssetLink,
    getBlockLink,
    getTransactionLink,
    isConfigured,
    openAddress,
    openAsset,
    openBlock,
    openTransaction,
  };
};
