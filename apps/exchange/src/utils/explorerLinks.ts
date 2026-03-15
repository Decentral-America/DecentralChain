import { logger } from '@/lib/logger';
/**
 * Explorer Links Utility
 * Generates blockchain explorer URLs for different networks
 */

/**
 * Network type for explorer links
 */
export type NetworkType = 'mainnet' | 'testnet' | 'stagenet' | 'custom';

/**
 * Explorer links interface
 */
export interface ExplorerLinks {
  /**
   * Generate transaction URL
   * @param txId - Transaction ID
   */
  transaction: (txId: string) => string;

  /**
   * Generate address URL
   * @param address - Wallet address
   */
  address: (address: string) => string;

  /**
   * Generate block URL
   * @param height - Block height
   */
  block: (height: number) => string;

  /**
   * Generate asset URL
   * @param assetId - Asset ID
   */
  asset: (assetId: string) => string;

  /**
   * Generate alias URL
   * @param alias - Address alias
   */
  alias: (alias: string) => string;

  /**
   * Generate data transaction URL
   * @param address - Address with data entries
   */
  data: (address: string) => string;

  /**
   * Generate leasing URL
   * @param address - Address with leasing
   */
  leasing: (address: string) => string;

  /**
   * Get base explorer URL
   */
  getBaseUrl: () => string;
}

/**
 * Explorer configuration
 */
export interface ExplorerConfig {
  /**
   * Network type
   */
  network: NetworkType;

  /**
   * Custom base URL (for custom networks)
   */
  customBaseUrl?: string;
}

/**
 * Default explorer base URLs
 */
const EXPLORER_BASE_URLS: Record<Exclude<NetworkType, 'custom'>, string> = {
  mainnet: 'https://decentralscan.com',
  stagenet: 'https://stagenet.decentralscan.com',
  testnet: 'https://testnet.decentralscan.com',
};

/**
 * Get explorer links for a specific network
 * @param config - Explorer configuration
 * @returns Explorer links object
 */
export const getExplorerLinks = (
  config: NetworkType | ExplorerConfig = 'mainnet',
): ExplorerLinks => {
  // Handle string shorthand
  const network = typeof config === 'string' ? config : config.network;
  const customUrl = typeof config === 'object' ? config.customBaseUrl : undefined;

  // Get base URL
  const baseUrl =
    network === 'custom' && customUrl
      ? customUrl
      : EXPLORER_BASE_URLS[network as Exclude<NetworkType, 'custom'>] || EXPLORER_BASE_URLS.mainnet;

  return {
    address: (address: string): string => {
      if (!address) {
        logger.warn('Address is required');
        return baseUrl;
      }
      return `${baseUrl}/address/${address}`;
    },

    alias: (alias: string): string => {
      if (!alias) {
        logger.warn('Alias is required');
        return baseUrl;
      }
      // Remove 'alias:' prefix if present
      const cleanAlias = alias.startsWith('alias:') ? alias.substring(6) : alias;
      return `${baseUrl}/alias/${cleanAlias}`;
    },

    asset: (assetId: string): string => {
      if (!assetId) {
        logger.warn('Asset ID is required');
        return baseUrl;
      }
      return `${baseUrl}/assets/${assetId}`;
    },

    block: (height: number): string => {
      if (height < 0) {
        logger.warn('Block height must be non-negative');
        return baseUrl;
      }
      return `${baseUrl}/blocks/${height}`;
    },

    data: (address: string): string => {
      if (!address) {
        logger.warn('Address is required');
        return baseUrl;
      }
      return `${baseUrl}/address/${address}/data`;
    },

    getBaseUrl: (): string => baseUrl,

    leasing: (address: string): string => {
      if (!address) {
        logger.warn('Address is required');
        return baseUrl;
      }
      return `${baseUrl}/address/${address}/leasing`;
    },
    transaction: (txId: string): string => {
      if (!txId) {
        logger.warn('Transaction ID is required');
        return baseUrl;
      }
      return `${baseUrl}/tx/${txId}`;
    },
  };
};

/**
 * Create explorer links with mainnet as default
 */
export const explorerLinks = getExplorerLinks('mainnet');

/**
 * Mainnet explorer links
 */
export const mainnetExplorer = getExplorerLinks('mainnet');

/**
 * Testnet explorer links
 */
export const testnetExplorer = getExplorerLinks('testnet');

/**
 * Stagenet explorer links
 */
export const stagenetExplorer = getExplorerLinks('stagenet');

/**
 * Open URL in new tab
 * @param url - URL to open
 */
export const openInExplorer = (url: string): void => {
  if (!url) {
    logger.warn('URL is required to open explorer');
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * Open transaction in explorer
 * @param txId - Transaction ID
 * @param network - Network type (default: mainnet)
 */
export const openTransaction = (txId: string, network: NetworkType = 'mainnet'): void => {
  const links = getExplorerLinks(network);
  openInExplorer(links.transaction(txId));
};

/**
 * Open address in explorer
 * @param address - Wallet address
 * @param network - Network type (default: mainnet)
 */
export const openAddress = (address: string, network: NetworkType = 'mainnet'): void => {
  const links = getExplorerLinks(network);
  openInExplorer(links.address(address));
};

/**
 * Open block in explorer
 * @param height - Block height
 * @param network - Network type (default: mainnet)
 */
export const openBlock = (height: number, network: NetworkType = 'mainnet'): void => {
  const links = getExplorerLinks(network);
  openInExplorer(links.block(height));
};

/**
 * Open asset in explorer
 * @param assetId - Asset ID
 * @param network - Network type (default: mainnet)
 */
export const openAsset = (assetId: string, network: NetworkType = 'mainnet'): void => {
  const links = getExplorerLinks(network);
  openInExplorer(links.asset(assetId));
};

/**
 * Validate transaction ID format
 * @param txId - Transaction ID to validate
 * @returns True if valid
 */
export const isValidTxId = (txId: string): boolean => {
  if (!txId) return false;
  // DCC transaction IDs are base58 strings, typically 44 characters
  return /^[1-9A-HJ-NP-Za-km-z]{44}$/.test(txId);
};

/**
 * Validate address format
 * @param address - Address to validate
 * @returns True if valid
 */
export const isValidAddress = (address: string): boolean => {
  if (!address) return false;
  // DCC addresses start with '3' followed by base58 characters, typically 35 characters
  return /^3[1-9A-HJ-NP-Za-km-z]{34}$/.test(address);
};

/**
 * Validate asset ID format
 * @param assetId - Asset ID to validate
 * @returns True if valid
 */
export const isValidAssetId = (assetId: string): boolean => {
  if (!assetId) return false;
  // DCC asset IDs are base58 strings, typically 44 characters
  // DCC (native token) is represented as null or empty string in some contexts
  if (assetId === 'DCC') return true;
  return /^[1-9A-HJ-NP-Za-km-z]{44}$/.test(assetId);
};

/**
 * Parse explorer URL to extract entity type and ID
 * @param url - Explorer URL
 * @returns Parsed entity information
 */
export const parseExplorerUrl = (
  url: string,
): { type: string; id: string; network: NetworkType } | null => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;

    // Determine network
    let network: NetworkType = 'mainnet';
    if (hostname.includes('testnet')) network = 'testnet';
    else if (hostname.includes('stagenet')) network = 'stagenet';

    // Parse path
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    if (pathParts.length < 2) return null;

    const [type, id] = pathParts;
    if (!type || !id) return null;

    return { id, network, type };
  } catch (error) {
    logger.error('Failed to parse explorer URL:', error);
    return null;
  }
};

/**
 * Get short transaction ID (first 6 + last 4 characters)
 * @param txId - Transaction ID
 * @returns Shortened ID
 */
export const getShortTxId = (txId: string): string => {
  if (!txId || txId.length < 10) return txId;
  return `${txId.slice(0, 6)}...${txId.slice(-4)}`;
};

/**
 * Get short address (first 6 + last 4 characters)
 * @param address - Address
 * @returns Shortened address
 */
export const getShortAddress = (address: string): string => {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

/**
 * Copy text to clipboard
 * @param text - Text to copy
 * @returns Promise resolving to success status
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    logger.error('Failed to copy to clipboard:', error);
    return false;
  }
};

/**
 * Export all utilities as namespace
 */
export const explorerUtils = {
  copyToClipboard,
  getExplorerLinks,
  getShortAddress,
  getShortTxId,
  isValidAddress,
  isValidAssetId,
  isValidTxId,
  mainnetExplorer,
  openAddress,
  openAsset,
  openBlock,
  openInExplorer,
  openTransaction,
  parseExplorerUrl,
  stagenetExplorer,
  testnetExplorer,
};
