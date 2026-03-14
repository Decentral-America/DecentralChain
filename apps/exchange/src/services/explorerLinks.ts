/**
 * Explorer Link Service
 *
 * Generates blockchain explorer links for transactions, addresses, blocks, and assets.
 * Uses explorer URL from mainnet.json via NetworkConfig.
 *
 * Matches Angular's explorer integration patterns.
 */

import NetworkConfig from '@/config/networkConfig';

export class ExplorerLinkService {
  /**
   * Get the base explorer URL from configuration
   */
  private static get baseUrl(): string {
    return NetworkConfig.explorer;
  }

  /**
   * Generate transaction explorer link
   * @param txId - Transaction ID
   * @returns Full URL to transaction in explorer
   */
  static getTransactionLink(txId: string): string {
    if (!txId) {
      throw new Error('Transaction ID is required');
    }
    return `${this.baseUrl}/tx/${txId}`;
  }

  /**
   * Generate address explorer link
   * @param address - Waves address
   * @returns Full URL to address in explorer
   */
  static getAddressLink(address: string): string {
    if (!address) {
      throw new Error('Address is required');
    }
    return `${this.baseUrl}/address/${address}`;
  }

  /**
   * Generate block explorer link
   * @param blockHeight - Block height number
   * @returns Full URL to block in explorer
   */
  static getBlockLink(blockHeight: number): string {
    if (!blockHeight || blockHeight < 1) {
      throw new Error('Valid block height is required');
    }
    return `${this.baseUrl}/blocks/${blockHeight}`;
  }

  /**
   * Generate asset explorer link
   * @param assetId - Asset ID
   * @returns Full URL to asset in explorer
   */
  static getAssetLink(assetId: string): string {
    if (!assetId) {
      throw new Error('Asset ID is required');
    }
    return `${this.baseUrl}/assets/${assetId}`;
  }

  /**
   * Open transaction in new browser tab
   * @param txId - Transaction ID
   */
  static openTransaction(txId: string): void {
    const url = this.getTransactionLink(txId);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Open address in new browser tab
   * @param address - Waves address
   */
  static openAddress(address: string): void {
    const url = this.getAddressLink(address);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Open block in new browser tab
   * @param blockHeight - Block height number
   */
  static openBlock(blockHeight: number): void {
    const url = this.getBlockLink(blockHeight);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Open asset in new browser tab
   * @param assetId - Asset ID
   */
  static openAsset(assetId: string): void {
    const url = this.getAssetLink(assetId);
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Check if explorer URL is configured
   */
  static isConfigured(): boolean {
    try {
      return Boolean(this.baseUrl);
    } catch {
      return false;
    }
  }
}

export default ExplorerLinkService;
