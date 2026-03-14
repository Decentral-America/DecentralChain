/**
 * Waves Gateway Provider
 *
 * Implements gateway operations for the Waves Gateway service
 * Handles BTC, ETH, USDT and other crypto deposits/withdrawals
 * Matches Angular's WavesGatewayService.js functionality
 */

import { BigNumber } from '@waves/bignumber';
import NetworkConfig from '@/config/networkConfig';
import type { IGatewayService, IGatewayDetails, GatewayAsset } from './types';

/**
 * Waves Gateway Provider Implementation
 */
export class WavesGatewayProvider implements IGatewayService {
  /**
   * Get deposit details for an asset
   * Calls the gateway's tunnel endpoint to get deposit address
   */
  async getDepositDetails(asset: GatewayAsset, userWavesAddress: string): Promise<IGatewayDetails> {
    const gatewayConfig = NetworkConfig.getGatewayConfig(asset.id);
    if (!gatewayConfig) {
      throw new Error(`[WavesGateway] No gateway config for asset ${asset.id}`);
    }

    try {
      // Call Waves Gateway tunnel API (matches Angular WavesGatewayService.getDepositAddress)
      const url = `${gatewayConfig.url}/tunnel/${userWavesAddress}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Gateway API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        address: data.address,
        attachment: data.attachment,
        minimumAmount: new BigNumber(data.minimumAmount || 0),
        maximumAmount: new BigNumber(data.maximumAmount || Number.MAX_SAFE_INTEGER),
        gatewayFee: new BigNumber(data.gatewayFee || 0),
        exchangeRate: data.exchangeRate ? new BigNumber(data.exchangeRate) : undefined,
      };
    } catch (error) {
      console.error('[WavesGateway] getDepositDetails failed:', error);
      throw error;
    }
  }

  /**
   * Get withdrawal details for an asset
   */
  async getWithdrawDetails(
    asset: GatewayAsset,
    targetAddress: string,
    paymentId?: string
  ): Promise<IGatewayDetails> {
    const gatewayConfig = NetworkConfig.getGatewayConfig(asset.id);
    if (!gatewayConfig) {
      throw new Error(`[WavesGateway] No gateway config for asset ${asset.id}`);
    }

    // Validate target address format using regex from config
    if (gatewayConfig.regex) {
      const regex = new RegExp(gatewayConfig.regex);
      if (!regex.test(targetAddress)) {
        throw new Error(`[WavesGateway] Invalid ${asset.name} address format`);
      }
    }

    // For withdrawals, return static details based on config
    // (Angular WavesGatewayService.getWithdrawDetails pattern)
    return {
      address: targetAddress,
      attachment: paymentId,
      minimumAmount: new BigNumber(0.001), // Default minimum
      maximumAmount: new BigNumber(1000000), // Default maximum
      gatewayFee: new BigNumber(0.001), // Default fee
    };
  }

  /**
   * Get send details (Waves Gateway specific)
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
const wavesGatewayProvider = new WavesGatewayProvider();

export default wavesGatewayProvider;
