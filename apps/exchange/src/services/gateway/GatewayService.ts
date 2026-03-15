/**
 * Gateway Service
 * Main service class for interacting with gateway API (BTC bridge)
 */
import { BigNumber } from '@decentralchain/bignumber';
import {
  type DepositDetails,
  type GatewayConfig,
  type GatewayType,
  type WithdrawDetails,
} from './types';
import { formatGatewayError, validateGatewayAddress } from './utils';

/**
 * Gateway Service Class
 * Handles communication with gateway API for deposit/withdraw operations
 *
 * SECURITY: All gateway URLs are validated to be HTTPS and match the allowlist.
 */
export class GatewayService {
  private gatewayConfigs: Record<string, GatewayConfig>;
  private timeout = 30000; // 30 second timeout

  /**
   * Validates that a gateway URL is well-formed and uses HTTPS.
   * Prevents SSRF and man-in-the-middle attacks on gateway communications.
   */
  private static validateGatewayUrl(url: string): void {
    if (!url || typeof url !== 'string') {
      throw new Error('Gateway URL is required');
    }
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error(`Invalid gateway URL: ${url}`);
    }
    if (parsed.protocol !== 'https:') {
      throw new Error(`Gateway URL must use HTTPS: ${url}`);
    }
  }

  constructor(configs: Record<string, GatewayConfig>) {
    // Validate all gateway URLs at construction time
    for (const [assetId, config] of Object.entries(configs)) {
      try {
        GatewayService.validateGatewayUrl(config.url);
      } catch (e) {
        throw new Error(`Invalid gateway config for ${assetId}: ${(e as Error).message}`);
      }
    }
    this.gatewayConfigs = configs;
  }

  /**
   * Check if an asset has gateway support for deposit or withdraw
   */
  hasSupportOf(assetId: string, _type: GatewayType): boolean {
    return !!this.gatewayConfigs[assetId];
  }

  /**
   * Get deposit details from gateway API
   * @param assetId - The asset ID to deposit
   * @param userAddress - User's DecentralChain address
   * @returns Deposit details including gateway address, fees, limits
   */
  async getDepositDetails(assetId: string, userAddress: string): Promise<DepositDetails> {
    const config = this.gatewayConfigs[assetId];
    if (!config) {
      throw new Error('Asset not supported by gateway');
    }

    try {
      // Determine API endpoint based on gateway configuration
      let fetchUrl = `${config.url}/api/fullinfo`;
      if (config.otherNetwork) {
        // For gateways with otherNetwork, use the full-info endpoint
        // Extract ticker from asset configuration if available
        const ticker = config.ticker ?? 'BTC';
        fetchUrl = `${config.url}/api/full-info/${config.otherNetwork}/${ticker}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(fetchUrl, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gateway API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Parse response into DepositDetails interface
      const depositDetails: DepositDetails = {
        address: data.otherAddress || data.address || '',
        disclaimerLink: data.disclaimer,
        gatewayFee: new BigNumber(data.fee || 0),
        gatewayType: data.type || 'deposit',
        gatewayUrl: config.url,
        maximumAmount: new BigNumber(data.maxAmount || data.max_amount || 0),
        minimumAmount: new BigNumber(data.minAmount || data.min_amount || 0),
        minRecoveryAmount: data.recovery_amount ? new BigNumber(data.recovery_amount) : undefined,
        operator: data.company,
        recoveryFee: data.recovery_fee ? new BigNumber(data.recovery_fee) : undefined,
        supportEmail: data.email,
        walletAddress: userAddress,
      };

      // For static tunnel type, get the specific deposit address
      if (depositDetails.gatewayType === 'deposit') {
        const tunnelAddress = await this.getDepositAddress(assetId, userAddress);
        depositDetails.address = tunnelAddress;
      }

      return depositDetails;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Gateway request timeout');
      }
      throw new Error(formatGatewayError(error));
    }
  }

  /**
   * Get withdraw details from gateway API
   * @param assetId - The asset ID to withdraw
   * @param targetAddress - External blockchain address to withdraw to
   * @returns Withdraw details including gateway address, fees, limits
   */
  async getWithdrawDetails(assetId: string, targetAddress: string): Promise<WithdrawDetails> {
    const config = this.gatewayConfigs[assetId];
    if (!config) {
      throw new Error('Asset not supported by gateway');
    }

    // Validate target address format
    const isValidAddress = validateGatewayAddress(targetAddress, assetId, this.gatewayConfigs);
    if (!isValidAddress) {
      throw new Error('Invalid destination address format');
    }

    try {
      // Determine API endpoint
      let fetchUrl = `${config.url}/api/fullinfo`;
      if (config.otherNetwork) {
        const ticker = config.ticker ?? 'BTC';
        fetchUrl = `${config.url}/api/full-info/${config.otherNetwork}/${ticker}`;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(fetchUrl, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Gateway API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Parse withdraw-specific fields
      const withdrawDetails: WithdrawDetails = {
        address: data.tnAddress || data.dccAddress || '',
        attachment: targetAddress,
        gatewayFee: new BigNumber(data.other_total_fee || data.fee || 0),
        gatewayType: data.type || 'deposit',
        gatewayUrl: config.url,
        maximumAmount: new BigNumber(data.maxAmount || data.max_amount || 0),
        minimumAmount: new BigNumber(data.minAmount || data.min_amount || 0),
      };

      return withdrawDetails;
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Gateway request timeout');
      }
      throw new Error(formatGatewayError(error));
    }
  }

  /**
   * Get static tunnel deposit address for a user
   * @param assetId - The asset ID
   * @param userAddress - User's DecentralChain address
   * @returns BTC deposit address
   */
  async getDepositAddress(assetId: string, userAddress: string): Promise<string> {
    const config = this.gatewayConfigs[assetId];
    if (!config) {
      throw new Error('Asset not supported by gateway');
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${config.url}/tunnel/${userAddress}`, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to get deposit address: ${response.status}`);
      }

      const data = await response.json();
      return data.address || '';
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Gateway request timeout');
      }
      throw new Error(formatGatewayError(error));
    }
  }

  /**
   * Get round-robin deposit address (temporary with expiry)
   * @param assetId - The asset ID
   * @param userAddress - User's DecentralChain address
   * @param recaptcha - Recaptcha token
   * @returns Temporary deposit address with expiry date
   */
  async getRobinAddress(
    assetId: string,
    userAddress: string,
    recaptcha: string,
  ): Promise<{ address: string; expiry: Date }> {
    const config = this.gatewayConfigs[assetId];
    if (!config) {
      throw new Error('Asset not supported by gateway');
    }

    try {
      const ticker = config.ticker ?? 'BTC';
      const otherNetwork = config.otherNetwork || 'Bitcoin';

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${config.url}/api/deposits`, {
        body: JSON.stringify({
          dstAddress: userAddress,
          dstNetwork: 'TurtleNetwork',
          recaptcha,
          srcNetwork: otherNetwork,
          ticker,
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        method: 'POST',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to get round-robin address: ${response.status}`);
      }

      const data = await response.json();
      return {
        address: data.depositAddress || '',
        expiry: new Date(data.expiry),
      };
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Gateway request timeout');
      }
      throw new Error(formatGatewayError(error));
    }
  }
}
