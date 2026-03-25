/**
 * Gateway Service
 *
 * Coordinates crypto gateway operations (deposits/withdrawals) across multiple providers
 * Matches Angular's GatewayService.js pattern
 *
 * Acts as a facade that:
 * 1. Registers gateway providers (DCCGateway, Coinomat, etc.)
 * 2. Routes requests to the appropriate provider based on asset configuration
 * 3. Provides unified API for all gateway operations
 */

import NetworkConfig from '@/config/networkConfig';
import { logger } from '@/lib/logger';
import {
  type GatewayAsset,
  type GatewayConfig,
  type GatewayError,
  type GatewayErrorCode,
  type IGatewayDetails,
  type IGatewayService,
} from './types';

/**
 * Main Gateway Service Coordinator
 */
export class GatewayService {
  /**
   * Registered gateway providers
   * Key: gateway ID (e.g., 'dccgateway', 'coinomat')
   * Value: Gateway provider instance
   */
  private providers: Map<string, IGatewayService> = new Map();

  /**
   * Register a gateway provider
   * @param gatewayId - Unique identifier for the gateway
   * @param provider - Gateway provider instance implementing IGatewayService
   */
  registerProvider(gatewayId: string, provider: IGatewayService): void {
    this.providers.set(gatewayId.toLowerCase(), provider);
    logger.debug(`[GatewayService] Registered provider: ${gatewayId}`);
  }

  /**
   * Get gateway provider for a specific asset
   * @param asset - Asset to get provider for
   * @returns Gateway provider or null if not found
   */
  getProvider(asset: GatewayAsset): IGatewayService | null {
    // Get gateway config from NetworkConfig (mainnet.json)
    const gatewayConfig = NetworkConfig.getGatewayConfig(asset.id);
    if (!gatewayConfig) {
      logger.warn(`[GatewayService] No gateway config found for asset: ${asset.id}`);
      return null;
    }

    // Look up provider by gateway_id or gateway_type
    const gatewayId = gatewayConfig.gateway_id || gatewayConfig.gateway_type || 'dccgateway';

    const provider = this.providers.get(gatewayId.toLowerCase());
    if (!provider) {
      logger.warn(`[GatewayService] No provider registered for gateway: ${gatewayId}`);
    }

    return provider || null;
  }

  /**
   * Get all cryptocurrencies available through gateways
   * @returns Map of asset ID to gateway config
   */
  getCryptocurrencies(): Record<string, GatewayConfig> {
    return NetworkConfig.getAllGatewayConfigs();
  }

  /**
   * Get assets purchasable with cards
   * @returns Map of asset ID to gateway config (filtered by card support)
   */
  getPurchasableWithCards(): Record<string, GatewayConfig> {
    const allGateways = NetworkConfig.getAllGatewayConfigs();
    const purchasableWithCards: Record<string, GatewayConfig> = {};

    // Filter gateways that support card purchases
    Object.entries(allGateways).forEach(([assetId, config]) => {
      // Check if gateway supports card purchases (simplex, moonpay, etc.)
      const gatewayId = config.gateway_id?.toLowerCase();
      if (gatewayId && ['simplex', 'moonpay', 'mercuryo'].includes(gatewayId)) {
        purchasableWithCards[assetId] = config;
      }
    });

    return purchasableWithCards;
  }

  /**
   * Get fiat currencies available through gateways
   * @returns Map of asset ID to gateway config (fiat only)
   */
  getFiats(): Record<string, boolean> {
    // Typical fiat asset IDs
    return {
      CNY: true,
      EUR: true,
      GBP: true,
      JPY: true,
      RUB: true,
      TRY: true,
      USD: true,
    };
  }

  /**
   * Check if an asset has gateway support
   * @param asset - Asset to check
   * @returns true if asset has gateway
   */
  hasGateway(asset: GatewayAsset): boolean {
    return NetworkConfig.hasGateway(asset.id);
  }

  /**
   * Check if gateway can be used for an asset
   * (Future: Add permission checks from config service)
   * @param asset - Asset to check
   * @returns true if gateway can be used
   */
  canUseGateway(asset: GatewayAsset): boolean {
    // Future: Check PERMISSIONS.CANT_TRANSFER_GATEWAY from config service
    // For now, allow all gateways
    return this.hasGateway(asset);
  }

  /**
   * Get deposit details for an asset
   * @param asset - Asset to deposit
   * @param userDCCAddress - User's DCC address
   * @returns Deposit details or null if no gateway available
   */
  async getDepositDetails(
    asset: GatewayAsset,
    userDCCAddress: string,
  ): Promise<IGatewayDetails | null> {
    const provider = this.getProvider(asset);
    if (!provider) {
      logger.error(`[GatewayService] No provider available for deposit: ${asset.id}`);
      return null;
    }

    try {
      return await provider.getDepositDetails(asset, userDCCAddress);
    } catch (error) {
      logger.error(`[GatewayService] Deposit details failed for ${asset.id}:`, error);
      throw error;
    }
  }

  /**
   * Get withdrawal details for an asset
   * @param asset - Asset to withdraw
   * @param targetAddress - Target address in external blockchain
   * @param paymentId - Optional payment ID
   * @returns Withdrawal details
   * @throws GatewayError if gateway is blocked or unavailable
   */
  async getWithdrawDetails(
    asset: GatewayAsset,
    targetAddress: string,
    paymentId?: string,
  ): Promise<IGatewayDetails> {
    // Check if gateway can be used
    if (!this.canUseGateway(asset)) {
      const error: GatewayError = {
        code: 1001 as GatewayErrorCode,
        message: 'Gateway is blocked',
      };
      throw error;
    }

    const provider = this.getProvider(asset);
    if (!provider) {
      const error: GatewayError = {
        code: 1005 as GatewayErrorCode,
        message: 'Gateway unavailable',
      };
      throw error;
    }

    try {
      return await provider.getWithdrawDetails(asset, targetAddress, paymentId);
    } catch (error) {
      logger.error(`[GatewayService] Withdraw details failed for ${asset.id}:`, error);
      throw error;
    }
  }

  /**
   * Get send details (DCC Gateway specific)
   * @param asset - Asset to send
   * @param targetAddress - Target address
   * @returns Send details or null
   */
  async getSendDetails(
    asset: GatewayAsset,
    targetAddress: string,
  ): Promise<IGatewayDetails | null> {
    const provider = this.getProvider(asset);
    if (!provider?.getSendDetails) {
      return null;
    }

    try {
      return await provider.getSendDetails(asset, targetAddress);
    } catch (error) {
      logger.error(`[GatewayService] Send details failed for ${asset.id}:`, error);
      throw error;
    }
  }

  /**
   * Validate target address against gateway regex pattern
   * @param asset - Asset to validate address for
   * @param address - Address to validate
   * @returns true if address is valid
   */
  validateAddress(asset: GatewayAsset, address: string): boolean {
    const gatewayConfig = NetworkConfig.getGatewayConfig(asset.id);
    if (!gatewayConfig?.regex) {
      return false;
    }

    try {
      const regex = new RegExp(gatewayConfig.regex);
      return regex.test(address);
    } catch (error) {
      logger.error(`[GatewayService] Invalid regex for ${asset.id}:`, error);
      return false;
    }
  }
}

/**
 * Singleton instance
 */
const gatewayService = new GatewayService();

export default gatewayService;
