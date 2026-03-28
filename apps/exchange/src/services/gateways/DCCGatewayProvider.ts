/**
 * DCC Gateway Provider
 *
 * Implements gateway operations for the DCC Gateway service
 * Handles BTC, ETH, USDT and other crypto deposits/withdrawals
 * Matches Angular's DCCGatewayService.js functionality
 */

import { BigNumber } from '@decentralchain/bignumber';
import { NetworkConfig } from '@/config/networkConfig';
import { logger } from '@/lib/logger';
import { type GatewayAsset, type IGatewayDetails, type IGatewayService } from './types';

/**
 * DCC Gateway Provider Implementation
 */
export class DCCGatewayProvider implements IGatewayService {
  /**
   * Get deposit details for an asset
   * Calls the gateway's tunnel endpoint to get deposit address
   */
  async getDepositDetails(asset: GatewayAsset, userDCCAddress: string): Promise<IGatewayDetails> {
    const gatewayConfig = NetworkConfig.getGatewayConfig(asset.id);
    if (!gatewayConfig) {
      throw new Error(`[DCCGateway] No gateway config for asset ${asset.id}`);
    }

    try {
      // Call DCC Gateway tunnel API (matches Angular DCCGatewayService.getDepositAddress)
      const url = `${gatewayConfig.url}/tunnel/${userDCCAddress}`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Gateway API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        address: data.address,
        attachment: data.attachment,
        exchangeRate: data.exchangeRate ? new BigNumber(data.exchangeRate) : undefined,
        gatewayFee: new BigNumber(data.gatewayFee || 0),
        maximumAmount: new BigNumber(data.maximumAmount || Number.MAX_SAFE_INTEGER),
        minimumAmount: new BigNumber(data.minimumAmount || 0),
      };
    } catch (error) {
      logger.error('[DCCGateway] getDepositDetails failed:', error);
      throw error;
    }
  }

  /**
   * Get withdrawal details for an asset
   */
  async getWithdrawDetails(
    asset: GatewayAsset,
    targetAddress: string,
    paymentId?: string,
  ): Promise<IGatewayDetails> {
    const gatewayConfig = NetworkConfig.getGatewayConfig(asset.id);
    if (!gatewayConfig) {
      throw new Error(`[DCCGateway] No gateway config for asset ${asset.id}`);
    }

    // Validate target address format using regex from config
    if (gatewayConfig.regex) {
      const regex = new RegExp(gatewayConfig.regex);
      if (!regex.test(targetAddress)) {
        throw new Error(`[DCCGateway] Invalid ${asset.name} address format`);
      }
    }

    // For withdrawals, return static details based on config
    // (Angular DCCGatewayService.getWithdrawDetails pattern)
    return {
      address: targetAddress,
      attachment: paymentId,
      gatewayFee: new BigNumber(0.001), // Default fee
      maximumAmount: new BigNumber(1000000), // Default maximum
      minimumAmount: new BigNumber(0.001), // Default minimum
    };
  }

  /**
   * Get send details (DCC Gateway specific)
   * Used for direct asset transfers through gateway
   */
  async getSendDetails(asset: GatewayAsset, targetAddress: string): Promise<IGatewayDetails> {
    // For sends, delegate to withdraw details
    return this.getWithdrawDetails(asset, targetAddress);
  }

  /**
   * Get all supported assets
   * Returns gateway configs from NetworkConfig
   */
  getAll(): Record<string, unknown> {
    return NetworkConfig.getAllGatewayConfigs();
  }
}

/**
 * Singleton instance
 */
const gatewayProvider = new DCCGatewayProvider();

export default gatewayProvider;
