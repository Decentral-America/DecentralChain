/**
 * Token Filter Service
 *
 * Manages token filtering and naming:
 * 1. Scam list - prevents display of known scam tokens
 * 2. Token names - provides verified names/tickers for assets
 *
 * Matches Angular's token filtering functionality.
 */

import { NetworkConfig } from '@/config/networkConfig';
import { logger } from '@/lib/logger';

export interface TokenInfo {
  assetId: string;
  name: string;
  ticker?: string | undefined;
  verified?: boolean | undefined;
}

class TokenFilterService {
  private scamList: Set<string> = new Set();
  private tokenNames: Map<string, TokenInfo> = new Map();
  private initialized = false;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the service by fetching scam list and token names
   * Safe to call multiple times - will only initialize once
   */
  async initialize(): Promise<void> {
    // Return existing initialization if in progress
    if (this.initPromise !== null) {
      return this.initPromise;
    }

    // Skip if already initialized
    if (this.initialized) {
      return Promise.resolve();
    }

    this.initPromise = this._performInitialization();
    return this.initPromise;
  }

  private async _performInitialization(): Promise<void> {
    try {
      logger.debug('[TokenFilter] Initializing token filters...');

      // Fetch both lists in parallel
      const [scamResponse, namesResponse] = await Promise.all([
        this._fetchScamList(),
        this._fetchTokenNames(),
      ]);

      // Process scam list
      if (scamResponse) {
        scamResponse.forEach((id) => {
          this.scamList.add(id);
        });
      }

      // Process token names
      if (namesResponse) {
        namesResponse.forEach((token) => {
          this.tokenNames.set(token.assetId, token);
        });
      }

      this.initialized = true;
      logger.debug('[TokenFilter] Initialized:', {
        namedTokens: this.tokenNames.size,
        scamTokens: this.scamList.size,
      });
    } catch (error) {
      logger.error('[TokenFilter] Initialization failed:', error);
      // Don't throw - allow app to function without filters
      // Mark as initialized anyway to prevent repeated failures
      this.initialized = true;
    } finally {
      this.initPromise = null;
    }
  }

  private async _fetchScamList(): Promise<string[] | null> {
    try {
      const scamUrl = NetworkConfig.scamListUrl;
      if (!scamUrl) {
        logger.warn('[TokenFilter] scamListUrl not configured');
        return null;
      }

      const response = await fetch(scamUrl, {
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // Parse CSV - each line is an asset ID
      const lines = (await response.text())
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      return lines;
    } catch (error) {
      logger.error('[TokenFilter] Failed to fetch scam list:', error);
      return null;
    }
  }

  private async _fetchTokenNames(): Promise<TokenInfo[] | null> {
    try {
      const namesUrl = NetworkConfig.tokensNameListUrl;
      if (!namesUrl) {
        logger.warn('[TokenFilter] tokensNameListUrl not configured');
        return null;
      }

      const response = await fetch(namesUrl, {
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      // Parse CSV - format: assetId,name,ticker
      const lines = (await response.text())
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      const tokens: TokenInfo[] = [];

      for (const line of lines) {
        const parts = line.split(',').map((p) => p.trim());
        if (parts.length >= 2) {
          tokens.push({
            assetId: parts[0] ?? '',
            name: parts[1] ?? '',
            ticker: parts[2] || undefined,
            verified: true,
          });
        }
      }

      return tokens;
    } catch (error) {
      logger.error('[TokenFilter] Failed to fetch token names:', error);
      return null;
    }
  }

  /**
   * Check if an asset is on the scam list
   * @param assetId - Asset ID to check
   * @returns true if asset is a known scam
   */
  isScam(assetId: string): boolean {
    if (!assetId) return false;
    return this.scamList.has(assetId);
  }

  /**
   * Get detailed token information
   * @param assetId - Asset ID to look up
   * @returns Token info if available
   */
  getTokenInfo(assetId: string): TokenInfo | undefined {
    if (!assetId) return;
    return this.tokenNames.get(assetId);
  }

  /**
   * Get display name for a token, with fallback
   * @param assetId - Asset ID to look up
   * @param fallback - Fallback name if not found
   * @returns Token ticker, name, or fallback
   */
  getDisplayName(assetId: string, fallback: string = 'Unknown'): string {
    if (!assetId) return fallback;

    const info = this.getTokenInfo(assetId);
    if (!info) return fallback;

    // biome-ignore lint/nursery/useNullishCoalescing: ticker/name may be '' (empty = no display name) — || fallback chain is intentional
    return info.ticker || info.name || fallback;
  }

  /**
   * Get all verified tokens
   * @returns Array of verified token info
   */
  getVerifiedTokens(): TokenInfo[] {
    return Array.from(this.tokenNames.values()).filter((token) => token.verified);
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Refresh token data (for periodic updates)
   */
  async refresh(): Promise<void> {
    this.initialized = false;
    this.initPromise = null;
    this.scamList.clear();
    this.tokenNames.clear();
    return this.initialize();
  }
}

// Export singleton instance
const tokenFilterService = new TokenFilterService();
export default tokenFilterService;
