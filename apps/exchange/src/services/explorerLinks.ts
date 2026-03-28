/**
 * Explorer Link Service
 *
 * Generates blockchain explorer links for transactions, addresses, blocks, and assets.
 * Uses explorer URL from mainnet.json via NetworkConfig.
 *
 * Matches Angular's explorer integration patterns.
 */

import { NetworkConfig } from '@/config/networkConfig';

function getBaseUrl(): string {
  return NetworkConfig.explorer;
}

export const ExplorerLinkService = {
  getAddressLink(address: string): string {
    if (!address) {
      throw new Error('Address is required');
    }
    return `${getBaseUrl()}/address/${address}`;
  },

  getAssetLink(assetId: string): string {
    if (!assetId) {
      throw new Error('Asset ID is required');
    }
    return `${getBaseUrl()}/assets/${assetId}`;
  },

  getBlockLink(blockHeight: number): string {
    if (!blockHeight || blockHeight < 1) {
      throw new Error('Valid block height is required');
    }
    return `${getBaseUrl()}/blocks/${blockHeight}`;
  },
  getTransactionLink(txId: string): string {
    if (!txId) {
      throw new Error('Transaction ID is required');
    }
    return `${getBaseUrl()}/tx/${txId}`;
  },

  isConfigured(): boolean {
    try {
      return Boolean(getBaseUrl());
    } catch {
      return false;
    }
  },

  openAddress(address: string): void {
    const url = ExplorerLinkService.getAddressLink(address);
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  openAsset(assetId: string): void {
    const url = ExplorerLinkService.getAssetLink(assetId);
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  openBlock(blockHeight: number): void {
    const url = ExplorerLinkService.getBlockLink(blockHeight);
    window.open(url, '_blank', 'noopener,noreferrer');
  },

  openTransaction(txId: string): void {
    const url = ExplorerLinkService.getTransactionLink(txId);
    window.open(url, '_blank', 'noopener,noreferrer');
  },
};
